import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { PlacedObject, Scene } from '../../engine/model/index.ts'
import { CELL_SIZE, createGeometry } from '../scene/geometry.ts'
import { sample9x9 } from '../scene/sample.fixture.ts'
import { SceneView } from '../scene/SceneView.tsx'
import { roomClipPath } from '../looks/roomClip.ts'
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
  const scene: Scene = {
    width: 4,
    height: 3,
    rooms: [{ id: 'A', name: 'Hall' }, { id: 'B', name: 'Study' }],
    cellRooms: [['A', 'A', 'B', 'B'], ['A', 'B', 'B', 'B'], ['A', 'A', 'A', 'B']],
    objects: [],
    edgeFeatures: [],
  }
  const geometry = createGeometry(scene)

  /** Rectangles of the clip path data, which is made of `M x y H x V y H x Z` pieces. */
  const rects = (d: string) =>
    [...d.matchAll(/M(-?[\d.]+) (-?[\d.]+)H(-?[\d.]+)V(-?[\d.]+)H/g)].map((m) => ({ x0: +m[1]!, y0: +m[2]!, x1: +m[3]!, y1: +m[4]! }))
  const inside = (d: string, x: number, y: number) => rects(d).some((r) => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1)

  it('clips to the squares of the room: no square of another room is inside, every square of its own is', () => {
    for (const roomId of ['A', 'B']) {
      const d = roomClipPath(scene.cellRooms, roomId, geometry)
      for (let row = 0; row < scene.height; row++) {
        for (let col = 0; col < scene.width; col++) {
          const c = geometry.cellCenter({ row, col })
          const r = geometry.cellRect({ row, col })
          // Probe points just inside the square's four corners and its centre.
          const probes = [c, { x: r.x + 1, y: r.y + 1 }, { x: r.x + r.width - 1, y: r.y + 1 }, { x: r.x + 1, y: r.y + r.height - 1 }, { x: r.x + r.width - 1, y: r.y + r.height - 1 }]
          for (const p of probes) expect(inside(d, p.x, p.y), `${roomId} r${row + 1}c${col + 1}`).toBe(scene.cellRooms[row]![col] === roomId)
        }
      }
    }
  })

  it('lets the top row rise over the grid edge and nothing else leave the grid', () => {
    const d = roomClipPath(scene.cellRooms, 'A', geometry)
    const top = geometry.cellRect({ row: 0, col: 0 })
    expect(inside(d, top.x + 10, top.y - 20)).toBe(true)
    expect(inside(d, top.x + 10, top.y - 200)).toBe(false)
    const row1 = geometry.cellRect({ row: 1, col: 0 })
    expect(inside(d, row1.x + 10, row1.y + row1.height + 10)).toBe(true)
    expect(inside(d, row1.x + row1.width + 10, row1.y + 10)).toBe(false)
  })

  it('wraps every object in the clip of its own room', () => {
    const objects: PlacedObject[] = [
      { id: 'wardrobe-a', type: 'wardrobe', cells: [{ row: 2, col: 0 }, { row: 2, col: 1 }] },
      { id: 'shelf-b', type: 'bookshelf', cells: [{ row: 0, col: 2 }] },
    ]
    const html = draw(scene, objects)
    const room = (id: string) => html.slice(html.indexOf(`data-room-objects="${id}"`))
    expect(room('A')).toContain('data-object="wardrobe-a"')
    expect(room('A').slice(0, room('A').indexOf('data-room-objects="B"') > 0 ? room('A').indexOf('data-room-objects="B"') : undefined)).not.toContain('shelf-b')
    expect(html.match(/clip-path="url\(#/g)?.length).toBe(2)
  })
})
