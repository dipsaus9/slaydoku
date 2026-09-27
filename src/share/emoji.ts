import type { DailyResult } from '../game/daily/results.ts'
import { dateLabel, formatDuration, hintsLabel, sizeLabel, tierLabel } from './format.ts'
import { siteLabel } from './site.ts'
import type { ShareMeta } from './types.ts'

/** One square per person on the board: placed without help, placed after opening a hint, or a check that came back wrong. */
export type StripCell = 'placed' | 'hint' | 'wrong'

export const STRIP_EMOJI: Record<StripCell, string> = { placed: '\u{1F7E6}', hint: '\u{1F7E8}', wrong: '\u{1F7E5}' }

/**
 * The strip under the text: `size` squares (one per suspect, so 6 to 12), blue for a person placed on your own, yellow for every hint
 * you opened and red for every time a full board was checked and was not right, in that order (blue first). More hints and wrong checks
 * than squares are cut off at the end (hints first). It says how the solve went and nothing about the puzzle: it is the same for every
 * puzzle of that size with the same counts, so it cannot leak the solution, a name or a clue.
 */
export function stripCells(result: Pick<DailyResult, 'hints' | 'wrongChecks'>, size: number): StripCell[] {
  const cells = Math.max(1, Math.floor(size))
  const hints = Math.min(Math.max(0, Math.floor(result.hints)), cells)
  const wrong = Math.min(Math.max(0, Math.floor(result.wrongChecks)), cells - hints)
  return [...Array<StripCell>(cells - hints - wrong).fill('placed'), ...Array<StripCell>(hints).fill('hint'), ...Array<StripCell>(wrong).fill('wrong')]
}

export const emojiStrip = (result: Pick<DailyResult, 'hints' | 'wrongChecks'>, size: number): string =>
  stripCells(result, size).map((cell) => STRIP_EMOJI[cell]).join('')

/**
 * The text of a share:
 *
 *     Slaydoku #43 · Medium · 9x9
 *     ⏱ 04:12 · 💡 2 hints
 *     🟦🟦🟦🟦🟦🟦🟦🟨🟨
 *     slaydoku.vercel.app
 */
export function emojiText(result: DailyResult, meta: ShareMeta): string {
  return [
    `Slaydoku #${result.n} · ${tierLabel(meta.tier)} · ${sizeLabel(meta.size)}`,
    `⏱ ${formatDuration(result.elapsedMs)} · \u{1F4A1} ${hintsLabel(result.hints)}`,
    emojiStrip(result, meta.size),
    siteLabel(meta.siteUrl),
  ].join('\n')
}

/** One-line description for a screen reader and for the `alt` text of the card preview. */
export function cardDescription(result: DailyResult, meta: ShareMeta): string {
  return `Slaydoku puzzle #${result.n} of ${dateLabel(result.date)}, ${tierLabel(meta.tier)}, ${sizeLabel(meta.size)}. Solved in ${formatDuration(result.elapsedMs)} with ${hintsLabel(result.hints)}.`
}
