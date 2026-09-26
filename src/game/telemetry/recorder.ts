import { sameCell } from '../../engine/model/index.ts'
import type { Puzzle } from '../../engine/model/index.ts'
import type { HintLevel } from '../hints.ts'
import type { StorageLike } from '../persistence.ts'
import type { GameState } from '../types.ts'
import { saveTelemetryRecord } from './storage.ts'
import type { TelemetryRecord } from './types.ts'

export interface RecorderConfig {
  puzzle: Puzzle
  /** Id the record is filed under (the level id). */
  puzzleId: string
  /** Where records go. `null` turns recording off. */
  storage: StorageLike | null
  /** Clock in ms. Default `Date.now`. */
  now?: () => number
  /** The state the session starts from; a level that is already solved is not recorded. */
  initial: GameState
}

export interface Recorder {
  /** Feed every state change: counts placements, checks and undos, and ends the session on a solve. */
  observe(prev: GameState, next: GameState): void
  /** A hint was shown at this level. */
  hint(level: HintLevel): void
  /** The player let the hint place somebody. */
  hintPlacement(): void
  /** The foreground clock: false while the tab is hidden or the screen is gone, true when back. */
  setActive(active: boolean): void
  /** A copy of the record as it stands (for tests and export). */
  snapshot(): TelemetryRecord
}

/**
 * Records one play session. Pure bookkeeping: it watches state changes and saves the record
 * after each one. Saving cannot throw, so play is never affected by a full or blocked store.
 */
export function createRecorder(config: RecorderConfig): Recorder {
  const { puzzle, puzzleId, storage } = config
  const now = config.now ?? Date.now
  const startedAt = now()
  const truth = new Map(puzzle.solution.map((p) => [p.personId, p.cell]))
  // Open until solved: an unfinished record already reads as abandoned.
  const enabled = config.initial.status !== 'solved'

  const record: TelemetryRecord = {
    sessionId: `${puzzleId}@${startedAt}`,
    puzzleId,
    startedAt,
    activeSeconds: 0,
    hints: { 1: 0, 2: 0, 3: 0 },
    hintPlacements: 0,
    wrongPlacements: 0,
    failedChecks: 0,
    undos: 0,
    outcome: 'abandoned',
  }

  let bankedMs = 0
  let activeSince: number | null = enabled ? startedAt : null
  let finished = !enabled

  const activeMs = (at: number) => bankedMs + (activeSince === null ? 0 : Math.max(0, at - activeSince))
  const save = () => {
    if (!enabled) return
    record.activeSeconds = Math.round(activeMs(now()) / 1000)
    saveTelemetryRecord(storage, record)
  }
  const stopClock = () => {
    if (activeSince === null) return
    bankedMs = activeMs(now())
    activeSince = null
  }

  return {
    observe(prev, next) {
      if (finished || next === prev) return
      const undone = prev.history.past.length > 0 && next.board === prev.history.past[prev.history.past.length - 1]
      const redone = prev.history.future.length > 0 && next.board === prev.history.future[prev.history.future.length - 1]
      if (undone) record.undos += 1
      if (!undone && !redone && next.board.placements !== prev.board.placements) {
        for (const [personId, cell] of Object.entries(next.board.placements)) {
          const before = prev.board.placements[personId]
          if (before && sameCell(before, cell)) continue
          const right = truth.get(personId)
          if (!right || !sameCell(right, cell)) record.wrongPlacements += 1
        }
        if (next.check && !next.check.solved) record.failedChecks += 1
      }
      if (next.status === 'solved') {
        record.outcome = 'solved'
        finished = true
        stopClock()
      }
      save()
    },
    hint(level) {
      if (finished) return
      record.hints[level] += 1
      save()
    },
    hintPlacement() {
      if (finished) return
      record.hintPlacements += 1
      save()
    },
    setActive(active) {
      if (finished) return
      if (active && activeSince === null) activeSince = now()
      if (!active) stopClock()
      save()
    },
    snapshot: () => ({ ...record, activeSeconds: Math.round(activeMs(now()) / 1000), hints: { ...record.hints } }),
  }
}
