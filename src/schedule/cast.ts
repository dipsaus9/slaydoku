import { castFor } from '../content/cast/index.ts'
import type { Cast } from '../content/cast/index.ts'
import { dateOfDayNumber, dayNumberOf } from './dates.ts'
import { sizeAndTierOf } from './pick.ts'

/*
 * The cast of a day. Names and genders are baked into the schedule, so they are decided when it is generated, from `castFor`, with the
 * names of the day before kept out. To stay a pure function of the date (so days can be built in any order or in parallel), the chain
 * is defined on the PLANNED sizes: the "nominal" cast of a day is `castFor(planned size, date, nominal cast of the day before)`, and the
 * chain starts on a fixed anchor date. Only a fallback day (a planned 12x12 hard or expert made as 9x9, see pick.ts) has another cast; see
 * `fallbackCast`.
 */

/** First day of the cast chain. Dates before it have no cast; the launch date must not be earlier. */
export const CAST_CHAIN_START = '2026-01-01'

const chain = new Map<number, Cast>()

/** The nominal cast of a date: for the planned size, avoiding the nominal cast of the day before. */
export function nominalCast(date: string): Cast {
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
  const next = nominalCast(dateOfDayNumber(dayNumberOf(date) + 1)).names
  return castFor(size, `${date}:fallback`, [...previousNames, ...next])
}
