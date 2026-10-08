import { useId, useMemo, type ReactNode } from 'react'
import { CELL_SIZE, type SceneGeometry } from '../scene/geometry.ts'
import { SOLID_COLORS, type Cylinder, type Prim } from './models.ts'
import { shade, type Solid, type SolidObject, solidOf } from './solid.ts'
import { primExtent, projectModel, sortBackToFront } from './project.ts'

export interface SceneSolidsProps {
  objects: readonly SolidObject[]
  /** The flat geometry of the scene (its `project` puts the footprint on screen). */
  geometry: SceneGeometry
  look: 'a2' | 'a3'
  /** Objects that have their own theme art keep it (flat) in every look. */
  themeIcons?: Readonly<Record<string, unknown>>
}

const r1 = (n: number) => Math.round(n * 10) / 10
const FRONT = 0.8
const RIGHT = 0.62
const STROKE = 3

function Poly({ pts, fill }: { pts: [number, number][]; fill: string }) {
  return <polygon points={pts.map((q) => `${r1(q[0])},${r1(q[1])}`).join(' ')} fill={fill} stroke={SOLID_COLORS.ink} strokeWidth={STROKE} strokeLinejoin="round" />
}

function cross(a: [number, number], b: [number, number], c: [number, number]) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
}

/** Convex hull (monotone chain) of the projected rings of a cylinder: its silhouette. */
function hull(points: [number, number][]): [number, number][] {
  const all = [...points].sort((u, w) => u[0] - w[0] || u[1] - w[1])
  const lower: [number, number][] = []
  for (const p of all) {
    while (lower.length > 1 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: [number, number][] = []
  for (const p of [...all].reverse()) {
    while (upper.length > 1 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop()
    upper.push(p)
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

function PrimShape({ prim, look }: { prim: Prim; look: 'a2' | 'a3' }) {
  const P = (x: number, y: number, z: number) => projectModel(look, x, y, z)
  if (prim.kind === 'box') {
    const { x0, y0, x1, y1, z0, z1, color } = prim
    return (
      <>
        <Poly fill={shade(color, FRONT)} pts={[P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)]} />
        <Poly fill={shade(color, RIGHT)} pts={[P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)]} />
        <Poly fill={color} pts={[P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)]} />
      </>
    )
  }
  const ring = (c: Cylinder, z: number) => Array.from({ length: 24 }, (_, t): [number, number] => P(c.x + Math.cos((t * Math.PI) / 12) * c.r, c.y + Math.sin((t * Math.PI) / 12) * c.r, z))
  const lo = ring(prim, prim.z0)
  const hi = ring(prim, prim.z1)
  return (
    <>
      <Poly fill={shade(prim.color, FRONT)} pts={hull([...lo, ...hi])} />
      <Poly fill={prim.color} pts={hi} />
    </>
  )
}

/** The blocks and cylinders of one model, back to front, in model units (for contact sheets and checks; the board uses SceneSolids). */
export function SolidPrims({ prims, look }: { prims: readonly Prim[]; look: 'a2' | 'a3' }) {
  return <>{sortBackToFront(prims, primExtent).map((p, i) => <PrimShape key={i} prim={p} look={look} />)}</>
}

/** A soft ground shadow: the footprint pushed to the lower right in model space (light from the top left). */
function shadowPoints(s: Solid, look: 'a2' | 'a3'): [number, number][] {
  const P = (x: number, y: number) => projectModel(look, x, y, 0)
  return [P(14, 10), P(s.width + 8, 10), P(s.width + 8, s.height + 4), P(14, s.height + 4)]
}

/**
 * The 3D blocks of a scene (looks 'a2' and 'a3'): rugs first, then one soft shadow layer, then the tall objects from back to front, each
 * made of its blocks and cylinders sorted the same way. Every object sits in a group translated to its footprint's top-left corner on
 * screen and scaled from model units (100 per cell) to drawing units; faces are the top (light), the front (darker) and the right (darkest).
 */
export function SceneSolids({ objects, geometry, look, themeIcons }: SceneSolidsProps): ReactNode {
  const filterId = `solid-shadow-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const solids = useMemo(() => {
    const list = objects.map((o) => solidOf(o, themeIcons)).filter((s): s is Solid => s !== null)
    const place = (s: Solid) => {
      const top = Math.min(...s.object.cells.map((c) => c.row))
      const left = Math.min(...s.object.cells.map((c) => c.col))
      const origin = geometry.project(geometry.toPoint(left, top))
      return { origin, left: left * 100, top: top * 100 }
    }
    const withPlace = list.map((s) => ({ s, ...place(s) }))
    const extent = (w: (typeof withPlace)[number]) => ({ x0: w.left, y0: w.top, x1: w.left + w.s.width, y1: w.top + w.s.height, z0: 0, z1: w.s.flat ? 1 : 2 })
    return {
      flat: sortBackToFront(withPlace.filter((w) => w.s.flat), extent),
      tall: sortBackToFront(withPlace.filter((w) => !w.s.flat), extent),
    }
  }, [objects, geometry, themeIcons])
  if (solids.flat.length + solids.tall.length === 0) return null
  const scale = CELL_SIZE / 100
  const group = (w: (typeof solids.flat)[number], body: ReactNode, tag = true) => (
    <g key={w.s.object.id} data-object={tag ? w.s.object.id : undefined} data-solid={tag ? w.s.object.type : undefined} transform={`translate(${r1(w.origin.x)} ${r1(w.origin.y)}) scale(${scale})`}>
      {body}
    </g>
  )
  return (
    <g data-look={look}>
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      {solids.flat.map((w) => group(w, sortBackToFront(w.s.prims, primExtent).map((p, i) => <PrimShape key={i} prim={p} look={look} />)))}
      <g filter={`url(#${filterId})`}>
        {solids.tall.map((w) => group(w, <polygon points={shadowPoints(w.s, look).map((q) => `${r1(q[0])},${r1(q[1])}`).join(' ')} fill="rgba(42,26,16,.24)" />, false))}
      </g>
      {solids.tall.map((w) => group(w, sortBackToFront(w.s.prims, primExtent).map((p, i) => <PrimShape key={i} prim={p} look={look} />)))}
    </g>
  )
}
