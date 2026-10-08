import type { TierId } from '../engine/generator/tiers/index.ts'
import { SCENE_THEMES } from '../content/themes/index.ts'
import type { ThemeId } from '../content/themes/index.ts'
import { createRng, shuffled } from '../render/cards/procedural/rng.ts'
import type { Rng } from '../render/cards/procedural/rng.ts'
import { seasonalThemeOf } from './calendar.ts'
import { dateOfDayNumber, dayNumberOf, weekStartOf, weekdayOfDayNumber } from './dates.ts'
import { LAUNCH_DATE } from './launch.ts'
import type { DayPlan } from './types.ts'

/*
 * What gets scheduled on a UTC date. Everything here is a pure function of the date: no clock, no state, no previously picked day. The
 * same date gives the same plan on every machine and in every run, so a schedule can be extended, split over several processes or
 * regenerated and stay identical. (The puzzle NUMBER is the only thing that depends on the launch date.)
 */

/** Board sizes of the schedule and their weights (owner mix: mostly 6 and 9, sometimes 7 and 12, never 16). */
export const SIZE_WEIGHTS: readonly (readonly [number, number])[] = [[6, 40], [9, 40], [7, 8], [12, 12]]

/** Sizes that hard and expert may use. */
export const ADVANCED_SIZES: readonly number[] = [9, 12]

/** Tier mix of the days that are not the week's expert day, in percent (sums to 100). */
export const TIER_MIX: readonly (readonly [TierId, number])[] = [['very-easy', 15], ['easy', 30], ['easy-medium', 25], ['medium', 20], ['hard', 10]]

/**
 * Tier mix for the ramp-up window (`isRampUp`): hard-free AND expert-free, `medium` picking up the 10-point share `hard` would otherwise
 * have held (20 -> 30). Same total (100) as `TIER_MIX`, so a roll that already landed on `medium`/`easy`/etc. under the unmodified mix
 * keeps its value; only a roll that would have been `hard` is remapped onto this table instead (see `tierOf`); an `expert` day inside the
 * window draws straight from this table too, with no kept-expert exception.
 */
export const RAMP_UP_TIER_MIX: readonly (readonly [TierId, number])[] = [['very-easy', 15], ['easy', 30], ['easy-medium', 25], ['medium', 30]]

/**
 * Last UTC date, inclusive, through which the ramp-up window suppresses `hard` and `expert` entirely (see `isRampUp`). Extended (SLAY-10.1)
 * from SLAY-6.3's 28-day, one-expert-kept window to run through this date, with no kept-expert exception anywhere inside it.
 */
export const RAMP_UP_END_DATE = '2026-10-31'

/** Whether a date falls within the ramp-up window: from `LAUNCH_DATE` through `RAMP_UP_END_DATE`, both inclusive. */
export const isRampUp = (date: string): boolean => {
  const day = dayNumberOf(date)
  return day >= dayNumberOf(LAUNCH_DATE) && day <= dayNumberOf(RAMP_UP_END_DATE)
}

/** The tiers whose puzzles need a 9x9 or 12x12 board. */
export const ADVANCED_TIERS: readonly TierId[] = ['hard', 'expert']

/** Size a hard or expert day falls back to when the planned 12x12 cannot be produced (see docs/authoring/schedule.md). */
export const FALLBACK_SIZE = 9

/**
 * Seeds one day may try: `seed` .. `seed + ATTEMPT_WINDOW - 1` (one window per day, `ATTEMPT_WINDOW` apart, so two days never share a
 * seed). A puzzle that fails a gate is retried with the next seed of the window.
 */
export const ATTEMPT_WINDOW = 50

/** First seed of a date's attempt window. */
export const seedOf = (date: string): number => dayNumberOf(date) * ATTEMPT_WINDOW

/** Which sizes a tier may use. */
export const sizesFor = (tier: TierId): readonly (readonly [number, number])[] =>
  ADVANCED_TIERS.includes(tier) ? SIZE_WEIGHTS.filter(([size]) => ADVANCED_SIZES.includes(size)) : SIZE_WEIGHTS

/** True when a plan may fall back to `FALLBACK_SIZE`: a planned 12x12 hard or expert day (the only boards too slow to make reliably). */
export const canFallBack = (plan: Pick<DayPlan, 'size' | 'tier'>): boolean => plan.size === 12 && ADVANCED_TIERS.includes(plan.tier)

function weighted<T>(entries: readonly (readonly [T, number])[], rng: Rng): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = rng.next() * total
  for (const [value, weight] of entries) {
    roll -= weight
    if (roll < 0) return value
  }
  return entries[entries.length - 1]![0]
}

/** Weekday (Monday 0 to Sunday 6) of the expert day of the UTC week that starts on Monday day number `monday`. Seeded per week. */
export const expertWeekday = (monday: number): number => createRng(`expert-day:${monday}`).int(7)

/** Whether a date is the expert day of its UTC week (Monday to Sunday): exactly one date per week is. */
export const isExpertDay = (date: string): boolean => {
  const day = dayNumberOf(date)
  return weekdayOfDayNumber(day) === expertWeekday(weekStartOf(day))
}

/** Whether `date` is a would-be expert day (`isExpertDay`) that the ramp-up window suppresses: every expert day inside the window, with no exception. */
export const isSuppressedExpertDay = (date: string): boolean => isExpertDay(date) && isRampUp(date)

/**
 * The tier of a date. Outside the ramp-up window: unchanged (the week's expert day is `expert`, every other day draws `TIER_MIX`).
 * Inside it: every would-be expert day draws `RAMP_UP_TIER_MIX` instead (no kept-expert exception, so a suppressed week holds zero
 * experts, not one — see `scheduleProblems`); every other day keeps its unmodified `TIER_MIX` draw exactly UNLESS that draw would have
 * been `hard`, in which case it draws `RAMP_UP_TIER_MIX` instead (same seed, same total of 100, so a non-`hard` draw is never disturbed
 * by the mix table's shape changing).
 */
function tierOf(date: string): TierId {
  if (!isRampUp(date)) return isExpertDay(date) ? 'expert' : weighted(TIER_MIX, createRng(`tier:${date}`))
  if (isExpertDay(date)) return weighted(RAMP_UP_TIER_MIX, createRng(`tier:${date}`))
  const unmodified = weighted(TIER_MIX, createRng(`tier:${date}`))
  return unmodified === 'hard' ? weighted(RAMP_UP_TIER_MIX, createRng(`tier:${date}`)) : unmodified
}

/** Rotation themes only: seasonal themes (`seasonal: true`) never enter the cycle, so the cycle length stays 5. */
const THEME_IDS: readonly ThemeId[] = SCENE_THEMES.filter((t) => !t.seasonal).map((t) => t.id)
const REGISTERED: ReadonlySet<ThemeId> = new Set(SCENE_THEMES.map((t) => t.id))
const THEME_CYCLE = THEME_IDS.length

const rawCycle = (cycle: number): ThemeId[] => shuffled(THEME_IDS, createRng(`theme-cycle:${cycle}`))

/**
 * Theme of a date: the days come in cycles of five (one per theme, in a seeded order per cycle), so the themes rotate evenly. When a
 * cycle would start with the theme the last cycle ended on, its first two are swapped, so the same theme never lands on two days in a
 * row. Pure per date. A seasonal rule (`seasonalThemeOf`) takes the day first; the rotation underneath is unaffected by it.
 */
export function themeOf(date: string): ThemeId {
  return seasonalThemeOf(date, (id) => REGISTERED.has(id)) ?? rotationThemeOf(date)
}

/** The rotation theme of a date, ignoring the seasonal calendar. */
export function rotationThemeOf(date: string): ThemeId {
  const day = dayNumberOf(date)
  const cycle = Math.floor(day / THEME_CYCLE)
  const order = rawCycle(cycle)
  if (order[0] === rawCycle(cycle - 1)[THEME_CYCLE - 1]) [order[0], order[1]] = [order[1]!, order[0]!]
  return order[day - cycle * THEME_CYCLE]!
}

/** Size and tier of a date. The expert day of the week is an expert; every other day draws a tier from `TIER_MIX` (see `tierOf` for the ramp-up window's exception), then a size the tier allows. */
export function sizeAndTierOf(date: string): { size: number; tier: TierId } {
  const tier: TierId = tierOf(date)
  return { tier, size: weighted(sizesFor(tier), createRng(`size:${date}`)) }
}

/** The plan of one date; `n` counts from `launch` (launch day = 1; earlier dates give 0 or less). */
export function planDay(date: string, launch: string = LAUNCH_DATE): DayPlan {
  return { n: dayNumberOf(date) - dayNumberOf(launch) + 1, date, ...sizeAndTierOf(date), theme: themeOf(date), seed: seedOf(date) }
}

/** The plans of `days` consecutive dates from `start`. */
export function planDays(start: string, days: number, launch: string = LAUNCH_DATE): DayPlan[] {
  const first = dayNumberOf(start)
  return Array.from({ length: days }, (_, i) => planDay(dateOfDayNumber(first + i), launch))
}
