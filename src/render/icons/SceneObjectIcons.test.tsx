import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createGeometry } from '../scene/geometry.ts'
import { sample9x9 } from '../scene/sample.fixture.ts'
import { SceneView } from '../scene/SceneView.tsx'
import { SceneObjectIcons } from './SceneObjectIcons.tsx'

describe('SceneObjectIcons', () => {
  it('draws every sample object into SceneView\'s objects layer at its cell', () => {
    const html = renderToStaticMarkup(
      <SceneView
        scene={sample9x9}
        objectsLayer={(geometry) => <SceneObjectIcons objects={sample9x9.objects} geometry={geometry} />}
      />,
    )
    const layer = html.slice(html.indexOf('data-layer="objects"'), html.indexOf('data-layer="marks"'))
    for (const object of sample9x9.objects) expect(layer).toContain(`data-object="${object.id}"`)
    // The vertical bed starts at r8c1: its translate is that cell's top-left corner.
    const geometry = createGeometry(sample9x9)
    const bed = geometry.cellRect({ row: 7, col: 0 })
    expect(layer).toContain(`translate(${bed.x} ${bed.y}) scale(0.64)`)
    expect(layer).toContain('data-icon="bed"')
  })

  it('skips objects without a matching footprint', () => {
    const geometry = createGeometry(sample9x9)
    const html = renderToStaticMarkup(
      <svg>
        <SceneObjectIcons
          objects={[{ id: 'odd', type: 'chair', cells: [{ row: 0, col: 0 }, { row: 3, col: 3 }] }]}
          geometry={geometry}
        />
      </svg>,
    )
    expect(html).not.toContain('data-icon')
  })

  it('draws the theme art of an object listed in themeIcons, the engine icon of the others', () => {
    const geometry = createGeometry(sample9x9)
    const objects = [
      { id: 'printer-1', type: 'cabinet' as const, cells: [{ row: 0, col: 0 }] },
      { id: 'kast-1', type: 'cabinet' as const, cells: [{ row: 2, col: 2 }] },
    ]
    const html = renderToStaticMarkup(
      <svg>
        <SceneObjectIcons objects={objects} geometry={geometry} themeIcons={{ 'printer-1': 'printer' }} />
      </svg>,
    )
    expect(html).toContain('data-theme-icon="printer"')
    expect(html).toContain('data-icon="cabinet"')
  })
})

describe('depth filter', () => {
  const count = (html: string) => (html.match(/<filter /g) ?? []).length

  it('defines the filter once for a whole scene, however many objects it has', () => {
    const geometry = createGeometry(sample9x9)
    const html = renderToStaticMarkup(
      <svg>
        <SceneObjectIcons objects={sample9x9.objects} geometry={geometry} />
      </svg>,
    )
    expect(sample9x9.objects.length).toBeGreaterThan(1)
    expect(count(html)).toBe(1)
    expect((html.match(/ filter="url\(#/g) ?? []).length).toBe(sample9x9.objects.length)
  })

  it('paints the objects under the walls and the room labels', () => {
    const html = renderToStaticMarkup(<SceneView scene={sample9x9} objectsLayer={(g) => <SceneObjectIcons objects={sample9x9.objects} geometry={g} />} />)
    const at = (l: string) => html.indexOf(`data-layer="${l}"`)
    expect(at('objects')).toBeLessThan(at('walls'))
    expect(at('walls')).toBeLessThan(at('room-labels'))
  })
})
