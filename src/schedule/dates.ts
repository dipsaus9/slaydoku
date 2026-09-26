/** UTC calendar helpers for the schedule. A date is always the text `YYYY-MM-DD`; a "day number" counts days since 1970-01-01 (UTC). No clock, no time zone. */

const DAY_MS = 86_400_000
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/** Day number (days since 1970-01-01 UTC) of a `YYYY-MM-DD` date. Throws on text that is not a real calendar date. */
export function dayNumberOf(date: string): number {
  const match = DATE_PATTERN.exec(date)
  if (!match) throw new RangeError(`"${date}" is not a date (YYYY-MM-DD)`)
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  const day = Math.round(ms / DAY_MS)
  if (dateOfDayNumber(day) !== date) throw new RangeError(`"${date}" is not a real calendar date`)
  return day
}

/** The `YYYY-MM-DD` date of a day number. */
export const dateOfDayNumber = (day: number): string => new Date(day * DAY_MS).toISOString().slice(0, 10)

/** Whether a text is a real `YYYY-MM-DD` calendar date. */
export function isDate(text: string): boolean {
  try {
    dayNumberOf(text)
    return true
  } catch {
    return false
  }
}

/** The date `days` days after `date` (negative: before). */
export const addDays = (date: string, days: number): string => dateOfDayNumber(dayNumberOf(date) + days)

/** Whole days from `from` to `to` (positive when `to` is later). */
export const daysBetween = (from: string, to: string): number => dayNumberOf(to) - dayNumberOf(from)

/** Weekday of a day number, Monday 0 to Sunday 6 (1970-01-01 was a Thursday). */
export const weekdayOfDayNumber = (day: number): number => (((day + 3) % 7) + 7) % 7

/** Weekday of a date, Monday 0 to Sunday 6. */
export const weekdayOf = (date: string): number => weekdayOfDayNumber(dayNumberOf(date))

/** Day number of the Monday that starts the UTC week (Monday to Sunday) holding a day number. */
export const weekStartOf = (day: number): number => day - weekdayOfDayNumber(day)

/** `YYYY-MM` of a date. */
export const monthOf = (date: string): string => date.slice(0, 7)
