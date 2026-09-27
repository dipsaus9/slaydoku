import { TELEMETRY_KEY, TELEMETRY_VERSION, loadTelemetry } from '../telemetry/storage.ts'
import { dailyId } from '../daily/ids.ts'
import { RESULTS_KEY, readAllResults } from '../daily/results.ts'
import { clearGame } from '../persistence.ts'
import type { StorageLike } from '../persistence.ts'
import { computeStats } from './compute.ts'
import type { Stats } from './compute.ts'

/** Puzzle number of a daily puzzle id (`daily-<n>`), or null for any other id (the lab and the demo also write telemetry). */
export function dailyNumberOf(puzzleId: string): number | null {
  const match = /^daily-(\d+)$/.exec(puzzleId)
  const n = match ? Number(match[1]) : NaN
  return Number.isInteger(n) && n >= 1 ? n : null
}

/** The numbers of the daily puzzles this device has played a session of (from the local play records). */
function playedNumbers(storage: StorageLike | null): number[] {
  const numbers = new Set<number>()
  for (const record of loadTelemetry(storage)) {
    const n = dailyNumberOf(record.puzzleId)
    if (n !== null) numbers.add(n)
  }
  return [...numbers]
}

/** Statistics as of the UTC date `today`, read from the results and play records on this device. An unreadable store reads as no history. */
export function readStats(storage: StorageLike | null, today: string): Stats {
  return computeStats(readAllResults(storage), today, playedNumbers(storage))
}

/**
 * Forgets the statistics: the stored results, the play records of the daily puzzles and the saved boards of every daily puzzle that was
 * played or solved, so those days show as new again (a solved board left behind would bring the result straight back). Other data stays:
 * the options, the how-it-works flag, the play records of other puzzles and the dev date override. Never throws; returns false when a
 * store refused.
 */
export function resetStats(storage: StorageLike | null): boolean {
  if (!storage) return false
  try {
    const numbers = new Set<number>([...playedNumbers(storage), ...readAllResults(storage).map((r) => r.n)])
    storage.removeItem(RESULTS_KEY)
    for (const n of numbers) clearGame(storage, dailyId(n))
    const others = loadTelemetry(storage).filter((r) => dailyNumberOf(r.puzzleId) === null)
    if (others.length === 0) storage.removeItem(TELEMETRY_KEY)
    else storage.setItem(TELEMETRY_KEY, JSON.stringify({ version: TELEMETRY_VERSION, records: others }))
    return true
  } catch {
    return false
  }
}
