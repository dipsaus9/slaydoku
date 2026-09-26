import type { Cell } from '../../engine/model/index.ts'
import { U } from './art/tokens.ts'
import type { Rotation } from './orientation.ts'
import { resolveIcon } from './resolve.ts'
import type { IconObjectType } from './types.ts'

export interface ObjectIconProps {
  type: IconObjectType
  /** The object's cells (grid coordinates are fine; only the shape matters). */
  cells: readonly Cell[]
  /** Preferred facing when several orientations fit; the art faces south at 0. */
  rotation?: Rotation
  mirror?: boolean
}

/**
 * The icon as an SVG group for embedding in a larger SVG. Coordinates are
 * 100 units per cell, origin at the top-left of the footprint's bounding
 * box, so a scene renderer only needs to translate it to the object's
 * top-left cell. Nothing is drawn outside the footprint's cells.
 */
export function ObjectIconGlyph({ type, cells, rotation, mirror }: ObjectIconProps) {
  const icon = resolveIcon(type, cells, { rotation, mirror })
  if (!icon) return null
  const [a, b, c, d, e, f] = icon.matrix
  return (
    <g data-icon={type} data-variant={icon.variant.id} transform={`matrix(${a} ${b} ${c} ${d} ${e} ${f})`}>
      {icon.variant.draw()}
    </g>
  )
}

export interface ObjectIconSvgProps extends ObjectIconProps {
  /** Pixel size of one cell. Defaults to 64. */
  cellSize?: number
  title?: string
}

/** Standalone icon: an `<svg>` exactly as large as the object's bounding box. */
export function ObjectIcon({ cellSize = 64, title, ...props }: ObjectIconSvgProps) {
  const icon = resolveIcon(props.type, props.cells, { rotation: props.rotation, mirror: props.mirror })
  if (!icon) return null
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={icon.cols * cellSize}
      height={icon.rows * cellSize}
      viewBox={`0 0 ${icon.cols * U} ${icon.rows * U}`}
      role="img"
      aria-label={title ?? props.type}
    >
      <ObjectIconGlyph {...props} />
    </svg>
  )
}
