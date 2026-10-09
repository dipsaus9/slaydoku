import { describe, expect, it } from 'vitest'
import { SCENE_THEMES } from '../content/themes/index.ts'
import { addDays, dayNumberOf, weekStartOf } from './dates.ts'
import { LAUNCH_DATE } from './launch.ts'
import {
  ADVANCED_SIZES, ATTEMPT_WINDOW, KEPT_DATES, PENDING_REGENERATION_THROUGH, PLANNED_SIZES, RULES_FROM, SIZE_WEIGHTS, SMALL_GRID_EXPERT_SIZE,
  SMALL_GRID_LAST_DATE, SMALL_GRID_LEVELS, SMALL_GRID_SIZE_WEIGHTS, TIER_MIX, acceptedPlans, allowedSizes, canFallBack, expertWeekday,
  followsCurrentRules, isExpertDay, isPendingRegeneration, isSmallGridLevel, launchSizeAndTierOf, planDay, planDays, seedOf, sizesFor,
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

describe('picker rules over long runs', () => {
  for (const [days, tierTolerance] of [[365, 5], [730, 3.5]] as const) {
    describe(`${days} days from the launch date`, () => {
      const plans = planDays(LAUNCH_DATE, days)
      const current = plans.filter((p) => followsCurrentRules(p.date))
      const others = current.filter((p) => p.tier !== 'expert')

      it('numbers the days from 1', () => {
        expect(plans[0]!.n).toBe(1)
        expect(plans[days - 1]!.n).toBe(days)
        expect(plans[0]!.date).toBe(LAUNCH_DATE)
      })
      it('has exactly one expert in every UTC week under the current rules, at most one in any week', () => {
        for (const week of fullWeeks(plans).filter((w) => w.every((p) => followsCurrentRules(p.date)))) expect(count(week, (p) => p.tier === 'expert'), week[0]!.date).toBe(1)
        for (const week of weeks(plans)) expect(count(week, (p) => p.tier === 'expert'), week[0]!.date).toBeLessThanOrEqual(1)
      })
      it('puts the expert on a seeded weekday that varies from week to week', () => {
        const kept = fullWeeks(current)
        const weekdays = new Set(kept.map((week) => week.findIndex((p) => p.tier === 'expert')))
        expect(weekdays.size).toBe(7)
        for (const week of kept) expect(week.findIndex((p) => p.tier === 'expert')).toBe(expertWeekday(weekStartOf(dayNumberOf(week[0]!.date))))
      })
      it('never plans a 16x16 or a size outside 6, 7, 8, 9 and 12', () => {
        for (const p of plans) expect(PLANNED_SIZES, p.date).toContain(p.size)
      })
      it('follows the tier mix on the days that are not the expert day (no ramp-up window)', () => {
        for (const [tier, percent] of TIER_MIX) expect(Math.abs(share(others, (p) => p.tier, tier) - percent), tier).toBeLessThanOrEqual(tierTolerance)
      })
      it('rotates the five themes evenly and never repeats one two days in a row', () => {
        for (const theme of SCENE_THEMES.filter((t) => !t.seasonal)) expect(share(plans, (p) => p.theme, theme.id), theme.id).toBeGreaterThan(17)
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
  it('plans hard from the first current-rule day on, about 10% of the days that are not expert days', () => {
    const hard = current.filter((p) => p.tier === 'hard')
    expect(hard.some((p) => p.date <= '2026-10-31')).toBe(true)
    expect(Math.abs(hard.length / count(current, (p) => p.tier !== 'expert') - 0.1)).toBeLessThanOrEqual(0.05)
    for (const p of hard) expect(sizesOf(SMALL_GRID_SIZE_WEIGHTS), p.date).toContain(p.size)
  })
  it('pins the planned size and tier counts of levels 1 to 100 (the table of the SLAY-22 PR)', () => {
    const tally = (pick: (p: DayPlan) => string | number) => Object.fromEntries([...new Set(levels.map(pick))].sort().map((k) => [k, count(levels, (p) => pick(p) === k)]))
    expect(tally((p) => p.size)).toEqual({ 6: 16, 7: 34, 8: 27, 9: 21, 12: 2 })
    expect(tally((p) => p.tier)).toEqual({ easy: 24, 'easy-medium': 26, expert: 13, hard: 8, medium: 18, 'very-easy': 11 })
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
  it('keeps hard and expert on 9x9 and 12x12', () => {
    for (const p of later.filter((q) => q.tier === 'expert' || q.tier === 'hard')) expect(ADVANCED_SIZES, `${p.date} ${p.tier}`).toContain(p.size)
    expect(sizesFor('hard', '2027-02-01').map(([s]) => s)).toEqual([9, 12])
    expect(sizesFor('expert', '2027-02-01').map(([s]) => s)).toEqual([9, 12])
    expect(sizesFor('medium', '2027-02-01').map(([s]) => s)).toEqual([6, 9, 7, 12])
  })
})

describe('launch rules: played days and kept days stay as they were generated', () => {
  const frozen = planDays(LAUNCH_DATE, dayNumberOf(RULES_FROM) - dayNumberOf(LAUNCH_DATE))

  it('plans every day before RULES_FROM, and the kept Simpshouse day, with the launch rules', () => {
    expect(RULES_FROM).toBe('2026-10-09')
    expect([...KEPT_DATES]).toEqual(['2026-10-14'])
    for (const p of frozen) expect({ size: p.size, tier: p.tier }, p.date).toEqual(launchSizeAndTierOf(p.date))
    expect(followsCurrentRules('2026-10-14')).toBe(false)
    expect({ size: planDay('2026-10-14').size, tier: planDay('2026-10-14').tier }).toEqual({ size: 12, tier: 'easy-medium' })
  })
  it('pins the twelve played days (levels 1 to 12)', () => {
    expect(frozen.map((p) => `${p.n}:${p.size}${p.tier}`).join(' ')).toBe(
      '1:6easy-medium 2:9medium 3:9easy 4:6medium 5:6easy-medium 6:7easy 7:6medium 8:6easy 9:6easy-medium 10:9very-easy 11:9medium 12:12easy',
    )
  })
  it('accepts the launch-rules plan for a committed day that awaits regeneration, and only then', () => {
    expect(PENDING_REGENERATION_THROUGH).toBe('2027-01-24')
    expect(isPendingRegeneration('2026-10-09')).toBe(true)
    expect(isPendingRegeneration('2026-10-08')).toBe(false)
    expect(isPendingRegeneration('2026-10-14')).toBe(false)
    expect(isPendingRegeneration('2027-01-25')).toBe(false)
    expect(acceptedPlans('2026-10-13').map((p) => `${p.size}${p.tier}`)).toEqual([`${planDay('2026-10-13').size}hard`, `${launchSizeAndTierOf('2026-10-13').size}${launchSizeAndTierOf('2026-10-13').tier}`])
    expect(acceptedPlans('2027-02-01')).toEqual([planDay('2027-02-01')])
    expect(allowedSizes('hard', '2026-10-13')).toEqual([6, 7, 8, 9, 12])
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
  it('gives one expert per week whatever the start day', () => {
    const plans = planDays('2027-03-03', 100)
    const byWeek = new Map<number, number>()
    for (const p of plans) if (p.tier === 'expert') byWeek.set(weekStartOf(dayNumberOf(p.date)), (byWeek.get(weekStartOf(dayNumberOf(p.date))) ?? 0) + 1)
    for (const count of byWeek.values()) expect(count).toBe(1)
    expect(isExpertDay(addDays('2027-03-01', expertWeekday(weekStartOf(dayNumberOf('2027-03-01')))))).toBe(true)
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
