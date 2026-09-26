import type { ReactNode } from 'react'
import type { FloorPattern } from '../roomStyles.ts'

export const PATTERN_TILE: Record<FloorPattern, { width: number; height: number }> = {
  wood: { width: 64, height: 32 },
  tiles: { width: 32, height: 32 },
  grass: { width: 32, height: 32 },
  water: { width: 32, height: 16 },
  stone: { width: 32, height: 32 },
  carpet: { width: 16, height: 16 },
}

/** Own flat patterns, drawn from simple strokes. Tiles repeat on a cell-aligned lattice. */
export function patternContent(pattern: FloorPattern, fill: string, ink: string): ReactNode {
  const stroke = { stroke: ink, strokeWidth: 1.4, fill: 'none', strokeLinecap: 'round' as const }
  switch (pattern) {
    case 'wood':
      return (
        <>
          <rect width="64" height="32" fill={fill} />
          <path d="M0 16H64M0 0H64M20 0V16M52 16V32" {...stroke} />
        </>
      )
    case 'tiles':
      return (
        <>
          <rect width="32" height="32" fill={fill} />
          <rect width="16" height="16" fill={ink} opacity="0.35" />
          <rect x="16" y="16" width="16" height="16" fill={ink} opacity="0.35" />
        </>
      )
    case 'grass':
      return (
        <>
          <rect width="32" height="32" fill={fill} />
          <path d="M6 12l2-5 2 5M22 28l2-5 2 5M24 10l1.5-4 1.5 4M9 30l1.5-4 1.5 4" {...stroke} />
        </>
      )
    case 'water':
      return (
        <>
          <rect width="32" height="16" fill={fill} />
          <path d="M0 8q8-6 16 0t16 0" {...stroke} />
        </>
      )
    case 'stone':
      return (
        <>
          <rect width="32" height="32" fill={fill} />
          <path
            d="M1 1h14v12H1zM17 1h14v12H17zM-7 17h14v14H-7zM9 17h14v14H9zM25 17h14v14H25z"
            {...stroke}
          />
        </>
      )
    case 'carpet':
      return (
        <>
          <rect width="16" height="16" fill={fill} />
          <path d="M0 16L16 0" {...stroke} opacity="0.55" />
        </>
      )
  }
}
