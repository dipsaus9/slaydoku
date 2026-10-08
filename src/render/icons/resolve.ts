import type { Cell } from '../../engine/model/index.ts'
import {
  ORIENTATIONS,
  boundingSize,
  footprintKey,
  normalizeCells,
  orientCells,
  orientationMatrix,
  type Matrix,
  type Orientation,
  type Rotation,
} from './orientation.ts'
import { ICON_DEFINITIONS, type IconVariant } from './registry.tsx'
import type { IconObjectType } from './types.ts'

export interface ResolvedIcon<V extends IconVariant = IconVariant> {
  variant: V
  orientation: Orientation
  /** Size in cells of the oriented footprint's bounding box. */
  cols: number
  rows: number
  /** Canonical art units (100 per cell) to oriented art units. */
  matrix: Matrix
  /** Footprint cells relative to the bounding box, row-major. */
  cells: Cell[]
}

export interface OrientationPreference {
  rotation?: Rotation
  mirror?: boolean
}

/** Footprints (canonical orientation) an object type can be drawn at. */
export function iconFootprints(type: IconObjectType): IconVariant[] {
  return ICON_DEFINITIONS[type].variants
}

/**
 * Find the art for an object of `type` covering `cells`. Matches any variant
 * under some rotation/mirror. When several orientations fit (a 2x1 desk
 * turned 90 or 270 degrees), `prefer` picks the one facing the wanted way;
 * otherwise the first fit wins. Returns undefined when no footprint matches.
 */
export function resolveIcon(
  type: IconObjectType,
  cells: readonly Cell[],
  prefer: OrientationPreference = {},
): ResolvedIcon | undefined {
  return resolveVariant(ICON_DEFINITIONS[type].variants, cells, prefer)
}

/** The matching of {@link resolveIcon}, over any list of footprint variants (theme icons use it too). Generic over the variant
 * type, so a caller with richer variants (the seasonal drafts of `tools/seasonal-previews.tsx` carry `draw`) keeps them typed. */
export function resolveVariant<V extends IconVariant>(
  variants: readonly V[],
  cells: readonly Cell[],
  prefer: OrientationPreference = {},
): ResolvedIcon<V> | undefined {
  if (cells.length === 0) return undefined
  const normal = normalizeCells(cells)
  const key = footprintKey(normal)
  const size = boundingSize(normal)
  const orientations = [...ORIENTATIONS].sort((a, b) => score(a, prefer) - score(b, prefer))
  for (const variant of variants) {
    if (variant.cells.length !== normal.length) continue
    for (const orientation of orientations) {
      const turned = orientCells(variant.cells, variant.cols, variant.rows, orientation)
      if (footprintKey(turned) !== key) continue
      const m = orientationMatrix(variant.cols, variant.rows, orientation)
      return {
        variant,
        orientation,
        cols: size.cols,
        rows: size.rows,
        // The matrix works in cells; art is 100 units per cell.
        matrix: [m[0], m[1], m[2], m[3], m[4] * 100, m[5] * 100],
        cells: turned,
      }
    }
  }
  return undefined
}

export function hasIcon(type: IconObjectType, cells: readonly Cell[]): boolean {
  return resolveIcon(type, cells) !== undefined
}

function score(o: Orientation, prefer: OrientationPreference): number {
  let s = o.mirror ? 1 : 0
  if (prefer.mirror !== undefined && o.mirror !== prefer.mirror) s += 10
  if (prefer.rotation !== undefined && o.rotation !== prefer.rotation) s += 20
  return s
}
