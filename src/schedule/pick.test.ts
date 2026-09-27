import { describe, expect, it } from 'vitest'
import { SCENE_THEMES } from '../content/themes/index.ts'
import { addDays, dayNumberOf, weekStartOf } from './dates.ts'
import { LAUNCH_DATE } from './launch.ts'
import {
  ADVANCED_SIZES, ATTEMPT_WINDOW, SIZE_WEIGHTS, TIER_MIX, canFallBack, expertWeekday, isExpertDay, planDay, planDays, seedOf, sizesFor, themeOf,
} from './pick.ts'
import type { DayPlan } from './types.ts'

/*
 * The launch date is not necessarily a Monday (it moves with the product), so a run's first and last UTC week (Monday to Sunday) can be
 * partial. `weeks()` buckets by the real week start (`weekStartOf`), not by naive 7-day chunks from day 0, so a partial head or tail week
 * is its own short bucket rather than silently merging into its neighbour. The tolerances are about two standard deviations of a seeded
 * draw over that many days; the numbers are fixed by the seeds, so a failure here means the picker changed, not that a run was unlucky.
 */
const weeks = (plans: DayPlan[]): DayPlan[][] => {
  const byStart = new Map<number, DayPlan[]>()
  for (const p of plans) {
    const start = weekStartOf(dayNumberOf(p.date))
    byStart.set(start, [...(byStart.get(start) ?? []), p])
  }
  return [...byStart.entries()].sort(([a], [b]) => a - b).map(([, week]) => week)
}
/** Full Monday-to-Sunday weeks only: a partial head/tail week's weekday positions do not line up with array index 0 = Monday. */
const fullWeeks = (plans: DayPlan[]): DayPlan[][] => weeks(plans).filter((week) => week.length === 7)
const share = (plans: readonly DayPlan[], pick: (p: DayPlan) => string | number, value: string | number): number =>
  (100 * plans.filter((p) => pick(p) === value).length) / plans.length

describe('picker rules over long runs', () => {
  for (const [days, tierTolerance, sizeTolerance] of [[365, 5, 6], [730, 3.5, 4]] as const) {
    describe(`${days} days from the launch date`, () => {
      const plans = planDays(LAUNCH_DATE, days)
      const others = plans.filter((p) => p.tier !== 'expert')

      it('starts on a Monday and numbers the days from 1', () => {
        expect(plans[0]!.n).toBe(1)
        expect(plans[days - 1]!.n).toBe(days)
        expect(plans[0]!.date).toBe(LAUNCH_DATE)
      })
      it('has exactly one expert in every UTC week (Monday to Sunday)', () => {
        for (const week of fullWeeks(plans)) expect(week.filter((p) => p.tier === 'expert').length, week[0]!.date).toBe(1)
        // A partial head or tail week (the run does not start/end on a Monday/Sunday) holds at most one.
        for (const week of weeks(plans).filter((w) => w.length < 7)) expect(week.filter((p) => p.tier === 'expert').length, week[0]!.date).toBeLessThanOrEqual(1)
      })
      it('puts the expert on a seeded weekday that varies from week to week', () => {
        const weekdays = new Set(fullWeeks(plans).map((week) => week.findIndex((p) => p.tier === 'expert')))
        expect(weekdays.size).toBe(7)
        for (const week of fullWeeks(plans)) expect(week.findIndex((p) => p.tier === 'expert')).toBe(expertWeekday(weekStartOf(dayNumberOf(week[0]!.date))))
      })
      it('never plans a 16x16 or a size outside 6, 7, 9 and 12', () => {
        for (const p of plans) expect(SIZE_WEIGHTS.map(([s]) => s), p.date).toContain(p.size)
        expect(plans.some((p) => p.size === 16)).toBe(false)
      })
      it('keeps expert and hard on 9x9 and 12x12', () => {
        for (const p of plans.filter((q) => q.tier === 'expert' || q.tier === 'hard')) expect(ADVANCED_SIZES, `${p.date} ${p.tier}`).toContain(p.size)
        expect(plans.filter((p) => p.tier === 'hard').length).toBeGreaterThan(0)
      })
      it('keeps 6x6 and 7x7 to very easy through medium', () => {
        for (const p of plans.filter((q) => q.size <= 7)) expect(['very-easy', 'easy', 'easy-medium', 'medium'], p.date).toContain(p.tier)
      })
      it('follows the tier mix on the days that are not the expert day', () => {
        for (const [tier, percent] of TIER_MIX) expect(Math.abs(share(others, (p) => p.tier, tier) - percent), tier).toBeLessThanOrEqual(tierTolerance)
      })
      it('mostly plans 6x6 and 9x9, sometimes 7x7 and 12x12', () => {
        const free = others.filter((p) => p.tier !== 'hard')
        for (const [size, weight] of SIZE_WEIGHTS) expect(Math.abs(share(free, (p) => p.size, size) - weight), `${size}x${size}`).toBeLessThanOrEqual(sizeTolerance)
        expect(share(plans, (p) => p.size, 6) + share(plans, (p) => p.size, 9)).toBeGreaterThan(65)
      })
      it('rotates the five themes evenly and never repeats one two days in a row', () => {
        for (const theme of SCENE_THEMES) expect(share(plans, (p) => p.theme, theme.id), theme.id).toBeGreaterThan(17)
        plans.forEach((p, i) => {
          if (i > 0) expect(p.theme, p.date).not.toBe(plans[i - 1]!.theme)
        })
      })
      it('never gives two consecutive days the same size, tier and theme', () => {
        plans.forEach((p, i) => {
          if (i > 0) expect(`${p.size}${p.tier}${p.theme}`, p.date).not.toBe(`${plans[i - 1]!.size}${plans[i - 1]!.tier}${plans[i - 1]!.theme}`)
        })
      })
      it('gives every day its own seed window', () => {
        const seeds = new Set(plans.map((p) => p.seed))
        expect(seeds.size).toBe(days)
        for (const p of plans) expect(p.seed).toBe(seedOf(p.date))
      })
    })
  }
})

describe('picker is pure', () => {
  it('gives the same plan for a date however it is asked for', () => {
    expect(planDay('2027-03-05')).toEqual(planDay('2027-03-05'))
    const run = planDays('2026-12-01', 40)
    expect(planDay('2027-01-03')).toEqual(run.find((p) => p.date === '2027-01-03'))
    // Splitting a run in two changes nothing.
    expect([...planDays('2026-12-01', 15), ...planDays('2026-12-16', 25)].map((p) => ({ ...p, n: 0 }))).toEqual(run.map((p) => ({ ...p, n: 0 })))
  })
  it('depends on the launch date only through the puzzle number', () => {
    const a = planDay('2027-01-20', '2026-10-12')
    const b = planDay('2027-01-20', '2026-11-01')
    expect({ ...a, n: 0 }).toEqual({ ...b, n: 0 })
    expect(a.n).toBe(101)
    expect(b.n).toBe(81)
  })
  it('gives one expert per week whatever the start day', () => {
    const plans = planDays('2027-03-03', 100)
    const byWeek = new Map<number, number>()
    for (const p of plans) if (p.tier === 'expert') byWeek.set(weekStartOf(dayNumberOf(p.date)), (byWeek.get(weekStartOf(dayNumberOf(p.date))) ?? 0) + 1)
    for (const count of byWeek.values()) expect(count).toBe(1)
    expect(isExpertDay(addDays('2027-03-01', expertWeekday(weekStartOf(dayNumberOf('2027-03-01')))))).toBe(true)
  })
  it('lets hard and expert use 9 and 12 only, the other tiers all four sizes', () => {
    expect(sizesFor('hard').map(([s]) => s)).toEqual([9, 12])
    expect(sizesFor('expert').map(([s]) => s)).toEqual([9, 12])
    expect(sizesFor('medium').map(([s]) => s)).toEqual([6, 9, 7, 12])
  })
  it('finds the theme without a previous day', () => {
    expect(themeOf('2026-10-12')).toBe(planDay('2026-10-12').theme)
  })
  it('gives the plan a seed window of 50', () => {
    expect(ATTEMPT_WINDOW).toBe(50)
    expect(planDay('2026-10-13').seed - planDay('2026-10-12').seed).toBe(ATTEMPT_WINDOW)
  })
  it('lets only a planned 12x12 hard or expert day fall back', () => {
    expect(canFallBack({ size: 12, tier: 'expert' })).toBe(true)
    expect(canFallBack({ size: 12, tier: 'hard' })).toBe(true)
    expect(canFallBack({ size: 12, tier: 'medium' })).toBe(false)
    expect(canFallBack({ size: 9, tier: 'expert' })).toBe(false)
  })
})
