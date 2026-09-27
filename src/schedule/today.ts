import { addDays, dayNumberOf, monthOf } from './dates.ts'
import type { IndexMonth, MonthFile, ScheduleDay, ScheduleIndex } from './types.ts'

/**
 * "Which puzzle is it now?" as pure functions: the UTC date of a clock reading, the time left until the next UTC midnight, and the day
 * of the schedule that holds a date, found through the small index and at most three month files (the date's own month first, then the
 * neighbours). No clock and no file access of its own: the caller hands in the reading and the loader, so tests inject both.
 */

const DAY_MS = 86_400_000

/** The UTC date (`YYYY-MM-DD`) of a clock reading in ms since the epoch. */
export const utcDateOf = (nowMs: number): string => new Date(nowMs).toISOString().slice(0, 10)

/** The instant a UTC date starts (its 00:00 UTC), in ms since the epoch. */
export const startOfUtcDay = (date: string): number => dayNumberOf(date) * DAY_MS

/** Ms from `nowMs` to the next 00:00 UTC. Exactly at midnight a new day has just started, so the answer is a whole day, never 0. */
export const msUntilNextUtcMidnight = (nowMs: number): number => DAY_MS - (((nowMs % DAY_MS) + DAY_MS) % DAY_MS)

/** The instant of the next 00:00 UTC after `nowMs`. */
export const nextUtcMidnight = (nowMs: number): number => nowMs + msUntilNextUtcMidnight(nowMs)

/** Ms from `nowMs` until a UTC date starts (negative once it has). */
export const msUntilDate = (date: string, nowMs: number): number => startOfUtcDay(date) - nowMs

/** Where a date sits relative to the schedule: before its first day, inside it, or after its last day (or the schedule is empty). */
export type Phase = 'before-launch' | 'scheduled' | 'after-schedule'

export function phaseOf(date: string, index: Pick<ScheduleIndex, 'first' | 'last' | 'count'>): Phase {
  if (index.count === 0) return 'after-schedule'
  if (dayNumberOf(date) < dayNumberOf(index.first)) return 'before-launch'
  if (dayNumberOf(date) > dayNumberOf(index.last)) return 'after-schedule'
  return 'scheduled'
}

/** The day of a date in already loaded month files, or null. */
export function findDay(files: readonly Pick<MonthFile, 'days'>[], date: string): ScheduleDay | null {
  for (const file of files) {
    const day = file.days.find((candidate) => candidate.date === date)
    if (day) return day
  }
  return null
}

/**
 * The month files worth opening for a date, best first: the ones whose range in the index holds the date, then the month of the date
 * itself, then the months of the day before and the day after (a date on a month boundary, or an index that lags one file behind).
 * Only months the index lists; each at most once.
 */
export function monthsToTry(date: string, index: Pick<ScheduleIndex, 'months'>): IndexMonth[] {
  const wanted = [monthOf(date), monthOf(addDays(date, -1)), monthOf(addDays(date, 1))]
  const ordered = [
    ...index.months.filter((m) => m.first <= date && date <= m.last),
    ...wanted.flatMap((month) => index.months.filter((m) => m.month === month)),
  ]
  return ordered.filter((m, at) => ordered.findIndex((other) => other.month === m.month) === at)
}

/** What a date shows: its puzzle, or the reason there is none. */
export type DayLookup =
  | { kind: 'day'; day: ScheduleDay }
  | { kind: 'before-launch'; first: string }
  | { kind: 'after-schedule'; last: string }
  /** The index says the date is scheduled but no file holds it: the schedule data is broken. */
  | { kind: 'missing'; date: string }

/**
 * The puzzle of a UTC date. Before the first scheduled day and after the last one no file is opened (the index answers). Otherwise the
 * month files of `monthsToTry` are loaded one at a time until one holds the date; a file that fails to load is skipped, and only when
 * every candidate failed does this throw (the caller offers a retry). `loadMonth` gets the `YYYY-MM` of the month.
 */
export async function lookupDay(
  date: string,
  index: ScheduleIndex,
  loadMonth: (month: string) => Promise<MonthFile>,
): Promise<DayLookup> {
  const phase = phaseOf(date, index)
  if (phase === 'before-launch') return { kind: 'before-launch', first: index.first }
  if (phase === 'after-schedule') return { kind: 'after-schedule', last: index.last }
  let loaded = 0
  let failure: unknown = null
  for (const { month } of monthsToTry(date, index)) {
    let file: MonthFile
    try {
      file = await loadMonth(month)
    } catch (error) {
      failure = error
      continue
    }
    loaded++
    const day = findDay([file], date)
    if (day) return { kind: 'day', day }
  }
  if (loaded === 0 && failure !== null) throw failure instanceof Error ? failure : new Error(String(failure))
  return { kind: 'missing', date }
}

/** Puzzle number of a date: 1 on the launch date, one more each day after it (numbers run without a gap). */
export const puzzleNumberOf = (date: string, launch: string): number => dayNumberOf(date) - dayNumberOf(launch) + 1
