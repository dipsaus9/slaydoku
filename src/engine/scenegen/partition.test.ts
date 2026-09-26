import { describe, expect, it } from 'vitest'
import { MIN_ROOM_CELLS, partitionRooms, roomCountFor } from './partition.ts'
import { createRandom } from './random.ts'

function regions(grid: number[][]): Map<number, { row: number; col: number }[]> {
  const out = new Map<number, { row: number; col: number }[]>()
  grid.forEach((line, row) =>
    line.forEach((id, col) => {
      const list = out.get(id) ?? []
      list.push({ row, col })
      out.set(id, list)
    }),
  )
  return out
}

function connected(cells: { row: number; col: number }[]): boolean {
  const keys = new Set(cells.map((c) => `${c.row},${c.col}`))
  const seen = new Set<string>()
  const todo = [cells[0]!]
  while (todo.length > 0) {
    const c = todo.pop()!
    const key = `${c.row},${c.col}`
    if (seen.has(key) || !keys.has(key)) continue
    seen.add(key)
    todo.push({ row: c.row + 1, col: c.col }, { row: c.row - 1, col: c.col }, { row: c.row, col: c.col + 1 }, { row: c.row, col: c.col - 1 })
  }
  return seen.size === cells.length
}

describe('partitionRooms', () => {
  it('covers the grid with connected rooms of at least the minimum size', () => {
    for (const [width, height] of [[6, 6], [9, 9], [16, 16], [7, 12], [13, 6]] as const) {
      for (let seed = 0; seed < 40; seed++) {
        const random = createRandom(seed)
        const grid = partitionRooms(width, height, roomCountFor(width, height, random), random)
        expect(grid).toHaveLength(height)
        for (const line of grid) expect(line).toHaveLength(width)
        for (const cells of regions(grid).values()) {
          expect(cells.length).toBeGreaterThanOrEqual(MIN_ROOM_CELLS)
          expect(connected(cells)).toBe(true)
        }
      }
    }
  })

  it('numbers rooms 0..n-1 without gaps', () => {
    const random = createRandom(9)
    const grid = partitionRooms(9, 9, 6, random)
    const ids = [...new Set(grid.flat())].sort((a, b) => a - b)
    expect(ids).toEqual(ids.map((_, i) => i))
  })

  it('is deterministic', () => {
    const make = () => partitionRooms(12, 12, 8, createRandom(5))
    expect(make()).toEqual(make())
  })

  it('mixes big and small rooms and mostly non-rectangular shapes on a big grid', () => {
    let nonRect = 0
    let rooms = 0
    let spread = 0
    for (let seed = 0; seed < 30; seed++) {
      const grid = partitionRooms(16, 16, 11, createRandom(seed))
      const sizes: number[] = []
      for (const cells of regions(grid).values()) {
        const rows = cells.map((c) => c.row)
        const cols = cells.map((c) => c.col)
        const box = (Math.max(...rows) - Math.min(...rows) + 1) * (Math.max(...cols) - Math.min(...cols) + 1)
        rooms++
        if (box !== cells.length) nonRect++
        sizes.push(cells.length)
      }
      if (Math.max(...sizes) >= 3 * Math.min(...sizes)) spread++
    }
    expect(nonRect / rooms).toBeGreaterThan(0.6)
    expect(spread).toBeGreaterThanOrEqual(27)
  })
})

describe('roomCountFor', () => {
  it('scales from about 4 (6x6) to about 11 (16x16)', () => {
    const counts = (size: number) =>
      new Set(Array.from({ length: 300 }, (_, i) => roomCountFor(size, size, createRandom(i))))
    expect(Math.min(...counts(6))).toBeGreaterThanOrEqual(4)
    expect(Math.max(...counts(6))).toBeLessThanOrEqual(5)
    expect(Math.min(...counts(9))).toBeGreaterThanOrEqual(5)
    expect(Math.max(...counts(9))).toBeLessThanOrEqual(7)
    expect(Math.min(...counts(16))).toBeGreaterThanOrEqual(10)
    expect(Math.max(...counts(16))).toBeLessThanOrEqual(12)
  })
})
