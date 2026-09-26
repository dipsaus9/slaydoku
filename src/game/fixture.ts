import type { CatalogClue } from '../engine/clues/index.ts'
import type { Cell, Puzzle } from '../engine/model/index.ts'
import { tutorialPuzzle } from '../engine/model/tutorial.fixture.ts'

/** The tutorial with its four clue cards (own reconstruction, same as the human solver tests). */
export const clues: CatalogClue[] = [
  { personId: 'A', type: 'besideObject', args: { objectType: 'table' } },
  { personId: 'B', type: 'onObject', args: { objectType: 'bed' } },
  { personId: 'C', type: 'besideFeature', args: { feature: 'window' } },
  { personId: 'V', type: 'aloneWithMurderer', args: {} },
]

export const puzzle: Puzzle = { ...tutorialPuzzle, clues }

/** True cells (0-based). Table r1c3 (0,2), tv (1,0) and plant (3,3) are blocked. */
export const at = {
  V: { row: 0, col: 0 },
  A: { row: 1, col: 2 },
  C: { row: 2, col: 3 },
  B: { row: 3, col: 1 },
} satisfies Record<string, Cell>

export const blocked: Cell = { row: 0, col: 2 }
