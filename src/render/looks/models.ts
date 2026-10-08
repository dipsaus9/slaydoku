import type { Matrix } from '../icons/orientation.ts'
import type { IconObjectType } from '../icons/types.ts'

/**
 * Small 3D block models of the SLAY-17.3 prototype (docs/design/looks-prototype.html), ported to TypeScript for the
 * SLAY-17.8 proof of concept. Model space: x to the right, y toward the viewer (south), z up, 100 units per cell. A
 * model is drawn in its canonical orientation (facing south, like the flat art: backs and heads on the north side) and
 * turned with the same matrix the flat icons use.
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
}

export interface Cylinder {
  kind: 'cylinder'
  /** Centre. */
  x: number
  y: number
  r: number
  z0: number
  z1: number
  color: string
}

export type Prim = Box | Cylinder

export interface SolidModel {
  cols: number
  rows: number
  prims: Prim[]
  /** A rug: lies on the floor, so it is drawn before (under) the tall objects and casts no shadow. */
  flat: boolean
}

/** The palette of the prototype (warm, matching the flat art). */
export const SOLID_COLORS = {
  ink: '#29211d',
  white: '#fbfbf8',
  cream: '#f2e9d4',
  creamLight: '#fef7e7',
  wood: '#a2795a',
  woodDark: '#78553d',
  woodDeep: '#5b3f2b',
  gold: '#cea657',
  yellow: '#e1ca73',
  yellowLight: '#ecdc9a',
  green: '#629b62',
  greenLight: '#8dba82',
  terracotta: '#ae644a',
  red: '#c6706d',
  purple: '#ad9bc4',
  sky: '#d1e5eb',
  teal: '#5f8a9a',
  tealLight: '#7fa6b4',
  tealDark: '#41697a',
  rug: '#b5524f',
  rugLight: '#d98b7a',
  blue: '#8eaed0',
  water: '#3f9fd6',
  waterLight: '#8fd3f2',
} as const
const C = SOLID_COLORS

const box = (x: number, y: number, w: number, d: number, z0: number, h: number, color: string): Box => ({
  kind: 'box',
  x0: x,
  y0: y,
  x1: x + w,
  y1: y + d,
  z0,
  z1: z0 + h,
  color,
})
const cyl = (x: number, y: number, r: number, z0: number, h: number, color: string): Cylinder => ({
  kind: 'cylinder',
  x,
  y,
  r,
  z0,
  z1: z0 + h,
  color,
})

/** Four legs under a W x H top. */
function legs(W: number, H: number, z: number, color: string = C.woodDeep): Box[] {
  const y1 = H - 21
  return [box(10, 10, 11, 11, 0, z, color), box(W - 21, 10, 11, 11, 0, z, color), box(10, y1, 11, 11, 0, z, color), box(W - 21, y1, 11, 11, 0, z, color)]
}

function chair(): SolidModel {
  return {
    cols: 1,
    rows: 1,
    flat: false,
    prims: [...legs(100, 100, 30), box(14, 22, 72, 64, 30, 10, C.cream), box(18, 26, 56, 56, 40, 6, C.creamLight), box(10, 8, 80, 13, 34, 44, C.cream)],
  }
}

function rug(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  return {
    cols,
    rows,
    flat: true,
    prims: [box(8, 10, W - 16, H - 20, 0, 3, C.rug), box(22, 24, W - 44, H - 48, 3, 0.8, C.rugLight), box(W / 2 - 16, H / 2 - 12, 32, 24, 3.8, 0.8, C.cream)],
  }
}

function table(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  return { cols, rows, flat: false, prims: [...legs(W, H, 40), box(8, 10, W - 16, H - 20, 40, 10, C.yellow), box(20, 22, W - 40, H - 44, 50, 1.5, C.yellowLight)] }
}

function bookshelf(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [box(6, 6, W - 12, 6, 0, 84, C.woodDeep), box(6, 6, 8, 88, 0, 84, C.wood), box(W - 14, 6, 8, 88, 0, 84, C.wood)]
  for (let s = 0; s < 4; s++) prims.push(box(6, 6, W - 12, 88, s === 3 ? 78 : s * 26, 6, C.wood))
  const books = Math.floor((W - 32) / 13.5)
  const colors = [C.red, C.cream, C.green, C.gold, C.purple, C.sky, '#e4aab8']
  for (let s = 0; s < 3; s++) {
    for (let k = 0; k < books; k++) prims.push(box(16 + k * 13.5, 24, 12, 62, 6 + s * 26, 12 + ((k * 2 + s) % 4) * 2.4, colors[(k + s * 3) % 7]!))
  }
  return { cols, rows: 1, flat: false, prims }
}

function plant(): SolidModel {
  return { cols: 1, rows: 1, flat: false, prims: [cyl(50, 50, 22, 0, 26, C.terracotta), cyl(50, 50, 38, 26, 12, C.green), cyl(50, 50, 27, 38, 12, C.greenLight), cyl(50, 50, 15, 50, 10, C.green)] }
}

/** Back on the north side, an arm at each end, one seat cushion per cell. */
function sofa(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [...legs(W, 100, 8), box(6, 10, W - 12, 84, 8, 22, C.teal)]
  const seat = (W - 64) / cols
  for (let i = 0; i < cols; i++) prims.push(box(32 + i * seat + 1, 38, seat - 2, 54, 30, 10, C.tealLight))
  prims.push(box(6, 10, W - 12, 26, 30, 34, C.tealDark), box(6, 36, 26, 58, 30, 16, C.tealDark), box(W - 32, 36, 26, 58, 30, 16, C.tealDark))
  return { cols, rows: 1, flat: false, prims }
}

/** Head (headboard and pillows) on the north side. */
function bed(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  const prims: Prim[] = [box(6, 4, W - 12, H - 8, 0, 16, C.woodDark), box(12, 10, W - 24, H - 20, 16, 14, C.white)]
  const blanketTop = 10 + (H - 20) * 0.36
  prims.push(box(12, blanketTop, W - 24, H - 10 - blanketTop, 30, 5, C.blue))
  const pw = (W - 24) / cols
  for (let i = 0; i < cols; i++) prims.push(box(12 + i * pw + 6, 16, pw - 12, 34, 30, 9, C.creamLight))
  prims.push(box(6, 4, W - 12, 10, 16, 44, C.wood))
  return { cols, rows, flat: false, prims }
}

/** Not in the app yet (no lamp object kind); kept so the look has it when one arrives. */
export function lamp(): SolidModel {
  return { cols: 1, rows: 1, flat: false, prims: [cyl(50, 50, 22, 0, 6, C.woodDark), cyl(50, 50, 4, 6, 64, C.woodDeep), cyl(50, 50, 30, 70, 24, C.yellowLight), cyl(50, 50, 20, 94, 2, C.yellow)] }
}

/**
 * A bathtub (SLAY-17.8 owner remark: the water must read as water). The prototype's pale slab on a white box did not. Here the tub is hollow: four
 * walls around a basin, the water a saturated blue block that stands lower than the rim (so the inner wall shows above it), with a light
 * surface sheen and foam bubbles on top. Not in the app yet (no bathtub object kind).
 */
export function bathtub(cols = 2, rows = 1): SolidModel {
  const W = cols * 100
  const H = rows * 100
  const wall = 14
  const rim = 36
  const prims: Prim[] = [
    box(6, 8, W - 12, H - 16, 0, 6, C.white),
    box(6, 8, W - 12, wall, 0, rim, C.white),
    box(6, H - 8 - wall, W - 12, wall, 0, rim, C.white),
    box(6, 8, wall, H - 16, 0, rim, C.white),
    box(W - 6 - wall, 8, wall, H - 16, 0, rim, C.white),
    box(6 + wall, 8 + wall, W - 12 - 2 * wall, H - 16 - 2 * wall, 6, 20, C.water),
    box(6 + wall + 8, 8 + wall + 8, W - 12 - 2 * wall - 16, 7, 26, 0.8, C.waterLight),
    box(6 + wall + 24, 8 + wall + 26, 30, 4, 26, 0.8, C.waterLight),
    cyl(W * 0.4, H * 0.55, 6, 26, 2, C.white),
    cyl(W * 0.4 + 14, H * 0.5, 4, 26, 2, C.white),
    cyl(W * 0.4 - 12, H * 0.68, 3.5, 26, 2, C.white),
    box(W - 6 - wall - 2, H / 2 - 10, 16, 20, rim, 12, C.gold),
  ]
  return { cols, rows, flat: false, prims }
}

/**
 * The block model for a footprint variant of an object kind, in canonical orientation, or null when this kind (or this
 * footprint, like the L-shaped sofa) has none and keeps the flat art.
 */
export function solidModel(type: IconObjectType, cols: number, rows: number, variantId: string): SolidModel | null {
  if (variantId.startsWith('L')) return null
  switch (type) {
    case 'chair':
      return cols === 1 && rows === 1 ? chair() : null
    case 'sofa':
      return rows === 1 ? sofa(cols) : null
    case 'bed':
      return bed(cols, rows)
    case 'bookshelf':
      return rows === 1 ? bookshelf(cols) : null
    case 'table':
      return table(cols, rows)
    case 'rug':
      return rug(cols, rows)
    case 'plant':
      return cols === 1 && rows === 1 ? plant() : null
    default:
      return null
  }
}

/** The kinds that have blocks. */
export const SOLID_TYPES: readonly IconObjectType[] = ['chair', 'sofa', 'bed', 'bookshelf', 'table', 'rug', 'plant']

/** Turn a canonical model into its footprint with the flat icon's matrix (100 units per cell, origin at the footprint's top-left). */
export function orientModel(model: SolidModel, matrix: Matrix): Prim[] {
  const [a, b, c, d, e, f] = matrix
  const at = (x: number, y: number): [number, number] => [a * x + c * y + e, b * x + d * y + f]
  return model.prims.map((p): Prim => {
    if (p.kind === 'cylinder') {
      const [x, y] = at(p.x, p.y)
      return { ...p, x, y }
    }
    const [xa, ya] = at(p.x0, p.y0)
    const [xb, yb] = at(p.x1, p.y1)
    return { ...p, x0: Math.min(xa, xb), x1: Math.max(xa, xb), y0: Math.min(ya, yb), y1: Math.max(ya, yb) }
  })
}
