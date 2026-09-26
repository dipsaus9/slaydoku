import type { BoardView } from '../human/board.ts'

/**
 * A flat, indexed copy of what the advanced techniques need from a board:
 * candidate lists per person and, per row/column, who and what can still
 * reach it. `BoardView` answers one question at a time through sets; the
 * advanced techniques ask the same things many times per application, so
 * they read this snapshot (built once per `find`) instead.
 */
export interface Snapshot {
  readonly board: BoardView
  readonly width: number
  readonly height: number
  /** Square grid: every row and every column holds exactly one person (the rules the line techniques rest on). */
  readonly square: boolean
  /** People not placed yet. */
  readonly unplaced: number[]
  /** Candidate cells per person (a placed person has their one cell). */
  readonly cand: number[][]
  readonly rowTaken: boolean[]
  readonly colTaken: boolean[]
  /** Rows/columns nobody stands in yet. */
  readonly freeRows: number[]
  readonly freeCols: number[]
  /** For each row, the cells some unplaced person can still stand on. */
  readonly rowCells: number[][]
  readonly colCells: number[][]
  /** For each row/column, the unplaced people who can still stand in it. */
  readonly rowPeople: number[][]
  readonly colPeople: number[][]
}

export function snapshot(board: BoardView): Snapshot {
  const { width, height } = board
  const cand: number[][] = []
  const unplaced: number[] = []
  const rowTaken: boolean[] = Array.from({ length: height }, () => false)
  const colTaken: boolean[] = Array.from({ length: width }, () => false)
  const rowCellSets = Array.from({ length: height }, () => new Set<number>())
  const colCellSets = Array.from({ length: width }, () => new Set<number>())
  const rowPeople: number[][] = Array.from({ length: height }, () => [])
  const colPeople: number[][] = Array.from({ length: width }, () => [])
  for (let p = 0; p < board.people.length; p++) {
    const own = board.candidates(p)
    cand.push(own)
    if (board.isPlaced(p)) {
      const at = board.placedAt(p)
      rowTaken[board.row(at)] = true
      colTaken[board.col(at)] = true
      continue
    }
    unplaced.push(p)
    const rows = new Set<number>()
    const cols = new Set<number>()
    for (const c of own) {
      const r = board.row(c)
      const k = board.col(c)
      rowCellSets[r]?.add(c)
      colCellSets[k]?.add(c)
      rows.add(r)
      cols.add(k)
    }
    for (const r of rows) rowPeople[r]?.push(p)
    for (const k of cols) colPeople[k]?.push(p)
  }
  const free = (taken: boolean[]) => taken.flatMap((t, i) => (t ? [] : [i]))
  return {
    board,
    width,
    height,
    square: width === height && board.people.length === width,
    unplaced,
    cand,
    rowTaken,
    colTaken,
    freeRows: free(rowTaken),
    freeCols: free(colTaken),
    rowCells: rowCellSets.map((s) => [...s]),
    colCells: colCellSets.map((s) => [...s]),
    rowPeople,
    colPeople,
  }
}

/** All subsets of `items` with exactly `size` members, in a stable order. */
export function subsets<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = []
  const pick = (start: number, chosen: T[]) => {
    if (chosen.length === size) {
      out.push([...chosen])
      return
    }
    for (let i = start; i <= items.length - (size - chosen.length); i++) {
      chosen.push(items[i] as T)
      pick(i + 1, chosen)
      chosen.pop()
    }
  }
  pick(0, [])
  return out
}
