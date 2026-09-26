import type { SceneGeometry } from '../geometry.ts'
import { THEME } from '../theme.ts'

/** R1..Rn down the left side, C1..Cn along the top. */
export function AxisLabels({ geometry }: { geometry: SceneGeometry }) {
  const rows = Array.from({ length: geometry.rows }, (_, i) => i)
  const cols = Array.from({ length: geometry.columns }, (_, i) => i)
  const common = {
    fontFamily: THEME.fontFamily,
    fontWeight: 700,
    fontSize: 14,
    fill: THEME.axisInk,
    textAnchor: 'middle' as const,
    dominantBaseline: 'central' as const,
  }
  return (
    <g data-layer="axis-labels" pointerEvents="none">
      {rows.map((row) => {
        const c = geometry.cellCenter({ row, col: 0 })
        return (
          <text key={`r${row}`} data-axis="row" x={geometry.origin.x - 18} y={c.y} {...common}>
            {`R${row + 1}`}
          </text>
        )
      })}
      {cols.map((col) => {
        const c = geometry.cellCenter({ row: 0, col })
        return (
          <text key={`c${col}`} data-axis="col" x={c.x} y={geometry.origin.y - 18} {...common}>
            {`C${col + 1}`}
          </text>
        )
      })}
    </g>
  )
}
