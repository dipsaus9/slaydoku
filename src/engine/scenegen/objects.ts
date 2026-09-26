import type { SceneTheme, ThemeFootprint, ThemeObject } from '../../content/themes/index.ts'
import type { Cell, EdgeFeature, PlacedObject } from '../model/index.ts'
import { inBounds, step } from '../model/index.ts'
import { pick, pickWeighted, shuffle, type Random } from './random.ts'

/** Every row and column keeps at least this many occupiable cells. */
export const MIN_FREE_PER_LINE = 2

/** A room keeps at least this share of its cells occupiable (rounded up, and at least one). */
export const MIN_FREE_SHARE = 0.5

/** Extra chance for objects the theme says belong in this kind of room. */
const FAVOUR_BOOST = 4

/** Chance boost when a spot fits the object's placement hint. */
const HINT_BOOST = 8

export interface PlaceObjectsInput {
  width: number
  height: number
  /** Room index per cell. */
  rooms: number[][]
  /** The theme room (with its `favours` list) of each room index. */
  favours: readonly (readonly string[])[]
  theme: SceneTheme
  edgeFeatures: readonly EdgeFeature[]
}

/** The 8 turns and mirrors of a footprint, each normalised to start at 0,0 and deduplicated. */
function orientations(footprint: ThemeFootprint): Cell[][] {
  const seen = new Set<string>()
  const out: Cell[][] = []
  for (const mirror of [false, true]) {
    for (let turns = 0; turns < 4; turns++) {
      let cells = footprint.cells.map((c) => ({ ...c }))
      if (mirror) cells = cells.map((c) => ({ row: c.row, col: -c.col }))
      for (let t = 0; t < turns; t++) cells = cells.map((c) => ({ row: c.col, col: -c.row }))
      const minRow = Math.min(...cells.map((c) => c.row))
      const minCol = Math.min(...cells.map((c) => c.col))
      const normal = cells
        .map((c) => ({ row: c.row - minRow, col: c.col - minCol }))
        .sort((a, b) => a.row - b.row || a.col - b.col)
      const key = normal.map((c) => `${c.row},${c.col}`).join(';')
      if (seen.has(key)) continue
      seen.add(key)
      out.push(normal)
    }
  }
  return out
}

/**
 * Fills the rooms with themed objects. Objects stay inside one room, never
 * overlap, keep clear of doors, and follow their placement hint when a spot
 * allows it. Blocking objects never take the last occupiable cells of a row,
 * column or room (see MIN_FREE_PER_LINE, MIN_FREE_SHARE); occupiable objects
 * (chairs, beds, rugs...) never block anything. Object ids read
 * `<theme kind>-<n>`, so the themed kind survives in the engine scene.
 */
export function placeObjects(input: PlaceObjectsInput, random: Random): PlacedObject[] {
  const { width, height, rooms, theme } = input
  const roomIds = [...new Set(rooms.flat())]
  const roomSize = new Map<number, number>()
  for (const id of rooms.flat()) roomSize.set(id, (roomSize.get(id) ?? 0) + 1)

  const taken = Array.from({ length: height }, () => Array.from({ length: width }, () => false))
  const rowFree = Array.from({ length: height }, () => width)
  const colFree = Array.from({ length: width }, () => height)
  const roomFree = new Map(roomSize)
  const nearDoor = new Set<string>()
  for (const feature of input.edgeFeatures) {
    if (feature.kind !== 'door') continue
    for (const cell of [feature.cell, step(feature.cell, feature.side)]) {
      if (inBounds({ width, height }, cell)) nearDoor.add(`${cell.row},${cell.col}`)
    }
  }

  const isWall = (row: number, col: number, dr: number, dc: number): boolean => {
    const other = rooms[row + dr]?.[col + dc]
    return other === undefined || other !== rooms[row]![col]
  }
  const onBoundary = (c: Cell) =>
    isWall(c.row, c.col, -1, 0) || isWall(c.row, c.col, 1, 0) || isWall(c.row, c.col, 0, -1) || isWall(c.row, c.col, 0, 1)
  const inCorner = (c: Cell) =>
    (isWall(c.row, c.col, -1, 0) || isWall(c.row, c.col, 1, 0)) &&
    (isWall(c.row, c.col, 0, -1) || isWall(c.row, c.col, 0, 1))

  const objects: PlacedObject[] = []
  const counter = new Map<string, number>()

  for (const room of shuffle(random, roomIds)) {
    const size = roomSize.get(room)!
    const minFree = Math.max(1, Math.ceil(size * MIN_FREE_SHARE))
    const cells: Cell[] = []
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) if (rooms[row]![col] === room) cells.push({ row, col })
    }
    const favoured = new Set(input.favours[room] ?? [])
    const perKind = new Map<string, number>()
    const target = Math.max(1, Math.round(size * (0.22 + random() * 0.22)))
    let covered = 0
    let misses = 0

    const fits = (placed: Cell[], object: ThemeObject): boolean => {
      for (const c of placed) {
        if (c.row >= height || c.col >= width) return false
        if (rooms[c.row]![c.col] !== room || taken[c.row]![c.col] || nearDoor.has(`${c.row},${c.col}`)) return false
      }
      if (object.occupiable) return true
      // Blocking: the lines and the room must keep enough free cells afterwards.
      const rowLoss = new Map<number, number>()
      const colLoss = new Map<number, number>()
      for (const c of placed) {
        rowLoss.set(c.row, (rowLoss.get(c.row) ?? 0) + 1)
        colLoss.set(c.col, (colLoss.get(c.col) ?? 0) + 1)
      }
      for (const [row, loss] of rowLoss) if (rowFree[row]! - loss < MIN_FREE_PER_LINE) return false
      for (const [col, loss] of colLoss) if (colFree[col]! - loss < MIN_FREE_PER_LINE) return false
      return roomFree.get(room)! - placed.length >= minFree
    }

    const tryPlace = (object: ThemeObject): Cell[] | undefined => {
      const footprint = pickWeighted(random, object.footprints, (f) => f.weight)
      if (!footprint) return undefined
      const shape = pick(random, orientations(footprint))
      const spots: { cells: Cell[]; score: number }[] = []
      for (const anchor of cells) {
        const placed = shape.map((c) => ({ row: anchor.row + c.row, col: anchor.col + c.col }))
        if (!fits(placed, object)) continue
        const good =
          object.placement === 'wall'
            ? placed.some(onBoundary)
            : object.placement === 'corner'
              ? placed.some(inCorner)
              : object.placement === 'centre'
                ? !placed.some(onBoundary)
                : true
        spots.push({ cells: placed, score: good && object.placement !== 'anywhere' ? HINT_BOOST : 1 })
      }
      const spot = pickWeighted(random, spots, (s) => s.score)
      if (!spot) return undefined
      const n = (counter.get(object.kind) ?? 0) + 1
      counter.set(object.kind, n)
      objects.push({ id: `${object.kind}-${n}`, type: object.engineType, cells: spot.cells })
      for (const c of spot.cells) {
        taken[c.row]![c.col] = true
        if (!object.occupiable) {
          rowFree[c.row]!--
          colFree[c.col]!--
          roomFree.set(room, roomFree.get(room)! - 1)
        }
      }
      return spot.cells
    }

    // A room first gets one of its signature objects (the bed in a bedroom), then random ones.
    let signature = favoured.size > 0 && size >= 3 ? 4 : 0
    while (covered < target && misses < 8) {
      const onlyFavoured = signature > 0
      const candidates = theme.objects.filter(
        (o) => (perKind.get(o.kind) ?? 0) < (o.maxPerRoom ?? Infinity) && (!onlyFavoured || favoured.has(o.kind)),
      )
      const object = pickWeighted(random, candidates, (o) => o.weight * (favoured.has(o.kind) ? FAVOUR_BOOST : 1))
      if (!object) break
      const placed = tryPlace(object)
      if (!placed) {
        if (onlyFavoured) signature--
        else misses++
        continue
      }
      signature = 0
      perKind.set(object.kind, (perKind.get(object.kind) ?? 0) + 1)
      covered += placed.length
    }
  }
  return objects
}
