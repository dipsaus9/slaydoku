import { addDays, dayNumberOf } from './dates.ts'
import type { ScheduleIndex } from './types.ts'

/** Fewer days than this after today and the schedule needs topping up (`bun run schedule:check` exits non-zero, SLAY-1.9 acts on it). */
export const MIN_DAYS_LEFT = 30

export interface ScheduleStatus {
  today: string
  last: string
  /** Scheduled days strictly after `today`. Before the launch: all of them. */
  daysLeft: number
  /** First date a top-up run would start on: the day after the last scheduled date. */
  nextStart: string
  ok: boolean
}

/**
 * How much of the schedule is still ahead of `today` (a UTC date): the scheduled days after it. Today's own puzzle is in use, not
 * left. Before the launch date every scheduled day is ahead.
 */
export function scheduleStatus(index: Pick<ScheduleIndex, 'first' | 'last' | 'count'>, today: string): ScheduleStatus {
  const ahead = index.count === 0 ? 0 : Math.max(0, dayNumberOf(index.last) - Math.max(dayNumberOf(today), dayNumberOf(index.first) - 1))
  return { today, last: index.last, daysLeft: ahead, nextStart: addDays(index.last, 1), ok: ahead >= MIN_DAYS_LEFT }
}

/** The top-up workflow generates when fewer days than this are left after today. Monthly runs plus 60 leave 29 or more days in the worst case, so the 30-day floor holds between runs. */
export const TOP_UP_BELOW = 60
/** Days a top-up generates by default. */
export const TOP_UP_DAYS = 90
/** Worker processes the top-up command asks for: a hosted runner has few cores. The bytes do not depend on it. */
export const TOP_UP_JOBS = 2

export interface TopUpPlan {
  today: string
  /** Scheduled days strictly after `today`. */
  daysLeft: number
  /** Whether a top-up is due: fewer than `TOP_UP_BELOW` days left. */
  needed: boolean
  /** First date to generate: the day after the last scheduled date (the launch date when nothing is scheduled). */
  start: string
  /** Days to generate. */
  days: number
  /** Last date the run would add. */
  end: string
  /** The exact command that tops up (what the workflow runs). */
  command: string
}

/**
 * What a top-up run would do: whether it is due, where it starts and the exact `bun run schedule` command. `index` is null (or has no days) when
 * nothing is scheduled yet, then the run starts on `launch`.
 */
export function topUpPlan(
  index: Pick<ScheduleIndex, 'first' | 'last' | 'count'> | null,
  today: string,
  launch: string,
  days: number = TOP_UP_DAYS,
): TopUpPlan {
  if (!Number.isInteger(days) || days < 1) throw new RangeError(`days must be a positive integer, got ${days}`)
  const empty = index === null || index.count === 0
  const daysLeft = empty ? 0 : scheduleStatus(index, today).daysLeft
  const start = empty ? launch : addDays(index.last, 1)
  return {
    today,
    daysLeft,
    needed: daysLeft < TOP_UP_BELOW,
    start,
    days,
    end: addDays(start, days - 1),
    command: `bun run schedule --start ${start} --days ${days} --jobs ${TOP_UP_JOBS}`,
  }
}
