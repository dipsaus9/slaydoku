import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { corsHeaders } from './cors.ts'
import { fakeKv } from './fakeKv.ts'
import { handleRequest } from './handler.ts'
import { hashEndpoint, hourKey, listHour, subKey } from './store.ts'

const endpoint = 'https://fcm.googleapis.com/fcm/send/abc123'
const sub = (over: Record<string, unknown> = {}) => ({
  subscription: { endpoint, keys: { p256dh: 'BPk_abc-DEF', auth: 'auth_key-1' } },
  hour: 8,
  ...over,
})
const call = (kv: ReturnType<typeof fakeKv>, method: string, body: unknown, origin?: string) =>
  handleRequest(
    new Request('https://push.example/subscribe', {
      method,
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: origin ? { origin } : {},
    }),
    { SUBSCRIPTIONS: kv },
  )

describe('validation', () => {
  it.each([
    ['http endpoint', sub({ subscription: { endpoint: 'http://fcm.googleapis.com/x', keys: { p256dh: 'a', auth: 'b' } } })],
    ['unknown host', sub({ subscription: { endpoint: 'https://evil.example/x', keys: { p256dh: 'a', auth: 'b' } } })],
    ['lookalike host', sub({ subscription: { endpoint: 'https://fcm.googleapis.com.evil.example/x', keys: { p256dh: 'a', auth: 'b' } } })],
    ['missing auth', sub({ subscription: { endpoint, keys: { p256dh: 'a' } } })],
    ['hour 5', sub({ hour: 5 })],
    ['hour 24', sub({ hour: 24 })],
    ['fractional hour', sub({ hour: 8.5 })],
    ['string hour', sub({ hour: '8' })],
    ['bad locale', sub({ locale: 'x'.repeat(30) })],
    ['array', []],
  ])('rejects %s with 400 and stores nothing', async (_n, body) => {
    const kv = fakeKv()
    expect((await call(kv, 'POST', body)).status).toBe(400)
    expect(kv.data.size).toBe(0)
  })

  it('rejects invalid json and bad delete bodies', async () => {
    const kv = fakeKv()
    expect((await call(kv, 'POST', '{nope')).status).toBe(400)
    expect((await call(kv, 'DELETE', { endpoint: 'https://evil.example/x' })).status).toBe(400)
  })

  it.each([6, 23])('accepts hour %i', async (hour) => {
    expect((await call(fakeKv(), 'POST', sub({ hour, locale: 'nl-NL' }))).status).toBe(200)
  })
})

describe('store', () => {
  it('stores under a hash of the endpoint and indexes by hour', async () => {
    const kv = fakeKv()
    await call(kv, 'POST', sub())
    const hash = await hashEndpoint(endpoint)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(JSON.parse(kv.data.get(subKey(hash))!)).toEqual(sub())
    expect(kv.data.has(hourKey(8, hash))).toBe(true)
    expect(await listHour(kv, 8)).toHaveLength(1)
    expect(await listHour(kv, 9)).toHaveLength(0)
    expect([...kv.data.keys()].some((k) => k.includes('fcm.googleapis'))).toBe(false)
  })

  it('moves the subscription when re-subscribing with a new hour', async () => {
    const kv = fakeKv()
    await call(kv, 'POST', sub())
    await call(kv, 'POST', sub({ hour: 20 }))
    expect(await listHour(kv, 8)).toHaveLength(0)
    expect(await listHour(kv, 20)).toHaveLength(1)
    expect(kv.data.size).toBe(2)
  })

  it('delete removes record and hour index, and is idempotent', async () => {
    const kv = fakeKv()
    await call(kv, 'POST', sub())
    expect((await call(kv, 'DELETE', { endpoint })).status).toBe(200)
    expect(kv.data.size).toBe(0)
    expect((await call(kv, 'DELETE', { endpoint })).status).toBe(200)
  })
})

describe('cors and routing', () => {
  it('allows Slaydoku origins only', async () => {
    for (const o of ['https://slaydoku.nl', 'https://www.slaydoku.nl', 'https://slaydoku.vercel.app']) {
      expect((await call(fakeKv(), 'POST', sub(), o)).headers.get('access-control-allow-origin')).toBe(o)
    }
    const other = await call(fakeKv(), 'POST', sub(), 'https://evil.example')
    expect(other.headers.get('access-control-allow-origin')).toBeNull()
    expect(corsHeaders(null)).toEqual({})
  })

  it('allows localhost only in dev', async () => {
    expect(corsHeaders('http://localhost:5173')).toEqual({})
    expect(corsHeaders('http://localhost:5173', true)['access-control-allow-origin']).toBe('http://localhost:5173')
  })

  it('answers preflight, 404 and 405', async () => {
    const kv = fakeKv()
    expect((await call(kv, 'OPTIONS', undefined, 'https://slaydoku.nl')).status).toBe(204)
    expect((await call(kv, 'GET', undefined)).status).toBe(405)
    const r = await handleRequest(new Request('https://push.example/other'), { SUBSCRIPTIONS: kv })
    expect(r.status).toBe(404)
  })
})

describe('worker source', () => {
  it('has no node: imports', () => {
    const dir = new URL('.', import.meta.url)
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))) {
      expect(readFileSync(new URL(f, dir), 'utf8'), f).not.toMatch(/from ['"]node:|process\./)
    }
  })
})
