import { isOccupiable, roomIdAt } from '../model/index.ts'
import type { Cell, Scene } from '../model/index.ts'
import type { Rng } from './rng.ts'

export class GeneratorError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GeneratorError'
  }
}

/** Where the victim and the (anonymous) suspects stand; `murderer` is one of `suspects`. */
export interface SampledPlacement {
  victim: Cell
  murderer: Cell
  suspects: Cell[]
}

export interface PlacementOptions {
  /** Pin the victim to this cell. It must lie inside the grid and be occupiable. */
  victimCell?: Cell
}

const NODE_BUDGET = 20_000
const MURDERER_TRIES = 12

/**
 * Samples a valid placement on a square scene: one person per row and column
 * (so N people on an N x N grid), everybody on an occupiable cell, and the
 * victim's room holding exactly one suspect (the murderer). Deterministic for
 * a given `rng` state. Throws GeneratorError when the scene cannot host one
 * (for example a pinned victim cell on a blocked square).
 */
export function samplePlacement(scene: Scene, rng: Rng, options: PlacementOptions = {}): SampledPlacement {
  if (scene.width !== scene.height) {
    throw new GeneratorError(`The generator needs a square grid, got ${scene.width}x${scene.height}.`)
  }
  const size = scene.width
  const pinned = options.victimCell
  if (pinned) {
    const inside = Number.isInteger(pinned.row) && Number.isInteger(pinned.col)
      && pinned.row >= 0 && pinned.row < size && pinned.col >= 0 && pinned.col < size
    if (!inside) throw new GeneratorError(`Victim cell r${pinned.row + 1}c${pinned.col + 1} lies outside the grid.`)
    if (!isOccupiable(scene, pinned)) {
      throw new GeneratorError(`Victim cell r${pinned.row + 1}c${pinned.col + 1} is not occupiable.`)
    }
  }

  const occupiable: boolean[][] = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => isOccupiable(scene, { row, col })),
  )
  const room = (row: number, col: number) => roomIdAt(scene, { row, col })
  const allCells: Cell[] = []
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) if (occupiable[row]?.[col]) allCells.push({ row, col })
  }

  const victims = pinned ? [pinned] : rng.shuffle(allCells)
  for (const victim of victims) {
    const victimRoom = room(victim.row, victim.col)
    const murdererCells = rng
      .shuffle(allCells)
      .filter((c) => room(c.row, c.col) === victimRoom && c.row !== victim.row && c.col !== victim.col)
      .slice(0, MURDERER_TRIES)
    for (const murderer of murdererCells) {
      const rest = completeSuspects(size, occupiable, room, victim, murderer, victimRoom, rng)
      if (rest) return { victim, murderer, suspects: [murderer, ...rest] }
    }
    // The pinned cell has no valid completion within budget: nothing else to try.
  }
  throw new GeneratorError(
    pinned
      ? `No valid placement found with the victim on r${pinned.row + 1}c${pinned.col + 1}.`
      : 'No valid placement found on this scene.',
  )
}

/**
 * Places the other suspects: every remaining row gets one column, all in
 * different columns, outside the victim's room (the murderer is already the
 * one suspect inside it). Row order is most-constrained-first, choices random.
 */
function completeSuspects(
  size: number,
  occupiable: boolean[][],
  room: (row: number, col: number) => string | undefined,
  victim: Cell,
  murderer: Cell,
  victimRoom: string | undefined,
  rng: Rng,
): Cell[] | null {
  const rowsLeft = new Set<number>()
  const colsLeft = new Set<number>()
  for (let i = 0; i < size; i++) {
    if (i !== victim.row && i !== murderer.row) rowsLeft.add(i)
    if (i !== victim.col && i !== murderer.col) colsLeft.add(i)
  }
  const options = (row: number): number[] =>
    [...colsLeft].filter((col) => occupiable[row]?.[col] && room(row, col) !== victimRoom)

  const chosen: Cell[] = []
  let nodes = 0
  const dfs = (): boolean => {
    if (rowsLeft.size === 0) return true
    if (++nodes > NODE_BUDGET) return false
    let bestRow = -1
    let bestOptions: number[] = []
    for (const row of rowsLeft) {
      const opts = options(row)
      if (opts.length === 0) return false
      if (bestRow < 0 || opts.length < bestOptions.length) {
        bestRow = row
        bestOptions = opts
      }
    }
    rowsLeft.delete(bestRow)
    for (const col of rng.shuffle(bestOptions)) {
      colsLeft.delete(col)
      chosen.push({ row: bestRow, col })
      if (dfs()) return true
      chosen.pop()
      colsLeft.add(col)
    }
    rowsLeft.add(bestRow)
    return false
  }
  return dfs() ? chosen : null
}
