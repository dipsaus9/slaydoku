import { describe, expect, it } from 'vitest'
import { castProblems, sharedNames } from '../content/cast/index.ts'
import { CAST_CHAIN_START, fallbackCast, nominalCast } from './cast.ts'
import { addDays } from './dates.ts'
import { planDay } from './pick.ts'

describe('the cast chain', () => {
  const dates = Array.from({ length: 200 }, (_, i) => addDays('2026-10-12', i))

  it('gives every day a valid cast for its planned size', () => {
    for (const date of dates) {
      const cast = nominalCast(date)
      expect(cast.names.length, date).toBe(planDay(date).size - 1)
      expect(castProblems(cast.names, cast.genders), date).toEqual([])
      expect(cast.portraits.length).toBe(cast.names.length)
    }
  })
  it('shares no name between consecutive days', () => {
    dates.forEach((date, i) => {
      if (i > 0) expect(sharedNames(nominalCast(dates[i - 1]!).names, nominalCast(date).names), date).toEqual([])
    })
  })
  it('is a pure function of the date, whatever order it is asked in', () => {
    const backwards = [...dates].reverse().map((d) => nominalCast(d).names)
    expect(backwards.reverse()).toEqual(dates.map((d) => nominalCast(d).names))
  })
  it('refuses a date before the chain starts', () => {
    expect(() => nominalCast('2025-12-31')).toThrow(RangeError)
    expect(nominalCast(CAST_CHAIN_START).names.length).toBeGreaterThan(0)
  })
  it('keeps the names of both neighbours out of a fallback day', () => {
    const date = '2026-11-10'
    const before = nominalCast(addDays(date, -1)).names
    const cast = fallbackCast(date, 9, before)
    expect(cast.names.length).toBe(8)
    expect(castProblems(cast.names, cast.genders)).toEqual([])
    expect(sharedNames(cast.names, before)).toEqual([])
    expect(sharedNames(cast.names, nominalCast(addDays(date, 1)).names)).toEqual([])
    expect(fallbackCast(date, 9, before)).toEqual(cast)
  })
})
