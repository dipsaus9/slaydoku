import { isOccupiableType } from './catalog.ts'
import type { Cell, EdgeFeature, EdgeFeatureKind, PlacedObject, Scene, Side } from './types.ts'

const STEP: Record<Side, Cell> = {
  north: { row: -1, col: 0 },
  east: { row: 0, col: 1 },
  south: { row: 1, col: 0 },
  west: { row: 0, col: -1 },
}

export const SIDES = Object.keys(STEP) as Side[]

export function sameCell(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col
}

export function cellKey(cell: Cell): string {
  return `${cell.row},${cell.col}`
}

export function inBounds(scene: Pick<Scene, 'width' | 'height'>, cell: Cell): boolean {
  return (
    Number.isInteger(cell.row) &&
    Number.isInteger(cell.col) &&
    cell.row >= 0 &&
    cell.row < scene.height &&
    cell.col >= 0 &&
    cell.col < scene.width
  )
}

/** The cell one step towards `side`. May lie outside the grid. */
export function step(cell: Cell, side: Side): Cell {
  const d = STEP[side]
  return { row: cell.row + d.row, col: cell.col + d.col }
}

/** Orthogonal neighbours inside the grid, regardless of walls. */
export function orthogonalNeighbors(scene: Pick<Scene, 'width' | 'height'>, cell: Cell): Cell[] {
  return SIDES.map((side) => step(cell, side)).filter((c) => inBounds(scene, c))
}

export function roomIdAt(scene: Scene, cell: Cell): string | undefined {
  return inBounds(scene, cell) ? scene.cellRooms[cell.row]?.[cell.col] : undefined
}

export function cellsInRoom(scene: Scene, roomId: string): Cell[] {
  const cells: Cell[] = []
  for (let row = 0; row < scene.height; row++) {
    for (let col = 0; col < scene.width; col++) {
      if (scene.cellRooms[row]?.[col] === roomId) cells.push({ row, col })
    }
  }
  return cells
}

export function objectsAt(scene: Scene, cell: Cell): PlacedObject[] {
  return scene.objects.filter((o) => o.cells.some((c) => sameCell(c, cell)))
}

/** Plain floor is occupiable; a cell is blocked as soon as a blocking object covers it. */
export function isOccupiable(scene: Scene, cell: Cell): boolean {
  if (!inBounds(scene, cell)) return false
  return objectsAt(scene, cell).every((o) => isOccupiableType(o.type))
}

export function occupiableCells(scene: Scene): Cell[] {
  const cells: Cell[] = []
  for (let row = 0; row < scene.height; row++) {
    for (let col = 0; col < scene.width; col++) {
      if (isOccupiable(scene, { row, col })) cells.push({ row, col })
    }
  }
  return cells
}

/**
 * "Beside": orthogonal neighbours (up, down, left, right) AND in the same
 * room. Diagonals and neighbours across a wall are not beside. A cell is not
 * beside itself.
 */
export function beside(a: Cell, b: Cell, scene: Scene): boolean {
  if (!inBounds(scene, a) || !inBounds(scene, b)) return false
  const distance = Math.abs(a.row - b.row) + Math.abs(a.col - b.col)
  if (distance !== 1) return false
  return roomIdAt(scene, a) === roomIdAt(scene, b)
}

/** Orthogonal neighbours of `cell` that are beside it (same room). */
export function besideCells(scene: Scene, cell: Cell): Cell[] {
  return orthogonalNeighbors(scene, cell).filter((c) => beside(cell, c, scene))
}

/**
 * The 1-2 cells touching an edge feature: its own cell plus the cell across
 * the line when that lies inside the grid. Rooms are not considered: a window
 * on a wall between two rooms touches both sides.
 */
export function featureCells(scene: Scene, feature: EdgeFeature): Cell[] {
  if (!inBounds(scene, feature.cell)) return []
  const across = step(feature.cell, feature.side)
  return inBounds(scene, across) ? [feature.cell, across] : [feature.cell]
}

/** Every cell touching any feature of `kind` (window by default), deduplicated. */
export function cellsBesideFeature(
  scene: Scene,
  kind: EdgeFeatureKind = 'window',
): Cell[] {
  const seen = new Map<string, Cell>()
  for (const feature of scene.edgeFeatures) {
    if (feature.kind !== kind) continue
    for (const cell of featureCells(scene, feature)) seen.set(cellKey(cell), cell)
  }
  return [...seen.values()]
}

/** Whether `cell` touches a feature of `kind` (window by default). */
export function isBesideFeature(
  scene: Scene,
  cell: Cell,
  kind: EdgeFeatureKind = 'window',
): boolean {
  return cellsBesideFeature(scene, kind).some((c) => sameCell(c, cell))
}

/** Rooms sharing at least one cell edge with `roomId`, in room-list order. */
export function adjacentRooms(scene: Scene, roomId: string): string[] {
  const found = new Set<string>()
  for (const cell of cellsInRoom(scene, roomId)) {
    for (const n of orthogonalNeighbors(scene, cell)) {
      const other = roomIdAt(scene, n)
      if (other !== undefined && other !== roomId) found.add(other)
    }
  }
  return scene.rooms.map((r) => r.id).filter((id) => found.has(id))
}

export function roomsAdjacent(scene: Scene, a: string, b: string): boolean {
  return a !== b && adjacentRooms(scene, a).includes(b)
}

/**
 * Whether `cell` is beside one object as a whole: next to one of its cells (see `beside`) while not
 * standing on the object itself. A person lying on the upper half of a 2-cell bed is on the bed, not
 * beside it; a one-cell object is unaffected (nobody stands on a cell and beside it).
 */
export function isBesideObject(scene: Scene, cell: Cell, object: Pick<PlacedObject, 'cells'>): boolean {
  if (object.cells.some((c) => sameCell(c, cell))) return false
  return object.cells.some((c) => beside(cell, c, scene))
}
