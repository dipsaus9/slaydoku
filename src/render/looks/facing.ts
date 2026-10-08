import type { Cell, ObjectType, PlacedObject, Scene } from '../../engine/model/index.ts'
import type { Rotation } from '../icons/orientation.ts'

/** Objects people sit at: a chair turns toward the first of these it stands next to. */
export const SEAT_TARGETS: readonly ObjectType[] = ['table', 'diningTable', 'desk', 'kitchenCounter', 'gardenTable']

type Side = 'south' | 'east' | 'north' | 'west'

/** The art faces south at rotation 0 and turns clockwise: a quarter turn makes it face west. */
const ROTATION_OF: Record<Side, Rotation> = { south: 0, west: 90, north: 180, east: 270 }
const STEP: Record<Side, Cell> = { south: { row: 1, col: 0 }, east: { row: 0, col: 1 }, north: { row: -1, col: 0 }, west: { row: 0, col: -1 } }
const OPPOSITE: Record<Side, Side> = { south: 'north', north: 'south', east: 'west', west: 'east' }
/** The fixed order that makes a tie deterministic: toward a table in this order, and the wall in this order. */
const SIDES: readonly Side[] = ['south', 'east', 'north', 'west']
const WALL_ORDER: readonly Side[] = ['north', 'west', 'south', 'east']

/**
 * Which way a chair faces (render only: the scene has no facing). Toward an object people sit at when one touches the chair (4 neighbours; the
 * first in the order south, east, north, west); otherwise away from the nearest wall of its room, into the room (a tie goes to the first of
 * north, west, south, east); undefined (the default, back to the north) when no side is nearer a wall than the others.
 */
export function chairFacing(chair: Pick<PlacedObject, 'id' | 'cells'>, objects: readonly Pick<PlacedObject, 'id' | 'type' | 'cells'>[], cellRooms: Scene['cellRooms']): Rotation | undefined {
  const cell = chair.cells[0]
  if (!cell || chair.cells.length !== 1) return undefined
  const at = (c: Cell, side: Side): Cell => ({ row: c.row + STEP[side].row, col: c.col + STEP[side].col })
  const targets = objects.filter((o) => o.id !== chair.id && SEAT_TARGETS.includes(o.type))
  for (const side of SIDES) {
    const n = at(cell, side)
    if (targets.some((o) => o.cells.some((c) => c.row === n.row && c.col === n.col))) return ROTATION_OF[side]
  }
  const room = cellRooms[cell.row]?.[cell.col]
  if (room === undefined) return undefined
  const free = (side: Side): number => {
    let n = 0
    let c = at(cell, side)
    while (cellRooms[c.row]?.[c.col] === room) {
      n++
      c = at(c, side)
    }
    return n
  }
  const distance = new Map(WALL_ORDER.map((side) => [side, free(side)] as const))
  const nearest = Math.min(...distance.values())
  if (WALL_ORDER.every((side) => distance.get(side) === nearest)) return undefined
  const wall = WALL_ORDER.find((side) => distance.get(side) === nearest)!
  return ROTATION_OF[OPPOSITE[wall]]
}
