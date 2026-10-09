import { describe, expect, it } from 'vitest'
import { SCENE_THEMES } from '../content/themes/index.ts'
import { seasonalThemeOf } from './calendar.ts'
import { addDays, dayNumberOf, weekStartOf } from './dates.ts'
import { LAUNCH_DATE } from './launch.ts'
import {
  ADVANCED_SIZES, ATTEMPT_WINDOW, KEPT_DATES, PENDING_REGENERATION_THROUGH, PLANNED_SIZES, RULES_FROM, SIZE_WEIGHTS, SMALL_GRID_EXPERT_SIZE,
  SMALL_GRID_LAST_DATE, SMALL_GRID_LEVELS, SMALL_GRID_SIZE_WEIGHTS, TIER_MIX, acceptedPlans, allowedSizes, canFallBack, followsCurrentRules,
  isLaunchExpertDay, isPendingRegeneration, isSmallGridLevel, launchExpertWeekday, launchSizeAndTierOf, planDay, planDays, seedOf, sizesFor,
  smallGridSizeAndTierOf, themeOf,
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

const sizesOf = (weights: readonly (readonly [number, number])[]): number[] => weights.map(([size]) => size)
const count = (plans: readonly DayPlan[], test: (p: DayPlan) => boolean): number => plans.filter(test).length
/** A day the calendar gives a seasonal theme (or Simpshouse): the rotation rules do not apply to it. */
const isSeasonal = (p: DayPlan): boolean => seasonalThemeOf(p.date, () => true) !== undefined

describe('picker rules over long runs', () => {
  for (const [days, tierTolerance] of [[365, 5], [730, 3.5]] as const) {
    describe(`${days} days from the launch date`, () => {
      const plans = planDays(LAUNCH_DATE, days)
      const current = plans.filter((p) => followsCurrentRules(p.date))

      it('numbers the days from 1', () => {
        expect(plans[0]!.n).toBe(1)
        expect(plans[days - 1]!.n).toBe(days)
        expect(plans[0]!.date).toBe(LAUNCH_DATE)
      })
      it('has no weekly expert rule under the current rules (SLAY-24): some weeks have none, some more than one', () => {
        const perWeek = fullWeeks(current).map((week) => count(week, (p) => p.tier === 'expert'))
        expect(perWeek.some((n) => n === 0)).toBe(true)
        expect(perWeek.some((n) => n !== 1)).toBe(true)
      })
      it('never plans a 16x16 or a size outside 6, 7, 8, 9 and 12', () => {
        for (const p of plans) expect(PLANNED_SIZES, p.date).toContain(p.size)
      })
      it('follows the tier mix on every current-rule day, expert included (no weekly expert day, no ramp-up window)', () => {
        for (const [tier, percent] of TIER_MIX) expect(Math.abs(share(current, (p) => p.tier, tier) - percent), tier).toBeLessThanOrEqual(tierTolerance)
      })
      it('rotates the five themes evenly over the plain days and never repeats one two days in a row outside the seasonal windows', () => {
        const plain = plans.filter((p) => !isSeasonal(p))
        for (const theme of SCENE_THEMES.filter((t) => !t.seasonal)) expect(share(plain, (p) => p.theme, theme.id), theme.id).toBeGreaterThan(17)
        plans.forEach((p, i) => {
          if (i > 0 && !isSeasonal(p)) expect(p.theme, p.date).not.toBe(plans[i - 1]!.theme)
        })
      })
      it('never gives two consecutive plain days the same size, tier and theme (inside a seasonal window the pair gate asks for other rooms instead)', () => {
        plans.forEach((p, i) => {
          if (i > 0 && !isSeasonal(p)) expect(`${p.size}${p.tier}${p.theme}`, p.date).not.toBe(`${plans[i - 1]!.size}${plans[i - 1]!.tier}${plans[i - 1]!.theme}`)
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

describe(`first ${SMALL_GRID_LEVELS} levels: at most 9x9, mostly 7x7 and 8x8, hard from day one (SLAY-22)`, () => {
  const levels = planDays(LAUNCH_DATE, SMALL_GRID_LEVELS)
  const current = levels.filter((p) => followsCurrentRules(p.date))

  it(`ends on level ${SMALL_GRID_LEVELS}, ${SMALL_GRID_LAST_DATE}`, () => {
    expect(SMALL_GRID_LAST_DATE).toBe('2027-01-04')
    expect(levels[SMALL_GRID_LEVELS - 1]!.date).toBe(SMALL_GRID_LAST_DATE)
    expect(isSmallGridLevel(SMALL_GRID_LAST_DATE)).toBe(true)
    expect(isSmallGridLevel(addDays(SMALL_GRID_LAST_DATE, 1))).toBe(false)
  })
  it('plans only 6x6 to 9x9 on every day under the current rules, never 12x12, expert always 9x9', () => {
    expect(current.length).toBe(87)
    for (const p of current) expect([6, 7, 8, 9], p.date).toContain(p.size)
    for (const p of current.filter((q) => q.tier === 'expert')) expect(p.size, p.date).toBe(SMALL_GRID_EXPERT_SIZE)
  })
  it('makes 7x7 and 8x8 together at least 60%: of the current-rule days and of all 100 levels (the played and kept days included)', () => {
    const smallMid = (p: DayPlan) => p.size === 7 || p.size === 8
    expect(count(current, smallMid) / current.length).toBeGreaterThanOrEqual(0.6)
    expect(count(levels, smallMid) / levels.length).toBeGreaterThanOrEqual(0.6)
  })
  it('plans hard from the first current-rule day on, about 20% of the days', () => {
    const hard = current.filter((p) => p.tier === 'hard')
    expect(hard.some((p) => p.date <= '2026-10-31')).toBe(true)
    expect(Math.abs(hard.length / current.length - 0.2)).toBeLessThanOrEqual(0.07)
    for (const p of hard) expect(sizesOf(SMALL_GRID_SIZE_WEIGHTS), p.date).toContain(p.size)
  })
  it('pins the planned size and tier counts of levels 1 to 100 and of the delivered range 2026-10-10 to 2027-01-01 (the tables of the SLAY-24 PR)', () => {
    const tally = (plans: DayPlan[], pick: (p: DayPlan) => string | number) => Object.fromEntries([...new Set(plans.map(pick))].sort().map((k) => [k, count(plans, (p) => pick(p) === k)]))
    expect(tally(levels, (p) => p.size)).toEqual({ 6: 19, 7: 37, 8: 28, 9: 15, 12: 1 })
    expect(tally(levels, (p) => p.tier)).toEqual({ easy: 13, 'easy-medium': 19, expert: 5, hard: 20, medium: 41, 'very-easy': 2 })
    const delivered = planDays('2026-10-10', 84)
    expect(delivered[83]!.date).toBe('2027-01-01')
    expect(tally(delivered, (p) => p.size)).toEqual({ 6: 11, 7: 35, 8: 27, 9: 11 })
    expect(tally(delivered, (p) => p.tier)).toEqual({ easy: 9, 'easy-medium': 16, expert: 5, hard: 20, medium: 33, 'very-easy': 1 })
  })
  it('follows the tier mix 5/10/20/40/20/5 over a long seeded sample (10,000 dates), expert always 9x9', () => {
    const sample = Array.from({ length: 10_000 }, (_, i) => smallGridSizeAndTierOf(addDays('2027-03-01', i)))
    for (const [tier, percent] of TIER_MIX) expect(Math.abs((100 * sample.filter((p) => p.tier === tier).length) / sample.length - percent), tier).toBeLessThanOrEqual(1)
    expect(TIER_MIX.reduce((n, [, w]) => n + w, 0)).toBe(100)
    for (const p of sample.filter((q) => q.tier === 'expert')) expect(p.size).toBe(SMALL_GRID_EXPERT_SIZE)
  })
  it('lets every tier but expert draw every small size, expert 9x9 only', () => {
    expect(sizesFor('hard', '2026-11-01').map(([s]) => s)).toEqual([7, 8, 6, 9])
    expect(sizesFor('very-easy', '2026-11-01').map(([s]) => s)).toEqual([7, 8, 6, 9])
    expect(sizesFor('expert', '2026-11-01').map(([s]) => s)).toEqual([9])
  })
  it('follows the small-grid weights over a long seeded sample (730 dates)', () => {
    const sample = Array.from({ length: 730 }, (_, i) => ({ date: addDays('2027-03-01', i), ...smallGridSizeAndTierOf(addDays('2027-03-01', i)) }))
    const free = sample.filter((p) => p.tier !== 'expert')
    const total = SMALL_GRID_SIZE_WEIGHTS.reduce((n, [, w]) => n + w, 0)
    for (const [size, weight] of SMALL_GRID_SIZE_WEIGHTS) expect(Math.abs((100 * count(free as DayPlan[], (p) => p.size === size)) / free.length - (100 * weight) / total), `${size}x${size}`).toBeLessThanOrEqual(4)
    expect(count(sample as DayPlan[], (p) => p.size === 7 || p.size === 8) / sample.length).toBeGreaterThanOrEqual(0.6)
    for (const p of sample.filter((q) => q.tier === 'expert')) expect(p.size).toBe(SMALL_GRID_EXPERT_SIZE)
  })
})

describe(`from level ${SMALL_GRID_LEVELS + 1}: the earlier size rules`, () => {
  const later = planDays(addDays(SMALL_GRID_LAST_DATE, 1), 730)
  const free = later.filter((p) => p.tier !== 'expert' && p.tier !== 'hard')

  it('mostly plans 6x6 and 9x9, sometimes 7x7 and 12x12, never 8x8', () => {
    for (const p of later) expect(sizesOf(SIZE_WEIGHTS), p.date).toContain(p.size)
    for (const [size, weight] of SIZE_WEIGHTS) expect(Math.abs(share(free, (p) => p.size, size) - weight), `${size}x${size}`).toBeLessThanOrEqual(4)
  })
  it('keeps hard on 9x9 and 12x12 and expert on 9x9 only (SLAY-24)', () => {
    for (const p of later.filter((q) => q.tier === 'hard')) expect(ADVANCED_SIZES, `${p.date} ${p.tier}`).toContain(p.size)
    for (const p of later.filter((q) => q.tier === 'expert')) expect(p.size, p.date).toBe(9)
    expect(sizesFor('hard', '2027-02-01').map(([s]) => s)).toEqual([9, 12])
    expect(sizesFor('expert', '2027-02-01').map(([s]) => s)).toEqual([9])
    expect(sizesFor('medium', '2027-02-01').map(([s]) => s)).toEqual([6, 9, 7, 12])
  })
})

describe('launch rules: played days and kept days stay as they were generated', () => {
  const frozen = planDays(LAUNCH_DATE, dayNumberOf(RULES_FROM) - dayNumberOf(LAUNCH_DATE))

  it('plans every day before RULES_FROM with the launch rules; no kept day any more (SLAY-24 regenerates 2026-10-14)', () => {
    expect(RULES_FROM).toBe('2026-10-10')
    expect([...KEPT_DATES]).toEqual([])
    for (const p of frozen) expect({ size: p.size, tier: p.tier }, p.date).toEqual(launchSizeAndTierOf(p.date))
    expect(followsCurrentRules('2026-10-14')).toBe(true)
    expect(planDay('2026-10-14').size).toBeLessThanOrEqual(9)
  })
  it('pins the thirteen played days (levels 1 to 13)', () => {
    expect(frozen.map((p) => `${p.n}:${p.size}${p.tier}`).join(' ')).toBe(
      '1:6easy-medium 2:9medium 3:9easy 4:6medium 5:6easy-medium 6:7easy 7:6medium 8:6easy 9:6easy-medium 10:9very-easy 11:9medium 12:12easy 13:' +
        `${launchSizeAndTierOf('2026-10-09').size}${launchSizeAndTierOf('2026-10-09').tier}`,
    )
  })
  it('keeps the launch rules\' weekly expert day for the played days only', () => {
    const monday = weekStartOf(dayNumberOf('2027-03-01'))
    expect(isLaunchExpertDay(addDays('2027-03-01', launchExpertWeekday(monday)))).toBe(true)
  })
  it('accepts only the current plan once nothing awaits regeneration', () => {
    expect(PENDING_REGENERATION_THROUGH).toBeNull()
    expect(isPendingRegeneration('2026-10-10')).toBe(false)
    expect(acceptedPlans('2026-10-13')).toEqual([planDay('2026-10-13')])
    expect(allowedSizes('hard', '2026-10-13')).toEqual([6, 7, 8, 9])
    expect(allowedSizes('hard', '2026-10-08')).toEqual([9, 12])
    expect(allowedSizes('hard', '2027-02-01')).toEqual([9, 12])
  })
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
