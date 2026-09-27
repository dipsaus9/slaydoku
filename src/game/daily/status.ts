import type { ScheduleDay } from '../../schedule/types.ts'
import { loadTelemetry } from '../telemetry/storage.ts'
import { loadGame } from '../persistence.ts'
import type { StorageLike } from '../persistence.ts'
import { dailyId } from './ids.ts'
import { readResult } from './results.ts'
import type { DailyResult } from './results.ts'
import type { SolveRecord } from './observe.ts'

/** What a day is for this player: not started, a saved board exists, or solved (with the recorded result). */
export type DayStatus = { kind: 'new' } | { kind: 'inProgress' } | { kind: 'solved'; result: DailyResult }

/** The part of a schedule day the player state needs. */
export type DayRef = Pick<ScheduleDay, 'n' | 'date' | 'fp' | 'puzzle'>

/**
 * Hints opened and wrong checks of one puzzle over all play sessions of it (a reload or a restart starts a new session), from the local
 * telemetry (`src/game/telemetry`). Nothing recorded, or an unreadable store, reads as zero.
 */
export function playCounts(storage: StorageLike | null, puzzleId: string): { hints: number; wrongChecks: number } {
  let hints = 0
  let wrongChecks = 0
  for (const record of loadTelemetry(storage)) {
    if (record.puzzleId !== puzzleId) continue
    hints += record.hints[1]
    wrongChecks += record.failedChecks
  }
  return { hints, wrongChecks }
}

/** The result of a day from how it was solved, with the hint and check counts of its play sessions. */
export function resultOf(storage: StorageLike | null, day: DayRef, solve: SolveRecord): DailyResult {
  return { n: day.n, date: day.date, fp: day.fp, elapsedMs: solve.elapsedMs, murdererId: solve.murdererId, ...playCounts(storage, dailyId(day.n)) }
}

/**
 * Where a day stands. The recorded result decides; a day whose saved board is a solved one but whose result was never written (a write
 * that failed) still reads as solved, with the counts of its sessions. A save of another puzzle (fingerprint guard) does not count.
 */
export function dayStatus(storage: StorageLike | null, day: DayRef): DayStatus {
  const result = readResult(storage, day.n, day.fp)
  if (result) return { kind: 'solved', result }
  const save = loadGame(storage, dailyId(day.n), day.puzzle)
  if (!save) return { kind: 'new' }
  if (save.check?.solved) {
    return { kind: 'solved', result: resultOf(storage, day, { murdererId: save.check.murdererId, elapsedMs: save.check.elapsedMs }) }
  }
  return { kind: 'inProgress' }
}
