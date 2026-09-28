import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { renderClue } from '../../engine/clues/en.ts'
import { renderClue as renderClueLocale } from '../../engine/clues/render.ts'
import type { CatalogClue } from '../../engine/clues/index.ts'
import type { Puzzle } from '../../engine/model/index.ts'
import { generatedPuzzles } from '../../content/generated.testing.ts'
import { demoPuzzle } from '../../content/demo/puzzle.ts'
import { CardGrid } from './CardGrid.tsx'

const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim()
const named: [string, Puzzle][] = [
  ['demo', demoPuzzle],
  ...generatedPuzzles().map((g): [string, Puzzle] => [g.id, g.puzzle]),
]
const names = named.map(([name]) => name)
const load = (name: string): Puzzle => named.find(([n]) => n === name)![1]

describe('CardGrid clue text', () => {
  // Regression: relational cards (direction of an object, distance, diagonal, ...) used to render an empty bubble.
  for (const name of names) {
    it(`shows the text of every suspect card in ${name}`, () => {
      const puzzle = load(name)
      const text = strip(renderToStaticMarkup(<CardGrid people={puzzle.people} clues={puzzle.clues} scene={puzzle.scene} />))
      const context = { scene: puzzle.scene, people: puzzle.people }
      for (const person of puzzle.people.filter((p) => p.kind === 'suspect')) {
        const clue = puzzle.clues.find((c) => c.personId === person.id)
        expect(clue, `${person.label} has a card`).toBeDefined()
        const line = renderClue(clue as CatalogClue, context)
        expect(line.trim().length).toBeGreaterThan(0)
        expect(text).toContain(line)
      }
    })
  }
})

describe('CardGrid with several cards per person', () => {
  // Regression: only the first card of a person was shown, so a second card (for example a column and a
  // room-edge card for the same suspect) was invisible and the puzzle looked unsolvable.
  for (const name of names) {
    it(`shows every card of every suspect in ${name}`, () => {
      const puzzle = load(name)
      const html = renderToStaticMarkup(<CardGrid people={puzzle.people} clues={puzzle.clues} scene={puzzle.scene} />)
      const text = strip(html)
      const context = { scene: puzzle.scene, people: puzzle.people }
      for (const clue of puzzle.clues) {
        if (clue.type === 'aloneWithMurderer') continue
        expect(text, `${clue.personId}: ${clue.type}`).toContain(renderClue(clue as CatalogClue, context))
      }
    })
  }

  it('renders one line per suspect card, plus the victim card', () => {
    const puzzle = load('demo')
    const html = renderToStaticMarkup(<CardGrid people={puzzle.people} clues={puzzle.clues} scene={puzzle.scene} />)
    const lines = (html.match(/polaroid__line/g) ?? []).length
    expect(lines).toBe(puzzle.clues.filter((c) => c.type !== 'aloneWithMurderer').length + 1)
  })
})

describe('CardGrid clue text, Dutch (locale nl, SLAY-3.2)', () => {
  for (const name of names) {
    it(`shows the Dutch text of every card, gift included, in ${name}`, () => {
      const puzzle = load(name)
      const text = strip(renderToStaticMarkup(<CardGrid people={puzzle.people} clues={puzzle.clues} scene={puzzle.scene} locale="nl" />))
      const context = { scene: puzzle.scene, people: puzzle.people }
      for (const clue of puzzle.clues) {
        if (clue.type === 'aloneWithMurderer') continue
        expect(text, `${clue.personId}: ${clue.type}`).toContain(renderClueLocale(clue as CatalogClue, context, 'nl'))
      }
    })
  }

  it('defaults to English when no locale is given', () => {
    const puzzle = load('demo')
    const html = renderToStaticMarkup(<CardGrid people={puzzle.people} clues={puzzle.clues} scene={puzzle.scene} />)
    expect(strip(html)).not.toContain('slachtoffer')
  })
})
