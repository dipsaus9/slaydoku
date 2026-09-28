import { describe, expect, it } from 'vitest'
import { readDay, recordEvent, type CounterStore, type RecordInput } from './kv.ts'

/** In-memory fake of the Redis slice this module needs — good enough to prove increments and reads without a real store. */
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

describe('recordEvent', () => {
  it('increments starts on a start event', async () => {
    const store = fakeStore()
    const result = await recordEvent(store, { day: '2026-10-14', event: 'start' })
    expect(result).toEqual({ ok: true })
    expect(store.data).toEqual({ 'stats:2026-10-14:starts': 1 })
  })

  it('increments solves and the solve-time sum/count when elapsedMs is present', async () => {
    const store = fakeStore()
    await recordEvent(store, { day: '2026-10-14', event: 'solve', elapsedMs: 45000 })
    expect(store.data).toEqual({
      'stats:2026-10-14:solves': 1,
      'stats:2026-10-14:solveMsSum': 45000,
      'stats:2026-10-14:solveMsCount': 1,
    })
  })

  it('increments only solves when elapsedMs is absent', async () => {
    const store = fakeStore()
    await recordEvent(store, { day: '2026-10-14', event: 'solve' })
    expect(store.data).toEqual({ 'stats:2026-10-14:solves': 1 })
  })

  it('rounds a fractional elapsedMs before storing', async () => {
    const store = fakeStore()
    await recordEvent(store, { day: '2026-10-14', event: 'solve', elapsedMs: 1234.6 })
    expect(store.data['stats:2026-10-14:solveMsSum']).toBe(1235)
  })

  it('rejects a malformed day without touching the store', async () => {
    const store = fakeStore()
    const result = await recordEvent(store, { day: '2026-1-14', event: 'start' })
    expect(result.ok).toBe(false)
    expect(store.data).toEqual({})
  })

  it('rejects a missing day without touching the store', async () => {
    const store = fakeStore()
    const result = await recordEvent(store, { day: undefined, event: 'start' })
    expect(result.ok).toBe(false)
    expect(store.data).toEqual({})
  })

  it('rejects an unknown event without touching the store', async () => {
    const store = fakeStore()
    const result = await recordEvent(store, { day: '2026-10-14', event: 'delete-everything' })
    expect(result.ok).toBe(false)
    expect(store.data).toEqual({})
  })

  it('rejects a negative elapsedMs without touching the store', async () => {
    const store = fakeStore()
    const result = await recordEvent(store, { day: '2026-10-14', event: 'solve', elapsedMs: -1 })
    expect(result.ok).toBe(false)
    expect(store.data).toEqual({})
  })

  it('rejects a non-finite elapsedMs without touching the store', async () => {
    const store = fakeStore()
    const result = await recordEvent(store, { day: '2026-10-14', event: 'solve', elapsedMs: Number.POSITIVE_INFINITY })
    expect(result.ok).toBe(false)
    expect(store.data).toEqual({})
  })

  it('rejects a non-numeric elapsedMs without touching the store', async () => {
    const store = fakeStore()
    const result = await recordEvent(store, { day: '2026-10-14', event: 'solve', elapsedMs: '45000' })
    expect(result.ok).toBe(false)
    expect(store.data).toEqual({})
  })
})

describe('readDay', () => {
  it("returns zero counters for a day nothing was recorded on", async () => {
    const store = fakeStore()
    expect(await readDay(store, '2026-10-14')).toEqual({ day: '2026-10-14', starts: 0, solves: 0, solveMsSum: 0, solveMsCount: 0 })
  })

  it('returns the accumulated counters after several events', async () => {
    const store = fakeStore()
    await recordEvent(store, { day: '2026-10-14', event: 'start' })
    await recordEvent(store, { day: '2026-10-14', event: 'start' })
    await recordEvent(store, { day: '2026-10-14', event: 'solve', elapsedMs: 30000 })
    await recordEvent(store, { day: '2026-10-14', event: 'solve', elapsedMs: 60000 })
    expect(await readDay(store, '2026-10-14')).toEqual({ day: '2026-10-14', starts: 2, solves: 2, solveMsSum: 90000, solveMsCount: 2 })
  })

  it('rejects a malformed day', async () => {
    const store = fakeStore()
    expect(await readDay(store, 'not-a-day')).toBeNull()
  })

  it('normalizes decimal-string counters the way a real Redis mget returns them', async () => {
    const store: CounterStore = {
      incr: async () => 0,
      incrby: async () => 0,
      mget: async () => ['3', '2', '90000', null],
    }
    expect(await readDay(store, '2026-10-14')).toEqual({ day: '2026-10-14', starts: 3, solves: 2, solveMsSum: 90000, solveMsCount: 0 })
  })
})

describe('privacy — only the four documented per-day keys are ever written (SLAY-7.1 AC4)', () => {
  it('ignores any extra fields a client tried to smuggle in, such as an ip or a cookie', async () => {
    const store = fakeStore()
    const smuggled: Record<string, unknown> = {
      day: '2026-10-14',
      event: 'start',
      ip: '203.0.113.5',
      cookie: 'sid=abc123',
      sessionId: 'e2f1',
    }
    await recordEvent(store, smuggled as unknown as RecordInput)
    expect(Object.keys(store.data)).toEqual(['stats:2026-10-14:starts'])
  })
})
