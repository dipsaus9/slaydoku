import { isStandaloneDisplay } from './install.ts'
import type { StorageLike } from './install.ts'

/**
 * Where the push Worker lives and the VAPID public key it signs with (both public, non-secret).
 * Set after deploying the Worker (docs/push.md). The store reports 'unavailable' while either value is empty or still a
 * PLACEHOLDER_ string, so a fresh checkout without a deployed Worker shows no reminder option.
 */
export const REMINDER_CONFIG = {
  workerUrl: 'https://slaydoku-push.dipsaus9.workers.dev',
  vapidPublicKey: 'BKE22SiYFLPguPUas1n3eD4-Mu88iAVvULNgMQov7ZHEvsf2PKUJSWBC-rl3gcEGSAwS2DjbfZumV8bcMWr2CDw',
} as const

export const REMINDER_KEY = 'slaydoku:reminder-hour'
export const MIN_HOUR = 6
export const MAX_HOUR = 23

/**
 * unavailable: not installed / no push support / config unset. off: nothing scheduled. on: subscribed.
 * blocked: the player denied permission. busy: a request is in flight. error: last action failed, retry it.
 */
export type ReminderStatus = 'unavailable' | 'off' | 'on' | 'blocked' | 'busy' | 'error'

export interface ReminderState {
  status: ReminderStatus
  /** The hour (local, 6..23) that is stored and confirmed by the Worker; null when off. */
  hour: number | null
}

export interface PushSubscriptionLike {
  endpoint: string
  toJSON(): { endpoint?: string; keys?: Record<string, string> }
  unsubscribe(): Promise<boolean>
}

export interface PushManagerLike {
  getSubscription(): Promise<PushSubscriptionLike | null>
  subscribe(options: { userVisibleOnly: boolean; applicationServerKey: Uint8Array<ArrayBuffer> }): Promise<PushSubscriptionLike>
}

export interface ReminderEnv {
  standalone: boolean
  /** Null when the browser has no Notification API. */
  notification: { permission: NotificationPermission; requestPermission(): Promise<NotificationPermission> } | null
  /** Resolves the push manager of the service worker registration; null when push is unsupported. */
  pushManager: (() => Promise<PushManagerLike>) | null
  fetch: typeof fetch
  storage: StorageLike | null
  config: { workerUrl: string; vapidPublicKey: string }
  locale?: string
}

export interface ReminderStore {
  subscribe(listener: () => void): () => void
  getSnapshot(): ReminderState
  enable(hour: number): Promise<void>
  changeHour(hour: number): Promise<void>
  disable(): Promise<void>
}

const isValidHour = (h: unknown): h is number => typeof h === 'number' && Number.isInteger(h) && h >= MIN_HOUR && h <= MAX_HOUR

export function readHour(storage: StorageLike | null): number | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(REMINDER_KEY)
    if (raw === null) return null
    const n: unknown = JSON.parse(raw)
    return isValidHour(n) ? n : null
  } catch {
    return null
  }
}

function writeHour(storage: StorageLike | null, hour: number | null): void {
  if (!storage) return
  try {
    if (hour === null) (storage as Storage).removeItem?.(REMINDER_KEY)
    else storage.setItem(REMINDER_KEY, JSON.stringify(hour))
  } catch {
    // The choice just is not remembered across reloads; the Worker still has it.
  }
}

/** Decodes a base64url VAPID public key into the bytes pushManager.subscribe wants. */
export function urlBase64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const bin = atob(padded)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function isConfigured(config: ReminderEnv['config']): boolean {
  return !config.workerUrl.startsWith('PLACEHOLDER') && !config.vapidPublicKey.startsWith('PLACEHOLDER')
}

export function createReminderStore(env: ReminderEnv): ReminderStore {
  const listeners = new Set<() => void>()
  const available = env.standalone && !!env.notification && !!env.pushManager && isConfigured(env.config)

  const initial = (): ReminderState => {
    if (!available) return { status: 'unavailable', hour: null }
    if (env.notification!.permission === 'denied') return { status: 'blocked', hour: null }
    const hour = readHour(env.storage)
    return hour !== null && env.notification!.permission === 'granted' ? { status: 'on', hour } : { status: 'off', hour: null }
  }
  let state = initial()

  const set = (next: ReminderState) => {
    state = next
    for (const l of listeners) l()
  }
  const endpointUrl = () => `${env.config.workerUrl.replace(/\/+$/, '')}/subscribe`
  const send = async (method: 'POST' | 'DELETE', body: unknown) => {
    const res = await env.fetch(endpointUrl(), {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`worker ${res.status}`)
  }

  /** Runs one action; on failure restores the settled state with status 'error' so the caller can retry. */
  const run = async (action: () => Promise<ReminderState>) => {
    if (!available || state.status === 'busy') return
    const settled = state
    set({ ...settled, status: 'busy' })
    try {
      set(await action())
    } catch {
      set({ ...settled, status: 'error' })
    }
  }

  const post = async (sub: PushSubscriptionLike, hour: number) => {
    const json = sub.toJSON()
    await send('POST', {
      subscription: { endpoint: json.endpoint ?? sub.endpoint, keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth } },
      hour,
      ...(env.locale ? { locale: env.locale } : {}),
    })
    writeHour(env.storage, hour)
  }

  const ensureSubscription = async (): Promise<PushSubscriptionLike> => {
    const manager = await env.pushManager!()
    return (
      (await manager.getSubscription()) ??
      manager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToBytes(env.config.vapidPublicKey) })
    )
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
    getSnapshot: () => state,
    async enable(hour) {
      if (!isValidHour(hour)) return
      await run(async () => {
        const permission =
          env.notification!.permission === 'default' ? await env.notification!.requestPermission() : env.notification!.permission
        if (permission !== 'granted') return { status: 'blocked', hour: null }
        await post(await ensureSubscription(), hour)
        return { status: 'on', hour }
      })
    },
    async changeHour(hour) {
      if (!isValidHour(hour)) return
      await run(async () => {
        if (env.notification!.permission !== 'granted') return { status: 'blocked', hour: null }
        await post(await ensureSubscription(), hour)
        return { status: 'on', hour }
      })
    },
    async disable() {
      await run(async () => {
        const sub = await (await env.pushManager!()).getSubscription()
        // Worker first: if it fails nothing local changed, so a retry still has the endpoint to send.
        if (sub) {
          await send('DELETE', { endpoint: sub.endpoint })
          await sub.unsubscribe()
        }
        writeHour(env.storage, null)
        return { status: 'off', hour: null }
      })
    },
  }
}

function defaultStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

let instance: ReminderStore | null = null

/** The reminder store of this page, built on first use from the real browser APIs. */
export function getReminderStore(): ReminderStore {
  if (instance) return instance
  const hasPush = typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof PushManager !== 'undefined'
  instance = createReminderStore({
    standalone: isStandaloneDisplay(
      typeof matchMedia !== 'undefined' ? matchMedia('(display-mode: standalone)').matches : false,
      typeof navigator !== 'undefined' ? (navigator as Navigator & { standalone?: boolean }).standalone : undefined,
    ),
    notification: typeof Notification !== 'undefined' ? Notification : null,
    pushManager: hasPush ? async () => (await navigator.serviceWorker.ready).pushManager : null,
    fetch: (...args) => globalThis.fetch(...args),
    storage: defaultStorage(),
    config: REMINDER_CONFIG,
    locale: typeof navigator !== 'undefined' ? navigator.language : undefined,
  })
  return instance
}
