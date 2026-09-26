import type { MouseEvent } from 'react'
import type { Cell } from '../../../engine/model/index.ts'
import { cellLabel, type SceneGeometry } from '../geometry.ts'

export interface HitLayerProps {
  geometry: SceneGeometry
  onCellClick?: (cell: Cell, event: MouseEvent<SVGRectElement>) => void
}

/** One invisible rect per cell, on top of everything, carrying `data-row` / `data-col`. */
export function HitLayer({ geometry, onCellClick }: HitLayerProps) {
  const rects = []
  for (let row = 0; row < geometry.rows; row++) {
    for (let col = 0; col < geometry.columns; col++) {
      const cell = { row, col }
      const r = geometry.cellRect(cell)
      rects.push(
        <rect
          key={`${row},${col}`}
          data-row={row}
          data-col={col}
          data-cell={cellLabel(cell)}
          x={r.x}
          y={r.y}
          width={r.width}
          height={r.height}
          fill="transparent"
          style={onCellClick ? { cursor: 'pointer' } : undefined}
          onClick={onCellClick ? (event) => onCellClick(cell, event) : undefined}
        />,
      )
    }
  }
  return <g data-layer="hit">{rects}</g>
}
