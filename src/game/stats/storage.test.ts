import { describe, expect, it } from 'vitest'
import { dailyId } from '../daily/ids.ts'
import { RESULTS_KEY, readAllResults, recordResult } from '../daily/results.ts'
import type { DailyResult } from '../daily/results.ts'
import { createMemoryStorage } from '../memoryStorage.ts'
import { OPTIONS_KEY, saveKey } from '../persistence.ts'
import { TELEMETRY_KEY, TELEMETRY_VERSION, loadTelemetry, saveTelemetryRecord } from '../telemetry/storage.ts'
import type { TelemetryRecord } from '../telemetry/types.ts'
import { dailyNumberOf, readStats, resetStats } from './storage.ts'

const result = (n: number, date: string, extra: Partial<DailyResult> = {}): DailyResult => ({
  n,
  date,
  fp: `fp${n}`,
  tier: 'easy',
  elapsedMs: 90_000,
  hints: 1,
  wrongChecks: 0,
  murdererId: 'p1',
  ...extra,
})

const record = (puzzleId: string): TelemetryRecord => ({
  sessionId: `${puzzleId}@1`,
  puzzleId,
  startedAt: 1,
  activeSeconds: 5,
  hints: { 1: 1, 2: 0, 3: 0 },
  hintPlacements: 0,
  wrongPlacements: 0,
  failedChecks: 0,
  undos: 0,
  outcome: 'abandoned',
})

describe('dailyNumberOf', () => {
  it('reads daily ids only', () => {
    expect(dailyNumberOf('daily-12')).toBe(12)
    expect(dailyNumberOf('daily-0')).toBeNull()
    expect(dailyNumberOf('demo')).toBeNull()
    expect(dailyNumberOf('daily-3x')).toBeNull()
  })
})

describe('readStats', () => {
  it('reads an empty or missing store as no history', () => {
    expect(readStats(createMemoryStorage(), '2026-10-15').played).toBe(0)
    expect(readStats(null, '2026-10-15').played).toBe(0)
  })

  it('counts started days from the play records, next to the solved ones', () => {
    const storage = createMemoryStorage()
    recordResult(storage, result(1, '2026-10-12'))
    recordResult(storage, result(2, '2026-10-13'))
    saveTelemetryRecord(storage, record(dailyId(3)))
    saveTelemetryRecord(storage, record(dailyId(2)))
    saveTelemetryRecord(storage, record('demo'))
    const stats = readStats(storage, '2026-10-13')
    expect(stats).toMatchObject({ played: 3, solved: 2, currentStreak: 2 })
  })

  it('a corrupt store reads as no history', () => {
    const storage = createMemoryStorage()
    storage.setItem(RESULTS_KEY, '{not json')
    storage.setItem(TELEMETRY_KEY, '[[')
    expect(readStats(storage, '2026-10-13').played).toBe(0)
  })

  it('a store that throws reads as no history', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    expect(readStats(broken, '2026-10-13').played).toBe(0)
    expect(resetStats(broken)).toBe(false)
  })
})

describe('resetStats', () => {
  it('removes results, daily play records and daily board saves, and nothing else', () => {
    const storage = createMemoryStorage()
    recordResult(storage, result(1, '2026-10-12'))
    saveTelemetryRecord(storage, record(dailyId(1)))
    saveTelemetryRecord(storage, record(dailyId(2)))
    saveTelemetryRecord(storage, record('demo'))
    storage.setItem(saveKey(dailyId(1)), '{}')
    storage.setItem(saveKey(dailyId(2)), '{}')
    storage.setItem(saveKey('demo'), '{}')
    storage.setItem(OPTIONS_KEY, '{"keep":true}')

    expect(resetStats(storage)).toBe(true)

    expect(readAllResults(storage)).toEqual([])
    expect(loadTelemetry(storage).map((t) => t.puzzleId)).toEqual(['demo'])
    expect(storage.getItem(saveKey(dailyId(1)))).toBeNull()
    expect(storage.getItem(saveKey(dailyId(2)))).toBeNull()
    expect(storage.getItem(saveKey('demo'))).toBe('{}')
    expect(storage.getItem(OPTIONS_KEY)).toBe('{"keep":true}')
    expect(readStats(storage, '2026-10-13')).toMatchObject({ played: 0, solved: 0, bestStreak: 0 })
  })

  it('drops the telemetry key when no other record is left', () => {
    const storage = createMemoryStorage()
    saveTelemetryRecord(storage, record(dailyId(4)))
    resetStats(storage)
    expect(storage.getItem(TELEMETRY_KEY)).toBeNull()
  })

  it('keeps other telemetry in the current version', () => {
    const storage = createMemoryStorage()
    saveTelemetryRecord(storage, record('demo'))
    resetStats(storage)
    expect(JSON.parse(storage.getItem(TELEMETRY_KEY)!).version).toBe(TELEMETRY_VERSION)
  })
})
