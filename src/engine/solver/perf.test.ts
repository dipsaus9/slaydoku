import { describe, expect, it } from 'vitest'
import type { CatalogClue } from '../clues/index.ts'
import { parsePuzzle } from '../model/index.ts'
import type { Placement, Puzzle } from '../model/index.ts'
import { solve } from './solve.ts'
import nine from './fixtures/synthetic-9x9.json?raw'
import sixteen from './fixtures/synthetic-16x16.json?raw'

/**
 * Representative puzzles of the official sizes, generated once from the clue
 * catalog (`uniquePuzzle`) and stored as synthetic fixtures: exactly one
 * solution, about two clues per person, no pinning row/column clues.
 */
function load(text: string): Puzzle {
  const parsed = parsePuzzle(text)
  if (!parsed.ok) throw new Error(parsed.issues.map((i) => i.message).join('; '))
  return parsed.value
}

/** Fastest of a few runs, so one scheduler hiccup does not fail the budget. */
function bestOf(runs: number, puzzle: Puzzle) {
  let best = Infinity
  let result = solve(puzzle.scene, puzzle.people, puzzle.clues as CatalogClue[])
  for (let i = 0; i < runs; i++) {
    const start = performance.now()
    result = solve(puzzle.scene, puzzle.people, puzzle.clues as CatalogClue[])
    best = Math.min(best, performance.now() - start)
  }
  return { best, result }
}

const cellOf = (solution: Placement[], id: string) => solution.find((p) => p.personId === id)?.cell

describe('solver performance', () => {
  for (const [name, text, budgetMs] of [
    ['9x9', nine, 200],
    ['16x16', sixteen, 4000],
  ] as const) {
    it(`${name} solves uniquely within ${budgetMs} ms`, { timeout: 60_000 }, () => {
      const puzzle = load(text)
      const { best, result } = bestOf(3, puzzle)
      expect(result.count).toBe(1)
      for (const { personId, cell } of puzzle.solution) {
        expect(cellOf(result.solutions[0] as Placement[], personId)).toEqual(cell)
      }
      expect(best).toBeLessThan(budgetMs)
    })
  }
})
