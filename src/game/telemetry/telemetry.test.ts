import { describe, expect, it } from 'vitest'
import { at, puzzle } from '../fixture.ts'
import type { StorageLike } from '../persistence.ts'
import { createGameStore } from '../store.ts'
import { clearTelemetry, exportTelemetry, loadTelemetry, MAX_RECORDS, saveTelemetryRecord, TELEMETRY_KEY } from './storage.ts'
import { trackStore } from './tracker.ts'
import type { TelemetryRecord } from './types.ts'

const memory = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

/** A store that refuses everything, like a full or blocked localStorage. */
const broken: StorageLike = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('quota')
  },
  removeItem: () => {
    throw new Error('blocked')
  },
}

const record = (over: Partial<TelemetryRecord> = {}): TelemetryRecord => ({
  sessionId: 's1',
  puzzleId: 'lvl',
  startedAt: 1,
  activeSeconds: 0,
  hints: { 1: 0, 2: 0, 3: 0 },
  hintPlacements: 0,
  wrongPlacements: 0,
  failedChecks: 0,
  undos: 0,
  outcome: 'abandoned',
  ...over,
})

function setup(telemetryStorage: StorageLike | null = memory(), gameStorage: StorageLike | null = null) {
  let clock = 1000
  const store = createGameStore({ levelId: 'lvl', puzzle, storage: gameStorage, now: () => clock })
  const tracker = trackStore(store, { puzzle, puzzleId: 'lvl', storage: telemetryStorage, now: () => clock })
  return { store, tracker, storage: telemetryStorage, advance: (ms: number) => void (clock += ms) }
}

const place = (store: ReturnType<typeof setup>['store'], id: keyof typeof at, cell = at[id]) =>
  store.dispatch({ type: 'place', personId: id, cell })

describe('telemetry storage', () => {
  it('keeps one record per session under slaydoku:telemetry, replacing on update', () => {
    const storage = memory()
    saveTelemetryRecord(storage, record())
    saveTelemetryRecord(storage, record({ undos: 2 }))
    saveTelemetryRecord(storage, record({ sessionId: 's2' }))
    expect(storage.data.has('slaydoku:telemetry')).toBe(true)
    expect(TELEMETRY_KEY).toBe('slaydoku:telemetry')
    const all = loadTelemetry(storage)
    expect(all.map((r) => r.sessionId)).toEqual(['s1', 's2'])
    expect(all[0]!.undos).toBe(2)
  })

  it('exports JSON and clears', () => {
    const storage = memory()
    saveTelemetryRecord(storage, record({ hints: { 1: 1, 2: 1, 3: 0 } }))
    const parsed = JSON.parse(exportTelemetry(storage))
    expect(parsed.records).toHaveLength(1)
    expect(parsed.records[0].hints).toEqual({ 1: 1, 2: 1, 3: 0 })
    clearTelemetry(storage)
    expect(loadTelemetry(storage)).toEqual([])
    expect(JSON.parse(exportTelemetry(storage)).records).toEqual([])
  })

  it('drops the oldest records past the cap', () => {
    const storage = memory()
    for (let i = 0; i < MAX_RECORDS + 3; i++) saveTelemetryRecord(storage, record({ sessionId: `s${i}` }))
    const all = loadTelemetry(storage)
    expect(all).toHaveLength(MAX_RECORDS)
    expect(all[0]!.sessionId).toBe('s3')
  })

  it('reads corrupt or foreign payloads as empty and cleans bad fields', () => {
    const storage = memory()
    storage.data.set(TELEMETRY_KEY, '{nope')
    expect(loadTelemetry(storage)).toEqual([])
    storage.data.set(TELEMETRY_KEY, JSON.stringify({ version: 99, records: [record()] }))
    expect(loadTelemetry(storage)).toEqual([])
    storage.data.set(
      TELEMETRY_KEY,
      JSON.stringify({ version: 1, records: [{ sessionId: 'x', puzzleId: 'p', undos: -3, activeSeconds: 'lots' }, 7, null] }),
    )
    const [only, ...rest] = loadTelemetry(storage)
    expect(rest).toEqual([])
    expect(only).toMatchObject({ sessionId: 'x', undos: 0, activeSeconds: 0, outcome: 'abandoned', hints: { 1: 0, 2: 0, 3: 0 } })
  })

  it('never throws when storage is missing, full or blocked', () => {
    expect(saveTelemetryRecord(null, record())).toBe(false)
    expect(saveTelemetryRecord(broken, record())).toBe(false)
    expect(loadTelemetry(null)).toEqual([])
    expect(loadTelemetry(broken)).toEqual([])
    expect(JSON.parse(exportTelemetry(broken)).records).toEqual([])
    expect(() => clearTelemetry(broken)).not.toThrow()
    expect(() => clearTelemetry(null)).not.toThrow()
  })
})

describe('play telemetry', () => {
  it('counts wrong placements, failed checks and undos, and records a solve', () => {
    const { store, tracker, storage, advance } = setup()
    advance(4000)
    place(store, 'V')
    place(store, 'A')
    place(store, 'C')
    expect(tracker.snapshot()).toMatchObject({ wrongPlacements: 0, failedChecks: 0 })
    // B on a wrong square completes the grid: one wrong placement, one failed check
    place(store, 'B', { row: 1, col: 1 })
    expect(tracker.snapshot()).toMatchObject({ wrongPlacements: 1, failedChecks: 1, outcome: 'abandoned' })
    store.dispatch({ type: 'undo' })
    store.dispatch({ type: 'redo' }) // undo and redo are not new mistakes
    expect(tracker.snapshot()).toMatchObject({ undos: 1, wrongPlacements: 1, failedChecks: 1 })
    advance(2000)
    place(store, 'B') // moves B to the true square
    expect(store.getState().status).toBe('solved')
    const saved = loadTelemetry(storage)
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ puzzleId: 'lvl', outcome: 'solved', undos: 1, wrongPlacements: 1, failedChecks: 1, activeSeconds: 6 })
    advance(60_000) // solved: the clock is frozen
    expect(tracker.snapshot().activeSeconds).toBe(6)
  })

  it('does not count notes, marks or moves onto the true square as wrong', () => {
    const { store, tracker } = setup()
    store.dispatch({ type: 'toggleNote', personId: 'A', cell: { row: 1, col: 1 } })
    store.dispatch({ type: 'toggleMark', personId: 'A', cell: { row: 2, col: 2 } })
    place(store, 'A')
    expect(tracker.snapshot().wrongPlacements).toBe(0)
  })

  it('counts hint uses per level and placements made by the hint button', () => {
    const { tracker, storage } = setup()
    tracker.hint(1)
    tracker.hint(2)
    tracker.hint(3)
    tracker.hint(1)
    tracker.hintPlacement()
    expect(loadTelemetry(storage)[0]).toMatchObject({ hints: { 1: 2, 2: 1, 3: 1 }, hintPlacements: 1 })
  })

  it('pauses active time while hidden', () => {
    const { tracker, advance } = setup()
    advance(3000)
    tracker.setVisible(false)
    advance(60_000)
    expect(tracker.snapshot().activeSeconds).toBe(3)
    tracker.setVisible(true)
    advance(2000)
    expect(tracker.snapshot().activeSeconds).toBe(5)
    tracker.stop()
    advance(9000)
    expect(tracker.snapshot().activeSeconds).toBe(5)
  })

  it('starts hidden when the tab is in the background', () => {
    let clock = 0
    const store = createGameStore({ levelId: 'lvl', puzzle, storage: null, now: () => clock })
    const tracker = trackStore(store, { puzzle, puzzleId: 'lvl', storage: null, now: () => clock, visible: false })
    clock += 5000
    expect(tracker.snapshot().activeSeconds).toBe(0)
  })

  it('ends a session on restart and starts a new one', () => {
    const { store, tracker, storage, advance } = setup()
    place(store, 'A', { row: 1, col: 1 })
    advance(1000)
    store.dispatch({ type: 'restart' })
    tracker.restart()
    advance(1000)
    place(store, 'A')
    const saved = loadTelemetry(storage)
    expect(saved).toHaveLength(2)
    expect(saved[0]).toMatchObject({ outcome: 'abandoned', wrongPlacements: 1 })
    expect(saved[1]).toMatchObject({ outcome: 'abandoned', wrongPlacements: 0 })
  })

  it('does not record a level that was already solved when opened', () => {
    const gameStorage = memory()
    const first = createGameStore({ levelId: 'lvl', puzzle, storage: gameStorage, now: () => 0 })
    for (const id of ['V', 'A', 'C', 'B'] as const) place(first, id)
    expect(first.getState().status).toBe('solved')
    const telemetryStorage = memory()
    const store = createGameStore({ levelId: 'lvl', puzzle, storage: gameStorage, now: () => 0 })
    const tracker = trackStore(store, { puzzle, puzzleId: 'lvl', storage: telemetryStorage, now: () => 0 })
    tracker.hint(1)
    tracker.stop()
    expect(loadTelemetry(telemetryStorage)).toEqual([])
  })

  it('leaves play untouched when storage throws', () => {
    const { store, tracker } = setup(broken)
    expect(() => {
      tracker.hint(2)
      tracker.setVisible(false)
      tracker.setVisible(true)
      place(store, 'V')
      place(store, 'A')
      place(store, 'C')
      place(store, 'B')
      tracker.stop()
    }).not.toThrow()
    expect(store.getState().status).toBe('solved')
    expect(tracker.snapshot()).toMatchObject({ outcome: 'solved', hints: { 2: 1 } })
  })

  it('works with storage off (null)', () => {
    const { store, tracker } = setup(null)
    place(store, 'V')
    expect(tracker.snapshot().wrongPlacements).toBe(0)
    expect(store.getState().board.placements.V).toEqual(at.V)
  })

  it('keeps no personal data: only numbers, the puzzle id and the outcome', () => {
    const { tracker } = setup()
    expect(Object.keys(tracker.snapshot()).sort()).toEqual(
      ['activeSeconds', 'failedChecks', 'hintPlacements', 'hints', 'outcome', 'puzzleId', 'sessionId', 'startedAt', 'undos', 'wrongPlacements'].sort(),
    )
  })
})
