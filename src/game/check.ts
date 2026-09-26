import { VICTIM_TEXT, evaluate } from '../engine/clues/index.ts'
import type { CatalogClue } from '../engine/clues/index.ts'
import { deriveMurderer, sameCell, validatePlacement } from '../engine/model/index.ts'
import type { Placement, Puzzle } from '../engine/model/index.ts'
import type { Board, CheckResult } from './types.ts'

export const placementsOf = (board: Board): Placement[] =>
  Object.entries(board.placements).map(([personId, cell]) => ({ personId, cell }))

/** Whether everybody, the victim included, stands on the grid. */
export const allPlaced = (puzzle: Puzzle, board: Board): boolean =>
  puzzle.people.length > 0 && puzzle.people.every((p) => p.id in board.placements)

/**
 * Whether the board is a valid answer in its own right: everybody placed on an occupiable square,
 * one person per row and column, every card true, and exactly one suspect with the victim. A puzzle
 * should have one solution, but if a player finds another that satisfies every card it is accepted
 * (design rule: never mark a consistent answer wrong).
 */
function validAnswer(puzzle: Puzzle, board: Board): string | null {
  const placements = placementsOf(board)
  if (!validatePlacement(puzzle, placements).ok) return null
  const clues = puzzle.clues as CatalogClue[]
  if (!clues.every((clue) => evaluate(clue, puzzle.scene, placements, puzzle.people))) return null
  return deriveMurderer(puzzle, placements)
}

/**
 * The automatic check. Nothing until every person is placed. Then either solved (with the
 * murderer: the suspect alone with the victim, and the elapsed time) or the count of people on
 * their true cell out of everybody. Any answer that satisfies every card counts as solved, not only the stored one. The wrong branch deliberately says nothing about who.
 */
export function checkCompletion(puzzle: Puzzle, board: Board, elapsedMs: number): CheckResult | null {
  if (!allPlaced(puzzle, board)) return null
  const truth = new Map(puzzle.solution.map((p) => [p.personId, p.cell]))
  const correctCount = puzzle.people.filter((p) => {
    const at = board.placements[p.id]
    const cell = truth.get(p.id)
    return at !== undefined && cell !== undefined && sameCell(at, cell)
  }).length
  const total = puzzle.people.length
  if (correctCount === total) {
    const murdererId = deriveMurderer(puzzle, puzzle.solution)
    if (murdererId !== null) return { solved: true, murdererId, elapsedMs }
  }
  const otherMurdererId = validAnswer(puzzle, board)
  if (otherMurdererId !== null) return { solved: true, murdererId: otherMurdererId, elapsedMs }
  return { solved: false, correctCount, total: puzzle.people.length }
}

/**
 * Result text for a check: the official "found the murderer" / "did not find everyone"
 * messages, worded around the victim.
 */
export function resultMessage(puzzle: Puzzle, result: CheckResult): string {
  if (result.solved) {
    const who = puzzle.people.find((p) => p.id === result.murdererId)
    return `You found the murderer! ${who?.label ?? result.murdererId} was alone with ${VICTIM_TEXT.noun}.`
  }
  return `Not everybody is in the right place yet: ${result.correctCount} of ${result.total} correct.`
}
