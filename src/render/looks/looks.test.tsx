import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { OBJECT_TYPES } from '../../engine/model/index.ts'
import { ORIENTATIONS, orientCells } from '../icons/orientation.ts'
import { ICON_DEFINITIONS } from '../icons/registry.tsx'
import { THEME_ICON_DEFINITIONS } from '../icons/themes/registry.ts'
import { THEME_ICON_IDS } from '../icons/themes/types.ts'
import { HEADROOM, MAX_Z, RISE, SKEW, projectModel, sortBackToFront } from './project.ts'
import { COLORS, modelHeight, orientModel, type Prim } from './models.ts'
import { bathtub } from './modelsHouse.ts'
import { ENGINE_MODELS, MODEL_ONLY, THEME_MODELS, solidModelFor } from './registry.ts'
import { SolidSvg } from './Solids.tsx'
import { solidBounds } from './solidGeometry.ts'
import { solidFor, solidOf } from './solid.ts'

/** Footprint of a primitive, model units. */
function footprintOf(p: Prim): { x0: number; x1: number; y0: number; y1: number } {
  switch (p.kind) {
    case 'box':
      return p
    case 'cylinder':
      return { x0: p.x - Math.max(p.r, p.r1 ?? 0), x1: p.x + Math.max(p.r, p.r1 ?? 0), y0: p.y - Math.max(p.r, p.r1 ?? 0), y1: p.y + Math.max(p.r, p.r1 ?? 0) }
    case 'sphere':
      return { x0: p.x - p.r, x1: p.x + p.r, y0: p.y - p.r, y1: p.y + p.r }
    case 'disc':
      return p.plane === 'xz' ? { x0: p.x - p.r, x1: p.x + p.r, y0: p.y, y1: p.y } : { x0: p.x, x1: p.x, y0: p.y - p.r, y1: p.y + p.r }
  }
}

const allVariants = [
  ...OBJECT_TYPES.flatMap((type) => ICON_DEFINITIONS[type].variants.map((variant) => ({ key: type as string, variant }))),
  ...THEME_ICON_IDS.flatMap((id) => THEME_ICON_DEFINITIONS[id].variants.map((variant) => ({ key: id as string, variant }))),
]

describe('projection', () => {
  it('is the oblique view of the owner pick: the floor stays square, height moves up and a little left', () => {
    expect(projectModel(30, 40, 0)).toEqual([30, 40])
    expect(projectModel(30, 40, 100)).toEqual([30 - 100 * SKEW, 40 - 100 * RISE])
  })

  it('leaves headroom for the tallest block the models may use', () => {
    const rise = MAX_Z * RISE * 0.64
    expect(HEADROOM).toBeGreaterThanOrEqual(Math.floor(rise))
    expect(HEADROOM).toBeLessThanOrEqual(Math.ceil(rise) + 1)
  })
})

describe('block models', () => {
  it('has a model for every footprint of every engine type and every theme-only drawing', () => {
    expect(Object.keys(ENGINE_MODELS).sort()).toEqual([...OBJECT_TYPES].sort())
    expect(Object.keys(THEME_MODELS).sort()).toEqual([...THEME_ICON_IDS].sort())
    for (const { key, variant } of allVariants) expect(solidModelFor(key, variant.cols, variant.rows, variant.id), `${key} ${variant.id}`).not.toBeNull()
  })

  it('keeps every block inside its footprint box and below the headroom height', () => {
    for (const { key, variant } of allVariants) {
      const model = solidModelFor(key, variant.cols, variant.rows, variant.id)!
      expect(model.cols, key).toBe(variant.cols)
      expect(model.rows, key).toBe(variant.rows)
      for (const p of model.prims) {
        const f = footprintOf(p)
        expect(f.x0, `${key} ${variant.id}`).toBeGreaterThanOrEqual(0)
        expect(f.y0, `${key} ${variant.id}`).toBeGreaterThanOrEqual(0)
        expect(f.x1, `${key} ${variant.id}`).toBeLessThanOrEqual(variant.cols * 100)
        expect(f.y1, `${key} ${variant.id}`).toBeLessThanOrEqual(variant.rows * 100)
      }
      expect(modelHeight(model.prims), `${key} ${variant.id} height`).toBeLessThanOrEqual(MAX_Z)
    }
  })

  it('turns every footprint in all 8 orientations into blocks that stay inside the turned footprint', () => {
    for (const { key, variant } of allVariants) {
      const model = solidModelFor(key, variant.cols, variant.rows, variant.id)!
      for (const o of ORIENTATIONS) {
        const cells = variant.cells
        const solid = solidFor(key in ENGINE_MODELS ? (key as never) : 'chair', key in THEME_MODELS ? (key as never) : undefined, orientCellsOf(variant, o), o)
        expect(solid, `${key} ${variant.id} ${o.rotation}${o.mirror ? 'm' : ''}`).not.toBeNull()
        expect(solid!.prims.length).toBe(model.prims.length)
        for (const p of solid!.prims) {
          const f = footprintOf(p)
          expect(f.x0).toBeGreaterThanOrEqual(-0.001)
          expect(f.y0).toBeGreaterThanOrEqual(-0.001)
          expect(f.x1).toBeLessThanOrEqual(solid!.width + 0.001)
          expect(f.y1).toBeLessThanOrEqual(solid!.height + 0.001)
        }
        expect(cells.length).toBe(solid!.cells.length)
      }
    }
  })

  it('draws a rug flat and everything that stands on legs higher than that', () => {
    const rug = solidModelFor('rug', 2, 1, '2x1')!
    expect(rug.flat).toBe(true)
    expect(modelHeight(rug.prims)).toBeLessThanOrEqual(6)
    for (const kind of ['table', 'bookshelf', 'chair', 'wardrobe']) expect(solidModelFor(kind, 1, 1, '1x1')!.flat, kind).toBe(false)
  })

  it('makes the bathtub water a saturated blue standing below the rim, with a light surface and foam, not a pale slab', () => {
    const tub = bathtub()
    const rim = Math.max(...tub.prims.filter((p) => p.kind === 'box' && p.color === COLORS.white).map((p) => (p as { z1: number }).z1))
    const water = tub.prims.find((p) => p.color === COLORS.water) as { z1: number }
    expect(water.z1).toBeLessThan(rim)
    expect(tub.prims.some((p) => p.color === COLORS.waterLight)).toBe(true)
    expect(tub.prims.filter((p) => p.kind === 'sphere' && p.color === COLORS.white).length).toBeGreaterThanOrEqual(3)
    const r = Number.parseInt(COLORS.water.slice(1, 3), 16)
    const b = Number.parseInt(COLORS.water.slice(5, 7), 16)
    expect(b - r).toBeGreaterThan(100)
    expect(Object.keys(MODEL_ONLY)).toContain('bathtub')
  })

  it('shows the water of the bubble bath the same way', () => {
    const bath = solidModelFor('bubbleBath', 2, 1, '2x1')!
    expect(bath.prims.some((p) => p.color === COLORS.water)).toBe(true)
    expect(bath.prims.some((p) => p.color === COLORS.waterLight)).toBe(true)
  })
})

const orientCellsOf = (variant: { cells: { row: number; col: number }[]; cols: number; rows: number }, o: (typeof ORIENTATIONS)[number]) => orientCells(variant.cells, variant.cols, variant.rows, o)

describe('what the board shows when several turns fit', () => {
  it('puts the front toward the viewer on a wide footprint and toward the right on a tall one', () => {
    const wide = solidOf({ id: 'w', type: 'wardrobe', cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] })!
    const tall = solidOf({ id: 't', type: 'wardrobe', cells: [{ row: 0, col: 0 }, { row: 1, col: 0 }] })!
    // A door is a thin sheet on the front: thin in y when the front faces south, thin in x when it faces east.
    const door = (prims: Prim[]) => prims.find((p) => p.kind === 'box' && p.color === COLORS.woodLight && p.line === 0) as Extract<Prim, { kind: 'box' }>
    expect(door(wide.prims).y1 - door(wide.prims).y0).toBeLessThan(1)
    expect(door(wide.prims).y0).toBeGreaterThan(50)
    expect(door(tall.prims).x1 - door(tall.prims).x0).toBeLessThan(1)
    expect(door(tall.prims).x0).toBeGreaterThan(50)
    expect(tall.width).toBe(100)
    expect(tall.height).toBe(200)
  })

  it('orients a model with the footprint matrix and keeps a flat sheet flat', () => {
    const model = solidModelFor('rug', 2, 1, '2x1')!
    const turned = orientModel(model.prims, [0, 1, -1, 0, 100, 0])
    for (const p of turned) {
      const f = footprintOf(p)
      expect(f.x1).toBeLessThanOrEqual(100.001)
      expect(f.y1).toBeLessThanOrEqual(200.001)
    }
  })
})

describe('painter order', () => {
  it('draws what lies behind first, left of and below first, for a camera at the front right above', () => {
    const box = (x0: number, y0: number, x1: number, y1: number) => ({ x0, y0, x1, y1, z0: 0, z1: 2 })
    const front = box(0, 100, 100, 200)
    const back = box(0, 0, 100, 100)
    expect(sortBackToFront(['front', 'back'], (k) => (k === 'front' ? front : back))).toEqual(['back', 'front'])
    const long = box(0, 0, 300, 100)
    const small = box(0, 100, 100, 200)
    expect(sortBackToFront(['small', 'long'], (k) => (k === 'small' ? small : long))).toEqual(['long', 'small'])
  })
})

describe('SolidSvg (legend swatch and contact sheet tile)', () => {
  it('crops to everything the object covers: a tall block never clips at the top, its shadow never at the right or bottom', () => {
    for (const [key, kind] of [['wardrobe', 'wardrobe'], ['bookshelf', 'bookshelf'], ['tree', 'tree'], ['fountain', 'fountain']] as const) {
      const type = key in ENGINE_MODELS ? kind : 'chair'
      const solid = solidFor(type as never, key in THEME_MODELS ? (key as never) : undefined, [{ row: 0, col: 0 }])!
      const b = solidBounds(solid)
      const html = renderToStaticMarkup(<SolidSvg solid={solid} pxPerCell={36} />)
      const vb = /viewBox="([-\d. ]+)"/.exec(html)![1]!.split(' ').map(Number)
      expect(vb[0]!, key).toBeLessThanOrEqual(b.x0)
      expect(vb[1]!, key).toBeLessThanOrEqual(b.y0)
      expect(vb[0]! + vb[2]!, key).toBeGreaterThanOrEqual(b.x1)
      expect(vb[1]! + vb[3]!, key).toBeGreaterThanOrEqual(b.y1)
      // The tall ones reach above the footprint, so the box must start above 0.
      if (key === 'wardrobe' || key === 'tree') expect(b.y0).toBeLessThan(-20)
    }
  })
})
