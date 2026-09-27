import type { TierId } from '../../engine/generator/tiers/index.ts'
import { addDays, dayNumberOf, isDate } from '../../schedule/dates.ts'
import { RESULT_TIERS } from '../daily/results.ts'
import type { DailyResult } from '../daily/results.ts'

/**
 * Statistics of the player, computed from the solved days stored on this device (`slaydoku:daily-results`, see `src/game/daily/results.ts`)
 * and the puzzle numbers that were started. Pure functions: no clock (the caller hands in today's UTC date), no storage, nothing that
 * leaves the device.
 *
 * A streak is a run of consecutive UTC dates whose puzzle was solved. A result belongs to the date of its own puzzle, not to the moment it
 * was solved, so a day solved the next morning still counts for its own day. A day that was not solved ends the run.
 */

export interface TierStats {
  tier: TierId
  /** Solved puzzles of this tier that have a time. */
  solved: number
  /** Fastest time, ms. */
  best: number
  /** Median time, ms (the mean of the two middle times when the count is even, rounded to a whole ms). */
  median: number
}

export interface Stats {
  /** Puzzles started: every solved day plus every started day that was not solved. Never less than `solved`. */
  played: number
  solved: number
  /** `solved / played` from 0 to 1; null when nothing was played. */
  solveRate: number | null
  /** Consecutive solved UTC days up to the latest solved day, when that day is today or yesterday; else 0. */
  currentStreak: number
  /** Longest run of consecutive solved UTC days ever. */
  bestStreak: number
  /** Hints opened over all solved puzzles. */
  totalHints: number
  /** `totalHints / solved`; null when nothing was solved. */
  averageHints: number | null
  /** Times per tier, only tiers with at least one solved puzzle, easiest first. */
  tiers: TierStats[]
}

/** The part of a stored result the statistics use. */
export type StatsResult = Pick<DailyResult, 'n' | 'date' | 'elapsedMs' | 'hints'> & { tier?: unknown }

const usable = (r: StatsResult): boolean =>
  Number.isInteger(r.n) && typeof r.date === 'string' && isDate(r.date) && Number.isFinite(r.elapsedMs) && r.elapsedMs >= 0

/** Median of numbers; null for none. An even count gives the mean of the two middle ones, rounded. */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2)
}

/**
 * The streaks of a set of solved dates (`YYYY-MM-DD`, any order, duplicates and unreal dates ignored). `today` is the UTC date now:
 * the current streak is alive while the latest solved date is today or yesterday, so it does not drop to 0 in the morning before the
 * day's puzzle is solved. A latest solved date after `today` (a clock set back) counts as alive as well.
 */
export function streaks(dates: readonly string[], today: string): { current: number; best: number } {
  const days = [...new Set(dates.filter(isDate).map(dayNumberOf))].sort((a, b) => a - b)
  let best = 0
  let run = 0
  let previous = Number.NaN
  for (const day of days) {
    run = day === previous + 1 ? run + 1 : 1
    previous = day
    best = Math.max(best, run)
  }
  const last = days.at(-1)
  const alive = last !== undefined && isDate(today) && last >= dayNumberOf(addDays(today, -1))
  return { current: alive ? run : 0, best }
}

/**
 * The statistics. `startedNumbers` are the puzzle numbers that were started (with or without a result); a result's own number counts as
 * started. Results that are unusable (no real date, a bad number or time) are ignored; when two results share a number the first one in
 * the list is used.
 */
export function computeStats(results: readonly StatsResult[], today: string, startedNumbers: readonly number[] = []): Stats {
  const byNumber = new Map<number, StatsResult>()
  for (const r of results) if (usable(r) && !byNumber.has(r.n)) byNumber.set(r.n, r)
  const solvedResults = [...byNumber.values()]

  const started = new Set<number>([...byNumber.keys(), ...startedNumbers.filter((n) => Number.isInteger(n) && n >= 1)])
  const solved = solvedResults.length
  const totalHints = solvedResults.reduce((sum, r) => sum + (Number.isFinite(r.hints) && r.hints > 0 ? Math.floor(r.hints) : 0), 0)
  const { current, best } = streaks(solvedResults.map((r) => r.date), today)

  const tiers: TierStats[] = []
  for (const tier of RESULT_TIERS) {
    const times = solvedResults.filter((r) => r.tier === tier).map((r) => r.elapsedMs)
    if (times.length > 0) tiers.push({ tier, solved: times.length, best: Math.min(...times), median: median(times)! })
  }

  return {
    played: started.size,
    solved,
    solveRate: started.size === 0 ? null : solved / started.size,
    currentStreak: current,
    bestStreak: best,
    totalHints,
    averageHints: solved === 0 ? null : totalHints / solved,
    tiers,
  }
}
