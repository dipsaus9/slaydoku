import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { PlacedObject, Scene } from '../../engine/model/index.ts'
import { CELL_SIZE, createGeometry } from '../scene/geometry.ts'
import { sample9x9 } from '../scene/sample.fixture.ts'
import { SceneView } from '../scene/SceneView.tsx'
import { drawOrder, frontRow } from '../looks/drawOrder.ts'
import { ORIENTATIONS, orientCells } from './orientation.ts'
import { ICON_DEFINITIONS } from './registry.tsx'
import { THEME_ICON_DEFINITIONS } from './themes/registry.ts'
import { themeIconsFor } from '../../content/themes/icons.ts'
import { readSchedule } from '../../schedule/schedule.testing.ts'
import { solidFor, solidOf } from '../looks/solid.ts'
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

  it('paints the walls, doors and windows first, then the objects, then marks, people and the room labels (painter order, walls at the very bottom)', () => {
    const scene = { ...sample9x9 }
    const html = renderToStaticMarkup(
      <SceneView
        scene={scene}
        showAxisLabels
        objectsLayer={(g) => <SceneObjectIcons objects={scene.objects} geometry={g} cellRooms={scene.cellRooms} />}
        marksLayer={<g data-probe="marks" />}
        peopleLayer={<g data-probe="people" />}
      />,
    )
    const at = (marker: string) => html.indexOf(marker)
    const order = ['data-layer="floors"', 'data-layer="grid"', 'data-layer="walls"', 'data-layer="edge-features"', 'data-layer="objects"', 'data-layer="marks"', 'data-layer="people"', 'data-layer="room-labels"', 'data-layer="axis-labels"', 'data-layer="hit"']
    const found = order.map(at)
    expect(found.every((i) => i >= 0), JSON.stringify(found)).toBe(true)
    expect([...found].sort((x, y) => x - y)).toEqual(found)
    // No object sits inside the wall layer or before it.
    expect(html.slice(0, at('data-layer="walls"'))).not.toContain('data-object')
  })

  it('draws a rug first, then each tall object with its own shadow just below it, lower rows later', () => {
    const scene: Scene = {
      width: 3,
      height: 3,
      rooms: [{ id: 'A', name: 'Hall' }],
      cellRooms: [['A', 'A', 'A'], ['A', 'A', 'A'], ['A', 'A', 'A']],
      objects: [
        { id: 'front-chair', type: 'chair', cells: [{ row: 2, col: 0 }] },
        { id: 'back-chair', type: 'chair', cells: [{ row: 0, col: 0 }] },
        { id: 'rug', type: 'rug', cells: [{ row: 2, col: 2 }] },
      ],
      edgeFeatures: [],
    }
    const html = draw(scene)
    const at = (id: string) => html.indexOf(`data-object="${id}"`)
    expect(at('rug')).toBeLessThan(at('back-chair'))
    expect(at('back-chair')).toBeLessThan(at('front-chair'))
    // A shadow (a blurred group) sits inside each tall object's own group, before its art, none in the rug's.
    const group = (id: string) => html.slice(at(id), at(id) + 4000)
    expect(group('rug').slice(0, group('rug').indexOf('data-object="back-chair"'))).not.toContain('filter="url(#')
    const chair = group('back-chair').slice(0, group('back-chair').indexOf('data-object="front-chair"'))
    expect(chair.indexOf('filter="url(#')).toBeGreaterThan(-1)
    expect(chair.indexOf('filter="url(#')).toBeLessThan(chair.indexOf('data-solid='))
  })
})

describe('drawOrder: the painter order of the objects', () => {
  const cell = (row: number, col: number) => ({ row, col })
  const item = (id: string, flat: boolean, ...cells: [number, number][]) => ({ id, flat, cells: cells.map(([r, c]) => cell(r, c)) })

  it('puts flat things first, then everything else by the row of its front edge, then by column from the left', () => {
    const items = [item('c', false, [4, 1]), item('rug', true, [6, 0]), item('a', false, [1, 5]), item('b', false, [4, 0]), item('d', false, [2, 2])]
    expect(drawOrder(items).map((i) => i.id)).toEqual(['rug', 'a', 'd', 'b', 'c'])
  })

  it('counts a long piece at its lowest row, so a tall sofa standing in rows 1 to 3 comes after a chair in row 2', () => {
    const sofa = item('sofa', false, [1, 6], [2, 6], [3, 6])
    const chair = item('chair', false, [2, 7])
    expect(drawOrder([sofa, chair]).map((i) => i.id)).toEqual(['chair', 'sofa'])
    expect(frontRow(sofa.cells)).toBe(3)
  })

  it('is stable: equal front row and column keep a fixed order by id, whatever the order they come in', () => {
    const items = [item('b', false, [2, 2]), item('a', false, [2, 2]), item('c', false, [2, 2])]
    expect(drawOrder(items).map((i) => i.id)).toEqual(['a', 'b', 'c'])
    expect(drawOrder([...items].reverse()).map((i) => i.id)).toEqual(['a', 'b', 'c'])
    expect(drawOrder(drawOrder(items)).map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('does not change its input', () => {
    const items = [item('b', false, [3, 0]), item('a', false, [1, 0])]
    drawOrder(items)
    expect(items.map((i) => i.id)).toEqual(['b', 'a'])
  })
})

/** The objects of a rendered scene in the order they are painted, with their front row, from the markup. */
function painted(html: string): { id: string; row: number }[] {
  return [...html.matchAll(/data-object="([^"]+)" data-front-row="(\d+)"/g)].map((m) => ({ id: m[1]!, row: Number(m[2]) }))
}

describe('the draw order of every kind and of every day of the schedule', () => {
  it('paints every kind in every orientation: flat first, then by front row and column, the shadow only for what stands up', () => {
    const kinds = [...Object.entries(ICON_DEFINITIONS).map(([k, d]) => [k, undefined, d.variants] as const), ...Object.entries(THEME_ICON_DEFINITIONS).map(([k, d]) => ['chair', k, d.variants] as const)]
    const scene: Scene = { width: 12, height: 12, rooms: [{ id: 'A', name: 'A' }], cellRooms: Array.from({ length: 12 }, () => Array.from({ length: 12 }, () => 'A')), objects: [], edgeFeatures: [] }
    const geometry = createGeometry(scene)
    let n = 0
    for (const [type, themeIcon, variants] of kinds) {
      for (const variant of variants) {
        for (const o of ORIENTATIONS) {
          const turned = orientCells(variant.cells, variant.cols, variant.rows, o)
          const solid = solidFor(type as never, themeIcon as never, turned, o)!
          // Three copies in a column of the grid, front one listed first: the output must still be back to front.
          const objects: PlacedObject[] = [8, 0, 4].map((r0, i) => ({ id: `o${i}`, type: type as never, cells: turned.map((c) => ({ row: c.row + r0, col: c.col + 2 })) }))
          const themeIcons = themeIcon ? Object.fromEntries(objects.map((x) => [x.id, themeIcon as never])) : undefined
          const html = renderToStaticMarkup(
            <svg>
              <SceneObjectIcons objects={objects} geometry={geometry} cellRooms={scene.cellRooms} themeIcons={themeIcons} />
            </svg>,
          )
          const order = painted(html).map((p) => p.id)
          expect(order, `${type} ${themeIcon ?? ''} ${variant.id} ${o.rotation}${o.mirror ? 'm' : ''}`).toEqual(['o1', 'o2', 'o0'])
          expect((html.match(/filter="url\(#/g) ?? []).length, 'shadows').toBe(solid.flat ? 0 : 3)
          n++
        }
      }
    }
    expect(n).toBeGreaterThan(500)
  })

  it('paints the objects of every day of the baked schedule with the flat ones first and then by front row and column', () => {
    const { days } = readSchedule()
    let checked = 0
    for (const day of days) {
      const sc = day.puzzle.scene
      const themeIcons = themeIconsFor(day.theme, sc.objects)
      const html = renderToStaticMarkup(
        <svg>
          <SceneObjectIcons objects={sc.objects} geometry={createGeometry(sc)} cellRooms={sc.cellRooms} themeIcons={themeIcons} />
        </svg>,
      )
      const out = painted(html)
      expect(out.length, day.date).toBe(sc.objects.length)
      const flatOf = (id: string) => solidOf(sc.objects.find((o) => o.id === id)!, themeIcons)!.flat
      const keys = out.map((p) => {
        const obj = sc.objects.find((o) => o.id === p.id)!
        return { id: p.id, flat: flatOf(p.id), row: Math.max(...obj.cells.map((c) => c.row)), col: Math.min(...obj.cells.map((c) => c.col)) }
      })
      for (let i = 1; i < keys.length; i++) {
        const a = keys[i - 1]!
        const b = keys[i]!
        const ok = a.flat !== b.flat ? a.flat && !b.flat : a.row !== b.row ? a.row < b.row : a.col !== b.col ? a.col < b.col : a.id < b.id
        expect(ok, `${day.date}: ${a.id} before ${b.id}`).toBe(true)
      }
      checked += out.length
    }
    expect(checked).toBeGreaterThan(1000)
  })
})
