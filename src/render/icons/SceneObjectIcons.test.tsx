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
