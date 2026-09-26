import type { Cell, EdgeFeature, Scene, Side } from '../../engine/model/index.ts'

/**
 * A unit piece of grid line. Coordinates are grid-line indices, not pixels.
 *
 * - `h` (horizontal): lies on the line `y = line` (0..height) and spans
 *   `x = index .. index + 1`. It separates cell (line - 1, index) from (line, index).
 * - `v` (vertical): lies on the line `x = line` (0..width) and spans
 *   `y = index .. index + 1`. It separates cell (index, line - 1) from (index, line).
 */
export interface GridEdge {
  orientation: 'h' | 'v'
  line: number
  index: number
}

export interface WallEdge extends GridEdge {
  /** True on the outer border of the grid. */
  border: boolean
}

/** A straight run of walls in grid-line coordinates. */
export interface WallSegment {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** The grid edge on the `side` of `cell`. Both neighbours of an inner line give the same edge. */
export function edgeOf(cell: Cell, side: Side): GridEdge {
  switch (side) {
    case 'north':
      return { orientation: 'h', line: cell.row, index: cell.col }
    case 'south':
      return { orientation: 'h', line: cell.row + 1, index: cell.col }
    case 'west':
      return { orientation: 'v', line: cell.col, index: cell.row }
    case 'east':
      return { orientation: 'v', line: cell.col + 1, index: cell.row }
  }
}

export function edgeKey(edge: GridEdge): string {
  return `${edge.orientation}${edge.line}:${edge.index}`
}

export function featureEdge(feature: EdgeFeature): GridEdge {
  return edgeOf(feature.cell, feature.side)
}

function roomAt(scene: Scene, row: number, col: number): string | undefined {
  if (row < 0 || col < 0 || row >= scene.height || col >= scene.width) return undefined
  return scene.cellRooms[row]?.[col]
}

/**
 * Every grid edge that carries a wall: between two cells of different rooms,
 * and every edge on the outer border. Derived purely from the room ids.
 */
export function wallEdges(scene: Scene): WallEdge[] {
  const edges: WallEdge[] = []
  for (let line = 0; line <= scene.height; line++) {
    for (let index = 0; index < scene.width; index++) {
      const above = roomAt(scene, line - 1, index)
      const below = roomAt(scene, line, index)
      if (above !== below) {
        edges.push({ orientation: 'h', line, index, border: line === 0 || line === scene.height })
      }
    }
  }
  for (let line = 0; line <= scene.width; line++) {
    for (let index = 0; index < scene.height; index++) {
      const left = roomAt(scene, index, line - 1)
      const right = roomAt(scene, index, line)
      if (left !== right) {
        edges.push({ orientation: 'v', line, index, border: line === 0 || line === scene.width })
      }
    }
  }
  return edges
}

/** Whether a wall stands on `edge` (true for any border edge of the grid). */
export function hasWall(scene: Scene, edge: GridEdge): boolean {
  return wallEdges(scene).some((w) => edgeKey(w) === edgeKey(edge))
}

/** Wall edges merged into maximal straight runs, so each run draws as one line. */
export function wallSegments(scene: Scene): WallSegment[] {
  const segments: WallSegment[] = []
  const edges = wallEdges(scene)
  for (const orientation of ['h', 'v'] as const) {
    const byLine = new Map<number, number[]>()
    for (const edge of edges) {
      if (edge.orientation !== orientation) continue
      byLine.set(edge.line, [...(byLine.get(edge.line) ?? []), edge.index])
    }
    for (const [line, indices] of [...byLine].sort((a, b) => a[0] - b[0])) {
      indices.sort((a, b) => a - b)
      let start = indices[0] as number
      let prev = start
      const flush = () => {
        segments.push(
          orientation === 'h'
            ? { x1: start, y1: line, x2: prev + 1, y2: line }
            : { x1: line, y1: start, x2: line, y2: prev + 1 },
        )
      }
      for (const index of indices.slice(1)) {
        if (index !== prev + 1) {
          flush()
          start = index
        }
        prev = index
      }
      flush()
    }
  }
  return segments
}
