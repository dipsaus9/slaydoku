import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { OBJECT_CATALOG, OBJECT_TYPES } from '../../engine/model/index.ts'
import type { Cell } from '../../engine/model/index.ts'
import { EdgeFeatureIcon } from './EdgeFeatureIcon.tsx'
import { ICON_DEPTH_FILTER, IconDepthScope, ObjectIcon, ObjectIconGlyph } from './ObjectIcon.tsx'
import { doorArt, EDGE_LENGTH, EDGE_THICKNESS, windowArt } from './art/edges.tsx'
import { renderContactSheet } from './contactSheet.ts'
import {
  ORIENTATIONS,
  applyMatrix,
  footprintKey,
  orientCells,
  orientationMatrix,
} from './orientation.ts'
import { ICON_DEFINITIONS } from './registry.tsx'
import { hasIcon, iconFootprints, resolveIcon } from './resolve.ts'
import { iconLegendGroups, isOccupiableIconType } from './types.ts'

/** The house objects promoted into the engine catalog by CAD-4.28. */
const HOUSE_OBJECT_TYPES = [
  'washingMachine', 'dryer', 'cabinet', 'stairs', 'toilet', 'sink', 'shower',
  'desk', 'wardrobe', 'diningTable', 'kitchenCounter', 'bicycle', 'gardenTable', 'bench',
] as const

/** Points of every drawn shape, padded by half its stroke, as [x, y] pairs. */
function shapeExtents(markup: string): { points: [number, number][]; pad: number }[] {
  const out: { points: [number, number][]; pad: number }[] = []
  const tag = /<(rect|circle|ellipse|line|polygon|polyline|path)\b([^>]*?)\/?>/g
  for (const match of markup.matchAll(tag)) {
    const name = match[1]!
    const attrs: Record<string, string> = {}
    for (const a of match[2]!.matchAll(/([\w-]+)="([^"]*)"/g)) attrs[a[1]!] = a[2]!
    const num = (k: string) => Number(attrs[k] ?? 0)
    const stroked = attrs.stroke !== undefined && attrs.stroke !== 'none'
    const pad = stroked ? num('stroke-width') / 2 : 0
    const points: [number, number][] = []
    if (name === 'rect') {
      points.push([num('x'), num('y')], [num('x') + num('width'), num('y') + num('height')])
    } else if (name === 'circle') {
      points.push([num('cx') - num('r'), num('cy') - num('r')], [num('cx') + num('r'), num('cy') + num('r')])
    } else if (name === 'ellipse') {
      points.push([num('cx') - num('rx'), num('cy') - num('ry')], [num('cx') + num('rx'), num('cy') + num('ry')])
    } else if (name === 'line') {
      points.push([num('x1'), num('y1')], [num('x2'), num('y2')])
    } else if (name === 'polygon' || name === 'polyline') {
      const v = attrs.points!.trim().split(/[\s,]+/).map(Number)
      for (let i = 0; i < v.length; i += 2) points.push([v[i]!, v[i + 1]!])
    } else {
      points.push(...pathPoints(attrs.d!))
    }
    out.push({ points, pad })
  }
  return out
}

/** Vertices plus sampled curve points of an absolute M/L/H/V/C/Q/Z path. */
function pathPoints(d: string): [number, number][] {
  const tokens = d.match(/[MLHVCQZ]|-?\d*\.?\d+/g)!
  const pts: [number, number][] = []
  let i = 0
  let cmd = ''
  let cur: [number, number] = [0, 0]
  let start: [number, number] = [0, 0]
  const read = () => Number(tokens[i++])
  while (i < tokens.length) {
    if (/[A-Z]/.test(tokens[i]!)) cmd = tokens[i++]!
    if (cmd === 'Z') {
      cur = start
      continue
    }
    if (cmd === 'M' || cmd === 'L') {
      cur = [read(), read()]
      if (cmd === 'M') start = cur
      pts.push(cur)
      if (cmd === 'M') cmd = 'L'
    } else if (cmd === 'H') {
      cur = [read(), cur[1]]
      pts.push(cur)
    } else if (cmd === 'V') {
      cur = [cur[0], read()]
      pts.push(cur)
    } else if (cmd === 'Q') {
      const c: [number, number] = [read(), read()]
      const p: [number, number] = [read(), read()]
      for (let t = 0.125; t <= 1; t += 0.125) {
        const u = 1 - t
        pts.push([u * u * cur[0] + 2 * u * t * c[0] + t * t * p[0], u * u * cur[1] + 2 * u * t * c[1] + t * t * p[1]])
      }
      cur = p
    } else if (cmd === 'C') {
      const c1: [number, number] = [read(), read()]
      const c2: [number, number] = [read(), read()]
      const p: [number, number] = [read(), read()]
      for (let t = 0.125; t <= 1; t += 0.125) {
        const u = 1 - t
        pts.push([
          u ** 3 * cur[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * p[0],
          u ** 3 * cur[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * p[1],
        ])
      }
      cur = p
    } else {
      throw new Error(`unsupported path command ${cmd}`)
    }
  }
  return pts
}

function insideCells(x: number, y: number, cells: readonly Cell[]): boolean {
  const eps = 1e-6
  return cells.some(
    (c) => x >= c.col * 100 - eps && x <= (c.col + 1) * 100 + eps && y >= c.row * 100 - eps && y <= (c.row + 1) * 100 + eps,
  )
}

function neighbours(a: Cell, b: Cell): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1
}

function connected(cells: readonly Cell[]): boolean {
  const seen = new Set([0])
  const queue = [0]
  while (queue.length > 0) {
    const cur = queue.pop()!
    cells.forEach((c, i) => {
      if (!seen.has(i) && neighbours(cells[cur]!, c)) {
        seen.add(i)
        queue.push(i)
      }
    })
  }
  return seen.size === cells.length
}

describe('icon registry', () => {
  it('has an icon for every type in the engine object catalog', () => {
    for (const type of OBJECT_TYPES) {
      expect(ICON_DEFINITIONS[type], type).toBeDefined()
      expect(iconFootprints(type).length, type).toBeGreaterThan(0)
    }
  })

  it('takes its types and occupiable flag from the engine catalog, house objects all blocking', () => {
    expect(Object.keys(ICON_DEFINITIONS).sort()).toEqual([...OBJECT_TYPES].sort())
    for (const type of OBJECT_TYPES) {
      expect(isOccupiableIconType(type), type).toBe(OBJECT_CATALOG[type].occupiable)
    }
    for (const type of HOUSE_OBJECT_TYPES) expect(isOccupiableIconType(type), type).toBe(false)
  })

  it('draws only footprints the engine catalog allows', () => {
    for (const type of OBJECT_TYPES) {
      const footprint = OBJECT_CATALOG[type].footprint
      if (!footprint) continue
      for (const v of iconFootprints(type)) {
        expect(v.cells.length, `${type} ${v.id}`).toBeGreaterThanOrEqual(footprint.minCells)
        expect(v.cells.length, `${type} ${v.id}`).toBeLessThanOrEqual(footprint.maxCells)
      }
    }
  })

  it('covers the house scene furniture', () => {
    for (const type of [
      'washingMachine', 'dryer', 'cabinet', 'stairs', 'bed', 'toilet', 'shower', 'sink', 'desk', 'chair',
      'wardrobe', 'diningTable', 'sofa', 'kitchenCounter', 'bicycle', 'gardenTable', 'bench', 'plant',
    ] as const) {
      expect(ICON_DEFINITIONS[type], type).toBeDefined()
    }
  })

  it('defines footprints: 2-cell bed, L-shaped sofa, no duplicates per type', () => {
    expect(iconFootprints('bed').some((v) => v.cells.length === 2)).toBe(true)
    const lSofa = iconFootprints('sofa').find((v) => v.id.startsWith('L'))
    expect(lSofa).toBeDefined()
    expect(lSofa!.cells.length).toBeLessThan(lSofa!.cols * lSofa!.rows)
    for (const type of OBJECT_TYPES) {
      const keys = new Set<string>()
      for (const v of iconFootprints(type)) {
        expect(connected(v.cells), `${type} ${v.id} connected`).toBe(true)
        const seen = ORIENTATIONS.map((o) => footprintKey(orientCells(v.cells, v.cols, v.rows, o)))
        for (const key of seen) expect(keys.has(key), `${type} ${v.id} duplicates another footprint`).toBe(false)
        for (const key of seen) keys.add(key)
      }
    }
  })
})

describe('orientation', () => {
  it('resolves every footprint under every rotation and mirror', () => {
    for (const type of OBJECT_TYPES) {
      for (const v of iconFootprints(type)) {
        for (const o of ORIENTATIONS) {
          const cells = orientCells(v.cells, v.cols, v.rows, o)
          const icon = resolveIcon(type, cells)
          expect(icon, `${type} ${v.id} ${o.rotation}${o.mirror ? 'm' : ''}`).toBeDefined()
          expect(icon!.variant.id).toBe(v.id)
        }
      }
    }
  })

  it('finds the icon for cells placed anywhere on the grid and rejects unknown shapes', () => {
    const bed = [{ row: 4, col: 3 }, { row: 5, col: 3 }]
    expect(hasIcon('bed', bed)).toBe(true)
    expect(resolveIcon('bed', bed)!.rows).toBe(2)
    expect(hasIcon('bed', [{ row: 0, col: 0 }])).toBe(false)
    expect(hasIcon('chair', [{ row: 0, col: 0 }, { row: 0, col: 1 }])).toBe(false)
    expect(hasIcon('chair', [])).toBe(false)
  })

  it('honours a preferred facing when several orientations fit', () => {
    const cells = [{ row: 0, col: 0 }, { row: 1, col: 0 }]
    expect(resolveIcon('desk', cells, { rotation: 90 })!.orientation.rotation).toBe(90)
    expect(resolveIcon('desk', cells, { rotation: 270 })!.orientation.rotation).toBe(270)
  })

  it('maps the canonical box exactly onto the oriented box', () => {
    for (const o of ORIENTATIONS) {
      const m = orientationMatrix(3, 2, o)
      const corners = [applyMatrix(m, 0, 0), applyMatrix(m, 3, 0), applyMatrix(m, 0, 2), applyMatrix(m, 3, 2)]
      const w = o.rotation === 90 || o.rotation === 270 ? 2 : 3
      const h = o.rotation === 90 || o.rotation === 270 ? 3 : 2
      for (const [x, y] of corners) {
        expect([0, w]).toContain(Math.round(x))
        expect([0, h]).toContain(Math.round(y))
      }
    }
  })
})

describe('footprint bounds', () => {
  it('draws every variant inside its own cells, stroke included', () => {
    for (const type of OBJECT_TYPES) {
      for (const v of iconFootprints(type)) {
        const markup = renderToStaticMarkup(<svg>{v.draw()}</svg>)
        const shapes = shapeExtents(markup)
        expect(shapes.length, `${type} ${v.id} draws something`).toBeGreaterThan(0)
        for (const { points, pad } of shapes) {
          for (const [x, y] of points) {
            for (const [dx, dy] of [[-pad, -pad], [pad, -pad], [-pad, pad], [pad, pad]] as const) {
              expect(insideCells(x + dx, y + dy, v.cells), `${type} ${v.id} point ${x},${y} pad ${pad}`).toBe(true)
            }
          }
        }
      }
    }
  })

  it('keeps edge features inside their one-cell-by-thin box', () => {
    for (const art of [windowArt, doorArt]) {
      for (const { points, pad } of shapeExtents(renderToStaticMarkup(<svg>{art()}</svg>))) {
        for (const [x, y] of points) {
          expect(x - pad).toBeGreaterThanOrEqual(0)
          expect(x + pad).toBeLessThanOrEqual(EDGE_LENGTH)
          expect(y - pad).toBeGreaterThanOrEqual(0)
          expect(y + pad).toBeLessThanOrEqual(EDGE_THICKNESS)
        }
      }
    }
  })
})

describe('components', () => {
  it('sizes the standalone svg to the oriented footprint', () => {
    const html = renderToStaticMarkup(
      <ObjectIcon type="bed" cells={[{ row: 2, col: 5 }, { row: 2, col: 6 }]} cellSize={50} />,
    )
    expect(html).toContain('width="100"')
    expect(html).toContain('height="50"')
    expect(html).toContain('viewBox="0 0 200 100"')
  })

  it('renders nothing for a footprint it cannot draw', () => {
    expect(renderToStaticMarkup(<ObjectIcon type="chair" cells={[{ row: 0, col: 0 }, { row: 1, col: 0 }]} />)).toBe('')
    expect(renderToStaticMarkup(<svg><ObjectIconGlyph type="tv" cells={[]} /></svg>)).not.toContain('data-icon')
  })

  it('does not encode occupiable/blocking in the art', () => {
    // The art is a pure function of type and footprint; the flag lives in the catalog only.
    const html = renderToStaticMarkup(<ObjectIcon type="sofa" cells={[{ row: 0, col: 0 }, { row: 0, col: 1 }]} />)
    expect(html).not.toMatch(/occupiable|blocking/i)
    const { occupiable, blocking } = iconLegendGroups()
    expect(occupiable.every((t) => OBJECT_CATALOG[t].occupiable)).toBe(true)
    expect(blocking.every((t) => !OBJECT_CATALOG[t].occupiable)).toBe(true)
    expect(occupiable.length + blocking.length).toBe(OBJECT_TYPES.length)
  })

  it('renders window and door on both axes', () => {
    for (const kind of ['window', 'door'] as const) {
      expect(renderToStaticMarkup(<EdgeFeatureIcon kind={kind} side="north" cellSize={50} />)).toContain('width="50" height="10"')
      expect(renderToStaticMarkup(<EdgeFeatureIcon kind={kind} side="east" cellSize={50} />)).toContain('width="10" height="50"')
    }
  })
})

describe('contact sheet', () => {
  it('lists every type and every footprint', () => {
    const html = renderContactSheet()
    expect(html.startsWith('<!doctype html>')).toBe(true)
    for (const type of OBJECT_TYPES) expect(html, type).toContain(`data-type="${type}"`)
    const footprints = OBJECT_TYPES.reduce((n, t) => n + iconFootprints(t).length, 0)
    expect(html.match(/class="variant"/g)?.length).toBe(footprints)
    expect(html).toContain('L3')
  })
})

describe('depth filter', () => {
  it('keeps the approved depth-55 values in one constant', () => {
    expect(ICON_DEPTH_FILTER).toEqual({
      bevel: 2.9,
      rimLight: { color: '#ffffff', opacity: 0.48, blur: 0.8 },
      innerShade: { color: '#2a1a10', opacity: 0.27, blur: 1 },
      groundShadow: { color: '#2a1a10', opacity: 0.29, blur: 2.6, dx: 2.4, dy: 5.3 },
      region: { x: '-25%', y: '-25%', width: '160%', height: '175%' },
    })
    const html = renderToStaticMarkup(<ObjectIcon type="chair" cells={[{ row: 0, col: 0 }]} />)
    expect(html).toMatch(/<filter [^>]*x="-25%" y="-25%" width="160%" height="175%"/)
    expect(html).toContain('dx="2.4" dy="5.3"')
    expect(html).toContain('stdDeviation="2.6"')
  })

  it('puts the filter outside the orientation transform in all 8 orientations', () => {
    const cells = [{ row: 0, col: 0 }]
    for (const rotation of [0, 90, 180, 270] as const) {
      for (const mirror of [false, true]) {
        const html = renderToStaticMarkup(
          <svg>
            <IconDepthScope>
              <ObjectIconGlyph type="chair" cells={cells} rotation={rotation} mirror={mirror} />
            </IconDepthScope>
          </svg>,
        )
        const filtered = html.indexOf('<g data-depth="" filter="url(#')
        const oriented = html.indexOf('<g data-icon="chair"')
        expect(filtered).toBeGreaterThan(-1)
        expect(oriented).toBeGreaterThan(filtered)
        expect(html.slice(html.indexOf('<g data-icon="chair"'), html.indexOf('>', oriented))).toContain('transform="matrix(')
        expect((html.match(/<filter /g) ?? []).length).toBe(1)
      }
    }
  })

  it('draws flat outside a scope', () => {
    expect(renderToStaticMarkup(<svg><ObjectIconGlyph type="chair" cells={[{ row: 0, col: 0 }]} /></svg>)).not.toContain('filter=')
  })
})
