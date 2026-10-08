import type { Cell } from '../../engine/model/index.ts'

export interface Orderable {
  id: string
  /** Lies on the floor (a rug, a mat): drawn before everything that stands up. */
  flat: boolean
  cells: readonly Cell[]
}

/** The row of the object's front (bottom) edge: its lowest row on the screen. */
export const frontRow = (cells: readonly Cell[]): number => Math.max(...cells.map((c) => c.row))
const leftCol = (cells: readonly Cell[]): number => Math.min(...cells.map((c) => c.col))

/**
 * The painter's order of the objects of a scene, back to front (owner, SLAY-17.4: the picture is built from the bottom up, so what is lower on the
 * screen is drawn later and sits on top; walls always lie underneath everything). First what lies flat on the floor, then what stands up. Within
 * each group by the row of the front edge (the lowest row of the footprint, so a long piece counts at its front end), then by column from the
 * left (the camera is on the right, so what is further right is nearer), then by id so ties are stable.
 */
export function drawOrder<T extends Orderable>(items: readonly T[]): T[] {
  return [...items].sort(
    (a, b) =>
      Number(b.flat) - Number(a.flat) ||
      frontRow(a.cells) - frontRow(b.cells) ||
      leftCol(a.cells) - leftCol(b.cells) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  )
}
