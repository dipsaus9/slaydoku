import type { BoardView } from '../board.ts'
import type { Deduction, Elimination, Technique } from '../types.ts'
import { lineNames, peopleNames, sentences } from '../en.ts'

/**
 * Overloaded rows and columns (official technique "overload"): when N people
 * can only stand in N rows (or columns) between them, those rows are theirs
 * and nobody else can stand there, even though we do not know who takes which.
 * A group of one is the plain "this person is confined to one row" case.
 */
export function overloadTechnique(maxGroup = 2, id = 'overload', level = 3): Technique {
  return {
    id,
    title: 'Overloaded rows and columns',
    level,
    find(board) {
      for (let size = 1; size <= maxGroup; size++) {
        for (const rows of [true, false]) {
          const found = findGroup(board, rows, size)
          if (found) return found
        }
      }
      return null
    },
  }
}

export const overload: Technique = overloadTechnique()

function findGroup(board: BoardView, rows: boolean, size: number): Deduction | null {
  const lineOf = (c: number) => (rows ? board.row(c) : board.col(c))
  const loose: number[] = []
  const reach = new Map<number, Set<number>>()
  for (let p = 0; p < board.people.length; p++) {
    if (board.isPlaced(p)) continue
    const lines = new Set(board.candidates(p).map(lineOf))
    if (lines.size > size) continue
    loose.push(p)
    reach.set(p, lines)
  }
  for (const group of subsets(loose, size)) {
    const lines = new Set(group.flatMap((p) => [...(reach.get(p) as Set<number>)]))
    if (lines.size !== size) continue
    const eliminate: Elimination[] = []
    for (let q = 0; q < board.people.length; q++) {
      if (board.isPlaced(q) || group.includes(q)) continue
      for (const c of board.candidates(q)) if (lines.has(lineOf(c))) eliminate.push({ person: q, cell: c })
    }
    if (eliminate.length === 0) continue
    const where = lineNames(rows, [...lines])
    const who = peopleNames(board, group)
    const explanation =
      size === 1
        ? `${who} can only stand in ${where} now. That ${rows ? 'row' : 'column'} belongs to ${who}, so nobody else can stand there.`
        : `${who} can only stand in ${where} now. We do not know who takes which ${rows ? 'row' : 'column'}, but those ${rows ? 'rows' : 'columns'} belong to them together, so nobody else can stand there.`
    return {
      eliminate,
      explanation: sentences(explanation),
      people: group,
      cells: [...new Set(eliminate.map((e) => e.cell))],
    }
  }
  return null
}

/** All subsets of `items` with exactly `size` members, in a stable order. */
function subsets(items: readonly number[], size: number): number[][] {
  const out: number[][] = []
  const pick = (start: number, chosen: number[]) => {
    if (chosen.length === size) {
      out.push([...chosen])
      return
    }
    for (let i = start; i < items.length; i++) {
      chosen.push(items[i] as number)
      pick(i + 1, chosen)
      chosen.pop()
    }
  }
  pick(0, [])
  return out
}
