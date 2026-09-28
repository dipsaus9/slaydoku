import type { BoardView } from '../board.ts'
import type { HumanContext, Technique } from '../types.ts'
import * as en from '../en.ts'
import * as nl from '../nl.ts'

/**
 * Single candidate: somebody has one square left. The official solution
 * pages word it "This isolates F on last carpet square".
 *
 * When several people are isolated at the same moment, the one whose clue
 * does not lean on another isolated person goes first: "Aaron was with Elyse"
 * is only pinned down once Elyse is, so Elyse is isolated before Aaron, as on
 * the official solution page.
 */
export const singleCandidate: Technique = {
  id: 'single-candidate',
  title: 'Only one square left',
  level: 1,
  find(board, context) {
    const pending: number[] = []
    for (let p = 0; p < board.people.length; p++) {
      if (!board.isPlaced(p) && board.candidateCount(p) === 1) pending.push(p)
    }
    const person = pending.find((p) => !leansOnAny(board, context, p, pending)) ?? pending[0]
    if (person === undefined) return null
    const [cell] = board.candidates(person) as [number]
    const w = context.locale === 'nl' ? nl : en
    const cellText = `${w.cellName(board, cell)}${w.onObject(board, cell)}`
    const explanation =
      context.locale === 'nl'
        ? nl.singleCandidateText(w.personName(board, person), cellText)
        : `${w.personName(board, person)} can only stand on one square now: ${cellText}. That row and column are taken with it.`
    return {
      place: { person, cell },
      eliminate: [],
      explanation: w.sentences(explanation),
      people: [person],
      cells: [cell],
    }
  },
}

/** Whether a clue of `person` names one of the `others` (who are isolated too). */
function leansOnAny(board: BoardView, context: HumanContext, person: number, others: number[]): boolean {
  const id = board.people[person]?.id
  return context.clues.some((clue) => {
    if (clue.personId !== id) return false
    const otherId = (clue.args as Record<string, unknown>).otherId
    return typeof otherId === 'string' && others.some((o) => o !== person && board.people[o]?.id === otherId)
  })
}
