import type { BoardView } from '../../human/board.ts'
import { countWord } from '../../../clues/index.ts'
import { lineNames, peopleNames, sentences } from '../../human/en.ts'
import type { Deduction, Elimination, Technique } from '../../human/types.ts'
import { snapshot, subsets } from '../snapshot.ts'
import type { Snapshot } from '../snapshot.ts'

/**
 * Subsets on the row/column permutation structure. Everybody stands in their
 * own row and their own column, so people and lines pair up one to one:
 *
 * - naked subset: k people who together can only reach k lines own those
 *   lines; nobody else can stand there (the basic `overload` is k = 1, 2);
 * - hidden subset: k free lines that only k people can reach are filled by
 *   exactly those people, so those people can stand nowhere else (needs a
 *   square grid, where every line holds somebody).
 */

const lineOf = (board: BoardView, rows: boolean, cell: number) => (rows ? board.row(cell) : board.col(cell))

/** Naked subsets of exactly `size` people, for rows and then columns. */
export function nakedLines(size: number, id: string, level: number, title: string): Technique {
  return {
    id,
    title,
    level,
    find(board) {
      const snap = snapshot(board)
      for (const rows of [true, false]) {
        const found = naked(snap, rows, size)
        if (found) return found
      }
      return null
    },
  }
}

function naked(snap: Snapshot, rows: boolean, size: number): Deduction | null {
  const { board } = snap
  const reach = new Map<number, Set<number>>()
  for (const p of snap.unplaced) {
    const lines = new Set((snap.cand[p] as number[]).map((c) => lineOf(board, rows, c)))
    if (lines.size <= size) reach.set(p, lines)
  }
  for (const group of subsets([...reach.keys()], size)) {
    const lines = new Set(group.flatMap((p) => [...(reach.get(p) as Set<number>)]))
    if (lines.size !== size) continue
    const eliminate: Elimination[] = []
    for (const q of snap.unplaced) {
      if (group.includes(q)) continue
      for (const c of snap.cand[q] as number[]) {
        if (lines.has(lineOf(board, rows, c))) eliminate.push({ person: q, cell: c })
      }
    }
    if (eliminate.length === 0) continue
    const noun = rows ? 'rows' : 'columns'
    return {
      eliminate,
      explanation: sentences(
        `${peopleNames(board, group)} can only stand in ${lineNames(rows, [...lines])} now: ${countWord(size)} people for ${countWord(size)} ${noun}. We do not know who stands where, but those ${noun} belong to them together. Nobody else can stand there.`,
      ),
      people: group,
      cells: [...new Set(eliminate.map((e) => e.cell))],
    }
  }
  return null
}

/** Hidden subsets of `min` to `max` lines, smallest first, rows and then columns. */
export function hiddenLines(min: number, max: number, id: string, level: number, title: string): Technique {
  return {
    id,
    title,
    level,
    find(board) {
      const snap = snapshot(board)
      if (!snap.square) return null
      for (let size = min; size <= max; size++) {
        for (const rows of [true, false]) {
          const found = hidden(snap, rows, size)
          if (found) return found
        }
      }
      return null
    },
  }
}

function hidden(snap: Snapshot, rows: boolean, size: number): Deduction | null {
  const { board } = snap
  const free = rows ? snap.freeRows : snap.freeCols
  const people = rows ? snap.rowPeople : snap.colPeople
  // Only lines few people can reach are worth combining.
  const usable = free.filter((l) => (people[l] as number[]).length <= size)
  for (const lines of subsets(usable, size)) {
    const who = new Set(lines.flatMap((l) => people[l] as number[]))
    if (who.size !== size) continue
    const inside = new Set(lines)
    const eliminate: Elimination[] = []
    for (const p of who) {
      for (const c of snap.cand[p] as number[]) {
        if (!inside.has(lineOf(board, rows, c))) eliminate.push({ person: p, cell: c })
      }
    }
    if (eliminate.length === 0) continue
    const list = lineNames(rows, lines)
    const group = [...who]
    const noun = rows ? 'row' : 'column'
    const explanation =
      size === 1
        ? `Only ${peopleNames(board, group)} can still stand in ${list}. Every ${noun} holds somebody, so ${peopleNames(board, group)} stands there and nowhere else.`
        : `Only ${peopleNames(board, group)} can still stand in ${list}. Every ${noun} holds somebody, so they fill those ${countWord(size)} ${rows ? 'rows' : 'columns'} together and stand nowhere else.`
    return { eliminate, explanation: sentences(explanation), people: group, cells: [...new Set(eliminate.map((e) => e.cell))] }
  }
  return null
}
