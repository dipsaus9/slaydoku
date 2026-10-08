import { useId, type ReactNode } from 'react'
import { LINE, type Box, type Cylinder, type Disc, type Prim, type Sphere } from './models.ts'
import { primExtent, projectModel, sortBackToFront } from './project.ts'
import type { Solid } from './solid.ts'
import { shade, shadowRects, solidBounds } from './solidGeometry.ts'

/** Light from the top left: the top face keeps the colour, the front face is 80 percent of it, the right face 62 percent. */
const FRONT = 0.8
const RIGHT = 0.62
const INK = '#29211d'

const r1 = (n: number) => Math.round(n * 10) / 10
type Pt = [number, number]
const pts = (list: Pt[]) => list.map((q) => `${r1(q[0])},${r1(q[1])}`).join(' ')

function Poly({ points, fill, line = LINE }: { points: Pt[]; fill: string; line?: number }) {
  return <polygon points={pts(points)} fill={fill} stroke={line > 0 ? INK : 'none'} strokeWidth={line} strokeLinejoin="round" />
}

function cross(a: Pt, b: Pt, c: Pt) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
}

/** Convex hull (monotone chain) of the projected rings of a cylinder: its silhouette. */
function hull(points: Pt[]): Pt[] {
  const all = [...points].sort((u, w) => u[0] - w[0] || u[1] - w[1])
  const lower: Pt[] = []
  for (const p of all) {
    while (lower.length > 1 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: Pt[] = []
  for (const p of [...all].reverse()) {
    while (upper.length > 1 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop()
    upper.push(p)
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

const P = projectModel
const SEGMENTS = 24
const BEVEL = 4

function BoxShape({ box }: { box: Box }) {
  const { x0, y0, x1, y1, z0, z1, color, line } = box
  // A solid block gets a pale line just inside its top edge: a bevel that keeps a big top from reading as a flat patch.
  const bevel = line !== 0 && z1 - z0 >= 4 && x1 - x0 >= 22 && y1 - y0 >= 22
  return (
    <>
      <Poly line={line} fill={shade(color, FRONT)} points={[P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)]} />
      <Poly line={line} fill={shade(color, RIGHT)} points={[P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)]} />
      <Poly line={line} fill={color} points={[P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)]} />
      {bevel ? <polygon points={pts([P(x0 + BEVEL, y0 + BEVEL, z1), P(x1 - BEVEL, y0 + BEVEL, z1), P(x1 - BEVEL, y1 - BEVEL, z1), P(x0 + BEVEL, y1 - BEVEL, z1)])} fill="none" stroke="#ffffff" strokeOpacity={0.32} strokeWidth={1.4} strokeLinejoin="round" /> : null}
    </>
  )
}

function CylinderShape({ cyl }: { cyl: Cylinder }) {
  const ring = (r: number, z: number): Pt[] =>
    Array.from({ length: SEGMENTS }, (_, t) => P(cyl.x + Math.cos((t * 2 * Math.PI) / SEGMENTS) * r, cyl.y + Math.sin((t * 2 * Math.PI) / SEGMENTS) * r, z))
  const lo = ring(cyl.r, cyl.z0)
  const hi = ring(cyl.r1 ?? cyl.r, cyl.z1)
  return (
    <>
      <Poly line={cyl.line} fill={shade(cyl.color, FRONT)} points={hull([...lo, ...hi])} />
      <Poly line={cyl.line} fill={cyl.color} points={hi} />
    </>
  )
}

function SphereShape({ ball }: { ball: Sphere }) {
  const [cx, cy] = P(ball.x, ball.y, ball.z)
  const r = ball.r
  return (
    <>
      <circle cx={r1(cx)} cy={r1(cy)} r={r} fill={shade(ball.color, RIGHT + 0.1)} stroke={INK} strokeWidth={LINE} />
      <circle cx={r1(cx - r * 0.14)} cy={r1(cy - r * 0.16)} r={r1(r * 0.72)} fill={ball.color} />
    </>
  )
}

function DiscShape({ disc }: { disc: Disc }) {
  const { plane, x, y, z, r, ring, color } = disc
  const at = (a: number): Pt => (plane === 'xz' ? P(x + Math.cos(a) * r, y, z + Math.sin(a) * r) : P(x, y + Math.cos(a) * r, z + Math.sin(a) * r))
  const outline = Array.from({ length: SEGMENTS }, (_, t) => at((t * 2 * Math.PI) / SEGMENTS))
  const fill = shade(color, plane === 'xz' ? FRONT : RIGHT)
  if (ring === undefined) return <polygon points={pts(outline)} fill={fill} stroke={INK} strokeWidth={LINE * 0.7} strokeLinejoin="round" />
  return <polygon points={pts(outline)} fill="none" stroke={fill} strokeWidth={ring} strokeLinejoin="round" />
}

function PrimShape({ prim }: { prim: Prim }) {
  switch (prim.kind) {
    case 'box':
      return <BoxShape box={prim} />
    case 'cylinder':
      return <CylinderShape cyl={prim} />
    case 'sphere':
      return <SphereShape ball={prim} />
    case 'disc':
      return <DiscShape disc={prim} />
  }
}

/** The blocks, cylinders, balls and discs of one object, back to front, in model units (100 per cell, origin at the footprint's top-left). */
export function SolidPrims({ prims }: { prims: readonly Prim[] }) {
  return <>{sortBackToFront(prims, primExtent).map((p, i) => <PrimShape key={i} prim={p} />)}</>
}

/** Softens the shadow. One definition per drawing, shared by every object in it. */
export function ShadowFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-20%" y="-20%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="2.4" />
    </filter>
  )
}

/** The shadow rectangles of one object, to sit inside a group that carries the blur filter. */
export function SolidShadow({ solid }: { solid: Pick<Solid, 'cells'> }): ReactNode {
  return (
    <g fill="#2a1a10" opacity={0.26}>
      {shadowRects(solid).map((q, i) => (
        <rect key={i} x={r1(q.x)} y={r1(q.y)} width={q.w} height={q.h} rx={6} />
      ))}
    </g>
  )
}

export interface SolidGlyphProps {
  solid: Solid
}

/**
 * One object on its own (the legend swatch, the contact sheet): shadow, then blocks. In model units with the footprint's top-left at 0,0.
 * The board draws its objects with SceneObjectIcons, which adds the room clip.
 */
export function SolidGlyph({ solid }: SolidGlyphProps) {
  const filterId = `solid-shadow-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <g data-solid={solid.key} data-icon={solid.themeIcon ? undefined : solid.key} data-theme-icon={solid.themeIcon}>
      {solid.flat ? null : (
        <>
          <defs>
            <ShadowFilter id={filterId} />
          </defs>
          <g filter={`url(#${filterId})`}>
            <SolidShadow solid={solid} />
          </g>
        </>
      )}
      <SolidPrims prims={solid.prims} />
    </g>
  )
}


export interface SolidSvgProps {
  solid: Solid
  /** Pixels per cell: the size of the drawing on screen (the board draws 64 per cell at full width, about 36 on a phone). Omit for a CSS-sized svg. */
  pxPerCell?: number
  /** Dashed squares under the object, for contact sheets. */
  showCells?: boolean
  className?: string
  title?: string
}

/** Padding around the drawing's bounds, model units. */
const SVG_PAD = 3

/**
 * One object in an svg of its own, cropped to what it covers (blocks, outline and shadow), so a swatch or a tile never clips a tall block or its
 * shadow whatever the size of the object. Used by the Legend and the contact sheets.
 */
export function SolidSvg({ solid, pxPerCell, showCells = false, className, title }: SolidSvgProps) {
  const b = solidBounds(solid)
  const x0 = b.x0 - SVG_PAD
  const y0 = b.y0 - SVG_PAD
  const w = b.x1 - b.x0 + 2 * SVG_PAD
  const h = b.y1 - b.y0 + 2 * SVG_PAD
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox={`${r1(x0)} ${r1(y0)} ${r1(w)} ${r1(h)}`}
      width={pxPerCell ? r1((w * pxPerCell) / 100) : undefined}
      height={pxPerCell ? r1((h * pxPerCell) / 100) : undefined}
      preserveAspectRatio="xMidYMid meet"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {showCells
        ? solid.cells.map((c) => <rect key={`${c.row}-${c.col}`} x={c.col * 100} y={c.row * 100} width={100} height={100} fill="rgba(255,255,255,.7)" stroke="#b9b2a0" strokeWidth={1.5} strokeDasharray="6 5" />)
        : null}
      <SolidGlyph solid={solid} />
    </svg>
  )
}
