import { describe, expect, it } from 'vitest'
import type { Scene } from '../../engine/model/index.ts'
import { tutorialPuzzle } from '../../engine/model/tutorial.fixture.ts'
import { sample9x9 } from './sample.fixture.ts'
import { edgeKey, edgeOf, hasWall, wallEdges, wallSegments, type GridEdge } from './walls.ts'

const tutorial = tutorialPuzzle.scene

function grid(rows: string[]): Scene {
  const ids = [...new Set(rows.join(''))]
  return {
    width: rows[0]?.length ?? 0,
    height: rows.length,
    rooms: ids.map((id) => ({ id, name: id })),
    cellRooms: rows.map((r) => [...r]),
    objects: [],
    edgeFeatures: [],
  }
}

describe('wallEdges', () => {
  it('puts walls on the outer border of a single room and nowhere else', () => {
    const edges = wallEdges(grid(['AAA', 'AAA']))
    expect(edges.every((e) => e.border)).toBe(true)
    // perimeter of a 3x2 grid: 3 + 3 horizontal, 2 + 2 vertical
    expect(edges).toHaveLength(10)
    expect(edges.filter((e) => e.orientation === 'h')).toHaveLength(6)
    expect(edges.filter((e) => e.orientation === 'v')).toHaveLength(4)
  })

  it('puts a wall exactly between cells of different rooms', () => {
    const scene = grid(['AB', 'AA'])
    // A(0,0)|B(0,1): vertical line x=1, row 0
    expect(hasWall(scene, { orientation: 'v', line: 1, index: 0 })).toBe(true)
    // B(0,1) over A(1,1): horizontal line y=1, column 1
    expect(hasWall(scene, { orientation: 'h', line: 1, index: 1 })).toBe(true)
    // A(0,0) over A(1,0) and A(1,0)|A(1,1): same room, no wall
    expect(hasWall(scene, { orientation: 'h', line: 1, index: 0 })).toBe(false)
    expect(hasWall(scene, { orientation: 'v', line: 1, index: 1 })).toBe(false)
  })

  it('marks only border edges as border', () => {
    const inner = wallEdges(grid(['AB', 'AA'])).filter((e) => !e.border)
    expect(inner.map(edgeKey).sort()).toEqual(['h1:1', 'v1:0'])
  })

  it('separates the two tutorial rooms with one full-width wall', () => {
    const inner = wallEdges(tutorial).filter((e) => !e.border)
    expect(inner).toHaveLength(4)
    expect(inner.every((e) => e.orientation === 'h' && e.line === 2)).toBe(true)
    expect(inner.map((e) => e.index).sort()).toEqual([0, 1, 2, 3])
  })

  it('has a wall on every border edge of any scene', () => {
    for (const scene of [tutorial, sample9x9, grid(['ABC'])]) {
      for (let i = 0; i < scene.width; i++) {
        expect(hasWall(scene, { orientation: 'h', line: 0, index: i })).toBe(true)
        expect(hasWall(scene, { orientation: 'h', line: scene.height, index: i })).toBe(true)
      }
      for (let i = 0; i < scene.height; i++) {
        expect(hasWall(scene, { orientation: 'v', line: 0, index: i })).toBe(true)
        expect(hasWall(scene, { orientation: 'v', line: scene.width, index: i })).toBe(true)
      }
    }
  })

  it('agrees with the room ids for every inner edge of the 9x9 sample', () => {
    const rooms = sample9x9.cellRooms
    for (let row = 0; row < 9; row++) {
      for (let col = 1; col < 9; col++) {
        const differs = rooms[row]?.[col - 1] !== rooms[row]?.[col]
        expect(hasWall(sample9x9, { orientation: 'v', line: col, index: row })).toBe(differs)
      }
    }
    for (let row = 1; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const differs = rooms[row - 1]?.[col] !== rooms[row]?.[col]
        expect(hasWall(sample9x9, { orientation: 'h', line: row, index: col })).toBe(differs)
      }
    }
  })
})

describe('wallSegments', () => {
  it('merges collinear edges into one run', () => {
    const segments = wallSegments(grid(['AA', 'BB']))
    expect(segments).toContainEqual({ x1: 0, y1: 1, x2: 2, y2: 1 })
    // inner run + top, bottom, left, right border runs
    expect(segments).toHaveLength(5)
  })

  it('splits a line into runs where the wall stops', () => {
    // wall at y=1 only under column 0 and column 2
    const segments = wallSegments(grid(['AAA', 'BAB'])).filter((s) => s.y1 === 1 && s.y2 === 1)
    expect(segments).toEqual([
      { x1: 0, y1: 1, x2: 1, y2: 1 },
      { x1: 2, y1: 1, x2: 3, y2: 1 },
    ])
  })

  it('covers exactly the same length as the unit edges', () => {
    for (const scene of [tutorial, sample9x9]) {
      const length = wallSegments(scene).reduce(
        (sum, s) => sum + Math.abs(s.x2 - s.x1) + Math.abs(s.y2 - s.y1),
        0,
      )
      expect(length).toBe(wallEdges(scene).length)
    }
  })
})

describe('edgeOf', () => {
  it('gives both neighbours of an inner line the same edge', () => {
    const a: GridEdge = edgeOf({ row: 1, col: 2 }, 'south')
    const b: GridEdge = edgeOf({ row: 2, col: 2 }, 'north')
    expect(a).toEqual(b)
    expect(edgeOf({ row: 3, col: 1 }, 'east')).toEqual(edgeOf({ row: 3, col: 2 }, 'west'))
  })
})
