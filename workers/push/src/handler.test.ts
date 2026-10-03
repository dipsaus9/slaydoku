import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { corsHeaders } from './cors.ts'
import { fakeKv } from './fakeKv.ts'
import { handleRequest } from './handler.ts'
import { hashEndpoint, hourKey, listHour, skipKey, subKey } from './store.ts'

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

describe('skip', () => {
  const NOW = Date.parse('2026-10-15T12:00:00Z')
  const skip = (kv: ReturnType<typeof fakeKv>, body: unknown, origin?: string, method = 'POST') =>
    handleRequest(
      new Request('https://push.example/skip', {
        method,
        body: method === 'POST' ? JSON.stringify(body) : null,
        headers: origin ? { origin } : {},
      }),
      { SUBSCRIPTIONS: kv },
      NOW,
    )

  it.each(['2026-10-15', '2026-10-14'])('stores date %s with a 36 hour TTL and answers 204', async (date) => {
    const kv = fakeKv()
    await call(kv, 'POST', sub())
    const put = vi.spyOn(kv, 'put')
    const res = await skip(kv, { endpoint, date })
    expect(res.status).toBe(204)
    const hash = await hashEndpoint(endpoint)
    expect(kv.data.get(skipKey(hash))).toBe(date)
    expect(put).toHaveBeenCalledWith(skipKey(hash), date, { expirationTtl: 36 * 60 * 60 })
  })

  it('answers the same 400 for an unknown endpoint, a bad date and a bad endpoint', async () => {
    const kv = fakeKv()
    await call(kv, 'POST', sub())
    const before = kv.data.size
    const bodies = [
      { endpoint: 'https://fcm.googleapis.com/fcm/send/unknown', date: '2026-10-15' },
      { endpoint, date: '2026-10-13' },
      { endpoint, date: '2026-10-16' },
      { endpoint, date: 'tomorrow' },
      { endpoint, date: 20261015 },
      { endpoint: 'https://evil.example/x', date: '2026-10-15' },
      { date: '2026-10-15' },
    ]
    const answers = await Promise.all(bodies.map(async (b) => { const r = await skip(kv, b); return [r.status, await r.text()] }))
    for (const a of answers) expect(a).toEqual(answers[0])
    expect(answers[0]![0]).toBe(400)
    expect(kv.data.size).toBe(before)
  })

  it('DELETE /subscribe removes the skip entry', async () => {
    const kv = fakeKv()
    await call(kv, 'POST', sub())
    await skip(kv, { endpoint, date: '2026-10-15' })
    await call(kv, 'DELETE', { endpoint })
    expect(kv.data.size).toBe(0)
  })

  it('has the same CORS as /subscribe, and rejects other methods', async () => {
    const kv = fakeKv()
    await call(kv, 'POST', sub())
    const ok = await skip(kv, { endpoint, date: '2026-10-15' }, 'https://slaydoku.nl')
    expect(ok.headers.get('access-control-allow-origin')).toBe('https://slaydoku.nl')
    const bad = await skip(kv, { endpoint, date: '2026-10-15' }, 'https://evil.example')
    expect(bad.headers.get('access-control-allow-origin')).toBeNull()
    const pre = await skip(kv, undefined, 'https://slaydoku.nl', 'OPTIONS')
    expect(pre.status).toBe(204)
    expect((await skip(kv, undefined, undefined, 'DELETE')).status).toBe(405)
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
