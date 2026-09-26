import { TIERS } from '../engine/generator/tiers/index.ts'
import { puzzleFingerprint } from '../game/fingerprint.ts'
import { sharedNames } from '../content/cast/index.ts'
import { SCENE_THEMES } from '../content/themes/index.ts'
import { entryProblems, ratingOf } from '../content/packs/gates.ts'
import { packId } from '../content/packs/ids.ts'
import type { PackEntry } from '../content/packs/types.ts'
import { missingCardText } from '../render/cards/cardText.ts'
import { isDate } from './dates.ts'
import { ADVANCED_SIZES, ADVANCED_TIERS, ATTEMPT_WINDOW, SIZE_WEIGHTS, seedOf } from './pick.ts'
import type { ScheduleDay } from './types.ts'

/*
 * The gates of a scheduled day. Node side only (it renders the card grid to markup, like the generation sweep): the tool and the tests
 * import this file by path, `index.ts` does not export it, so the app never bundles it.
 */

/** The names of a day's suspects in seat order. */
export const castOfDay = (day: Pick<ScheduleDay, 'puzzle'>): string[] => day.puzzle.people.filter((p) => p.kind === 'suspect').map((p) => p.label)

/** A day as the pack pipeline knows it, so every gate of the pack (`entryProblems`) can run on it unchanged. */
export function packEntryOf(day: ScheduleDay): PackEntry {
  return {
    id: packId(day.size, day.tier, day.theme, day.seed),
    size: day.size,
    tier: day.tier,
    theme: day.theme,
    seed: day.seed,
    title: day.title,
    clueCount: day.puzzle.clues.length,
    rating: ratingOf(day.puzzle, day.tier).rating,
    cast: castOfDay(day),
    puzzle: day.puzzle,
  }
}

/** Problems with how a day relates to the day before it: no name in common, not the same size, tier and theme together. */
export function pairProblems(previous: ScheduleDay, day: ScheduleDay): string[] {
  const problems: string[] = []
  const shared = sharedNames(castOfDay(previous), castOfDay(day))
  if (shared.length > 0) problems.push(`${day.date}: shares the names ${shared.join(', ')} with ${previous.date}`)
  if (previous.size === day.size && previous.tier === day.tier && previous.theme === day.theme) {
    problems.push(`${day.date}: same size, tier and theme as ${previous.date}`)
  }
  return problems
}

/**
 * Checks one scheduled day from scratch, with solver runs of its own; the same checks run at generation and when the committed schedule
 * is re-verified. Returns human-readable problems, empty when the day is good:
 *
 * - shape: a real UTC date, a size the schedule uses (never 16; hard and expert only on 9x9 and 12x12), a known tier and theme, the
 *   seed inside the day's attempt window, a title, one portrait per suspect;
 * - the fingerprint matches the puzzle;
 * - every gate of a pack puzzle (`entryProblems`): unique solution, human-solvable at the tier, band checks, hint and clue audit, clue-noun
 *   audit, clue count and variety, and the cast (`castProblems`: pool names, unique first letters, balanced genders);
 * - the rendered-screen check (`missingCardText`): every card of every suspect is on the screen;
 * - with `previous`: `pairProblems`.
 */
export function dayProblems(day: ScheduleDay, previous?: ScheduleDay): string[] {
  const problems: string[] = []
  const at = (msg: string) => problems.push(`${day.date}: ${msg}`)
  if (!isDate(day.date)) at('not a UTC date')
  if (!SIZE_WEIGHTS.some(([size]) => size === day.size)) at(`size ${day.size} is not one of ${SIZE_WEIGHTS.map(([size]) => size).join(', ')}`)
  if (ADVANCED_TIERS.includes(day.tier) && !ADVANCED_SIZES.includes(day.size)) at(`${day.tier} on ${day.size}x${day.size}, only ${ADVANCED_SIZES.join(' and ')} allowed`)
  if (!TIERS.some((t) => t.id === day.tier)) at(`unknown tier "${day.tier}"`)
  if (!SCENE_THEMES.some((t) => t.id === day.theme)) at(`unknown theme "${day.theme}"`)
  if (isDate(day.date)) {
    const first = seedOf(day.date)
    if (day.seed < first || day.seed >= first + ATTEMPT_WINDOW) at(`seed ${day.seed} is outside the day's window ${first}..${first + ATTEMPT_WINDOW - 1}`)
    else if (day.attempts !== day.seed - first + 1) at(`attempts ${day.attempts} does not match seed ${day.seed}`)
  }
  if (day.fallbackFrom !== undefined && (day.fallbackFrom !== 12 || !ADVANCED_TIERS.includes(day.tier))) at(`fallbackFrom ${day.fallbackFrom} is not a planned 12x12 hard or expert day`)
  if (day.title.trim() === '') at('empty title')
  const suspects = day.puzzle.people.filter((p) => p.kind === 'suspect')
  if (day.portraits.length !== suspects.length) at(`${day.portraits.length} portraits for ${suspects.length} suspects`)
  if (day.fp !== puzzleFingerprint(day.puzzle)) at('fp does not match the puzzle')
  problems.push(...entryProblems(packEntryOf(day)).map((p) => `${day.date}: ${p}`))
  for (const missing of missingCardText(day.puzzle)) at(`screen: ${missing}`)
  if (previous) problems.push(...pairProblems(previous, day))
  return problems
}
