import { describe, expect, it } from 'vitest'
import type { PlacedObject, Scene } from '../../engine/model/index.ts'
import { COLORS, type Prim } from './models.ts'
import { chairFacing } from './facing.ts'
import { solidOf } from './solid.ts'

const room = (rows: number, cols: number, id = 'A') => Array.from({ length: rows }, () => Array.from({ length: cols }, () => id))
const chair = (row: number, col: number, id = 'chair-1'): PlacedObject => ({ id, type: 'chair', cells: [{ row, col }] })
const table = (cells: [number, number][], type: PlacedObject['type'] = 'table'): PlacedObject => ({ id: `${type}-1`, type, cells: cells.map(([row, col]) => ({ row, col })) })
const facing = (c: PlacedObject, others: PlacedObject[], rooms: Scene['cellRooms'] = room(5, 5)) => chairFacing(c, [c, ...others], rooms)

describe('chairFacing', () => {
  it('turns toward a table on each of the four sides (rotation 0 faces south, a quarter turn west)', () => {
    expect(facing(chair(2, 2), [table([[3, 2]])])).toBe(0)
    expect(facing(chair(2, 2), [table([[2, 3]])])).toBe(270)
    expect(facing(chair(2, 2), [table([[1, 2]])])).toBe(180)
    expect(facing(chair(2, 2), [table([[2, 1]])])).toBe(90)
  })

  it('knows every object people sit at, but not a bookshelf or a plant', () => {
    for (const type of ['table', 'diningTable', 'desk', 'kitchenCounter', 'gardenTable'] as const) expect(facing(chair(2, 2), [table([[2, 3]], type)]), type).toBe(270)
    for (const type of ['bookshelf', 'plant', 'sofa'] as const) expect(facing(chair(2, 2), [table([[2, 3]], type)]), type).toBeUndefined()
  })

  it('does not count a table that only touches at a corner', () => {
    expect(facing(chair(2, 2), [table([[3, 3]])])).toBeUndefined()
  })

  it('picks the first of south, east, north, west when several tables touch it', () => {
    expect(facing(chair(2, 2), [table([[2, 1]]), table([[1, 2]], 'desk'), table([[2, 3]], 'diningTable')])).toBe(270)
    expect(facing(chair(2, 2), [table([[2, 1]]), table([[1, 2]], 'desk')])).toBe(180)
  })

  it('faces away from the nearest wall, into the room, when no table touches it', () => {
    expect(facing(chair(0, 2), [])).toBe(0)
    expect(facing(chair(4, 2), [])).toBe(180)
    expect(facing(chair(2, 0), [])).toBe(270)
    expect(facing(chair(2, 4), [])).toBe(90)
  })

  it('stands in a corner on a deterministic side: the wall order is north, west, south, east', () => {
    expect(facing(chair(0, 0), [])).toBe(0)
    expect(facing(chair(0, 4), [])).toBe(0)
    expect(facing(chair(4, 0), [])).toBe(270)
    expect(facing(chair(4, 4), [])).toBe(180)
  })

  it('counts a wall between rooms: the nearest wall is the room edge, not the grid edge', () => {
    const rooms = [['A', 'A', 'B', 'B', 'B'], ...room(4, 5).map(() => ['A', 'A', 'B', 'B', 'B'])]
    expect(facing(chair(2, 1), [], rooms)).toBe(90)
    expect(facing(chair(2, 2), [], rooms)).toBe(270)
  })

  it('keeps the default for a chair in the middle of a room with no neighbours', () => {
    expect(facing(chair(2, 2), [])).toBeUndefined()
  })

  it('turns two chairs at one table each toward it, whatever the order of the objects', () => {
    const t = table([[2, 2], [2, 3]])
    const a = chair(1, 2, 'a')
    const b = chair(3, 3, 'b')
    const rooms = room(5, 5)
    expect(chairFacing(a, [a, b, t], rooms)).toBe(0)
    expect(chairFacing(b, [a, b, t], rooms)).toBe(180)
    expect(chairFacing(a, [t, b, a], rooms)).toBe(0)
    expect(chairFacing(b, [t, b, a], rooms)).toBe(180)
  })

  it('is deterministic: the same board gives the same answer every time', () => {
    const objects = [chair(1, 1, 'c1'), chair(3, 3, 'c2'), table([[2, 2]])]
    const first = objects.map((o) => chairFacing(o, objects, room(5, 5)))
    for (let i = 0; i < 5; i++) expect(objects.map((o) => chairFacing(o, objects, room(5, 5)))).toEqual(first)
  })

  it('leaves everything that is not a single-cell chair alone', () => {
    expect(chairFacing({ id: 'x', cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] }, [], room(3, 3))).toBeUndefined()
  })
})

describe('the chair block turned by the facing', () => {
  /** Which side of the footprint the backrest (the tallest cream box) is on. */
  const backrestSide = (rotation: number) => {
    const solid = solidOf(chair(0, 0), undefined, rotation as 0)!
    const back = solid.prims.find((p): p is Extract<Prim, { kind: 'box' }> => p.kind === 'box' && p.color === COLORS.cream && p.z1 === 78)!
    const cx = (back.x0 + back.x1) / 2
    const cy = (back.y0 + back.y1) / 2
    return cx < 20 ? 'west' : cx > 80 ? 'east' : cy < 20 ? 'north' : 'south'
  }

  it('puts the backrest opposite to where the chair faces, in the block art', () => {
    expect(backrestSide(0)).toBe('north')
    expect(backrestSide(90)).toBe('east')
    expect(backrestSide(180)).toBe('south')
    expect(backrestSide(270)).toBe('west')
  })
})
