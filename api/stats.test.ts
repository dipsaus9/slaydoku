import { describe, expect, it } from 'vitest'
import type { CounterStore } from './_lib/kv.ts'
import { createHandler } from './stats.ts'

function fakeStore(initial: Record<string, number> = {}): CounterStore & { data: Record<string, number> } {
  const data = { ...initial }
  return {
    data,
    async incr(key) {
      data[key] = (data[key] ?? 0) + 1
      return data[key]
    },
    async incrby(key, amount) {
      data[key] = (data[key] ?? 0) + amount
      return data[key]
    },
    async mget(keys) {
      return keys.map((key) => (key in data ? data[key] : null))
    },
  }
}

function fakeRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(body: unknown) {
      res.body = body
    },
  }
  return res
}

describe('POST /api/stats', () => {
  it('records a start event and returns 200', async () => {
    const store = fakeStore()
    const res = fakeRes()
    await createHandler(() => store)({ method: 'POST', query: {}, body: { day: '2026-10-14', event: 'start' } }, res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(store.data).toEqual({ 'stats:2026-10-14:starts': 1 })
  })

  it('records a solve event with elapsedMs and returns 200', async () => {
    const store = fakeStore()
    const res = fakeRes()
    await createHandler(() => store)({ method: 'POST', query: {}, body: { day: '2026-10-14', event: 'solve', elapsedMs: 42000 } }, res)
    expect(res.statusCode).toBe(200)
    expect(store.data).toEqual({
      'stats:2026-10-14:solves': 1,
      'stats:2026-10-14:solveMsSum': 42000,
      'stats:2026-10-14:solveMsCount': 1,
    })
  })

  it('rejects malformed input with 400 and never touches the store', async () => {
    const store = fakeStore()
    const res = fakeRes()
    await createHandler(() => store)({ method: 'POST', query: {}, body: { day: 'bad-day', event: 'start' } }, res)
    expect(res.statusCode).toBe(400)
    expect(store.data).toEqual({})
  })

  it('rejects a missing body the same way', async () => {
    const store = fakeStore()
    const res = fakeRes()
    await createHandler(() => store)({ method: 'POST', query: {} }, res)
    expect(res.statusCode).toBe(400)
    expect(store.data).toEqual({})
  })
})

describe('GET /api/stats', () => {
  it("returns a day's current counters", async () => {
    const store = fakeStore({ 'stats:2026-10-14:starts': 5, 'stats:2026-10-14:solves': 3 })
    const res = fakeRes()
    await createHandler(() => store)({ method: 'GET', query: { day: '2026-10-14' } }, res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ day: '2026-10-14', starts: 5, solves: 3, solveMsSum: 0, solveMsCount: 0 })
  })

  it('requires a day query param', async () => {
    const res = fakeRes()
    await createHandler(() => fakeStore())({ method: 'GET', query: {} }, res)
    expect(res.statusCode).toBe(400)
  })

  it('rejects a malformed day', async () => {
    const res = fakeRes()
    await createHandler(() => fakeStore())({ method: 'GET', query: { day: 'nope' } }, res)
    expect(res.statusCode).toBe(400)
  })

  it("the response body carries only the four counter fields plus day — never a request header, cookie, or IP (SLAY-7.1 AC4)", async () => {
    const store = fakeStore({ 'stats:2026-10-14:starts': 1 })
    const res = fakeRes()
    await createHandler(() => store)({ method: 'GET', query: { day: '2026-10-14' } }, res)
    expect(Object.keys(res.body as object).sort()).toEqual(['day', 'solveMsCount', 'solveMsSum', 'solves', 'starts'])
  })
})

it('rejects any other method with 405', async () => {
  const res = fakeRes()
  await createHandler(() => fakeStore())({ method: 'DELETE', query: {} }, res)
  expect(res.statusCode).toBe(405)
})

it('reports 500 without throwing when the KV store is not configured yet (owner-prerequisite path)', async () => {
  const res = fakeRes()
  await createHandler(() => {
    throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.')
  })({ method: 'GET', query: { day: '2026-10-14' } }, res)
  expect(res.statusCode).toBe(500)
  expect(res.body).toEqual({ error: expect.stringContaining('KV_REST_API_URL') })
})
