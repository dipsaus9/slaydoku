import { describe, expect, it } from 'vitest'
import { SIMPSHOUSE_POOL, castProblems, sharedNames } from '../content/cast/index.ts'
import { nominalCast } from './cast.ts'
import { addDays } from './dates.ts'
import { castOfDay } from './gates.ts'
import { planDay } from './pick.ts'
import { readSchedule } from './schedule.testing.ts'

const SIMPS = '2026-10-14'

describe('a day with a cast pool of its own (Simpshouse, SLAY-18.2)', () => {
  it('takes its cast from the Simpshouse pool, valid and keeping out both neighbours', () => {
    const cast = nominalCast(SIMPS)
    expect(cast.names.length).toBe(planDay(SIMPS).size - 1)
    expect(castProblems(cast.names, cast.genders)).toEqual([])
    expect(cast.names.every((n) => SIMPSHOUSE_POOL.some((p) => p.name === n))).toBe(true)
    // The day is a 12x12, so all 11 letters are used and a name that is the pool's only one for its letter cannot be avoided: 2026-10-13
    // (unchanged by this story) has Iris, so Iris repeats. Everything else is kept out. The gate allows exactly one shared name next to a themed-pool day (pairProblems, owner decision 2026-10-08).
    expect(sharedNames(cast.names, nominalCast(addDays(SIMPS, -1)).names)).toEqual(['Iris'])
    expect(sharedNames(cast.names, nominalCast(addDays(SIMPS, 1)).names)).toEqual([])
    expect(nominalCast(SIMPS)).toEqual(cast)
  })

  it('leaves the cast of every other committed day byte-identical (the chain runs through the themed day unchanged)', () => {
    const { days } = readSchedule()
    let checked = 0
    for (const day of days) {
      // 2026-09-30 was regenerated (SLAY-10.1) with a cast that is not the chain's; fallback days have their own cast.
      if (day.date === SIMPS || day.date === '2026-09-30' || day.fallbackFrom !== undefined) continue
      const cast = nominalCast(day.date)
      expect(castOfDay(day), day.date).toEqual(cast.names)
      expect(day.portraits, day.date).toEqual(cast.portraits)
      checked++
    }
    expect(checked).toBeGreaterThan(100)
  })
})
