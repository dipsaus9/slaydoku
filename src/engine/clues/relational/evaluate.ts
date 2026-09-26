import { isBesideObject, roomIdAt, sameCell, step } from '../../model/index.ts'
import type { Cell, Placement, Scene } from '../../model/index.ts'
import type { CompassSide, DiagonalDirection, Qualifiers, RelationalClue } from './types.ts'

/** Row/column deltas of one step per direction (row 0 is the top). */
const DELTA: Record<CompassSide | DiagonalDirection, { row: number; col: number }> = {
  north: { row: -1, col: 0 },
  south: { row: 1, col: 0 },
  east: { row: 0, col: 1 },
  west: { row: 0, col: -1 },
  northwest: { row: -1, col: -1 },
  northeast: { row: -1, col: 1 },
  southwest: { row: 1, col: -1 },
  southeast: { row: 1, col: 1 },
}

/** Strict comparison on the axis of `side`: true when `cell` lies on that side of `ref`. */
export function isSideOf(cell: Cell, ref: Cell, side: CompassSide): boolean {
  const d = DELTA[side]
  return d.row !== 0 ? (cell.row - ref.row) * d.row > 0 : (cell.col - ref.col) * d.col > 0
}

/**
 * `cell` lies strictly beyond the whole extent of `object` on the axis of `side`: north = in a row
 * above its topmost row, south = below its bottom row, east/west likewise with columns. This is how
 * a person reads "noordelijker dan een bed": above the whole bed, not merely above one of its cells.
 * A one-cell object behaves like a plain cell.
 */
export function isBeyondObject(cell: Cell, object: readonly Cell[], side: CompassSide): boolean {
  if (object.length === 0) return false
  return object.every((c) => isSideOf(cell, c, side))
}

/**
 * `cell` is exactly `count` rows (north/south) or columns (east/west) away from
 * `ref` in direction `side`. Only that axis counts: the other coordinate is free.
 */
export function isExactlyFrom(cell: Cell, ref: Cell, side: CompassSide, count: number): boolean {
  const d = DELTA[side]
  return d.row !== 0 ? cell.row - ref.row === d.row * count : cell.col - ref.col === d.col * count
}

/** Strict quadrant: above-left etc., both axes strictly. */
export function isInQuadrant(cell: Cell, ref: Cell, direction: DiagonalDirection): boolean {
  const d = DELTA[direction]
  return (cell.row - ref.row) * d.row > 0 && (cell.col - ref.col) * d.col > 0
}

/** On the diagonal ray from `ref` in `direction`, at `steps` steps or any distance. */
export function isOnDiagonal(
  cell: Cell,
  ref: Cell,
  direction: DiagonalDirection | undefined,
  steps?: number,
): boolean {
  const dr = cell.row - ref.row
  const dc = cell.col - ref.col
  if (dr === 0 || Math.abs(dr) !== Math.abs(dc)) return false
  if (steps !== undefined && Math.abs(dr) !== steps) return false
  if (direction === undefined) return true
  const d = DELTA[direction]
  return Math.sign(dr) === d.row && Math.sign(dc) === d.col
}

/**
 * Whether a relational clue is true for a full placement (everyone placed,
 * victim included). An unplaced holder or reference makes it false. Same
 * contract as the structural `evaluate`.
 */
export function evaluateRelational(
  clue: RelationalClue,
  scene: Scene,
  placements: Placement[],
): boolean {
  const cells = new Map(placements.map((p) => [p.personId, p.cell]))
  const roomOf = (id: string) => {
    const cell = cells.get(id)
    return cell === undefined ? undefined : roomIdAt(scene, cell)
  }
  const cell = cells.get(clue.personId)
  const room = roomOf(clue.personId)
  if (cell === undefined || room === undefined) return false

  const other = 'otherId' in clue.args ? cells.get(clue.args.otherId) : undefined
  const otherRoom = 'otherId' in clue.args ? roomOf(clue.args.otherId) : undefined
  const needsOther = 'otherId' in clue.args
  if (needsOther && (other === undefined || otherRoom === undefined)) return false

  const qualified = (q: Qualifiers): boolean => {
    if (q.roomId !== undefined && q.roomId !== room) return false
    if (!q.alone) return true
    return [...cells.keys()].filter((id) => roomOf(id) === room).length === 1
  }
  const objectsOf = (type: string) => scene.objects.filter((o) => o.type === type)

  switch (clue.type) {
    case 'directionOf':
      return other !== undefined && isSideOf(cell, other, clue.args.side) && qualified(clue.args)
    case 'directionOfObject':
      return (
        // Beyond the WHOLE extent of at least one object of the type (not any single cell of it).
        objectsOf(clue.args.objectType).some((o) => isBeyondObject(cell, o.cells, clue.args.side)) &&
        qualified(clue.args)
      )
    case 'exactDistance':
      return (
        other !== undefined &&
        isExactlyFrom(cell, other, clue.args.side, clue.args.count) &&
        qualified(clue.args)
      )
    case 'directlyNextToObject': {
      // holder = the square one step `side` of a square of an object, same room, and not on that object itself
      const from = step(cell, opposite(clue.args.side))
      return objectsOf(clue.args.objectType).some(
        (o) => o.cells.some((c) => sameCell(c, from)) && isBesideObject(scene, cell, o),
      )
    }
    case 'diagonal':
      return (
        other !== undefined &&
        isOnDiagonal(cell, other, clue.args.direction, clue.args.steps) &&
        qualified(clue.args)
      )
    case 'quadrant':
      return (
        other !== undefined && isInQuadrant(cell, other, clue.args.direction) && qualified(clue.args)
      )
    case 'sameRoom':
      return otherRoom === room
    case 'differentRoom':
    case 'notWith':
      return otherRoom !== room
    case 'notBesideObject':
      return !objectsOf(clue.args.objectType).some((o) => isBesideObject(scene, cell, o))
  }
}

function opposite(side: CompassSide): CompassSide {
  return { north: 'south', south: 'north', east: 'west', west: 'east' }[side] as CompassSide
}
