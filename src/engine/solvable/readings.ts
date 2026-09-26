import { solveAdvanced } from '../solver/advanced/solve.ts'
import type { CatalogClue } from '../clues/index.ts'
import type { Puzzle } from '../model/index.ts'

/**
 * How many card readings the existing hint solver does before it places its first
 * person. It keeps every reading in its head at once, so a big number here is what a
 * human cannot do: this is the evidence figure of the solvability report.
 * `null` when the solver never places anybody.
 */
export function readingsBeforeFirstPlacement(puzzle: Puzzle): number | null {
  const result = solveAdvanced(puzzle.scene, puzzle.people, puzzle.clues as CatalogClue[])
  const first = result.steps.findIndex((s) => s.placed !== undefined)
  if (first < 0) return null
  return result.steps.slice(0, first).filter((s) => s.technique === 'clue').length
}
