import { describe, expect, it } from 'vitest'
import { withCastNames } from '../../ui/play/index.ts'
import { readSchedule } from '../../schedule/schedule.testing.ts'
import { createGameStore } from '../store.ts'
import { createMemoryStorage } from '../memoryStorage.ts'
import { saveTelemetryRecord } from '../telemetry/storage.ts'
import type { TelemetryRecord } from '../telemetry/types.ts'
import { dailyId } from './ids.ts'
import { observeSolve } from './observe.ts'
import { readResult, recordResult } from './results.ts'
import { dayStatus, playCounts, resultOf } from './status.ts'

const { days } = readSchedule()
const day = days[3]!
const id = dailyId(day.n)
const record = (over: Partial<TelemetryRecord>): TelemetryRecord => ({
  sessionId: `${id}@${Math.random()}`,
  puzzleId: id,
  startedAt: 0,
  activeSeconds: 10,
  hints: { 1: 0, 2: 0, 3: 0 },
  hintPlacements: 0,
  wrongPlacements: 0,
  failedChecks: 0,
  undos: 0,
  outcome: 'abandoned',
  ...over,
})

/** Places everybody on the stored solution through a real game store. */
function solve(storage: ReturnType<typeof createMemoryStorage>) {
  const store = createGameStore({ levelId: id, puzzle: day.puzzle, storage, now: () => 5000 })
  for (const p of day.puzzle.solution) store.dispatch({ type: 'place', personId: p.personId, cell: p.cell })
  return store
}

describe('daily ids', () => {
  it('names the save slot after the puzzle number', () => {
    expect(dailyId(43)).toBe('daily-43')
  })
})

describe('dayStatus', () => {
  it('is new without a save, in progress with one, and solved with a result', () => {
    const storage = createMemoryStorage()
    expect(dayStatus(storage, day)).toEqual({ kind: 'new' })
    const store = createGameStore({ levelId: id, puzzle: day.puzzle, storage, now: () => 1000 })
    store.dispatch({ type: 'toggleNote', personId: day.puzzle.people[0]!.id, cell: { row: 0, col: 0 } })
    expect(dayStatus(storage, day)).toEqual({ kind: 'inProgress' })
    const result = resultOf(storage, day, { murdererId: 'x', elapsedMs: 4000 })
    recordResult(storage, result)
    expect(dayStatus(storage, day)).toEqual({ kind: 'solved', result })
  })

  it('reads a solved board without a recorded result as solved (the record write failed)', () => {
    const storage = createMemoryStorage()
    solve(storage)
    const status = dayStatus(storage, day)
    expect(status.kind).toBe('solved')
    expect(readResult(storage, day.n)).toBeNull()
  })

  it('does not use a save or a result of another puzzle behind the same number (fingerprint guard)', () => {
    const storage = createMemoryStorage()
    solve(storage)
    recordResult(storage, resultOf(storage, day, { murdererId: 'x', elapsedMs: 4000 }))
    expect(dayStatus(storage, { ...day, fp: 'another', puzzle: days[4]!.puzzle })).toEqual({ kind: 'new' })
  })

  it('reads a missing storage as new', () => {
    expect(dayStatus(null, day)).toEqual({ kind: 'new' })
  })
})

describe('playCounts and resultOf', () => {
  it('adds the hints and failed checks of every session of that puzzle, and no other', () => {
    const storage = createMemoryStorage()
    saveTelemetryRecord(storage, record({ hints: { 1: 2, 2: 1, 3: 1 }, failedChecks: 1 }))
    saveTelemetryRecord(storage, record({ hints: { 1: 1, 2: 0, 3: 0 }, failedChecks: 2 }))
    saveTelemetryRecord(storage, record({ puzzleId: dailyId(day.n + 1), hints: { 1: 9, 2: 9, 3: 9 }, failedChecks: 9 }))
    expect(playCounts(storage, id)).toEqual({ hints: 3, wrongChecks: 3 })
    expect(resultOf(storage, day, { murdererId: 'p1', elapsedMs: 61_000 })).toEqual({
      n: day.n,
      date: day.date,
      fp: day.fp,
      tier: day.tier,
      elapsedMs: 61_000,
      murdererId: 'p1',
      hints: 3,
      wrongChecks: 3,
    })
  })

  it('reads no telemetry as zero', () => {
    expect(playCounts(createMemoryStorage(), id)).toEqual({ hints: 0, wrongChecks: 0 })
    expect(playCounts(null, id)).toEqual({ hints: 0, wrongChecks: 0 })
  })
})

describe('observeSolve', () => {
  it('fires once when the saved board turns solved, with the murderer of the puzzle', () => {
    const memory = createMemoryStorage()
    const seen: { murdererId: string; elapsedMs: number }[] = []
    const watched = observeSolve(memory, id, day.puzzle, (r) => seen.push(r))
    solve(watched as ReturnType<typeof createMemoryStorage>)
    expect(seen).toHaveLength(1)
    const named = withCastNames(day.puzzle)
    expect(named.people.some((p) => p.id === seen[0]!.murdererId)).toBe(true)
    expect(seen[0]!.elapsedMs).toBe(0)
  })

  it('does not fire for a board that was already solved when watching started', () => {
    const memory = createMemoryStorage()
    solve(memory)
    const seen: unknown[] = []
    const watched = observeSolve(memory, id, day.puzzle, (r) => seen.push(r))
    const store = createGameStore({ levelId: id, puzzle: day.puzzle, storage: watched, now: () => 9000 })
    store.dispatch({ type: 'setOption', option: 'showTimer', value: false })
    expect(seen).toEqual([])
  })
})
