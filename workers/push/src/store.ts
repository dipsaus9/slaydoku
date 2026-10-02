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
  await kv.delete(subKey(hash))
}

/** For the sender: every subscription chosen for one Amsterdam hour. */
export async function listHour(kv: KvLike, hour: number): Promise<StoredSubscription[]> {
  const { keys } = await kv.list({ prefix: hourPrefix(hour) })
  const out: StoredSubscription[] = []
  for (const { name } of keys) {
    const raw = await kv.get(subKey(name.slice(hourPrefix(hour).length)))
    if (raw) out.push(JSON.parse(raw) as StoredSubscription)
  }
  return out
}
