import type { TierId } from '../engine/generator/tiers/index.ts'
import { SCENE_THEMES } from '../content/themes/index.ts'
import type { ThemeId } from '../content/themes/index.ts'
import { createRng, shuffled } from '../render/cards/procedural/rng.ts'
import type { Rng } from '../render/cards/procedural/rng.ts'
import { seasonalThemeOf } from './calendar.ts'
import { addDays, dateOfDayNumber, dayNumberOf, weekStartOf, weekdayOfDayNumber } from './dates.ts'
import { LAUNCH_DATE } from './launch.ts'
import type { DayPlan } from './types.ts'

/*
 * What gets scheduled on a UTC date. Everything here is a pure function of the date: no clock, no state, no previously picked day. The
 * same date gives the same plan on every machine and in every run, so a schedule can be extended, split over several processes or
 * regenerated and stay identical. (The puzzle NUMBER is the only thing that depends on the launch date.)
 *
 * Two rule sets (see docs/authoring/schedule.md, "How a day is picked"):
 * - the CURRENT rules (SLAY-22, owner decision 2026-10-08) plan every date from `RULES_FROM` on: small boards for the first
 *   `SMALL_GRID_LEVELS` levels, hard from day one, no ramp-up window;
 * - the LAUNCH rules plan every date before `RULES_FROM` (the days already played, and the dates before launch the cast chain walks
 *   through) and the owner-approved `KEPT_DATES`. They are frozen: changing them would change days people have played.
 */

/** Tier mix of the days that are not the week's expert day, in percent (sums to 100). Both rule sets. */
export const TIER_MIX: readonly (readonly [TierId, number])[] = [['very-easy', 15], ['easy', 30], ['easy-medium', 25], ['medium', 20], ['hard', 10]]

/** The tiers that need advanced techniques. */
export const ADVANCED_TIERS: readonly TierId[] = ['hard', 'expert']

/** The first date the current rules plan. Days before it keep the launch rules (they were generated and played under them). */
export const RULES_FROM = '2026-10-09'

/** Owner-approved days after `RULES_FROM` that keep the launch rules and their committed puzzle: the Simpshouse day (SLAY-18.4). */
export const KEPT_DATES: ReadonlySet<string> = new Set(['2026-10-14'])

/**
 * Last committed date that may still follow the launch rules although it lies on or after `RULES_FROM`: the days generated before
 * SLAY-22 and not regenerated yet. `scheduleProblems` accepts such a day under either rule set. SLAY-18.10 regenerates them and sets this
 * to null (moving `RULES_FROM` to its first regenerated date if days have been played since).
 */
export const PENDING_REGENERATION_THROUGH: string | null = '2027-01-24'

/** Levels 1 to `SMALL_GRID_LEVELS` (counted from `LAUNCH_DATE`) use `SMALL_GRID_SIZE_WEIGHTS` (SLAY-22: 12x12 is too hard on a phone). */
export const SMALL_GRID_LEVELS = 100

/** The last date of the small-grid levels: level `SMALL_GRID_LEVELS` (2027-01-04 for a launch on 2026-09-27). Fixed by `LAUNCH_DATE`, not by a run's `--launch`. */
export const SMALL_GRID_LAST_DATE = addDays(LAUNCH_DATE, SMALL_GRID_LEVELS - 1)

/**
 * Board sizes of the first `SMALL_GRID_LEVELS` levels and their weights: at most 9x9, mostly 7x7 and 8x8. Every tier but expert draws from
 * it, hard included. 9x9 has a small weight because the weekly expert day is 9x9 as well: over the planned levels 13 to 100 this gives
 * about 69% 7x7 and 8x8, 11% 6x6 and 20% 9x9 (owner's suggestion was 35/35/15/15, which left 7x7 and 8x8 at 60% once the experts count).
 */
export const SMALL_GRID_SIZE_WEIGHTS: readonly (readonly [number, number])[] = [[7, 42], [8, 42], [6, 10], [9, 6]]

/** The size of an expert day within the first `SMALL_GRID_LEVELS` levels. */
export const SMALL_GRID_EXPERT_SIZE = 9

/** Board sizes from level `SMALL_GRID_LEVELS + 1` on (and of the launch rules): mostly 6 and 9, sometimes 7 and 12, never 16. */
export const SIZE_WEIGHTS: readonly (readonly [number, number])[] = [[6, 40], [9, 40], [7, 8], [12, 12]]

/** Sizes that hard and expert may use from level `SMALL_GRID_LEVELS + 1` on (and under the launch rules). */
export const ADVANCED_SIZES: readonly number[] = [9, 12]

/** Every board size any rule plans. */
export const PLANNED_SIZES: readonly number[] = [6, 7, 8, 9, 12]

/** Size a hard or expert day falls back to when the planned 12x12 cannot be produced (see docs/authoring/schedule.md). */
export const FALLBACK_SIZE = 9

/**
 * Seeds one day may try: `seed` .. `seed + ATTEMPT_WINDOW - 1` (one window per day, `ATTEMPT_WINDOW` apart, so two days never share a
 * seed). A puzzle that fails a gate is retried with the next seed of the window.
 */
export const ATTEMPT_WINDOW = 50

/** First seed of a date's attempt window. */
export const seedOf = (date: string): number => dayNumberOf(date) * ATTEMPT_WINDOW

/** Whether the current rules plan a date (on or after `RULES_FROM` and not a kept date). */
export const followsCurrentRules = (date: string): boolean => dayNumberOf(date) >= dayNumberOf(RULES_FROM) && !KEPT_DATES.has(date)

/** Whether a date is one of the first `SMALL_GRID_LEVELS` levels (on or before `SMALL_GRID_LAST_DATE`). */
export const isSmallGridLevel = (date: string): boolean => dayNumberOf(date) <= dayNumberOf(SMALL_GRID_LAST_DATE)

/** Which sizes a tier may use on a date under the current rules. */
export const sizesFor = (tier: TierId, date: string): readonly (readonly [number, number])[] => {
  if (isSmallGridLevel(date)) return tier === 'expert' ? [[SMALL_GRID_EXPERT_SIZE, 1]] : SMALL_GRID_SIZE_WEIGHTS
  return launchSizesFor(tier)
}

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

/** Tier under the current rules: the week's expert day is `expert`, every other day draws `TIER_MIX`. No ramp-up window (SLAY-22). */
const tierOf = (date: string): TierId => (isExpertDay(date) ? 'expert' : weighted(TIER_MIX, createRng(`tier:${date}`)))

/* ---- Launch rules: frozen, see the header. ---- */

const launchSizesFor = (tier: TierId): readonly (readonly [number, number])[] =>
  ADVANCED_TIERS.includes(tier) ? SIZE_WEIGHTS.filter(([size]) => ADVANCED_SIZES.includes(size)) : SIZE_WEIGHTS

/** The launch rules' gentler first month (SLAY-10.1): from `LAUNCH_DATE` through this date no hard and no expert. Only days before `RULES_FROM` and kept dates still use it. */
const LAUNCH_RAMP_UP_END = '2026-10-31'
const LAUNCH_RAMP_UP_MIX: readonly (readonly [TierId, number])[] = [['very-easy', 15], ['easy', 30], ['easy-medium', 25], ['medium', 30]]

function launchTierOf(date: string): TierId {
  const day = dayNumberOf(date)
  const rampUp = day >= dayNumberOf(LAUNCH_DATE) && day <= dayNumberOf(LAUNCH_RAMP_UP_END)
  if (!rampUp) return tierOf(date)
  if (isExpertDay(date)) return weighted(LAUNCH_RAMP_UP_MIX, createRng(`tier:${date}`))
  const unmodified = weighted(TIER_MIX, createRng(`tier:${date}`))
  return unmodified === 'hard' ? weighted(LAUNCH_RAMP_UP_MIX, createRng(`tier:${date}`)) : unmodified
}

/** Size and tier of a date under the launch rules (the rules every day before SLAY-22 was generated with). */
export function launchSizeAndTierOf(date: string): { size: number; tier: TierId } {
  const tier = launchTierOf(date)
  return { tier, size: weighted(launchSizesFor(tier), createRng(`size:${date}`)) }
}

/* ---- Themes ---- */

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

/* ---- Plans ---- */

/** Size and tier under the small-grid rules, whatever the date (`sizeAndTierOf` uses it for the first `SMALL_GRID_LEVELS` levels; tests sample it over long runs). */
export function smallGridSizeAndTierOf(date: string): { size: number; tier: TierId } {
  const tier = tierOf(date)
  return { tier, size: tier === 'expert' ? SMALL_GRID_EXPERT_SIZE : weighted(SMALL_GRID_SIZE_WEIGHTS, createRng(`size:${date}`)) }
}

/**
 * Size and tier of a date. Current rules: the week's expert day is an expert (9x9 in the first `SMALL_GRID_LEVELS` levels), every other
 * day draws a tier from `TIER_MIX`, then a size the tier allows on that date (`sizesFor`). Dates before `RULES_FROM` and `KEPT_DATES`:
 * the launch rules.
 */
export function sizeAndTierOf(date: string): { size: number; tier: TierId } {
  if (!followsCurrentRules(date)) return launchSizeAndTierOf(date)
  if (isSmallGridLevel(date)) return smallGridSizeAndTierOf(date)
  const tier = tierOf(date)
  return { tier, size: weighted(sizesFor(tier, date), createRng(`size:${date}`)) }
}

/** The plan of one date; `n` counts from `launch` (launch day = 1; earlier dates give 0 or less). */
export function planDay(date: string, launch: string = LAUNCH_DATE): DayPlan {
  return { n: dayNumberOf(date) - dayNumberOf(launch) + 1, date, ...sizeAndTierOf(date), theme: themeOf(date), seed: seedOf(date) }
}

/** Whether a date awaits regeneration: under the current rules, but committed under the launch rules (see `PENDING_REGENERATION_THROUGH`). */
export const isPendingRegeneration = (date: string): boolean =>
  PENDING_REGENERATION_THROUGH !== null && followsCurrentRules(date) && dayNumberOf(date) <= dayNumberOf(PENDING_REGENERATION_THROUGH)

/** The board sizes a day of `tier` on `date` may have under the rule sets it may follow (a fallback's `FALLBACK_SIZE` aside). */
export function allowedSizes(tier: TierId, date: string): number[] {
  const sets = [...(followsCurrentRules(date) ? [sizesFor(tier, date)] : []), ...(!followsCurrentRules(date) || isPendingRegeneration(date) ? [launchSizesFor(tier)] : [])]
  return [...new Set(sets.flat().map(([size]) => size))].sort((a, b) => a - b)
}

/**
 * The plans a committed day may follow: `planDay`, plus the launch-rules plan while the day awaits regeneration (on or after
 * `RULES_FROM`, through `PENDING_REGENERATION_THROUGH`). Used by the schedule checks.
 */
export function acceptedPlans(date: string, launch: string = LAUNCH_DATE): DayPlan[] {
  const plan = planDay(date, launch)
  return isPendingRegeneration(date) ? [plan, { ...plan, ...launchSizeAndTierOf(date) }] : [plan]
}

/** The plans of `days` consecutive dates from `start`. */
export function planDays(start: string, days: number, launch: string = LAUNCH_DATE): DayPlan[] {
  const first = dayNumberOf(start)
  return Array.from({ length: days }, (_, i) => planDay(dateOfDayNumber(first + i), launch))
}
