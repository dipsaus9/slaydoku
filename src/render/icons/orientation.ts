import type { Cell } from '../../engine/model/index.ts'

/**
 * Icons are drawn once, in a canonical orientation, and turned by a
 * transform: an optional mirror across the vertical axis, then a clockwise
 * rotation. Canonical art "faces south": the back of a sofa, the head of a
 * bed and the tank of a toilet sit on the north side.
 */
export type Rotation = 0 | 90 | 180 | 270

export interface Orientation {
  rotation: Rotation
  mirror: boolean
}

export const ROTATIONS: readonly Rotation[] = [0, 90, 180, 270]

/** All eight orientations, plain rotations first. */
export const ORIENTATIONS: readonly Orientation[] = [
  ...ROTATIONS.map((rotation) => ({ rotation, mirror: false })),
  ...ROTATIONS.map((rotation) => ({ rotation, mirror: true })),
]

/** SVG-style affine matrix: x' = a*x + c*y + e, y' = b*x + d*y + f. */
export type Matrix = readonly [a: number, b: number, c: number, d: number, e: number, f: number]

function multiply(m: Matrix, n: Matrix): Matrix {
  // m applied after n.
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ]
}

/**
 * Matrix taking a `cols` x `rows` box (any unit) to its oriented box, which is
 * `rows` x `cols` for quarter turns. The top-left corner of the result is 0,0.
 */
export function orientationMatrix(cols: number, rows: number, o: Orientation): Matrix {
  const mirror: Matrix = o.mirror ? [-1, 0, 0, 1, cols, 0] : [1, 0, 0, 1, 0, 0]
  const turn: Matrix =
    o.rotation === 90
      ? [0, 1, -1, 0, rows, 0]
      : o.rotation === 180
        ? [-1, 0, 0, -1, cols, rows]
        : o.rotation === 270
          ? [0, -1, 1, 0, 0, cols]
          : [1, 0, 0, 1, 0, 0]
  return multiply(turn, mirror)
}

export function applyMatrix(m: Matrix, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]
}

/** Size in cells of a `cols` x `rows` footprint after orientation. */
export function orientedSize(
  cols: number,
  rows: number,
  o: Orientation,
): { cols: number; rows: number } {
  return o.rotation === 90 || o.rotation === 270 ? { cols: rows, rows: cols } : { cols, rows }
}

/**
 * Cells of a canonical footprint (relative to its `cols` x `rows` box) after
 * orientation, sorted row-major, relative to the oriented box.
 */
export function orientCells(cells: readonly Cell[], cols: number, rows: number, o: Orientation): Cell[] {
  const m = orientationMatrix(cols, rows, o)
  return sortCells(
    cells.map((cell) => {
      const [x, y] = applyMatrix(m, cell.col + 0.5, cell.row + 0.5)
      return { row: Math.floor(y), col: Math.floor(x) }
    }),
  )
}

export function sortCells(cells: readonly Cell[]): Cell[] {
  return [...cells].sort((a, b) => a.row - b.row || a.col - b.col)
}

/** Shift cells so the bounding box starts at 0,0; sorted row-major. */
export function normalizeCells(cells: readonly Cell[]): Cell[] {
  const minRow = Math.min(...cells.map((c) => c.row))
  const minCol = Math.min(...cells.map((c) => c.col))
  return sortCells(cells.map((c) => ({ row: c.row - minRow, col: c.col - minCol })))
}

export function footprintKey(cells: readonly Cell[]): string {
  return sortCells(cells)
    .map((c) => `${c.row}:${c.col}`)
    .join('|')
}

export function boundingSize(cells: readonly Cell[]): { cols: number; rows: number } {
  return {
    cols: Math.max(...cells.map((c) => c.col)) + 1,
    rows: Math.max(...cells.map((c) => c.row)) + 1,
  }
}
