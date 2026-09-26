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
