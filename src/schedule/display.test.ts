import { describe, expect, it } from 'vitest'
import { clockTimeIn, countdownLabel, formatCountdown, formatDayMonth, formatLongDate, utcWithLocal } from './display.ts'

const at = (iso: string) => Date.parse(iso)

describe('dates', () => {
  it('writes the long date with the weekday', () => {
    expect(formatLongDate('2026-10-12')).toBe('Monday 12 October 2026')
    expect(formatLongDate('2026-10-18')).toBe('Sunday 18 October 2026')
    expect(formatLongDate('2028-02-29')).toBe('Tuesday 29 February 2028')
    expect(formatLongDate('2027-01-01')).toBe('Friday 1 January 2027')
  })

  it('writes day and month', () => {
    expect(formatDayMonth('2026-10-12')).toBe('12 October')
    expect(formatDayMonth('2027-03-05')).toBe('5 March')
  })

  it('refuses a text that is no date', () => {
    expect(() => formatLongDate('12 October')).toThrow(RangeError)
    expect(() => formatDayMonth('2026-02-30')).toThrow(RangeError)
  })
})

describe('formatCountdown', () => {
  it('reads hours, minutes and seconds', () => {
    expect(formatCountdown(5 * 3_600_000 + 3 * 60_000 + 10_000)).toBe('05:03:10')
    expect(formatCountdown(59_000)).toBe('00:00:59')
    expect(formatCountdown(23 * 3_600_000 + 59 * 60_000 + 59_000)).toBe('23:59:59')
  })

  it('rounds up, so it reaches 00:00:00 at the moment the time is up, and never goes below', () => {
    expect(formatCountdown(1)).toBe('00:00:01')
    expect(formatCountdown(1000)).toBe('00:00:01')
    expect(formatCountdown(0)).toBe('00:00:00')
    expect(formatCountdown(-5000)).toBe('00:00:00')
  })

  it('names the days from a day up (the launch countdown)', () => {
    expect(formatCountdown(86_400_000)).toBe('1d 00:00:00')
    expect(formatCountdown(14 * 86_400_000 + 5 * 3_600_000 + 3 * 60_000 + 10_000)).toBe('14d 05:03:10')
  })
})

describe('countdownLabel (the spoken version)', () => {
  it('says the units in words, singular and plural', () => {
    expect(countdownLabel(5 * 3_600_000 + 3 * 60_000 + 10_000)).toBe('5 hours, 3 minutes and 10 seconds')
    expect(countdownLabel(3_600_000 + 60_000 + 1000)).toBe('1 hour, 1 minute and 1 second')
    expect(countdownLabel(2 * 3_600_000)).toBe('2 hours')
    expect(countdownLabel(90_000)).toBe('1 minute and 30 seconds')
    expect(countdownLabel(3 * 86_400_000 + 1000)).toBe('3 days and 1 second')
    expect(countdownLabel(0)).toBe('0 seconds')
  })
})

describe('the local equivalent of a UTC instant', () => {
  const midnight = at('2026-10-13T00:00:00Z')

  it('shows the local time of the same instant in a fixed time zone', () => {
    expect(clockTimeIn(midnight, 'Europe/Amsterdam')).toBe('02:00') // CEST in October
    expect(clockTimeIn(midnight, 'UTC')).toBe('00:00')
    expect(clockTimeIn(midnight, 'Asia/Kolkata')).toBe('05:30')
    expect(clockTimeIn(midnight, 'America/New_York')).toBe('20:00')
    expect(clockTimeIn(at('2026-12-13T00:00:00Z'), 'Europe/Amsterdam')).toBe('01:00') // CET in winter
  })

  it('never writes 24:00', () => {
    expect(clockTimeIn(at('2026-10-12T22:00:00Z'), 'Europe/Amsterdam')).toBe('00:00')
  })

  it('writes "Ends at 00:00 UTC (02:00 your time)"', () => {
    expect(utcWithLocal(midnight, { timeZone: 'Europe/Amsterdam' })).toBe('00:00 UTC (02:00 your time)')
    expect(utcWithLocal(midnight, { timeZone: 'Asia/Kolkata' })).toBe('00:00 UTC (05:30 your time)')
    expect(utcWithLocal(midnight, { timeZone: 'America/New_York' })).toBe('00:00 UTC (20:00 your time)')
  })

  it('leaves out the local part on a device that is on UTC', () => {
    expect(utcWithLocal(midnight, { timeZone: 'UTC' })).toBe('00:00 UTC')
    expect(utcWithLocal(midnight, { timeZone: 'Europe/London' })).toBe('00:00 UTC (01:00 your time)') // BST in October
    expect(utcWithLocal(at('2026-12-13T00:00:00Z'), { timeZone: 'Europe/London' })).toBe('00:00 UTC') // GMT in winter
  })

  it('names the local date when it differs and the caller asks (the launch countdown)', () => {
    expect(utcWithLocal(midnight, { timeZone: 'America/New_York', withDate: true })).toBe('00:00 UTC (12 October, 20:00 your time)')
    expect(utcWithLocal(midnight, { timeZone: 'Europe/Amsterdam', withDate: true })).toBe('00:00 UTC (02:00 your time)')
  })

  it('falls back to the UTC part alone for an unknown time zone', () => {
    expect(utcWithLocal(midnight, { timeZone: 'Not/AZone' })).toBe('00:00 UTC')
  })

  it('replaces "your time" with a given label (the app fixes the clock to Amsterdam for every visitor)', () => {
    expect(utcWithLocal(midnight, { timeZone: 'Europe/Amsterdam', label: 'Amsterdam time' })).toBe('00:00 UTC (02:00 Amsterdam time)')
  })
})
