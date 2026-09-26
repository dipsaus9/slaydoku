import { GRID_LINE_WIDTH } from '../geometry.ts'
import type { SceneGeometry } from '../geometry.ts'
import { THEME } from '../theme.ts'

/** Thin lines between every pair of cells. Walls draw over them. */
export function GridLines({ geometry }: { geometry: SceneGeometry }) {
  const { columns, rows, toPoint } = geometry
  const parts: string[] = []
  for (let line = 1; line < rows; line++) {
    const a = toPoint(0, line)
    const b = toPoint(columns, line)
    parts.push(`M${a.x} ${a.y}L${b.x} ${b.y}`)
  }
  for (let line = 1; line < columns; line++) {
    const a = toPoint(line, 0)
    const b = toPoint(line, rows)
    parts.push(`M${a.x} ${a.y}L${b.x} ${b.y}`)
  }
  return (
    <path
      data-layer="grid"
      d={parts.join('')}
      stroke={THEME.grid}
      strokeWidth={GRID_LINE_WIDTH}
      fill="none"
    />
  )
}
