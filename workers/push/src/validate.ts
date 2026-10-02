export interface PushSubscriptionJson {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export interface SubscribeBody {
  subscription: PushSubscriptionJson
  hour: number
  locale?: string
}

export const MIN_HOUR = 6
export const MAX_HOUR = 23

/** Hosts of the browser push services (FCM, Mozilla autopush, Apple web push, Windows WNS). */
const PUSH_HOST_SUFFIXES = [
  'fcm.googleapis.com',
  'push.services.mozilla.com',
  'push.apple.com',
  'notify.windows.com',
]

export function isKnownPushHost(hostname: string): boolean {
  return PUSH_HOST_SUFFIXES.some((s) => hostname === s || hostname.endsWith(`.${s}`))
}

export function isPushEndpoint(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  return url.protocol === 'https:' && !url.username && !url.password && isKnownPushHost(url.hostname)
}

const isKey = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0 && v.length <= 256 && /^[A-Za-z0-9_-]+={0,2}$/.test(v)

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export function parseSubscribeBody(body: unknown): SubscribeBody | null {
  if (!isRecord(body)) return null
  const { subscription, hour, locale } = body
  if (!isRecord(subscription) || !isRecord(subscription.keys)) return null
  const { endpoint, keys } = subscription
  if (!isPushEndpoint(endpoint)) return null
  if (!isKey(keys.p256dh) || !isKey(keys.auth)) return null
  if (typeof hour !== 'number' || !Number.isInteger(hour) || hour < MIN_HOUR || hour > MAX_HOUR) return null
  if (locale !== undefined && (typeof locale !== 'string' || !/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(locale))) {
    return null
  }
  return {
    subscription: { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
    hour,
    ...(locale === undefined ? {} : { locale }),
  }
}

export function parseUnsubscribeBody(body: unknown): { endpoint: string } | null {
  if (!isRecord(body) || !isPushEndpoint(body.endpoint)) return null
  return { endpoint: body.endpoint }
}
