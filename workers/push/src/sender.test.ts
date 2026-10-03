import { beforeAll, describe, expect, it, vi } from 'vitest'
import { amsterdamNow } from './amsterdam.ts'
import { fakeKv } from './fakeKv.ts'
import { hashEndpoint, hourKey, listHour, skipKey, subKey } from './store.ts'
import { CHUNK_SIZE, PUSH_TOPIC, PUSH_TTL_SECONDS, runScheduled, type SenderEnv } from './sender.ts'
import { b64urlDecode, b64urlEncode } from './vapid.ts'

let publicKey = ''
let privateKey = ''
let verifyKey: CryptoKey

beforeAll(async () => {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  publicKey = b64urlEncode(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)))
  privateKey = ((await crypto.subtle.exportKey('jwk', pair.privateKey)) as JsonWebKey).d as string
  verifyKey = pair.publicKey
})

const at = (iso: string) => Date.parse(iso)
const endpointFor = (host: string, i: number) => `https://${host}/push/${i}`

async function addSub(kv: ReturnType<typeof fakeKv>, endpoint: string, hour: number) {
  const hash = await hashEndpoint(endpoint)
  await kv.put(subKey(hash), JSON.stringify({ subscription: { endpoint, keys: { p256dh: 'a', auth: 'b' } }, hour }))
  await kv.put(hourKey(hour, hash), '')
}

const envFor = (kv: ReturnType<typeof fakeKv>): SenderEnv => ({
  SUBSCRIPTIONS: kv,
  VAPID_PUBLIC_KEY: publicKey,
  VAPID_PRIVATE_KEY: privateKey,
  VAPID_SUBJECT: 'mailto:test@example.com',
})

function fakeFetch(status: (url: string) => number = () => 201) {
  const calls: { url: string; headers: Record<string, string> }[] = []
  const fn = (async (url: string, init: RequestInit) => {
    calls.push({ url, headers: init.headers as Record<string, string> })
    return new Response(null, { status: status(url) })
  }) as unknown as typeof fetch
  return { fn, calls }
}

describe('amsterdamNow', () => {
  it.each([
    ['2026-03-28T05:00:00Z', 6], // CET, before the March switch
    ['2026-03-29T05:00:00Z', 7], // CEST, after it
    ['2026-03-29T00:59:00Z', 1],
    ['2026-03-29T01:00:00Z', 3], // 02:00 does not exist
    ['2026-10-24T05:00:00Z', 7], // CEST, before the October switch
    ['2026-10-25T05:00:00Z', 6], // CET, after it
    ['2026-10-25T00:30:00Z', 2],
    ['2026-10-25T01:30:00Z', 2], // 02:00-03:00 happens twice
  ])('%s is Amsterdam hour %i', (iso, hour) => {
    expect(amsterdamNow(new Date(iso)).hour).toBe(hour)
  })

  it('reports the Amsterdam calendar day, not the UTC one', () => {
    expect(amsterdamNow(new Date('2026-06-30T22:30:00Z'))).toEqual({ date: '2026-07-01', hour: 0 })
  })
})

describe('hour selection across DST', () => {
  it.each([
    ['2026-03-28T05:00:00Z', 6],
    ['2026-03-29T05:00:00Z', 7],
    ['2026-10-24T05:00:00Z', 7],
    ['2026-10-25T05:00:00Z', 6],
  ])('at %s only hour %i subscribers are sent to', async (iso, hour) => {
    const kv = fakeKv()
    for (const h of [6, 7, 8]) await addSub(kv, endpointFor('fcm.googleapis.com', h), h)
    const { fn, calls } = fakeFetch()
    const res = await runScheduled(envFor(kv), at(iso), fn)
    expect(calls.map((c) => c.url)).toEqual([endpointFor('fcm.googleapis.com', hour)])
    expect(res).toMatchObject({ hour, sent: 1, done: true })
  })
})

describe('VAPID push', () => {
  it('signs ES256 with one reused JWT per origin and sets TTL and Topic', async () => {
    const kv = fakeKv()
    await addSub(kv, endpointFor('fcm.googleapis.com', 1), 8)
    await addSub(kv, endpointFor('fcm.googleapis.com', 2), 8)
    await addSub(kv, endpointFor('updates.push.services.mozilla.com', 3), 8)
    const { fn, calls } = fakeFetch()
    const t = at('2026-10-15T06:00:00Z')
    await runScheduled(envFor(kv), t, fn)
    expect(calls).toHaveLength(3)

    const parsed = calls.map((c) => {
      const m = /^vapid t=([^,]+), k=(.+)$/.exec(c.headers.authorization as string)
      expect(m).not.toBeNull()
      expect(m?.[2]).toBe(publicKey)
      return { url: c.url, jwt: m?.[1] as string }
    })
    const fcm = parsed.filter((p) => p.url.includes('fcm'))
    expect(fcm[0]?.jwt).toBe(fcm[1]?.jwt)
    expect(parsed.find((p) => p.url.includes('mozilla'))?.jwt).not.toBe(fcm[0]?.jwt)

    for (const { url, jwt } of parsed) {
      const [h, c, s] = jwt.split('.') as [string, string, string]
      expect(JSON.parse(new TextDecoder().decode(b64urlDecode(h)))).toEqual({ typ: 'JWT', alg: 'ES256' })
      const claims = JSON.parse(new TextDecoder().decode(b64urlDecode(c)))
      expect(claims.aud).toBe(new URL(url).origin)
      expect(claims.sub).toBe('mailto:test@example.com')
      expect(claims.exp).toBeGreaterThan(t / 1000)
      expect(claims.exp - t / 1000).toBeLessThanOrEqual(24 * 3600)
      const sig = b64urlDecode(s)
      expect(sig).toHaveLength(64)
      const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, verifyKey, sig, new TextEncoder().encode(`${h}.${c}`))
      expect(ok).toBe(true)
    }
    for (const c of calls) {
      expect(c.headers.ttl).toBe(String(PUSH_TTL_SECONDS))
      expect(c.headers.topic).toBe(PUSH_TOPIC)
    }
  })
})

describe('chunking', () => {
  it('sends more subscribers than one chunk exactly once, within the subrequest cap per run', async () => {
    const kv = fakeKv()
    const total = CHUNK_SIZE * 3 + 4
    for (let i = 0; i < total; i++) await addSub(kv, endpointFor('fcm.googleapis.com', i), 8)
    const { fn, calls } = fakeFetch()
    const seen: number[] = []
    for (let run = 0; run < 10; run++) {
      const before = kv.calls.n
      const fetched = calls.length
      const res = await runScheduled(envFor(kv), at('2026-10-15T06:00:00Z') + run * 5 * 60_000, fn)
      seen.push(res.sent)
      expect(kv.calls.n - before + (calls.length - fetched)).toBeLessThanOrEqual(50)
      if (res.done) break
    }
    expect(seen.reduce((a, b) => a + b, 0)).toBe(total)
    expect(new Set(calls.map((c) => c.url)).size).toBe(total)
    expect(calls).toHaveLength(total)
    // a finished hour is a no-op
    const again = await runScheduled(envFor(kv), at('2026-10-15T06:55:00Z'), fn)
    expect(again).toMatchObject({ sent: 0, done: true })
    expect(calls).toHaveLength(total)
  })

  it('stays within the cap even when every send prunes', async () => {
    const kv = fakeKv()
    for (let i = 0; i < CHUNK_SIZE; i++) await addSub(kv, endpointFor('fcm.googleapis.com', i), 8)
    const { fn, calls } = fakeFetch(() => 410)
    const before = kv.calls.n
    await runScheduled(envFor(kv), at('2026-10-15T06:00:00Z'), fn)
    expect(kv.calls.n - before + calls.length).toBeLessThanOrEqual(50)
  })

  it('a new Amsterdam day sends to the same hour again', async () => {
    const kv = fakeKv()
    await addSub(kv, endpointFor('fcm.googleapis.com', 1), 8)
    const { fn, calls } = fakeFetch()
    await runScheduled(envFor(kv), at('2026-10-15T06:00:00Z'), fn)
    await runScheduled(envFor(kv), at('2026-10-16T06:00:00Z'), fn)
    expect(calls).toHaveLength(2)
  })
})

describe('skip date', () => {
  const skipFor = async (kv: ReturnType<typeof fakeKv>, endpoint: string, date: string) =>
    kv.put(skipKey(await hashEndpoint(endpoint)), date, { expirationTtl: 129600 })

  it('leaves out a subscription skipped for today, still sends older or missing skip dates', async () => {
    const kv = fakeKv()
    const [today, old, none] = [1, 2, 3].map((i) => endpointFor('fcm.googleapis.com', i)) as [string, string, string]
    for (const e of [today, old, none]) await addSub(kv, e, 8)
    await skipFor(kv, today, '2026-10-15')
    await skipFor(kv, old, '2026-10-14')
    const { fn, calls } = fakeFetch()
    const res = await runScheduled(envFor(kv), at('2026-10-15T06:00:00Z'), fn)
    expect(calls.map((c) => c.url).sort()).toEqual([old, none])
    expect(res).toMatchObject({ sent: 2, skipped: 1, done: true })
  })

  it('applies across chunks and stays within the subrequest cap', async () => {
    const kv = fakeKv()
    const total = CHUNK_SIZE * 3 + 2
    const skipped = new Set<string>()
    for (let i = 0; i < total; i++) {
      const e = endpointFor('fcm.googleapis.com', i)
      await addSub(kv, e, 8)
      if (i % 3 === 0) {
        skipped.add(e)
        await skipFor(kv, e, '2026-10-15')
      }
    }
    const { fn, calls } = fakeFetch()
    for (let run = 0; run < 10; run++) {
      const before = kv.calls.n
      const fetched = calls.length
      const res = await runScheduled(envFor(kv), at('2026-10-15T06:00:00Z') + run * 5 * 60_000, fn)
      expect(kv.calls.n - before + (calls.length - fetched)).toBeLessThanOrEqual(50)
      if (res.done) break
    }
    expect(calls).toHaveLength(total - skipped.size)
    expect(calls.some((c) => skipped.has(c.url))).toBe(false)
  })

  it('a skip for today no longer applies the next UTC day', async () => {
    const kv = fakeKv()
    const e = endpointFor('fcm.googleapis.com', 1)
    await addSub(kv, e, 8)
    await skipFor(kv, e, '2026-10-15')
    const { fn, calls } = fakeFetch()
    await runScheduled(envFor(kv), at('2026-10-15T06:00:00Z'), fn)
    await runScheduled(envFor(kv), at('2026-10-16T06:00:00Z'), fn)
    expect(calls).toHaveLength(1)
  })

  it('pruning a dead subscription removes its skip entry too', async () => {
    const kv = fakeKv()
    const dead = endpointFor('fcm.googleapis.com', 1)
    await addSub(kv, dead, 8)
    await skipFor(kv, dead, '2026-10-14')
    const { fn } = fakeFetch(() => 410)
    await runScheduled(envFor(kv), at('2026-10-15T06:00:00Z'), fn)
    expect([...kv.data.keys()].filter((k) => !k.startsWith('run:'))).toEqual([])
  })
})

describe('pruning and failures', () => {
  it.each([404, 410])('%i deletes the subscription and its index entry', async (code) => {
    const kv = fakeKv()
    const dead = endpointFor('fcm.googleapis.com', 1)
    await addSub(kv, dead, 8)
    await addSub(kv, endpointFor('fcm.googleapis.com', 2), 8)
    const { fn } = fakeFetch((u) => (u === dead ? code : 201))
    const res = await runScheduled(envFor(kv), at('2026-10-15T06:00:00Z'), fn)
    expect(res).toMatchObject({ sent: 1, pruned: 1 })
    const hash = await hashEndpoint(dead)
    expect(kv.data.has(subKey(hash))).toBe(false)
    expect(kv.data.has(hourKey(8, hash))).toBe(false)
    expect(await listHour(kv, 8)).toHaveLength(1)
  })

  it('keeps the subscription on other failures and never logs the endpoint', async () => {
    const kv = fakeKv()
    const flaky = endpointFor('fcm.googleapis.com', 1)
    const thrower = endpointFor('fcm.googleapis.com', 2)
    await addSub(kv, flaky, 8)
    await addSub(kv, thrower, 8)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fn = (async (url: string) => {
      if (url === thrower) throw new TypeError(`network down ${url}`)
      return new Response(null, { status: 503 })
    }) as unknown as typeof fetch
    const res = await runScheduled(envFor(kv), at('2026-10-15T06:00:00Z'), fn)
    expect(res).toMatchObject({ sent: 0, pruned: 0, failed: 2, done: true })
    expect(await listHour(kv, 8)).toHaveLength(2)
    expect(warn).toHaveBeenCalledTimes(2)
    expect(JSON.stringify(warn.mock.calls)).not.toContain('fcm.googleapis.com')
    warn.mockRestore()
  })
})

describe('listHour pagination', () => {
  it('follows the KV cursor past the 1000-key page limit', async () => {
    const kv = fakeKv()
    const n = 1003
    for (let i = 0; i < n; i++) {
      const hash = `h${String(i).padStart(5, '0')}`
      kv.data.set(hourKey(9, hash), '')
      kv.data.set(subKey(hash), JSON.stringify({ subscription: { endpoint: `https://fcm.googleapis.com/${i}`, keys: { p256dh: 'a', auth: 'b' } }, hour: 9 }))
    }
    expect(await listHour(kv, 9)).toHaveLength(n)
  })
})
