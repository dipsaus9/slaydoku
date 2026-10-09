import { describe, expect, it } from 'vitest'
import { SIMPSHOUSE_POOL, castProblems, sharedNames } from '../content/cast/index.ts'
import { nominalCast } from './cast.ts'
import { addDays } from './dates.ts'
import { THEMED_DAY_SHARED_NAMES, castOfDay } from './gates.ts'
import { planDay, planDays } from './pick.ts'
import { readSchedule } from './schedule.testing.ts'

/** Simpshouse days of the delivered range (SLAY-24): the 1st of every month, the test day 2026-10-10 and 2026-10-14. */
const SIMPS_DAYS = ['2026-10-10', '2026-10-14', '2026-11-01', '2026-12-01', '2027-01-01']

describe('days with a cast pool of their own (Simpshouse, SLAY-18.2 and SLAY-24)', () => {
  it('plans exactly these Simpshouse days from 2026-10-10 to 2027-01-01, each in a normal size', () => {
    const planned = planDays('2026-10-10', 84).filter((p) => p.theme === 'simpshouse')
    expect(planned.map((p) => p.date)).toEqual(SIMPS_DAYS)
    for (const p of planned) expect([6, 7, 8, 9], p.date).toContain(p.size)
  })

  it.each(SIMPS_DAYS)('%s: a valid cast from the Simpshouse pool with Romy and Dennis, keeping out both neighbours', (date) => {
    const cast = nominalCast(date)
    expect(cast.names.length).toBe(planDay(date).size - 1)
    expect(castProblems(cast.names, cast.genders)).toEqual([])
    expect(cast.names.every((n) => SIMPSHOUSE_POOL.some((p) => p.name === n))).toBe(true)
    expect(cast.names).toEqual(expect.arrayContaining(['Romy', 'Dennis']))
    for (const other of [addDays(date, -1), addDays(date, 1)]) {
      expect(sharedNames(cast.names, nominalCast(other).names).length, other).toBeLessThanOrEqual(THEMED_DAY_SHARED_NAMES)
    }
    expect(nominalCast(date)).toEqual(cast)
  })

  it('bakes the nominal cast into every committed Simpshouse day after the played days, and the chain cast into every other day', () => {
    const { days } = readSchedule()
    let checked = 0
    for (const day of days) {
      // 2026-09-30 was regenerated (SLAY-10.1) with a cast that is not the chain's; fallback days have their own cast.
      if (day.date === '2026-09-30' || day.fallbackFrom !== undefined) continue
      const cast = nominalCast(day.date)
      expect(castOfDay(day), day.date).toEqual(cast.names)
      expect(day.portraits, day.date).toEqual(cast.portraits)
      if (day.theme === 'simpshouse') expect(castOfDay(day), day.date).toEqual(expect.arrayContaining(['Romy', 'Dennis']))
      checked++
    }
    expect(checked).toBeGreaterThan(90)
  })
})
