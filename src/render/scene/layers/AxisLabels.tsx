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
        const c = geometry.axisPoint('row', row)
        return (
          <text key={`r${row}`} data-axis="row" x={c.x} y={c.y} {...common}>
            {`R${row + 1}`}
          </text>
        )
      })}
      {cols.map((col) => {
        const c = geometry.axisPoint('col', col)
        return (
          <text key={`c${col}`} data-axis="col" x={c.x} y={c.y} {...common}>
            {`C${col + 1}`}
          </text>
        )
      })}
    </g>
  )
}
