import { step } from '../model/index.ts'
import type { Cell, EdgeFeature, Side } from '../model/index.ts'
import { pick, shuffle, type Random } from './random.ts'

/** A grid line between two cells of different rooms, written from the `from` cell's side. */
interface Wall {
  from: Cell
  side: Side
  a: number
  b: number
}

const SIDE_STEPS: readonly Side[] = ['east', 'south']

/** Every inner wall segment between two different rooms (each once, east and south sides only). */
function innerWalls(rooms: number[][]): Wall[] {
  const walls: Wall[] = []
  for (let row = 0; row < rooms.length; row++) {
    for (let col = 0; col < rooms[row]!.length; col++) {
      for (const side of SIDE_STEPS) {
        const next = step({ row, col }, side)
        const other = rooms[next.row]?.[next.col]
        const here = rooms[row]![col]!
        if (other !== undefined && other !== here) walls.push({ from: { row, col }, side, a: here, b: other })
      }
    }
  }
  return walls
}

/**
 * One door per pair of touching rooms along a random spanning tree, so every
 * room is reachable from every other, plus a few extra doors that make loops.
 * A room never gets more than four doors, and two doors never share a wall cell.
 */
export function placeDoors(rooms: number[][], roomCount: number, random: Random): EdgeFeature[] {
  const walls = innerWalls(rooms)
  const byPair = new Map<string, Wall[]>()
  for (const wall of walls) {
    const key = wall.a < wall.b ? `${wall.a}-${wall.b}` : `${wall.b}-${wall.a}`
    const list = byPair.get(key)
    if (list) list.push(wall)
    else byPair.set(key, [wall])
  }
  const neighbours = new Map<number, Set<number>>()
  for (const wall of walls) {
    if (!neighbours.has(wall.a)) neighbours.set(wall.a, new Set())
    if (!neighbours.has(wall.b)) neighbours.set(wall.b, new Set())
    neighbours.get(wall.a)!.add(wall.b)
    neighbours.get(wall.b)!.add(wall.a)
  }

  const chosen: { pair: [number, number]; wall: Wall }[] = []
  const connected = new Set<number>([Math.floor(random() * roomCount)])
  const doorCount = new Map<number, number>()
  const usedCells = new Set<string>()
  const addDoor = (a: number, b: number, strict: boolean): boolean => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`
    const all = byPair.get(key) ?? []
    const spaced = all.filter(
      (w) => !usedCells.has(cellSide(w.from)) && !usedCells.has(cellSide(step(w.from, w.side))),
    )
    const options = strict || spaced.length > 0 ? spaced : all
    if (options.length === 0) return false
    const wall = pick(random, options)
    usedCells.add(cellSide(wall.from))
    usedCells.add(cellSide(step(wall.from, wall.side)))
    chosen.push({ pair: [a, b], wall })
    doorCount.set(a, (doorCount.get(a) ?? 0) + 1)
    doorCount.set(b, (doorCount.get(b) ?? 0) + 1)
    return true
  }

  // Randomised Prim over the room adjacency graph.
  while (connected.size < roomCount) {
    const frontier: [number, number][] = []
    for (const from of connected) {
      for (const to of neighbours.get(from) ?? []) if (!connected.has(to)) frontier.push([from, to])
    }
    if (frontier.length === 0) break
    const [from, to] = pick(random, frontier)
    addDoor(from, to, false)
    connected.add(to)
  }

  // Extra doors between touching rooms that are not linked yet.
  const linked = new Set(chosen.map(({ pair: [a, b] }) => (a < b ? `${a}-${b}` : `${b}-${a}`)))
  for (const key of shuffle(random, [...byPair.keys()])) {
    if (linked.has(key) || random() > 0.3) continue
    const [a, b] = key.split('-').map(Number) as [number, number]
    if ((doorCount.get(a) ?? 0) >= 4 || (doorCount.get(b) ?? 0) >= 4) continue
    if (addDoor(a, b, true)) linked.add(key)
  }

  return chosen.map(({ wall }) => ({ kind: 'door', cell: wall.from, side: wall.side }))
}

function cellSide(cell: Cell): string {
  return `${cell.row},${cell.col}`
}

/**
 * Windows on the outer edge of the grid, on the given rooms only (the indoor
 * ones). Roughly one per eight border cells, at most two per room, spread over
 * different cells; at least one when any candidate exists.
 */
export function placeWindows(
  rooms: number[][],
  indoor: ReadonlySet<number>,
  random: Random,
): EdgeFeature[] {
  const height = rooms.length
  const width = rooms[0]?.length ?? 0
  const candidates: { feature: EdgeFeature; room: number }[] = []
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const room = rooms[row]![col]!
      if (!indoor.has(room)) continue
      const sides: Side[] = []
      if (row === 0) sides.push('north')
      if (row === height - 1) sides.push('south')
      if (col === 0) sides.push('west')
      if (col === width - 1) sides.push('east')
      for (const side of sides) candidates.push({ feature: { kind: 'window', cell: { row, col }, side }, room })
    }
  }
  if (candidates.length === 0) return []
  const perimeter = 2 * (width + height)
  const wanted = Math.max(1, Math.round(perimeter / 8))
  const perRoom = new Map<number, number>()
  const used = new Set<string>()
  const out: EdgeFeature[] = []
  for (const { feature, room } of shuffle(random, candidates)) {
    if (out.length >= wanted) break
    if ((perRoom.get(room) ?? 0) >= 2) continue
    const key = cellSide(feature.cell)
    if (used.has(key)) continue
    used.add(key)
    perRoom.set(room, (perRoom.get(room) ?? 0) + 1)
    out.push(feature)
  }
  return out
}
