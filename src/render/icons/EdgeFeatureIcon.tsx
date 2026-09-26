import type { EdgeFeatureKind, Side } from '../../engine/model/index.ts'
import { doorArt, EDGE_LENGTH, EDGE_THICKNESS, windowArt } from './art/edges.tsx'

export interface EdgeFeatureIconProps {
  kind: EdgeFeatureKind
  /** Which edge of its cell the feature sits on; north/south run horizontally. */
  side: Side
  /** Pixel length of the grid line the feature sits on (one cell). Defaults to 64. */
  cellSize?: number
}

/**
 * Window or door for a grid line. The svg is one cell long and a fifth of a
 * cell thick; centre it on the line. It carries no wall: the scene renderer
 * owns walls and gaps.
 */
export function EdgeFeatureIcon({ kind, side, cellSize = 64 }: EdgeFeatureIconProps) {
  const vertical = side === 'east' || side === 'west'
  const long = cellSize
  const thick = (cellSize * EDGE_THICKNESS) / EDGE_LENGTH
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={vertical ? thick : long}
      height={vertical ? long : thick}
      viewBox={vertical ? `0 0 ${EDGE_THICKNESS} ${EDGE_LENGTH}` : `0 0 ${EDGE_LENGTH} ${EDGE_THICKNESS}`}
      role="img"
      aria-label={kind}
    >
      <g transform={vertical ? `matrix(0 1 -1 0 ${EDGE_THICKNESS} 0)` : undefined}>
        {kind === 'window' ? windowArt() : doorArt()}
      </g>
    </svg>
  )
}
