import * as en from '../../human/en.ts'
import * as nl from '../../human/nl.ts'
import type { BoardView } from '../../human/board.ts'
import type { Elimination, HumanContext, Technique } from '../../human/types.ts'
import { linkModel } from '../links.ts'
import * as advNl from '../nl.ts'
import { Trial } from '../trial.ts'
import type { Refutation } from '../trial.ts'

/** Refutations to spell out in the explanation; the rest are counted. */
const SHOWN = 2
/** Forced placements to list per refutation before cutting the chain short. */
const CHAIN_SHOWN = 6

/**
 * Chain reasoning: suppose a person stands on a square and follow what that
 * forces. Somebody else is left with a single square, so they are placed,
 * which closes a row and column, which leaves a next person with one square,
 * and every clue card ties the people together further. When the chain runs
 * into somebody with nowhere to stand (or a row nobody can reach), the
 * supposition was wrong and the square is out. This is not guessing: nothing
 * is kept when the chain works out, only the dead ends are struck off.
 *
 * The chain only uses forced consequences: rows and columns of placed people,
 * the clue cards that name two people (checked square by square), a person
 * with one square left, and a row or column with one square left.
 */
export const chain: Technique = {
  id: 'chain',
  title: 'Chain reasoning',
  level: 5,
  find(board, context) {
    const model = linkModel(board, context)
    const trial = new Trial(board, model)
    const found = trial.refuteAll()
    if (found.length === 0) return null
    return describe(board, context, found)
  },
}

function describe(board: BoardView, context: HumanContext, found: Refutation[]) {
  const w = context.locale === 'nl' ? nl : en
  const eliminate: Elimination[] = found.map((f) => ({ person: f.person, cell: f.cell }))
  const parts = found.slice(0, SHOWN).map((f) => explainOne(board, context, f))
  const more = found.length - SHOWN
  const tail =
    more > 0
      ? context.locale === 'nl'
        ? advNl.chainTailText(more)
        : ` The same reasoning rules out ${w.manyWord(more)} other ${more === 1 ? 'square' : 'squares'}.`
      : ''
  return {
    eliminate,
    explanation: w.sentences(`${parts.join(' ')}${tail}`),
    people: [...new Set(found.slice(0, SHOWN).flatMap((f) => [f.person, ...f.forced.map((x) => x.person)]))],
    cells: [...new Set(found.slice(0, SHOWN).flatMap((f) => [f.cell, ...f.forced.map((x) => x.cell)]))],
  }
}

function explainOne(board: BoardView, context: HumanContext, f: Refutation): string {
  const w = context.locale === 'nl' ? nl : en
  const who = w.personName(board, f.person)
  if (context.locale === 'nl') {
    const steps = f.forced.slice(0, CHAIN_SHOWN).map((x) => `${w.personName(board, x.person)} op ${w.cellName(board, x.cell)}`)
    const cut = f.forced.length > CHAIN_SHOWN
    const deadText = f.dead.kind === 'person' ? w.personName(board, f.dead.index) : f.dead.kind === 'row' ? w.rowName(f.dead.index) : w.colName(f.dead.index)
    return advNl.chainStepText(who, w.cellName(board, f.cell), steps, cut, f.dead.kind === 'person', deadText)
  }
  const steps = f.forced.slice(0, CHAIN_SHOWN).map((x) => `${w.personName(board, x.person)} op ${w.cellName(board, x.cell)}`)
  const cut = f.forced.length > CHAIN_SHOWN ? ' and so on' : ''
  const lead = steps.length > 0 ? `That forces ${w.joinList(steps, 'and', '; ')}${cut}. As a result, ` : 'Then '
  const end =
    f.dead.kind === 'person'
      ? `${w.personName(board, f.dead.index)} has no square left.`
      : `${f.dead.kind === 'row' ? w.rowName(f.dead.index) : w.colName(f.dead.index)} has no free square left.`
  return `Suppose ${who} stands on ${w.cellName(board, f.cell)}. ${lead}${end} That is impossible, so ${who} does not stand there.`
}
