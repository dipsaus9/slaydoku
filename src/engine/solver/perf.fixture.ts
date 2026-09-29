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
export function load(text: string): Puzzle {
  const parsed = parsePuzzle(text)
  if (!parsed.ok) throw new Error(parsed.issues.map((i) => i.message).join('; '))
  return parsed.value
}

/** The two official sizes, and the wall-clock solve budget each carries in perf.slow.test.ts. */
export const PERF_CASES = [
  ['9x9', nine, 200],
  ['16x16', sixteen, 4000],
] as const

export const cellOf = (solution: Placement[], id: string) => solution.find((p) => p.personId === id)?.cell

export function solveOnce(puzzle: Puzzle) {
  return solve(puzzle.scene, puzzle.people, puzzle.clues as CatalogClue[])
}

/** Fastest of a few runs, so one scheduler hiccup does not fail the budget. */
export function bestOf(runs: number, puzzle: Puzzle) {
  let best = Infinity
  let result = solveOnce(puzzle)
  for (let i = 0; i < runs; i++) {
    const start = performance.now()
    result = solveOnce(puzzle)
    best = Math.min(best, performance.now() - start)
  }
  return { best, result }
}
