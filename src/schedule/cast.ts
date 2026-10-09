import { castFor, hasOwnCastPool } from '../content/cast/index.ts'
import type { Cast } from '../content/cast/index.ts'
import { dateOfDayNumber, dayNumberOf } from './dates.ts'
import { sizeAndTierOf, themeOf } from './pick.ts'

/*
 * The cast of a day. Names and genders are baked into the schedule, so they are decided when it is generated, from `castFor`, with the
 * names of the day before kept out. To stay a pure function of the date (so days can be built in any order or in parallel), the chain
 * is defined on the PLANNED sizes: the "nominal" cast of a day is `castFor(planned size, date, nominal cast of the day before)`, and the
 * chain starts on a fixed anchor date. Only a fallback day (a planned 12x12 hard or expert made as 9x9, see pick.ts) has another cast; see
 * `fallbackCast`.
 *
 * A day whose theme has a cast pool of its own (Simpshouse, SLAY-18.2) is OUT of the chain: the chain still runs through it on the
 * regular pool as if the day were plain (never shown), so the days around it get exactly the casts they had before, and the day itself
 * takes a cast from the theme's pool that keeps out the names of both neighbours (the chain's cast of the day before and after).
 */

/** First day of the cast chain. Dates before it have no cast; the launch date must not be earlier. */
export const CAST_CHAIN_START = '2026-01-01'

const chain = new Map<number, Cast>()

/** The nominal cast of a date: for the planned size, avoiding the nominal cast of the day before; a themed-pool day: see `themedDayCast`. */
export function nominalCast(date: string): Cast {
  const theme = themeOf(date)
  return hasOwnCastPool(theme) ? themedDayCast(date, theme, sizeAndTierOf(date).size) : chainCast(date)
}

/** The cast of a day with a pool of its own: that pool, keeping out the chain's names of the day before and after. */
function themedDayCast(date: string, theme: string, size: number): Cast {
  const day = dayNumberOf(date)
  const start = dayNumberOf(CAST_CHAIN_START)
  const around = [day - 1, day + 1].filter((d) => d >= start).flatMap((d) => chainCast(dateOfDayNumber(d)).names)
  return castFor(size, date, around, theme)
}

/** The cast of a date in the chain itself (plain days and the hidden stand-ins of themed-pool days). */
function chainCast(date: string): Cast {
  const target = dayNumberOf(date)
  const start = dayNumberOf(CAST_CHAIN_START)
  if (target < start) throw new RangeError(`no cast before ${CAST_CHAIN_START} (asked for ${date})`)
  for (let day = start; day <= target; day++) {
    if (chain.has(day)) continue
    const when = dateOfDayNumber(day)
    chain.set(day, castFor(sizeAndTierOf(when).size, when, day === start ? [] : chain.get(day - 1)!.names))
  }
  return chain.get(target)!
}

/**
 * The cast of a fallback day: `size` people, keeping out the names of the day before as it really is (`previousNames`: its final cast, which
 * differs from the nominal one when that day was a fallback too) and of the day after (its nominal cast, which the day after keeps as it is),
 * so both neighbours still share no name with it. The seed has the word "fallback" in it so it never repeats the nominal draw.
 */
export function fallbackCast(date: string, size: number, previousNames: readonly string[]): Cast {
  const next = chainCast(dateOfDayNumber(dayNumberOf(date) + 1)).names
  return castFor(size, `${date}:fallback`, [...previousNames, ...next], themeOf(date))
}
