import type { Cell, Scene } from '../../engine/model/index.ts'
import type { SceneGeometry } from '../scene/geometry.ts'

const r1 = (n: number) => Math.round(n * 10) / 10

const key = (c: Cell) => `${c.row}:${c.col}`

/**
 * The squares an object may draw on: its own squares, and a neighbouring square (4 sides) only when it belongs to the same room, a diagonal
 * one only when both squares beside it do as well. So a block can rise over, or cast its shadow on, the free floor of its own room, never
 * over a wall, never into another room and never round the corner of a wall into a square that only touches the object diagonally.
 * Outside the grid nothing is allowed: a block that reaches the outer wall is cut there like at any other wall.
 */
export function allowedCells(cells: readonly Cell[], cellRooms: Scene['cellRooms']): Cell[] {
  const first = cells[0]
  if (!first) return []
  const room = cellRooms[first.row]?.[first.col]
  const same = (c: Cell) => room !== undefined && cellRooms[c.row]?.[c.col] === room
  const out = new Map<string, Cell>(cells.map((c) => [key(c), c]))
  for (const c of cells) {
    for (const dr of [-1, 0, 1]) {
      for (const dc of [-1, 0, 1]) {
        if (dr === 0 && dc === 0) continue
        const n = { row: c.row + dr, col: c.col + dc }
        const ok = dr === 0 || dc === 0 ? same(n) : same(n) && same({ row: c.row + dr, col: c.col }) && same({ row: c.row, col: c.col + dc })
        if (ok) out.set(key(n), n)
      }
    }
  }
  return [...out.values()]
}

/** Path data (viewBox units) of the squares an object may draw on, for a `clipPath`. */
export function objectClipPath(cells: readonly Cell[], cellRooms: Scene['cellRooms'], geometry: SceneGeometry): string {
  return allowedCells(cells, cellRooms)
    .map((cell) => {
      const r = geometry.cellRect(cell)
      return `M${r1(r.x)} ${r1(r.y)}H${r1(r.x + r.width)}V${r1(r.y + r.height)}H${r1(r.x)}Z`
    })
    .join('')
}
