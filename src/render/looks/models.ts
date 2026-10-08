import type { Matrix } from '../icons/orientation.ts'

/**
 * The block model language of the object art (owner pick A2, docs/design/looks.md: "How to draw a new object"). Model space: x to the
 * right, y toward the viewer (south), z up, 100 units per cell. A model is drawn in its canonical orientation (facing south, like the old flat
 * art: backs, heads and tanks on the north side) and is turned with the same matrix the footprint resolver gives (`orientModel`), in 3D, before
 * it is projected, so a chair turned half a turn shows the back of its backrest.
 */
export interface Box {
  kind: 'box'
  x0: number
  y0: number
  x1: number
  y1: number
  z0: number
  z1: number
  color: string
  /** Outline width in model units (default `LINE`); 0 for a thin decal that must not get a heavy edge. */
  line?: number
}

/** A round post, bowl or pot; `r1` makes it a cone or a bucket (radius at the top). */
export interface Cylinder {
  kind: 'cylinder'
  /** Centre. */
  x: number
  y: number
  r: number
  r1?: number
  z0: number
  z1: number
  color: string
  line?: number
}

/** A ball: shown as a circle with a highlight. */
export interface Sphere {
  kind: 'sphere'
  x: number
  y: number
  z: number
  r: number
  color: string
}

/**
 * A flat round shape standing upright: a porthole, a wheel, a clock face, a speaker. 'xz' faces the viewer (centre x, z, at depth y), 'yz'
 * faces right (centre y, z, at x). `ring` makes it a tyre or a rim of that thickness instead of a full disc.
 */
export interface Disc {
  kind: 'disc'
  plane: 'xz' | 'yz'
  /** Centre; the coordinate across the plane is the position of the plane. */
  x: number
  y: number
  z: number
  r: number
  ring?: number
  color: string
}

export type Prim = Box | Cylinder | Sphere | Disc

export interface SolidModel {
  cols: number
  rows: number
  prims: Prim[]
  /** Lies on the floor (highest point at most `FLAT_Z`): drawn before (under) the tall objects and casts no shadow. */
  flat: boolean
}

/** Default outline width, model units. */
export const LINE = 3
/** An object whose highest point is at most this high lies on the floor. */
export const FLAT_Z = 6

/** The palette (warm, matching the board): the colours of the old flat art plus the shades the blocks need. */
export const COLORS = {
  ink: '#29211d',
  white: '#fbfbf8',
  cream: '#f2e9d4',
  creamLight: '#fef7e7',
  creamDark: '#d8c9a6',
  paper: '#ede2c6',
  wood: '#a2795a',
  woodLight: '#be9f7d',
  woodDark: '#78553d',
  woodDeep: '#5b3f2b',
  gold: '#cea657',
  goldDark: '#a98438',
  yellow: '#e1ca73',
  yellowLight: '#ecdc9a',
  green: '#629b62',
  greenLight: '#8dba82',
  greenDark: '#4a7c51',
  terracotta: '#ae644a',
  terraDark: '#8a4a36',
  soil: '#5a3a2b',
  red: '#c6706d',
  redDark: '#a8514f',
  rug: '#b5524f',
  rugLight: '#d98b7a',
  purple: '#ad9bc4',
  purpleDark: '#907ca8',
  lilac: '#c1b0da',
  pink: '#e4aab8',
  sky: '#d1e5eb',
  skyLight: '#e3eff2',
  blue: '#8eaed0',
  blueDark: '#5b8fd6',
  teal: '#5f8a9a',
  tealLight: '#7fa6b4',
  tealDark: '#41697a',
  steel: '#c4c9d1',
  steelDark: '#8d94a0',
  slate: '#4c4f5b',
  stone: '#d2d4da',
  stoneDark: '#a9acb5',
  slick: '#3b354f',
  sand: '#ecd9a0',
  sandDark: '#d6bd7c',
  board: '#33604c',
  water: '#3f9fd6',
  waterLight: '#8fd3f2',
  glass: '#cfe6f0',
} as const
export const C = COLORS

export const box = (x: number, y: number, w: number, d: number, z0: number, h: number, color: string, line?: number): Box => ({
  kind: 'box',
  x0: x,
  y0: y,
  x1: x + w,
  y1: y + d,
  z0,
  z1: z0 + h,
  color,
  ...(line === undefined ? {} : { line }),
})

export const cyl = (x: number, y: number, r: number, z0: number, h: number, color: string, r1?: number, line?: number): Cylinder => ({
  kind: 'cylinder',
  x,
  y,
  r,
  z0,
  z1: z0 + h,
  color,
  ...(r1 === undefined ? {} : { r1 }),
  ...(line === undefined ? {} : { line }),
})

export const ball = (x: number, y: number, z: number, r: number, color: string): Sphere => ({ kind: 'sphere', x, y, z, r, color })

/** A disc on the south face (plane 'xz', depth `y`) or the east face (plane 'yz', at `x`) of a block. */
export const disc = (plane: Disc['plane'], x: number, y: number, z: number, r: number, color: string, ring?: number): Disc => ({
  kind: 'disc',
  plane,
  x,
  y,
  z,
  r,
  color,
  ...(ring === undefined ? {} : { ring }),
})

/** A thin sheet lying on the top face of a block (a cloth, a screen, a pattern): no outline weight. */
export const onTop = (x: number, y: number, w: number, d: number, z: number, color: string, h = 0.8): Box => box(x, y, w, d, z, h, color, 0)

/** A thin sheet standing on a block's south face at `y` (a door, a screen, a label): no outline weight. */
export const onFront = (x: number, y: number, w: number, z: number, h: number, color: string, t = 0.8): Box => box(x, y, w, t, z, h, color, 0)

/** Four legs under a `W x H` top, `size` units square, set in by `inset`. */
export function legs(W: number, H: number, z: number, color: string = C.woodDeep, size = 11, inset = 10): Box[] {
  return [
    box(inset, inset, size, size, 0, z, color),
    box(W - inset - size, inset, size, size, 0, z, color),
    box(inset, H - inset - size, size, size, 0, z, color),
    box(W - inset - size, H - inset - size, size, size, 0, z, color),
  ]
}

/** Moves a drawing toward the back (negative) or front (positive) of its cell: tall, shallow furniture is drawn at its real depth, centred in the cell. */
export function shiftY(prims: readonly Prim[], dy: number): Prim[] {
  return prims.map((p): Prim => (p.kind === 'box' ? { ...p, y0: p.y0 + dy, y1: p.y1 + dy } : { ...p, y: p.y + dy }))
}

/** A model whose `flat` flag follows from its heights. */
export function model(cols: number, rows: number, prims: Prim[]): SolidModel {
  return { cols, rows, prims, flat: modelHeight(prims) <= FLAT_Z }
}

/** Highest point of a model, model units. */
export const modelHeight = (prims: readonly Prim[]): number =>
  Math.max(...prims.map((p) => (p.kind === 'sphere' ? p.z + p.r : p.kind === 'disc' ? p.z + p.r : p.z1)))

/** `(cols, rows)` to the model of one footprint; `variant` is the footprint id of the registry ('2x1', 'L3'). */
export type ModelBuilder = (cols: number, rows: number, variant: string) => SolidModel

/** Turn a canonical model into its footprint with the matrix of the footprint resolver (100 units per cell, origin at the footprint's top-left). */
export function orientModel(prims: readonly Prim[], matrix: Matrix): Prim[] {
  const [a, b, c, d, e, f] = matrix
  const at = (x: number, y: number): [number, number] => [a * x + c * y + e, b * x + d * y + f]
  return prims.map((p): Prim => {
    if (p.kind === 'box') {
      const [xa, ya] = at(p.x0, p.y0)
      const [xb, yb] = at(p.x1, p.y1)
      return { ...p, x0: Math.min(xa, xb), x1: Math.max(xa, xb), y0: Math.min(ya, yb), y1: Math.max(ya, yb) }
    }
    const [x, y] = at(p.x, p.y)
    // A quarter turn swaps the two planes an upright disc can stand in.
    if (p.kind === 'disc' && a === 0) return { ...p, x, y, plane: p.plane === 'xz' ? 'yz' : 'xz' }
    return { ...p, x, y }
  })
}
