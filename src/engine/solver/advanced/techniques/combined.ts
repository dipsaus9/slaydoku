import { countWord, renderClue } from '../../../clues/index.ts'
import type { CatalogClue } from '../../../clues/index.ts'
import type { BoardView } from '../../human/board.ts'
import { cellList, peopleNames, personName, sentences } from '../../human/en.ts'
import type { Elimination, Technique } from '../../human/types.ts'
import { linkModel } from '../links.ts'
import type { Link } from '../links.ts'
import { snapshot } from '../snapshot.ts'

/** One neighbour of a hub person and the clues that tie them together. */
interface Group {
  neighbour: number
  links: Link[]
}

const MAX_GROUPS = 5

/**
 * Combined clues (relational and "with" clues alike): the basic clue technique
 * weighs every card on its own. Here the cards of one person are weighed
 * together. Take person Q on square X. Every other person a card ties Q to
 * needs a square that satisfies ALL cards between them and Q, and those squares
 * cannot share a row or column with each other or with X. When no such set of
 * squares exists, Q is not on X, even though every single card still allows it.
 *
 * This covers two cards about the same pair (say "north of" and "on a
 * diagonal with"), and a person tied to several others (distances, diagonals
 * and quadrants that compete for the same few rows and columns).
 */
export const combinedClues: Technique = {
  id: 'clue-combined',
  title: 'Combine clues',
  level: 4,
  find(board, context) {
    const model = linkModel(board, context)
    if (model.links.length < 2) return null
    const snap = snapshot(board)
    const n = model.cellCount
    for (const q of snap.unplaced) {
      const groups = groupsOf(model.links, q)
      if (groups.length === 0) continue
      const richer = groups.length >= 2 || groups.some((g) => g.links.length >= 2)
      if (!richer) continue
      const used = groups.slice(0, MAX_GROUPS)
      const eliminate: Elimination[] = []
      for (const cell of snap.cand[q] as number[]) {
        const options = used.map((g) =>
          (snap.cand[g.neighbour] as number[]).filter(
            (d) =>
              board.row(d) !== board.row(cell) &&
              board.col(d) !== board.col(cell) &&
              g.links.every((l) => (l.holder === q ? l.compat[cell * n + d] : l.compat[d * n + cell]) === 1),
          ),
        )
        if (!distinctRepresentatives(board, options)) eliminate.push({ person: q, cell })
      }
      if (eliminate.length === 0) continue
      const tied = used.flatMap((g) => g.links)
      const cards = tied.slice(0, 3).map((l) => `"${renderClue(context.clues[l.clue] as CatalogClue, { scene: board.scene, people: [...board.people] })}"`)
      const neighbours = peopleNames(board, used.map((g) => g.neighbour))
      const name = personName(board, q)
      return {
        eliminate,
        explanation: sentences(
          `The cards of ${name} and ${neighbours} belong together: ${cards.join(' ')}${tied.length > 3 ? ` There ${tied.length - 3 === 1 ? 'is' : 'are'} ${countWord(tied.length - 3)} more like these.` : ''} If ${name} stands on ${cellList(board, eliminate.map((e) => e.cell))}, there is no combination of squares left for ${neighbours} that fits all those cards without sharing a row or column. So ${name} does not stand there.`,
        ),
        people: [q, ...used.map((g) => g.neighbour)],
        cells: [...new Set(eliminate.map((e) => e.cell))],
        clueIndex: tied[0]?.clue,
      }
    }
    return null
  },
}

function groupsOf(links: readonly Link[], person: number): Group[] {
  const groups = new Map<number, Group>()
  for (const link of links) {
    const neighbour = link.holder === person ? link.other : link.other === person ? link.holder : -1
    if (neighbour < 0) continue
    const group = groups.get(neighbour) ?? { neighbour, links: [] }
    group.links.push(link)
    groups.set(neighbour, group)
  }
  return [...groups.values()]
}

/** Picks one square per group so that no two picks share a row or a column. */
function distinctRepresentatives(board: BoardView, options: number[][]): boolean {
  if (options.some((o) => o.length === 0)) return false
  const order = [...options].sort((a, b) => a.length - b.length)
  const rows = new Set<number>()
  const cols = new Set<number>()
  const pick = (i: number): boolean => {
    if (i === order.length) return true
    for (const d of order[i] as number[]) {
      const r = board.row(d)
      const c = board.col(d)
      if (rows.has(r) || cols.has(c)) continue
      rows.add(r)
      cols.add(c)
      if (pick(i + 1)) return true
      rows.delete(r)
      cols.delete(c)
    }
    return false
  }
  return pick(0)
}
