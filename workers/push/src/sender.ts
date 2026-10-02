import { amsterdamNow } from './amsterdam.ts'
import type { KvLike } from './kv.ts'
import { getSubscription, hourKey, listHourPage, subKey } from './store.ts'
import { authorizationHeader, importVapidKey, signVapidJwt } from './vapid.ts'

export interface SenderEnv {
  SUBSCRIPTIONS: KvLike
  VAPID_PUBLIC_KEY: string
  VAPID_PRIVATE_KEY: string
  /** `mailto:` or https URL identifying the sender, required by push services. */
  VAPID_SUBJECT: string
}

/**
 * Free-plan Workers allow ~50 subrequests per invocation and KV calls count. Per subscriber the
 * worst case is a KV get, a push fetch and two KV deletes (4), plus the list and the progress
 * read/write: 11 * 4 + 3 = 47.
 */
export const CHUNK_SIZE = 11
export const PUSH_TTL_SECONDS = 3 * 60 * 60
export const PUSH_TOPIC = 'daily-puzzle'
const JWT_LIFETIME_SECONDS = 12 * 60 * 60
const PROGRESS_TTL_SECONDS = 2 * 24 * 60 * 60

/** Progress of one Amsterdam hour's send: the KV list cursor of the next chunk, or done. */
interface Progress {
  done: boolean
  cursor?: string
}

const progressKey = (date: string, hour: number) => `run:${date}:${String(hour).padStart(2, '0')}`

export interface RunResult {
  hour: number
  sent: number
  pruned: number
  failed: number
  done: boolean
}

/**
 * Sends one chunk of the current Amsterdam hour's reminders. Trigger it often (every few minutes):
 * the first run of an hour starts the list, each later run continues from the stored cursor, and
 * once the hour is done further runs cost a single KV read. Crash safety is at-least-once per
 * chunk; the shared Topic makes a push service collapse a duplicate.
 */
export async function runScheduled(env: SenderEnv, scheduledTime: number, fetchFn: typeof fetch = fetch): Promise<RunResult> {
  const now = new Date(scheduledTime)
  const { date, hour } = amsterdamNow(now)
  const result: RunResult = { hour, sent: 0, pruned: 0, failed: 0, done: false }
  const pKey = progressKey(date, hour)
  const raw = await env.SUBSCRIPTIONS.get(pKey)
  const progress: Progress = raw ? (JSON.parse(raw) as Progress) : { done: false }
  if (progress.done) return { ...result, done: true }

  const page = await listHourPage(env.SUBSCRIPTIONS, hour, {
    limit: CHUNK_SIZE,
    ...(progress.cursor === undefined ? {} : { cursor: progress.cursor }),
  })

  const key = page.hashes.length > 0 ? await importVapidKey(env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY) : null
  const exp = Math.floor(scheduledTime / 1000) + JWT_LIFETIME_SECONDS
  const jwts = new Map<string, Promise<string>>()
  const jwtFor = (origin: string) => {
    let jwt = jwts.get(origin)
    if (!jwt) jwts.set(origin, (jwt = signVapidJwt(key as CryptoKey, origin, env.VAPID_SUBJECT, exp)))
    return jwt
  }

  await Promise.all(
    page.hashes.map(async (hash) => {
      const stored = await getSubscription(env.SUBSCRIPTIONS, hash)
      if (!stored) {
        await env.SUBSCRIPTIONS.delete(hourKey(hour, hash))
        return
      }
      const { endpoint } = stored.subscription
      try {
        const jwt = await jwtFor(new URL(endpoint).origin)
        const res = await fetchFn(endpoint, {
          method: 'POST',
          headers: {
            authorization: authorizationHeader(jwt, env.VAPID_PUBLIC_KEY),
            ttl: String(PUSH_TTL_SECONDS),
            topic: PUSH_TOPIC,
            urgency: 'normal',
            'content-length': '0',
          },
        })
        if (res.status === 404 || res.status === 410) {
          await Promise.all([env.SUBSCRIPTIONS.delete(subKey(hash)), env.SUBSCRIPTIONS.delete(hourKey(hour, hash))])
          result.pruned++
        } else if (res.ok) result.sent++
        else {
          result.failed++
          console.warn(`push service answered ${res.status}`)
        }
      } catch (err) {
        result.failed++
        console.warn(`push send failed: ${err instanceof Error ? err.name : 'error'}`)
      }
    }),
  )

  const next: Progress = page.cursor === undefined ? { done: true } : { done: false, cursor: page.cursor }
  await env.SUBSCRIPTIONS.put(pKey, JSON.stringify(next), { expirationTtl: PROGRESS_TTL_SECONDS })
  result.done = next.done
  return result
}

