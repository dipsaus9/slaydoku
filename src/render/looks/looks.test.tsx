import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createMemoryStorage } from '../../game/memoryStorage.ts'
import { LOOK_KEY, readLook, writeLook } from '../../locale/index.ts'
import { OBJECT_TYPES } from '../../engine/model/index.ts'
import { ICON_DEFINITIONS } from '../icons/registry.tsx'
import { createGeometry } from '../scene/geometry.ts'
import { sample9x9 } from '../scene/sample.fixture.ts'
import { SceneView } from '../scene/SceneView.tsx'
import { SceneObjectIcons } from '../icons/SceneObjectIcons.tsx'
import { lookSwitchAllowed } from './look.ts'
import { bathtub, SOLID_COLORS, solidModel, SOLID_TYPES } from './models.ts'
import { sortBackToFront } from './project.ts'
import { SceneSolids } from './Solids.tsx'
import { solidOf } from './solid.ts'

const size = { width: 9, height: 7 }

describe('where the Look switch may show', () => {
  it('shows in dev, on localhost and on preview hosts, never on production', () => {
    expect(lookSwitchAllowed(true, 'anything')).toBe(true)
    expect(lookSwitchAllowed(false, 'localhost')).toBe(true)
    expect(lookSwitchAllowed(false, 'slaydoku-git-slay-17-8-preview-look-poc-team.vercel.app')).toBe(true)
    expect(lookSwitchAllowed(false, 'slaydoku-5hq3k1.vercel.app')).toBe(true)
    expect(lookSwitchAllowed(false, 'slaydoku.vercel.app')).toBe(false)
    expect(lookSwitchAllowed(false, 'slaydoku.nl')).toBe(false)
    expect(lookSwitchAllowed(false, 'www.slaydoku.nl')).toBe(false)
    expect(lookSwitchAllowed(false, 'evil.example.com')).toBe(false)
    expect(lookSwitchAllowed(false, '')).toBe(false)
  })
})

describe('the stored look', () => {
  it('round-trips and ignores unusable values', () => {
    const storage = createMemoryStorage()
    expect(readLook(storage)).toBeNull()
    writeLook(storage, 'a3')
    expect(readLook(storage)).toBe('a3')
    storage.setItem(LOOK_KEY, 'b9')
    expect(readLook(storage)).toBeNull()
    expect(readLook(null)).toBeNull()
  })
})

describe('A3 geometry (diamond grid)', () => {
  const g = createGeometry(size, { look: 'a3', axisLabels: true })

  it('keeps the flat drawing and lays it on the diamond with one transform', () => {
    expect(g.planeTransform).toMatch(/^matrix\(/)
    expect(createGeometry(size).planeTransform).toBeUndefined()
    expect(createGeometry(size, { look: 'a2' }).planeTransform).toBeUndefined()
  })

  it('puts every cell centre inside the view box, inside its own diamond, and upright centres on the same spot', () => {
    for (let row = 0; row < size.height; row++) {
      for (let col = 0; col < size.width; col++) {
        const bounds = g.cellBounds({ row, col })
        const c = g.upright.cellCenter({ row, col })
        expect(bounds.x).toBeGreaterThanOrEqual(0)
        expect(bounds.y).toBeGreaterThanOrEqual(0)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(g.viewBox.width)
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(g.viewBox.height)
        expect(c.x).toBeCloseTo(bounds.x + bounds.width / 2, 5)
        expect(c.y).toBeCloseTo(bounds.y + bounds.height / 2, 5)
      }
    }
  })

  it('is a real isometric lattice: neighbours differ by the same screen step', () => {
    const a = g.upright.cellCenter({ row: 2, col: 2 })
    const right = g.upright.cellCenter({ row: 2, col: 3 })
    const down = g.upright.cellCenter({ row: 3, col: 2 })
    expect(right.x - a.x).toBeCloseTo(a.x - down.x, 5)
    expect(right.y - a.y).toBeCloseTo(down.y - a.y, 5)
    expect(right.y).toBeGreaterThan(a.y)
  })

  it('gives every axis label a point outside the grid and inside the view box', () => {
    for (let i = 0; i < size.width; i++) {
      const p = g.axisPoint('col', i)
      expect(p.x).toBeGreaterThan(0)
      expect(p.x).toBeLessThan(g.viewBox.width)
      expect(p.y).toBeGreaterThan(0)
    }
    for (let i = 0; i < size.height; i++) expect(g.axisPoint('row', i).x).toBeGreaterThan(0)
  })

  it('leaves headroom for the blocks in A2 and A3 only', () => {
    expect(createGeometry(size, { look: 'a2' }).origin.y).toBeGreaterThan(createGeometry(size).origin.y)
    expect(createGeometry(size).viewBox).toEqual(createGeometry(size, { look: 'now' }).viewBox)
  })
})

describe('block models', () => {
  it('covers the seven kinds named in the story, for every footprint of a rectangular variant', () => {
    expect([...SOLID_TYPES].sort()).toEqual(['bed', 'bookshelf', 'chair', 'plant', 'rug', 'sofa', 'table'])
    for (const type of SOLID_TYPES) {
      for (const variant of ICON_DEFINITIONS[type].variants) {
        const model = solidModel(type, variant.cols, variant.rows, variant.id)
        if (variant.id.startsWith('L')) expect(model).toBeNull()
        else expect(model, `${type} ${variant.id}`).not.toBeNull()
      }
    }
  })

  it('leaves every other kind on the flat art', () => {
    for (const type of OBJECT_TYPES.filter((t) => !SOLID_TYPES.includes(t))) {
      for (const variant of ICON_DEFINITIONS[type].variants) expect(solidModel(type, variant.cols, variant.rows, variant.id)).toBeNull()
    }
  })

  it('keeps every block inside its footprint', () => {
    for (const type of SOLID_TYPES) {
      for (const variant of ICON_DEFINITIONS[type].variants) {
        const model = solidModel(type, variant.cols, variant.rows, variant.id)
        if (!model) continue
        for (const p of model.prims) {
          const [x0, x1, y0, y1] = p.kind === 'box' ? [p.x0, p.x1, p.y0, p.y1] : [p.x - p.r, p.x + p.r, p.y - p.r, p.y + p.r]
          expect(x0, `${type} ${variant.id}`).toBeGreaterThanOrEqual(0)
          expect(y0).toBeGreaterThanOrEqual(0)
          expect(x1).toBeLessThanOrEqual(variant.cols * 100)
          expect(y1).toBeLessThanOrEqual(variant.rows * 100)
        }
      }
    }
  })

  it('makes the bathtub water a saturated blue standing below the rim, with a light surface and foam, not a pale slab', () => {
    const tub = bathtub()
    const rim = Math.max(...tub.prims.filter((p) => p.color === SOLID_COLORS.white).map((p) => p.z1))
    const water = tub.prims.find((p) => p.color === SOLID_COLORS.water)!
    expect(water.z1).toBeLessThan(rim)
    expect(tub.prims.some((p) => p.color === SOLID_COLORS.waterLight)).toBe(true)
    expect(tub.prims.filter((p) => p.kind === 'cylinder' && p.color === SOLID_COLORS.white).length).toBeGreaterThanOrEqual(3)
    // Blue clearly dominates red in the water colour and differs from the tub body.
    const r = Number.parseInt(SOLID_COLORS.water.slice(1, 3), 16)
    const b = Number.parseInt(SOLID_COLORS.water.slice(5, 7), 16)
    expect(b - r).toBeGreaterThan(100)
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

describe('SceneSolids and SceneObjectIcons', () => {
  const objects = [
    { id: 'c1', type: 'chair' as const, cells: [{ row: 1, col: 1 }] },
    { id: 'car1', type: 'car' as const, cells: [{ row: 3, col: 3 }, { row: 4, col: 3 }] },
    { id: 'l1', type: 'sofa' as const, cells: [{ row: 5, col: 0 }, { row: 5, col: 1 }, { row: 6, col: 0 }] },
  ]
  const geometry = createGeometry(size, { look: 'a3' })

  it('turns only the covered kinds into blocks (the L sofa and the car stay flat)', () => {
    expect(solidOf(objects[0]!)).not.toBeNull()
    expect(solidOf(objects[1]!)).toBeNull()
    expect(solidOf(objects[2]!)).toBeNull()
    expect(solidOf(objects[0]!, { c1: 'printer' })).toBeNull()
  })

  it.each(['a2', 'a3'] as const)('draws blocks for the chair and flat art for the rest in %s', (look) => {
    const g = createGeometry(size, { look })
    const solids = renderToStaticMarkup(<svg><SceneSolids objects={objects} geometry={g} look={look} /></svg>)
    expect(solids).toContain('data-solid="chair"')
    expect(solids).not.toContain('data-solid="car"')
    const flat = renderToStaticMarkup(<svg><SceneObjectIcons objects={objects} geometry={g} look={look} /></svg>)
    expect(flat).not.toContain('data-object="c1"')
    expect(flat).toContain('data-object="car1"')
    expect(flat).toContain('data-object="l1"')
  })

  it('keeps the shipped markup for look now: no plane group, hit squares on top, flat art for everything', () => {
    const html = renderToStaticMarkup(
      <SceneView scene={sample9x9} objectsLayer={(g) => <SceneObjectIcons objects={sample9x9.objects} geometry={g} />} />,
    )
    expect(html).not.toContain('data-layer="plane"')
    expect(html).not.toContain('data-layer="solids"')
    expect(html.indexOf('data-layer="hit"')).toBeGreaterThan(html.indexOf('data-room-label'))
  })

  it('draws the diamond: floors, walls and hit squares in the plane group, room labels and people outside it', () => {
    const html = renderToStaticMarkup(
      <SceneView
        scene={sample9x9}
        look="a3"
        showAxisLabels
        objectsLayer={(g) => <SceneObjectIcons objects={sample9x9.objects} geometry={g} look="a3" />}
        solidsLayer={(g) => <SceneSolids objects={sample9x9.objects} geometry={g} look="a3" />}
      />,
    )
    expect(geometry.planeTransform).toBeDefined()
    expect(html).toContain('data-layer="plane"')
    expect(html).toContain('data-layer="hit-plane"')
    // 81 hit squares, every one inside the transformed group.
    const hit = html.slice(html.indexOf('data-layer="hit-plane"'))
    expect((hit.match(/data-cell=/g) ?? []).length).toBe(81)
    // The labels come after the marks and people layers, as in the flat looks (SLAY-17.5).
    expect(html.indexOf('data-room-label')).toBeGreaterThan(html.indexOf('data-layer="people"'))
  })
})
