import { describe, expect, it } from 'vitest'
import { SIMPSHOUSE_POOL, castProblems, sharedNames } from '../content/cast/index.ts'
import { nominalCast } from './cast.ts'
import { addDays } from './dates.ts'
import { castOfDay } from './gates.ts'
import { PENDING_REGENERATION_THROUGH, isPendingRegeneration, planDay } from './pick.ts'
import { readSchedule } from './schedule.testing.ts'

const SIMPS = '2026-10-14'

describe('a day with a cast pool of its own (Simpshouse, SLAY-18.2)', () => {
  it('takes its cast from the Simpshouse pool, valid and keeping out both neighbours', () => {
    // The committed day is kept as the owner approved it (SLAY-22 KEPT_DATES); the chain around it follows the current rules, so the
    // committed cast is checked, not a fresh nominal draw. The gate allows one shared name next to a themed-pool day (pairProblems, owner
    // decision 2026-10-08); the nominal casts the regenerated neighbours will get share none.
    const day = readSchedule().days.find((d) => d.date === SIMPS)!
    const names = castOfDay(day)
    const genders = day.puzzle.people.filter((p) => p.kind === 'suspect').map((p) => p.gender!)
    expect(names.length).toBe(planDay(SIMPS).size - 1)
    expect(castProblems(names, genders)).toEqual([])
    expect(names.every((n) => SIMPSHOUSE_POOL.some((p) => p.name === n))).toBe(true)
    expect(sharedNames(names, nominalCast(addDays(SIMPS, -1)).names)).toEqual([])
    expect(sharedNames(names, nominalCast(addDays(SIMPS, 1)).names)).toEqual([])
    expect(castProblems(nominalCast(SIMPS).names, nominalCast(SIMPS).genders)).toEqual([])
  })

  it('leaves the cast of every other committed day byte-identical (the chain runs through the themed day unchanged)', () => {
    const { days } = readSchedule()
    let checked = 0
    for (const day of days) {
      // 2026-09-30 was regenerated (SLAY-10.1) with a cast that is not the chain's; fallback days have their own cast.
      // A day awaiting regeneration under the SLAY-22 rules was made on the launch rules' chain; SLAY-18.10 regenerates it.
      if (day.date === SIMPS || day.date === '2026-09-30' || day.fallbackFrom !== undefined || isPendingRegeneration(day.date)) continue
      const cast = nominalCast(day.date)
      expect(castOfDay(day), day.date).toEqual(cast.names)
      expect(day.portraits, day.date).toEqual(cast.portraits)
      checked++
    }
    expect(checked).toBeGreaterThan(PENDING_REGENERATION_THROUGH === null ? 100 : 10)
  })
})
