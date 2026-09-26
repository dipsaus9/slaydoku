import { dayNumberOf, weekdayOf } from './dates.ts'

/** Text for the daily screen: countdowns, the local equivalent of a UTC instant, dates. English; no clock and no locale lookups that differ between machines. */

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const

const pad = (n: number): string => String(n).padStart(2, '0')

/** `Monday 12 October 2026`, for a `YYYY-MM-DD` date. */
export function formatLongDate(date: string): string {
  dayNumberOf(date)
  return `${WEEKDAYS[weekdayOf(date)]} ${Number(date.slice(8, 10))} ${MONTHS[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`
}

/** `12 October`, for a `YYYY-MM-DD` date. */
export function formatDayMonth(date: string): string {
  dayNumberOf(date)
  return `${Number(date.slice(8, 10))} ${MONTHS[Number(date.slice(5, 7)) - 1]}`
}

/** Whole seconds left, rounded up so the display reaches 00:00:00 at the moment the time is up. Never negative. */
const secondsLeft = (ms: number): number => Math.max(0, Math.ceil(ms / 1000))

/** `05:03:10`, or `3d 05:03:10` from a day up. */
export function formatCountdown(ms: number): string {
  const total = secondsLeft(ms)
  const days = Math.floor(total / 86_400)
  const rest = total % 86_400
  const clock = `${pad(Math.floor(rest / 3600))}:${pad(Math.floor((rest % 3600) / 60))}:${pad(rest % 60)}`
  return days > 0 ? `${days}d ${clock}` : clock
}

const unit = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`

/** The same span in words for a screen reader: `5 hours, 3 minutes and 10 seconds`. */
export function countdownLabel(ms: number): string {
  const total = secondsLeft(ms)
  const parts = [
    [Math.floor(total / 86_400), 'day'],
    [Math.floor((total % 86_400) / 3600), 'hour'],
    [Math.floor((total % 3600) / 60), 'minute'],
    [total % 60, 'second'],
  ] as const
  const shown = parts.filter(([n]) => n > 0).map(([n, word]) => unit(n, word))
  if (shown.length === 0) return unit(0, 'second')
  if (shown.length === 1) return shown[0]!
  return `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}`
}

/** `HH:MM` (24 hour clock) of an instant in a time zone (default: this device's). Null when the runtime cannot say. */
export function clockTimeIn(instantMs: number, timeZone?: string): string | null {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone }).formatToParts(new Date(instantMs))
    const hour = parts.find((p) => p.type === 'hour')?.value
    const minute = parts.find((p) => p.type === 'minute')?.value
    return hour !== undefined && minute !== undefined ? `${hour}:${minute}` : null
  } catch {
    return null
  }
}

/** `YYYY-MM-DD` of an instant in a time zone, or null. */
function dateIn(instantMs: number, timeZone?: string): string | null {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone }).formatToParts(new Date(instantMs))
    const get = (type: string) => parts.find((p) => p.type === type)?.value
    return `${get('year')}-${get('month')}-${get('day')}`
  } catch {
    return null
  }
}

/**
 * A UTC instant as text: `00:00 UTC (02:00 your time)`. When this device is on UTC (or the local time reads the same) only the UTC part is
 * given. With `withDate`, a local date that differs from the UTC date is named too: `00:00 UTC (11 October, 20:00 your time)`.
 */
export function utcWithLocal(instantMs: number, options: { timeZone?: string; withDate?: boolean } = {}): string {
  const utc = `${clockTimeIn(instantMs, 'UTC') ?? '00:00'} UTC`
  const local = clockTimeIn(instantMs, options.timeZone)
  if (local === null) return utc
  const sameDay = dateIn(instantMs, options.timeZone) === dateIn(instantMs, 'UTC')
  if (local === clockTimeIn(instantMs, 'UTC') && sameDay) return utc
  const day = options.withDate && !sameDay ? dateIn(instantMs, options.timeZone) : null
  return `${utc} (${day ? `${formatDayMonth(day)}, ` : ''}${local} your time)`
}
