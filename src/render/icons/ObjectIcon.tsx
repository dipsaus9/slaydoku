import { createContext, useContext, useId, type ReactNode } from 'react'
import type { Cell } from '../../engine/model/index.ts'
import { U } from './art/tokens.ts'
import type { Rotation } from './orientation.ts'
import { resolveIcon } from './resolve.ts'
import type { IconObjectType } from './types.ts'

/**
 * The approved depth look (owner, 2026-10-03, depth 55/100; docs/design/depth-prototype.html).
 * Light comes from the top-left, the ground shadow falls to the bottom-right.
 */
// oxlint-disable-next-line react/only-export-components -- a constant shared with the tests
export const ICON_DEPTH_FILTER = {
  /** How far the silhouette is shifted to cut the light and shade rims out of it. */
  bevel: 2.9,
  rimLight: { color: '#ffffff', opacity: 0.48, blur: 0.8 },
  innerShade: { color: '#2a1a10', opacity: 0.27, blur: 1 },
  groundShadow: { color: '#2a1a10', opacity: 0.29, blur: 2.6, dx: 2.4, dy: 5.3 },
  region: { x: '-25%', y: '-25%', width: '160%', height: '175%' },
} as const

const DepthFilterId = createContext<string | null>(null)

/** The depth filter chain of the prototype's `filterDef`; bounding-box region, so it fits every object. */
function IconDepthFilter({ id }: { id: string }) {
  const { bevel, rimLight, innerShade, groundShadow, region } = ICON_DEPTH_FILTER
  return (
    <filter id={id} {...region} colorInterpolationFilters="sRGB">
      <feOffset in="SourceAlpha" dx={bevel} dy={bevel} result="dr" />
      <feComposite in="SourceAlpha" in2="dr" operator="out" result="rimTL" />
      <feGaussianBlur in="rimTL" stdDeviation={rimLight.blur} result="rimTLb" />
      <feFlood floodColor={rimLight.color} floodOpacity={rimLight.opacity} />
      <feComposite in2="rimTLb" operator="in" result="hi" />
      <feOffset in="SourceAlpha" dx={-bevel} dy={-bevel} result="ul" />
      <feComposite in="SourceAlpha" in2="ul" operator="out" result="rimBR" />
      <feGaussianBlur in="rimBR" stdDeviation={innerShade.blur} result="rimBRb" />
      <feFlood floodColor={innerShade.color} floodOpacity={innerShade.opacity} />
      <feComposite in2="rimBRb" operator="in" result="sh" />
      <feGaussianBlur in="SourceAlpha" stdDeviation={groundShadow.blur} result="gb" />
      <feOffset in="gb" dx={groundShadow.dx} dy={groundShadow.dy} result="go" />
      <feFlood floodColor={groundShadow.color} floodOpacity={groundShadow.opacity} />
      <feComposite in2="go" operator="in" result="gs" />
      <feMerge>
        <feMergeNode in="gs" />
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="hi" />
        <feMergeNode in="sh" />
      </feMerge>
    </filter>
  )
}

/**
 * Put this once inside every rendered SVG that draws object icons (board, legend swatch, contact
 * sheet tile): it defines the depth filter one time and every glyph below it points at it.
 * Glyphs outside a scope draw flat.
 */
export function IconDepthScope({ children }: { children: ReactNode }) {
  const id = `icon-depth-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <DepthFilterId.Provider value={id}>
      <defs>
        <IconDepthFilter id={id} />
      </defs>
      {children}
    </DepthFilterId.Provider>
  )
}

/**
 * The filter sits OUTSIDE the art's orientation transform, so it works in screen space: light and
 * shadow stay top-left and bottom-right whatever the rotation or mirror.
 */
export function IconDepthGroup({ children }: { children: ReactNode }) {
  const id = useContext(DepthFilterId)
  return (
    <g data-depth={id ? '' : undefined} filter={id ? `url(#${id})` : undefined}>
      {children}
    </g>
  )
}

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
    <IconDepthGroup>
      <g data-icon={type} data-variant={icon.variant.id} transform={`matrix(${a} ${b} ${c} ${d} ${e} ${f})`}>
        {icon.variant.draw()}
      </g>
    </IconDepthGroup>
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
      <IconDepthScope>
        <ObjectIconGlyph {...props} />
      </IconDepthScope>
    </svg>
  )
}
