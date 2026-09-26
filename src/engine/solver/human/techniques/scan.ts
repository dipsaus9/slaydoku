import type { BoardView } from '../board.ts'
import type { Deduction, Elimination, Technique } from '../types.ts'
import { cellName, colName, peopleNames, personName, rowName, sentences } from '../en.ts'

/**
 * Scan rows and columns: a free row or column with exactly one square anybody
 * can still reach must hold somebody on that square, even if we do not know
 * who yet (official technique "scan"). When only one person can reach it, that
 * person is isolated there. Otherwise the square's other line is taken.
 *
 * Only meaningful on a square grid, where every row and column holds someone.
 */
export const scan: Technique = {
  id: 'scan',
  title: 'Row by row, column by column',
  level: 2,
  find(board) {
    if (board.width !== board.height) return null
    for (const rows of [true, false]) {
      const lines = rows ? board.height : board.width
      for (let line = 0; line < lines; line++) {
        if (rows ? board.rowTaken(line) : board.colTaken(line)) continue
        const found = single(board, rows, line)
        if (found) return found
      }
    }
    return null
  },
}

function single(board: BoardView, rows: boolean, line: number): Deduction | null {
  const reachable = new Map<number, number[]>()
  for (let p = 0; p < board.people.length; p++) {
    if (board.isPlaced(p)) continue
    for (const c of board.candidates(p)) {
      if ((rows ? board.row(c) : board.col(c)) !== line) continue
      reachable.set(c, [...(reachable.get(c) ?? []), p])
    }
  }
  if (reachable.size !== 1) return null
  const [[cell, who]] = [...reachable] as [[number, number[]]]
  const lineName = rows ? rowName(line) : colName(line)
  // Within a known row only the column tells the squares apart (and the other way round).
  const freeSquare = rows ? colName(board.col(cell)) : rowName(board.row(cell))
  const opening = `Every row and column holds somebody, and in ${lineName} only one square is still free: ${freeSquare}.`
  if (who.length === 1) {
    const person = who[0] as number
    return {
      place: { person, cell },
      eliminate: [],
      explanation: sentences(`${opening} Only ${personName(board, person)} can still stand there. So ${personName(board, person)} stands on ${cellName(board, cell)}.`),
      people: [person],
      cells: [cell],
    }
  }
  // The occupant of the square takes its other line: nobody else can use it.
  const otherLine = rows ? board.col(cell) : board.row(cell)
  const eliminate: Elimination[] = []
  const hit: number[] = []
  for (let p = 0; p < board.people.length; p++) {
    if (board.isPlaced(p)) continue
    for (const c of board.candidates(p)) {
      if (c === cell || (rows ? board.col(c) : board.row(c)) !== otherLine) continue
      eliminate.push({ person: p, cell: c })
      hit.push(c)
    }
  }
  if (eliminate.length === 0) return null
  const taken = rows ? colName(otherLine) : rowName(otherLine)
  return {
    eliminate,
    explanation: sentences(
      `${opening} One of these people stands there: ${peopleNames(board, who, 'or')}. We do not know who yet, but ${taken} is taken either way, so nobody else can stand there.`,
    ),
    people: who,
    cells: [cell, ...new Set(hit)],
  }
}
