import type { KvLike } from './kv.ts'
import type { SubscribeBody } from './validate.ts'

export interface StoredSubscription {
  subscription: SubscribeBody['subscription']
  hour: number
  locale?: string
}

/** Key layout: `sub:<hash>` holds the record, `hour:<HH>:<hash>` is the per-hour index (empty value). */
export const subKey = (hash: string) => `sub:${hash}`
export const hourPrefix = (hour: number) => `hour:${String(hour).padStart(2, '0')}:`
/** `skip:<hash>` holds the UTC date (YYYY-MM-DD) the player already solved; it expires by itself. */
export const skipKey = (hash: string) => `skip:${hash}`
export const SKIP_TTL_SECONDS = 36 * 60 * 60
export const hourKey = (hour: number, hash: string) => `${hourPrefix(hour)}${hash}`

export async function hashEndpoint(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function saveSubscription(kv: KvLike, body: SubscribeBody): Promise<void> {
  const hash = await hashEndpoint(body.subscription.endpoint)
  const previous = await kv.get(subKey(hash))
  if (previous) {
    const old = JSON.parse(previous) as StoredSubscription
    if (old.hour !== body.hour) await kv.delete(hourKey(old.hour, hash))
  }
  const record: StoredSubscription = {
    subscription: body.subscription,
    hour: body.hour,
    ...(body.locale === undefined ? {} : { locale: body.locale }),
  }
  await kv.put(subKey(hash), JSON.stringify(record))
  await kv.put(hourKey(body.hour, hash), '')
}

export async function removeSubscription(kv: KvLike, endpoint: string): Promise<void> {
  const hash = await hashEndpoint(endpoint)
  const previous = await kv.get(subKey(hash))
  if (previous) {
    const old = JSON.parse(previous) as StoredSubscription
    await kv.delete(hourKey(old.hour, hash))
  }
  await kv.delete(skipKey(hash))
  await kv.delete(subKey(hash))
}

/** Stores the skip date for an existing subscription; false when the endpoint is unknown. */
export async function saveSkip(kv: KvLike, endpoint: string, date: string): Promise<boolean> {
  const hash = await hashEndpoint(endpoint)
  if (!(await kv.get(subKey(hash)))) return false
  await kv.put(skipKey(hash), date, { expirationTtl: SKIP_TTL_SECONDS })
  return true
}

export interface HourPage {
  hashes: string[]
  /** Present while more pages follow. */
  cursor?: string
}

/** One page of the hour index (hashes only, no record reads); pass the returned cursor to continue. */
export async function listHourPage(
  kv: KvLike,
  hour: number,
  opts: { cursor?: string; limit?: number } = {},
): Promise<HourPage> {
  const prefix = hourPrefix(hour)
  const res = await kv.list({
    prefix,
    ...(opts.cursor === undefined ? {} : { cursor: opts.cursor }),
    ...(opts.limit === undefined ? {} : { limit: opts.limit }),
  })
  const hashes = res.keys.map((k) => k.name.slice(prefix.length))
  return res.list_complete === false && res.cursor !== undefined ? { hashes, cursor: res.cursor } : { hashes }
}

export async function getSubscription(kv: KvLike, hash: string): Promise<StoredSubscription | null> {
  const raw = await kv.get(subKey(hash))
  return raw ? (JSON.parse(raw) as StoredSubscription) : null
}

/** Every subscription chosen for one Amsterdam hour, following the KV list cursor across pages. */
export async function listHour(kv: KvLike, hour: number): Promise<StoredSubscription[]> {
  const out: StoredSubscription[] = []
  let cursor: string | undefined
  do {
    const page = await listHourPage(kv, hour, cursor === undefined ? {} : { cursor })
    for (const hash of page.hashes) {
      const sub = await getSubscription(kv, hash)
      if (sub) out.push(sub)
    }
    cursor = page.cursor
  } while (cursor !== undefined)
  return out
}
