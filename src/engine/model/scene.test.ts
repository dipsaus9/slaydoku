import { describe, expect, it } from 'vitest'
import {
  adjacentRooms,
  beside,
  besideCells,
  cellsBesideFeature,
  cellsInRoom,
  featureCells,
  isBesideFeature,
  isOccupiable,
  objectsAt,
  occupiableCells,
  roomIdAt,
  roomsAdjacent,
} from './scene.ts'
import { tutorialPuzzle } from './tutorial.fixture.ts'
import type { Scene } from './types.ts'

const { scene } = tutorialPuzzle
const at = (row: number, col: number) => ({ row, col })

describe('occupiability', () => {
  it('plain floor is occupiable', () => {
    expect(isOccupiable(scene, at(0, 0))).toBe(true)
    expect(isOccupiable(scene, at(1, 1))).toBe(true)
  })

  it('blocking objects are not occupiable', () => {
    expect(isOccupiable(scene, at(0, 2))).toBe(false) // table
    expect(isOccupiable(scene, at(1, 0))).toBe(false) // tv
    expect(isOccupiable(scene, at(3, 3))).toBe(false) // plant
  })

  it('every cell of a multi-cell occupiable object can hold a person', () => {
    expect(isOccupiable(scene, at(2, 1))).toBe(true)
    expect(isOccupiable(scene, at(3, 1))).toBe(true)
    expect(objectsAt(scene, at(2, 1)).map((o) => o.id)).toEqual(['bed'])
    expect(objectsAt(scene, at(3, 1)).map((o) => o.id)).toEqual(['bed'])
  })

  it('cells outside the grid are not occupiable', () => {
    expect(isOccupiable(scene, at(-1, 0))).toBe(false)
    expect(isOccupiable(scene, at(0, 4))).toBe(false)
  })

  it('lists occupiable cells', () => {
    expect(occupiableCells(scene)).toHaveLength(16 - 3)
  })

  it('an L-shaped sofa covers several cells', () => {
    const l: Scene = {
      width: 3,
      height: 2,
      rooms: [{ id: 'r', name: 'Room' }],
      cellRooms: [
        ['r', 'r', 'r'],
        ['r', 'r', 'r'],
      ],
      objects: [{ id: 'sofa', type: 'sofa', cells: [at(0, 0), at(1, 0), at(1, 1)] }],
      edgeFeatures: [],
    }
    expect(occupiableCells(l)).toHaveLength(6)
    expect(objectsAt(l, at(1, 1))).toHaveLength(1)
  })
})

describe('rooms', () => {
  it('reads the room of a cell', () => {
    expect(roomIdAt(scene, at(1, 3))).toBe('living')
    expect(roomIdAt(scene, at(2, 0))).toBe('bedroom')
    expect(roomIdAt(scene, at(4, 0))).toBeUndefined()
  })

  it('lists the cells of a room', () => {
    expect(cellsInRoom(scene, 'living')).toHaveLength(8)
    expect(cellsInRoom(scene, 'nowhere')).toEqual([])
  })

  it('finds adjacent rooms', () => {
    expect(adjacentRooms(scene, 'living')).toEqual(['bedroom'])
    expect(roomsAdjacent(scene, 'living', 'bedroom')).toBe(true)
    expect(roomsAdjacent(scene, 'living', 'living')).toBe(false)
  })

  it('rooms that only touch at a corner are not adjacent', () => {
    const corner: Scene = {
      width: 2,
      height: 2,
      rooms: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
        { id: 'c', name: 'C' },
      ],
      cellRooms: [
        ['a', 'b'],
        ['b', 'c'],
      ],
      objects: [],
      edgeFeatures: [],
    }
    expect(roomsAdjacent(corner, 'a', 'b')).toBe(true)
    expect(roomsAdjacent(corner, 'a', 'c')).toBe(false)
  })
})

describe('beside', () => {
  it('is true for orthogonal neighbours in the same room', () => {
    expect(beside(at(1, 2), at(0, 2), scene)).toBe(true) // A beside the table
    expect(beside(at(0, 0), at(0, 1), scene)).toBe(true)
    expect(beside(at(0, 1), at(0, 0), scene)).toBe(true)
    expect(beside(at(3, 0), at(3, 1), scene)).toBe(true)
  })

  it('is false for diagonal neighbours', () => {
    expect(beside(at(0, 0), at(1, 1), scene)).toBe(false)
    expect(beside(at(2, 2), at(3, 3), scene)).toBe(false)
  })

  it('is false across a wall', () => {
    expect(beside(at(1, 0), at(2, 0), scene)).toBe(false)
    expect(beside(at(1, 3), at(2, 3), scene)).toBe(false)
  })

  it('is false for the same cell, distant cells and cells outside the grid', () => {
    expect(beside(at(0, 0), at(0, 0), scene)).toBe(false)
    expect(beside(at(0, 0), at(0, 2), scene)).toBe(false)
    expect(beside(at(0, 3), at(0, 4), scene)).toBe(false)
  })

  it('lists the beside cells of a cell', () => {
    expect(besideCells(scene, at(1, 0))).toEqual([at(0, 0), at(1, 1)])
    expect(besideCells(scene, at(2, 3))).toEqual([at(3, 3), at(2, 2)])
  })
})

describe('window and door adjacency', () => {
  it('a window on the outer edge touches one cell', () => {
    const [window] = scene.edgeFeatures
    expect(window).toBeDefined()
    expect(featureCells(scene, window!)).toEqual([at(2, 3)])
    expect(cellsBesideFeature(scene)).toEqual([at(2, 3)])
    expect(isBesideFeature(scene, at(2, 3))).toBe(true)
    expect(isBesideFeature(scene, at(1, 3))).toBe(false)
  })

  it('a feature on an inner line touches two cells, from either spelling', () => {
    const inner = { kind: 'window', cell: at(1, 1), side: 'south' } as const
    const other = { kind: 'window', cell: at(2, 1), side: 'north' } as const
    expect(featureCells(scene, inner)).toEqual([at(1, 1), at(2, 1)])
    expect(featureCells(scene, other)).toEqual([at(2, 1), at(1, 1)])
    const withInner: Scene = { ...scene, edgeFeatures: [inner, other] }
    expect(cellsBesideFeature(withInner)).toHaveLength(2)
  })

  it('separates windows from doors', () => {
    const door = { kind: 'door', cell: at(0, 0), side: 'north' } as const
    const withDoor: Scene = { ...scene, edgeFeatures: [...scene.edgeFeatures, door] }
    expect(cellsBesideFeature(withDoor, 'door')).toEqual([at(0, 0)])
    expect(isBesideFeature(withDoor, at(0, 0))).toBe(false)
    expect(isBesideFeature(withDoor, at(0, 0), 'door')).toBe(true)
  })
})
