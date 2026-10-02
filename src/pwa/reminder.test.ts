import { describe, expect, it, vi } from 'vitest'
import { createReminderStore, readHour, REMINDER_KEY } from './reminder.ts'
import type { PushManagerLike, PushSubscriptionLike, ReminderEnv } from './reminder.ts'

const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc'

function setup(over: Partial<ReminderEnv> & { permission?: NotificationPermission; requested?: NotificationPermission; ok?: boolean } = {}) {
  const data = new Map<string, string>()
  const storage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  }
  let existing: PushSubscriptionLike | null = null
  const unsubscribe = vi.fn(async () => {
    existing = null
    return true
  })
  const sub: PushSubscriptionLike = {
    endpoint: ENDPOINT,
    toJSON: () => ({ endpoint: ENDPOINT, keys: { p256dh: 'pk', auth: 'ak' } }),
    unsubscribe,
  }
  const subscribe = vi.fn(async () => (existing = sub))
  const manager: PushManagerLike = { getSubscription: async () => existing, subscribe }
  const fetchFn = vi.fn(async () => ({ ok: over.ok ?? true, status: over.ok === false ? 500 : 200 }) as Response)
  const notification = { permission: over.permission ?? ('default' as NotificationPermission), requestPermission: undefined as unknown as () => Promise<NotificationPermission> }
  const requestPermission = vi.fn(async () => (notification.permission = over.requested ?? 'granted'))
  notification.requestPermission = requestPermission
  const env: ReminderEnv = {
    standalone: true,
    notification,
    pushManager: async () => manager,
    fetch: fetchFn as unknown as typeof fetch,
    storage,
    config: { workerUrl: 'https://push.example.dev/', vapidPublicKey: 'BAAA' },
    ...over,
  }
  return { store: createReminderStore(env), data, fetchFn, subscribe, unsubscribe, requestPermission, storage }
}

describe('reminder store', () => {
  it('is unavailable when not standalone, without push/Notification, or with placeholder config', () => {
    expect(setup({ standalone: false }).store.getSnapshot().status).toBe('unavailable')
    expect(setup({ notification: null }).store.getSnapshot().status).toBe('unavailable')
    expect(setup({ pushManager: null }).store.getSnapshot().status).toBe('unavailable')
    expect(setup({ config: { workerUrl: 'PLACEHOLDER_WORKER_URL', vapidPublicKey: 'BAAA' } }).store.getSnapshot().status).toBe('unavailable')
  })

  it('never prompts when unavailable', async () => {
    const s = setup({ standalone: false })
    await s.store.enable(8)
    expect(s.requestPermission).not.toHaveBeenCalled()
    expect(s.fetchFn).not.toHaveBeenCalled()
  })

  it('enable requests permission, subscribes, POSTs the exact Worker body and stores the hour', async () => {
    const s = setup()
    await s.store.enable(8)
    expect(s.requestPermission).toHaveBeenCalled()
    const [url, init] = s.fetchFn.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://push.example.dev/subscribe')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({
      subscription: { endpoint: ENDPOINT, keys: { p256dh: 'pk', auth: 'ak' } },
      hour: 8,
    })
    expect(s.store.getSnapshot()).toEqual({ status: 'on', hour: 8 })
    expect(readHour(s.storage)).toBe(8)
  })

  it('denied permission ends blocked with no request sent', async () => {
    const s = setup({ requested: 'denied' })
    await s.store.enable(8)
    expect(s.store.getSnapshot().status).toBe('blocked')
    expect(s.fetchFn).not.toHaveBeenCalled()
    expect(s.subscribe).not.toHaveBeenCalled()
  })

  it('changeHour re-POSTs with the new hour', async () => {
    const s = setup()
    await s.store.enable(8)
    await s.store.changeHour(20)
    expect(s.fetchFn).toHaveBeenCalledTimes(2)
    expect(JSON.parse((s.fetchFn.mock.calls[1] as unknown as [string, RequestInit])[1].body as string).hour).toBe(20)
    expect(s.store.getSnapshot()).toEqual({ status: 'on', hour: 20 })
    expect(s.subscribe).toHaveBeenCalledTimes(1)
  })

  it('disable DELETEs on the Worker, unsubscribes locally and clears the hour', async () => {
    const s = setup()
    await s.store.enable(8)
    await s.store.disable()
    const [, init] = s.fetchFn.mock.calls[1] as unknown as [string, RequestInit]
    expect(init.method).toBe('DELETE')
    expect(JSON.parse(init.body as string)).toEqual({ endpoint: ENDPOINT })
    expect(s.unsubscribe).toHaveBeenCalled()
    expect(s.store.getSnapshot()).toEqual({ status: 'off', hour: null })
    expect(s.data.has(REMINDER_KEY)).toBe(false)
  })

  it('a network failure leaves a retryable error and keeps stored state', async () => {
    const s = setup()
    await s.store.enable(8)
    s.fetchFn.mockRejectedValueOnce(new Error('offline'))
    await s.store.changeHour(20)
    expect(s.store.getSnapshot()).toEqual({ status: 'error', hour: 8 })
    expect(readHour(s.storage)).toBe(8)
    await s.store.changeHour(20)
    expect(s.store.getSnapshot()).toEqual({ status: 'on', hour: 20 })
  })

  it('a failed DELETE keeps the local subscription so disable can be retried', async () => {
    const s = setup()
    await s.store.enable(8)
    s.fetchFn.mockResolvedValueOnce({ ok: false, status: 500 } as Response)
    await s.store.disable()
    expect(s.store.getSnapshot().status).toBe('error')
    expect(s.unsubscribe).not.toHaveBeenCalled()
    await s.store.disable()
    expect(s.store.getSnapshot().status).toBe('off')
  })

  it('failing enable (HTTP error) does not store the hour', async () => {
    const s = setup({ ok: false })
    await s.store.enable(8)
    expect(s.store.getSnapshot()).toEqual({ status: 'error', hour: null })
    expect(readHour(s.storage)).toBeNull()
  })

  it('restores the on state from storage and survives a throwing storage', async () => {
    const stored = { getItem: () => '9', setItem: () => {} }
    expect(setup({ permission: 'granted', storage: stored }).store.getSnapshot()).toEqual({ status: 'on', hour: 9 })
    const throwing = {
      getItem: () => {
        throw new Error('x')
      },
      setItem: () => {
        throw new Error('x')
      },
    }
    const t = setup({ storage: throwing })
    await t.store.enable(7)
    expect(t.store.getSnapshot()).toEqual({ status: 'on', hour: 7 })
  })

  it('rejects hours outside 6..23', async () => {
    const s = setup()
    await s.store.enable(5)
    expect(s.requestPermission).not.toHaveBeenCalled()
  })
})

