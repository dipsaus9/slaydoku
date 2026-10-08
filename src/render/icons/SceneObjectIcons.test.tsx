import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { PlacedObject, Scene } from '../../engine/model/index.ts'
import { CELL_SIZE, createGeometry } from '../scene/geometry.ts'
import { sample9x9 } from '../scene/sample.fixture.ts'
import { SceneView } from '../scene/SceneView.tsx'
import { allowedCells, objectClipPath } from '../looks/objectClip.ts'
import { ORIENTATIONS, orientCells } from './orientation.ts'
import { ICON_DEFINITIONS } from './registry.tsx'
import { THEME_ICON_DEFINITIONS } from './themes/registry.ts'
import { themeIconsFor } from '../../content/themes/icons.ts'
import { readSchedule } from '../../schedule/schedule.testing.ts'
import { solidFor } from '../looks/solid.ts'
import { primExtent } from '../looks/project.ts'
import { SceneObjectIcons } from './SceneObjectIcons.tsx'

const draw = (scene: Scene, objects: PlacedObject[] = scene.objects, themeIcons?: Record<string, never>) => {
  const geometry = createGeometry(scene)
  return renderToStaticMarkup(
    <svg>
      <SceneObjectIcons objects={objects} geometry={geometry} cellRooms={scene.cellRooms} themeIcons={themeIcons} />
    </svg>,
  )
}

describe('SceneObjectIcons', () => {
  it("draws every sample object into SceneView's objects layer at its cell", () => {
    const html = renderToStaticMarkup(
      <SceneView scene={sample9x9} objectsLayer={(geometry) => <SceneObjectIcons objects={sample9x9.objects} geometry={geometry} cellRooms={sample9x9.cellRooms} />} />,
    )
    const layer = html.slice(html.indexOf('data-layer="objects"'), html.indexOf('data-layer="marks"'))
    for (const object of sample9x9.objects) expect(layer).toContain(`data-object="${object.id}"`)
    // The vertical bed starts at r8c1: its translate is that cell's top-left corner.
    const bed = createGeometry(sample9x9).cellRect({ row: 7, col: 0 })
    expect(layer).toContain(`translate(${bed.x} ${bed.y}) scale(${CELL_SIZE / 100})`)
    expect(layer).toContain('data-icon="bed"')
  })

  it('skips objects without a matching footprint', () => {
    const html = draw(sample9x9, [{ id: 'odd', type: 'chair', cells: [{ row: 0, col: 0 }, { row: 3, col: 3 }] }])
    expect(html).not.toContain('data-object')
  })

  it('draws the theme art of an object listed in themeIcons, the engine art of the others', () => {
    const objects: PlacedObject[] = [
      { id: 'printer-1', type: 'cabinet', cells: [{ row: 0, col: 0 }] },
      { id: 'kast-1', type: 'cabinet', cells: [{ row: 2, col: 2 }] },
    ]
    const html = draw(sample9x9, objects, { 'printer-1': 'printer' as never })
    expect(html).toContain('data-theme-icon="printer"')
    expect(html).toContain('data-icon="cabinet"')
  })

  it('paints the objects under the walls and the room labels', () => {
    const html = renderToStaticMarkup(<SceneView scene={sample9x9} objectsLayer={(g) => <SceneObjectIcons objects={sample9x9.objects} geometry={g} cellRooms={sample9x9.cellRooms} />} />)
    const at = (l: string) => html.indexOf(`data-layer="${l}"`)
    expect(at('objects')).toBeLessThan(at('walls'))
    expect(at('walls')).toBeLessThan(at('room-labels'))
  })

  it('draws a rug first, then the shadows, then the tall objects back to front, per room', () => {
    const scene: Scene = {
      width: 3,
      height: 3,
      rooms: [{ id: 'A', name: 'Hall' }],
      cellRooms: [['A', 'A', 'A'], ['A', 'A', 'A'], ['A', 'A', 'A']],
      objects: [
        { id: 'front-chair', type: 'chair', cells: [{ row: 2, col: 0 }] },
        { id: 'back-chair', type: 'chair', cells: [{ row: 0, col: 0 }] },
        { id: 'rug', type: 'rug', cells: [{ row: 1, col: 1 }] },
      ],
      edgeFeatures: [],
    }
    const html = draw(scene)
    const at = (id: string) => html.indexOf(`data-object="${id}"`)
    expect(at('rug')).toBeLessThan(at('back-chair'))
    expect(at('back-chair')).toBeLessThan(at('front-chair'))
    expect(html.indexOf('filter="url(#')).toBeLessThan(at('back-chair'))
  })
})

describe('an object never paints outside its own room', () => {
  // L-shaped rooms, a wall corner, a room that wraps round another: where a block could leak diagonally.
  const layout = [
    'AAAAAAAA',
    'AAAAAAAA',
    'AABBBBAA',
    'AABBBBAA',
    'AABBBBAA',
    'AAAAAAAA',
    'CCCCDDDD',
    'CCCCDDDD',
  ]
  const scene: Scene = {
    width: 8,
    height: 8,
    rooms: ['A', 'B', 'C', 'D'].map((id) => ({ id, name: id })),
    cellRooms: layout.map((row) => [...row]),
    objects: [],
    edgeFeatures: [],
  }
  const geometry = createGeometry(scene)
  const roomOf = (row: number, col: number) => scene.cellRooms[row]?.[col]

  /** Rectangles of the clip path data, which is made of `M x y H x V y H x Z` pieces. */
  const rects = (d: string) => [...d.matchAll(/M(-?[\d.]+) (-?[\d.]+)H(-?[\d.]+)V(-?[\d.]+)H/g)].map((m) => ({ x0: +m[1]!, y0: +m[2]!, x1: +m[3]!, y1: +m[4]! }))
  /** The squares (row, col) that a clip path covers, found by probing the middle and the four corners just inside of every square of the grid. */
  function covered(d: string, rows: number, cols: number): Set<string> {
    const rs = rects(d)
    const out = new Set<string>()
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const r = geometry.cellRect({ row, col })
        for (const [dx, dy] of [[0.5, 0.5], [0.04, 0.04], [0.96, 0.04], [0.04, 0.96], [0.96, 0.96]] as const) {
          const x = r.x + dx * r.width
          const y = r.y + dy * r.height
          if (rs.some((q) => x > q.x0 && x < q.x1 && y > q.y0 && y < q.y1)) out.add(`${row}:${col}`)
        }
      }
    }
    return out
  }

  it('allows its own squares and the free floor of its room beside them, nothing else (no other room, no diagonal round a wall corner)', () => {
    // A chair in the corner of room B: north and west are room A, so only its own square and the B squares are allowed.
    const chair = [{ row: 2, col: 2 }]
    const ok = allowedCells(chair, scene.cellRooms).map((c) => `${c.row}:${c.col}`).sort()
    expect(ok).toEqual(['2:2', '2:3', '3:2', '3:3'])
    // Next to the bottom of B the diagonal of A (row 5, col 1) must not leak through the wall corner at (5, 2).
    const low = [{ row: 4, col: 2 }]
    expect(allowedCells(low, scene.cellRooms).map((c) => `${c.row}:${c.col}`).sort()).toEqual(['3:2', '3:3', '4:2', '4:3'])
    const outer = [{ row: 0, col: 0 }]
    expect(allowedCells(outer, scene.cellRooms).map((c) => `${c.row}:${c.col}`).sort()).toEqual(['0:0', '0:1', '1:0', '1:1'])
    expect(allowedCells([], scene.cellRooms)).toEqual([])
  })

  it('clips to exactly those squares: no probe point of another room lies inside, none outside the grid', () => {
    for (const cells of [[{ row: 2, col: 2 }], [{ row: 5, col: 1 }, { row: 5, col: 2 }], [{ row: 6, col: 3 }], [{ row: 0, col: 7 }], [{ row: 7, col: 4 }, { row: 7, col: 5 }]]) {
      const d = objectClipPath(cells, scene.cellRooms, geometry)
      const home = roomOf(cells[0]!.row, cells[0]!.col)
      for (const key of covered(d, scene.height, scene.width)) {
        const [row, col] = key.split(':').map(Number)
        expect(roomOf(row!, col!), `${JSON.stringify(cells)} covers ${key}`).toBe(home)
      }
      // The clip never reaches past the grid's own squares: outer walls cut like any other.
      const origin = geometry.cellRect({ row: 0, col: 0 })
      for (const q of rects(d)) {
        expect(q.x0).toBeGreaterThanOrEqual(origin.x - 0.1)
        expect(q.y0).toBeGreaterThanOrEqual(origin.y - 0.1)
        expect(q.x1).toBeLessThanOrEqual(origin.x + scene.width * CELL_SIZE + 0.1)
        expect(q.y1).toBeLessThanOrEqual(origin.y + scene.height * CELL_SIZE + 0.1)
      }
    }
  })

  it('wraps the art and the shadow of every object in the clip of that object, for every kind in every orientation', () => {
    const kinds = [...Object.entries(ICON_DEFINITIONS).map(([k, d]) => [k, undefined, d.variants] as const), ...Object.entries(THEME_ICON_DEFINITIONS).map(([k, d]) => ['chair', k, d.variants] as const)]
    let n = 0
    for (const [type, themeIcon, variants] of kinds) {
      for (const variant of variants) {
        for (const o of ORIENTATIONS) {
          const turned = orientCells(variant.cells, variant.cols, variant.rows, o)
          // Every position of the footprint that lies in one room: at the grid edge, beside a wall and in a wall corner alike.
          const spots: { row: number; col: number }[][] = []
          for (let r0 = 0; r0 < scene.height; r0++) {
            for (let c0 = 0; c0 < scene.width; c0++) {
              const cells = turned.map((c) => ({ row: c.row + r0, col: c.col + c0 }))
              const rooms = new Set(cells.map((c) => roomOf(c.row, c.col)))
              if (rooms.size === 1 && [...rooms].every((r) => r !== undefined)) spots.push(cells)
            }
          }
          const step = Math.max(1, Math.floor(spots.length / 6))
          for (const cells of spots.filter((_, i) => i % step === 0)) {
          const solid = solidFor(type as never, themeIcon as never, turned, o)
          expect(solid, `${type} ${themeIcon ?? ''} ${variant.id}`).not.toBeNull()
          // Where the art is projected, relative to the footprint corner: it stays within one square of the footprint (headroom is gone, so the clip
          // alone decides what shows); the clip is the squares around the footprint of the same room only.
          for (const p of solid!.prims) {
            const e = primExtent(p)
            expect(e.z1).toBeLessThanOrEqual(96.01)
          }
          const id = 'probe-1'
          const html = renderToStaticMarkup(
            <svg>
              <SceneObjectIcons objects={[{ id, type: type as never, cells }]} geometry={geometry} cellRooms={scene.cellRooms} themeIcons={themeIcon ? { [id]: themeIcon as never } : undefined} />
            </svg>,
          )
          n++
          const clipId = /clip-path="url\(#([^)]+)\)"/.exec(html)![1]!
          expect(html.match(new RegExp(`clip-path="url\\(#${clipId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)"`, 'g'))!.length, 'art and shadow').toBeGreaterThanOrEqual(solid!.flat ? 1 : 2)
          const d = new RegExp(`<clipPath id="${clipId}"><path d="([^"]+)"`).exec(html)![1]!
          const home = roomOf(cells[0]!.row, cells[0]!.col)
          for (const key of covered(d, scene.height, scene.width)) {
            const [row, col] = key.split(':').map(Number)
            expect(roomOf(row!, col!), `${type} ${themeIcon ?? ''} ${variant.id} ${o.rotation}${o.mirror ? 'm' : ''} covers ${key}`).toBe(home)
          }
          // Nothing of the object is drawn outside its clip group.
          const outside = html.replace(/<g clip-path="url\(#[^)]+\)"[\s\S]*$/, '')
          expect(outside).not.toContain('data-object')
          }
        }
      }
    }
    expect(n).toBeGreaterThan(1000)
  })

  it('holds for every object of every day of the baked schedule: the clip covers only squares of the object\'s own room', () => {
    const { days } = readSchedule()
    let checked = 0
    for (const day of days) {
      const sc = day.puzzle.scene
      const g = createGeometry(sc)
      const themeIcons = themeIconsFor(day.theme, sc.objects)
      const html = renderToStaticMarkup(
        <svg>
          <SceneObjectIcons objects={sc.objects} geometry={g} cellRooms={sc.cellRooms} themeIcons={themeIcons} />
        </svg>,
      )
      const paths = new Map([...html.matchAll(/<clipPath id="([^"]+)"><path d="([^"]+)"/g)].map((m) => [m[1]!, m[2]!]))
      for (const m of html.matchAll(/<g clip-path="url\(#([^)]+)\)" data-clip-of="([^"]+)"/g)) {
        const object = sc.objects.find((o) => o.id === m[2])!
        const home = sc.cellRooms[object.cells[0]!.row]![object.cells[0]!.col]
        for (const q of rects(paths.get(m[1]!)!)) {
          for (const [fx, fy] of [[0.5, 0.5], [0.02, 0.02], [0.98, 0.98]] as const) {
            const col = Math.floor((q.x0 + fx * (q.x1 - q.x0) - g.origin.x) / CELL_SIZE)
            const row = Math.floor((q.y0 + fy * (q.y1 - q.y0) - g.origin.y) / CELL_SIZE)
            expect(sc.cellRooms[row]?.[col], `${day.date} ${object.id}`).toBe(home)
          }
        }
        checked++
      }
    }
    expect(checked).toBeGreaterThan(1000)
  })
})
