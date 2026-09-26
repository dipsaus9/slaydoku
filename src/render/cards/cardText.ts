import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { CatalogClue } from '../../engine/clues/index.ts'
import { renderClue } from '../../engine/clues/en.ts'
import type { Puzzle } from '../../engine/model/index.ts'
import { CardGrid } from './CardGrid.tsx'

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

/** Markup reduced to the text a person reads: tags gone, entities decoded, whitespace collapsed. */
export function markupText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:#x([0-9a-f]+)|#(\d+)|([a-z]+));/gi, (whole, hex: string | undefined, dec: string | undefined, name: string | undefined) => {
      if (hex !== undefined) return String.fromCodePoint(parseInt(hex, 16))
      if (dec !== undefined) return String.fromCodePoint(Number(dec))
      return ENTITIES[(name as string).toLowerCase()] ?? whole
    })
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Cards of a puzzle that the rendered `CardGrid` does not show. For every suspect and every card the puzzle gives them (the victim's
 * fixed card excluded) the Dutch text of the card must appear in the rendered markup, and be non-empty. Empty result: everyone sees all of
 * their cards. This is the check for the bug class "a card exists in the data but not on the screen" (an empty bubble for a relational card,
 * a second card of a person that was never drawn).
 */
export function missingCardText(puzzle: Pick<Puzzle, 'people' | 'clues' | 'scene'>): string[] {
  const text = markupText(renderToStaticMarkup(createElement(CardGrid, { people: puzzle.people, clues: puzzle.clues, scene: puzzle.scene })))
  const context = { scene: puzzle.scene, people: puzzle.people }
  const missing: string[] = []
  for (const person of puzzle.people.filter((p) => p.kind === 'suspect')) {
    const own = puzzle.clues.filter((c) => c.personId === person.id)
    for (const clue of own) {
      const line = renderClue(clue as CatalogClue, context).trim()
      if (line === '') missing.push(`${person.label}: card ${clue.type} has no text`)
      else if (!text.includes(line)) missing.push(`${person.label}: card "${line}" is not on the screen`)
    }
  }
  return missing
}
