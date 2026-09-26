import { gaussian, pickWeighted, randomInt, type Random } from './random.ts'

/** Smallest room the partition keeps (smaller ones merge into a neighbour). */
export const MIN_ROOM_CELLS = 2

const STEPS = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
] as const

/**
 * How many rooms a grid gets: about 4 on 6x6, 6 on 9x9, 8 on 12x12 and 11 on
 * 16x16, plus or minus one so boards of one size still differ.
 */
export function roomCountFor(width: number, height: number, random: Random): number {
  const side = Math.sqrt(width * height)
  const base = Math.round(4 + 0.7 * (side - 6))
  const roll = random()
  const jitter = roll < 0.3 ? 1 : roll > 0.85 ? -1 : 0
  const max = Math.round(4 + 0.7 * (side - 6) + 1)
  return Math.max(4, Math.min(max, base + jitter))
}

/**
 * Splits a `width` x `height` grid into `count` connected rooms of very
 * different size and shape, like the official sheets: big L-shaped or wrapping
 * areas next to small closets. Region growing from spread-out seeds, each room
 * with its own target size. Returns the room index (0..n-1) per cell,
 * `grid[row][col]`. The result can hold fewer rooms than asked when tiny ones
 * had to merge; callers count the distinct indexes.
 */
export function partitionRooms(
  width: number,
  height: number,
  count: number,
  random: Random,
): number[][] {
  const total = width * height
  const grid: number[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => -1))

  // Target sizes: log-normal shares, so a few rooms are big and a few small.
  const shares = Array.from({ length: count }, () => Math.exp(gaussian(random) * 0.65))
  const shareTotal = shares.reduce((a, b) => a + b, 0)
  const targets = shares.map((s) => Math.max(MIN_ROOM_CELLS, Math.round((s / shareTotal) * total)))

  // Seeds: best of several random candidates, the one farthest from existing seeds.
  const seeds: { row: number; col: number }[] = []
  for (let i = 0; i < count; i++) {
    let best: { row: number; col: number } | undefined
    let bestDistance = -1
    for (let tries = 0; tries < 12; tries++) {
      const candidate = { row: randomInt(random, height), col: randomInt(random, width) }
      const distance = Math.min(
        ...seeds.map((s) => Math.abs(s.row - candidate.row) + Math.abs(s.col - candidate.col)),
        99,
      )
      if (distance > bestDistance) {
        best = candidate
        bestDistance = distance
      }
    }
    if (best === undefined) throw new Error('no seed candidate')
    if (bestDistance === 0) {
      // Every candidate hit a seed: take the first free cell instead.
      best = firstFree(grid) ?? best
    }
    grid[best.row]![best.col] = i
    seeds.push(best)
  }

  const sizes = Array.from({ length: count }, () => 1)
  let free = total - count
  while (free > 0) {
    const rooms = Array.from({ length: count }, (_, i) => i)
    const withDeficit = rooms.filter((i) => sizes[i]! < targets[i]! && hasFreeNeighbour(grid, i))
    const pool = withDeficit.length > 0 ? withDeficit : rooms.filter((i) => hasFreeNeighbour(grid, i))
    const room = pickWeighted(random, pool, (i) => (withDeficit.length > 0 ? targets[i]! - sizes[i]! : 1))
    if (room === undefined) break
    const cell = pickFrontierCell(grid, room, random)
    if (cell === undefined) break
    grid[cell.row]![cell.col] = room
    sizes[room]!++
    free--
  }

  // Cells no room could reach cannot occur on a connected grid, but stay safe.
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) if (grid[row]![col] === -1) grid[row]![col] = 0
  }

  mergeTinyRooms(grid, width, height)
  return renumber(grid)
}

function firstFree(grid: number[][]): { row: number; col: number } | undefined {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row]!.length; col++) if (grid[row]![col] === -1) return { row, col }
  }
  return undefined
}

function neighbours(grid: number[][], row: number, col: number): { row: number; col: number }[] {
  const out: { row: number; col: number }[] = []
  for (const [dr, dc] of STEPS) {
    const r = row + dr
    const c = col + dc
    if (grid[r]?.[c] !== undefined) out.push({ row: r, col: c })
  }
  return out
}

function hasFreeNeighbour(grid: number[][], room: number): boolean {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row]!.length; col++) {
      if (grid[row]![col] !== room) continue
      if (neighbours(grid, row, col).some((n) => grid[n.row]![n.col] === -1)) return true
    }
  }
  return false
}

/** A free cell touching `room`; cells with more neighbours in the room are likelier (blobby, not stringy). */
function pickFrontierCell(
  grid: number[][],
  room: number,
  random: Random,
): { row: number; col: number } | undefined {
  const candidates = new Map<string, { row: number; col: number; touching: number }>()
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row]!.length; col++) {
      if (grid[row]![col] !== room) continue
      for (const n of neighbours(grid, row, col)) {
        if (grid[n.row]![n.col] !== -1) continue
        const key = `${n.row},${n.col}`
        const known = candidates.get(key)
        if (known) known.touching++
        else candidates.set(key, { ...n, touching: 1 })
      }
    }
  }
  return pickWeighted(random, [...candidates.values()], (c) => (c.touching >= 2 ? 3 : 1))
}

/** Rooms below MIN_ROOM_CELLS join the neighbouring room they share most edges with. */
function mergeTinyRooms(grid: number[][], width: number, height: number): void {
  for (;;) {
    const sizes = new Map<number, number>()
    for (const line of grid) for (const id of line) sizes.set(id, (sizes.get(id) ?? 0) + 1)
    const tiny = [...sizes].find(([, size]) => size < MIN_ROOM_CELLS)
    if (!tiny) return
    const [id] = tiny
    const shared = new Map<number, number>()
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        if (grid[row]![col] !== id) continue
        for (const n of neighbours(grid, row, col)) {
          const other = grid[n.row]![n.col]!
          if (other !== id) shared.set(other, (shared.get(other) ?? 0) + 1)
        }
      }
    }
    const target = [...shared].sort((a, b) => b[1] - a[1])[0]?.[0]
    if (target === undefined) return
    for (const line of grid) for (let i = 0; i < line.length; i++) if (line[i] === id) line[i] = target
  }
}

function renumber(grid: number[][]): number[][] {
  const map = new Map<number, number>()
  for (const line of grid) for (const id of line) if (!map.has(id)) map.set(id, map.size)
  return grid.map((line) => line.map((id) => map.get(id)!))
}
