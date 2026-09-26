import { describe, expect, it } from 'vitest'
import { addDays, dateOfDayNumber, dayNumberOf, daysBetween, isDate, monthOf, weekStartOf, weekdayOf } from './dates.ts'

describe('UTC dates', () => {
  it('counts days since 1970-01-01', () => {
    expect(dayNumberOf('1970-01-01')).toBe(0)
    expect(dayNumberOf('1970-01-02')).toBe(1)
    expect(dateOfDayNumber(dayNumberOf('2026-10-12'))).toBe('2026-10-12')
  })
  it('refuses text that is not a real date', () => {
    for (const bad of ['2026-02-30', '2026-13-01', '2026-1-1', 'tomorrow', '2026-10-12T00:00:00Z', '']) {
      expect(isDate(bad), bad).toBe(false)
      expect(() => dayNumberOf(bad)).toThrow(RangeError)
    }
    expect(isDate('2028-02-29')).toBe(true)
  })
  it('adds days across month and year ends and leap days', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01')
    expect(addDays('2026-10-12', -12)).toBe('2026-09-30')
    expect(daysBetween('2026-10-12', '2027-02-08')).toBe(119)
  })
  it('knows the weekday, Monday first', () => {
    expect(weekdayOf('2026-10-12')).toBe(0)
    expect(weekdayOf('2026-10-18')).toBe(6)
    expect(weekdayOf('1970-01-01')).toBe(3)
    expect(dateOfDayNumber(weekStartOf(dayNumberOf('2026-10-18')))).toBe('2026-10-12')
    expect(dateOfDayNumber(weekStartOf(dayNumberOf('2026-10-19')))).toBe('2026-10-19')
  })
  it('names the month', () => {
    expect(monthOf('2026-11-05')).toBe('2026-11')
  })
})
