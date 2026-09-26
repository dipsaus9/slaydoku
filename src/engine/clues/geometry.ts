import { cellsInRoom, inBounds, roomIdAt, step } from '../model/index.ts'
import type { Cell, Scene, Side } from '../model/index.ts'
import type { LinePosition } from './types.ts'

/** A side of `cell` is a wall when it faces the grid border or another room. */
function hasWall(scene: Scene, cell: Cell, side: Side): boolean {
  const next = step(cell, side)
  return !inBounds(scene, next) || roomIdAt(scene, next) !== roomIdAt(scene, cell)
}

/**
 * Corner: "where two or three walls of an area meet". A cell is a corner when
 * two perpendicular sides of it are walls (grid border or another room).
 * Two opposite walls (a corridor) do not meet, so they do not count.
 */
export function isCorner(scene: Scene, cell: Cell): boolean {
  if (!inBounds(scene, cell)) return false
  const wall = (side: Side) => hasWall(scene, cell, side)
  return (
    (wall('north') && wall('east')) ||
    (wall('east') && wall('south')) ||
    (wall('south') && wall('west')) ||
    (wall('west') && wall('north'))
  )
}

/**
 * The row (north, south) or column (west, east) that is the edge of `roomId`: the smallest / largest row or column
 * index that holds a square of the room. Null when the room has no squares.
 */
export function roomEdgeIndex(scene: Scene, roomId: string, edge: Side): number | null {
  const cells = cellsInRoom(scene, roomId)
  if (cells.length === 0) return null
  const values = cells.map((c) => (edge === 'north' || edge === 'south' ? c.row : c.col))
  return edge === 'north' || edge === 'west' ? Math.min(...values) : Math.max(...values)
}

/** The 0-based row/column index a position names, or null (middle of an even count). */
export function lineIndex(size: number, position: LinePosition): number | null {
  if (position === 'first') return 0
  if (position === 'last') return size - 1
  return size % 2 === 1 ? (size - 1) / 2 : null
}
