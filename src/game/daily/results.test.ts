import { describe, expect, it } from 'vitest'
import { createMemoryStorage } from '../memoryStorage.ts'
import type { StorageLike } from '../persistence.ts'
import { RESULTS_KEY, RESULTS_VERSION, readAllResults, readResult, recordResult } from './results.ts'
import type { DailyResult } from './results.ts'

const result = (n: number, extra: Partial<DailyResult> = {}): DailyResult => ({
  n,
  date: `2026-10-${String(11 + n).padStart(2, '0')}`,
  fp: `fp-${n}`,
  elapsedMs: 123_456,
  hints: 2,
  wrongChecks: 1,
  murdererId: 'p3',
  ...extra,
})

describe('daily results', () => {
  it('reads back what was recorded, per puzzle number', () => {
    const storage = createMemoryStorage()
    expect(recordResult(storage, result(1))).toBe(true)
    expect(recordResult(storage, result(3, { hints: 0 }))).toBe(true)
    expect(readResult(storage, 1)).toEqual(result(1))
    expect(readResult(storage, 3)).toEqual(result(3, { hints: 0 }))
    expect(readResult(storage, 2)).toBeNull()
  })

  it('lists every result, oldest puzzle first', () => {
    const storage = createMemoryStorage()
    for (const n of [5, 2, 9]) recordResult(storage, result(n))
    expect(readAllResults(storage).map((r) => r.n)).toEqual([2, 5, 9])
  })

  it('keeps the first result of a day: a second one changes nothing (no replay for a new time)', () => {
    const storage = createMemoryStorage()
    expect(recordResult(storage, result(4, { elapsedMs: 90_000 }))).toBe(true)
    expect(recordResult(storage, result(4, { elapsedMs: 30_000, hints: 0 }))).toBe(false)
    expect(readResult(storage, 4)?.elapsedMs).toBe(90_000)
    expect(readResult(storage, 4)?.hints).toBe(2)
  })

  it('does not use a result of another puzzle with the same number (fingerprint guard)', () => {
    const storage = createMemoryStorage()
    recordResult(storage, result(4))
    expect(readResult(storage, 4, 'fp-4')).not.toBeNull()
    expect(readResult(storage, 4, 'other')).toBeNull()
  })

  it('stores a versioned document under a fixed key', () => {
    const storage = createMemoryStorage()
    recordResult(storage, result(1))
    const stored = JSON.parse(storage.getItem(RESULTS_KEY)!) as { version: number; results: Record<string, DailyResult> }
    expect(RESULTS_KEY).toBe('slaydoku:daily-results')
    expect(stored.version).toBe(RESULTS_VERSION)
    expect(Object.keys(stored.results)).toEqual(['1'])
  })

  it('reads corrupt, other-version and missing storage as empty', () => {
    for (const raw of ['not json', '{"version":99,"results":{}}', '{"version":1}', '[]', 'null', '{"version":1,"results":{"1":{"n":"x"}}}']) {
      const storage = createMemoryStorage()
      storage.setItem(RESULTS_KEY, raw)
      expect(readAllResults(storage), raw).toEqual([])
      expect(readResult(storage, 1), raw).toBeNull()
    }
    expect(readAllResults(null)).toEqual([])
    expect(readResult(null, 1)).toBeNull()
  })

  it('drops damaged entries and makes numbers safe, keeping the good ones', () => {
    const storage = createMemoryStorage()
    const good = result(2)
    storage.setItem(
      RESULTS_KEY,
      JSON.stringify({ version: RESULTS_VERSION, results: { 1: { n: 1 }, 2: good, 3: { ...result(3), hints: -4, wrongChecks: 'x', elapsedMs: -5 } } }),
    )
    const all = readAllResults(storage)
    expect(all.map((r) => r.n)).toEqual([2, 3])
    expect(all[1]).toMatchObject({ hints: 0, wrongChecks: 0, elapsedMs: 0 })
  })

  it('handles storage that throws, silently', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('full')
      },
      removeItem: () => {},
    }
    expect(recordResult(broken, result(1))).toBe(false)
    expect(readResult(broken, 1)).toBeNull()
    expect(readAllResults(broken)).toEqual([])
    expect(recordResult(null, result(1))).toBe(false)
  })

  it('refuses a result that is not shaped like one', () => {
    const storage = createMemoryStorage()
    expect(recordResult(storage, { ...result(1), n: 0 })).toBe(false)
    expect(recordResult(storage, { ...result(1), date: 'yesterday' })).toBe(false)
    expect(recordResult(storage, { ...result(1), elapsedMs: Number.NaN })).toBe(false)
    expect(readAllResults(storage)).toEqual([])
  })
})

describe('tier of a result', () => {
  it('is kept when known, and dropped when unknown or missing (results from before statistics)', () => {
    const storage = createMemoryStorage()
    recordResult(storage, result(1, { tier: 'hard' }))
    recordResult(storage, result(2, { tier: 'nonsense' as never }))
    recordResult(storage, result(3))
    expect(readResult(storage, 1)?.tier).toBe('hard')
    expect(readResult(storage, 2)).not.toHaveProperty('tier')
    expect(readResult(storage, 3)).not.toHaveProperty('tier')
  })
})
