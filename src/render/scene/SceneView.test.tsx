import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Scene } from '../../engine/model/index.ts'
import { tutorialPuzzle } from '../../engine/model/tutorial.fixture.ts'
import { createGeometry } from './geometry.ts'
import { roomLabelLayout } from './labels.ts'
import { sample9x9 } from './sample.fixture.ts'
import { SceneView, type SceneViewProps } from './SceneView.tsx'

const tutorial = tutorialPuzzle.scene

function render(props: SceneViewProps): string {
  return renderToStaticMarkup(<SceneView {...props} />)
}

/** An n x n scene with an L-shaped room wrapped around a square one. */
function square(n: number): Scene {
  const half = Math.floor(n / 2)
  return {
    width: n,
    height: n,
    rooms: [
      { id: 'in', name: 'Inner' },
      { id: 'out', name: 'Outer ring' },
    ],
    cellRooms: Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c) => (r < half && c < half ? 'in' : 'out')),
    ),
    objects: [],
    edgeFeatures: [],
  }
}

describe('SceneView', () => {
  it('renders the tutorial as one scalable svg', () => {
    const html = render({ scene: tutorial })
    const g = createGeometry(tutorial)
    expect(html.startsWith('<svg')).toBe(true)
    expect(html).toContain(`viewBox="0 0 ${g.viewBox.width} ${g.viewBox.height}"`)
    expect(html).toContain('width="100%"')
    expect(html.slice(0, html.indexOf('>'))).not.toMatch(/ height="\d/)
  })

  it.each([6, 9, 12, 16])('renders an n x n scene with a hit rect per cell (n = %i)', (n) => {
    const html = render({ scene: square(n) })
    const hits = [...html.matchAll(/<rect data-row="(\d+)" data-col="(\d+)"/g)]
    expect(hits).toHaveLength(n * n)
    expect(hits[0]?.slice(1)).toEqual(['0', '0'])
    expect(hits.at(-1)?.slice(1)).toEqual([String(n - 1), String(n - 1)])
  })

  it('renders non-rectangular rooms and the 9x9 sample', () => {
    const html = render({ scene: sample9x9 })
    for (const room of sample9x9.rooms) expect(html).toContain(`data-room="${room.id}"`)
    expect(html).toContain('data-layer="walls"')
  })

  it('draws a floor path, a label and walls', () => {
    const html = render({ scene: tutorial })
    expect(html).toContain('data-room="living"')
    expect(html).toContain('data-room-label="living"')
    expect(html).toContain('>LIVING ROOM<')
    expect(html).toContain('data-layer="walls"')
  })

  it('draws the room label in Dutch when locale is nl, the same noun the clue text uses (SLAY-5.2)', () => {
    const en = render({ scene: tutorial })
    const nl = render({ scene: tutorial, locale: 'nl' })
    expect(en).toContain('>LIVING ROOM<')
    expect(nl).toContain('>WOONKAMER<')
    expect(nl).not.toContain('LIVING ROOM')
  })

  it('renders windows and doors on their edges', () => {
    const html = render({ scene: sample9x9 })
    expect(html).toContain('data-feature="window"')
    expect(html).toContain('data-feature="door"')
    expect(render({ scene: tutorial })).toContain('data-edge="v4:2"')
  })

  it('toggles axis labels', () => {
    expect(render({ scene: tutorial })).not.toContain('data-layer="axis-labels"')
    const html = render({ scene: tutorial, showAxisLabels: true })
    expect(html).toContain('data-layer="axis-labels"')
    for (const label of ['R1', 'R4', 'C1', 'C4']) expect(html).toContain(`>${label}<`)
    expect(html).not.toContain('>R5<')
  })

  it('always exposes the overlay layers, in paint order below the hit rects; room labels sit above marks and people (SLAY-17.5), notes above the labels (SLAY-20)', () => {
    const html = render({ scene: tutorial })
    const order = ['objects', 'marks', 'people', 'room-labels', 'notes', 'hit'].map((l) =>
      html.indexOf(`data-layer="${l}"`),
    )
    expect(order.every((i) => i >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('fades a room name back over a square with notes, and only that one (SLAY-20)', () => {
    const room = tutorial.rooms[0]!
    const label = roomLabelLayout(tutorial, room.id)!
    const under = `${label.run.row},${Math.floor(label.center.x)}`
    const html = render({ scene: tutorial, notedCells: new Set([under]) })
    const faded = [...html.matchAll(/data-room-label="([^"]+)"[^>]*opacity="0.5"/g)].map((m) => m[1])
    expect(faded).toEqual([room.id])
    expect(render({ scene: tutorial, notedCells: new Set() })).not.toContain('data-yield')
  })

  it('renders layer content, from nodes or from a geometry function', () => {
    const html = render({
      scene: tutorial,
      objectsLayer: <circle data-test="object" />,
      marksLayer: (g) => <circle data-test="mark" cx={g.cellCenter({ row: 0, col: 0 }).x} />,
      peopleLayer: <circle data-test="person" />,
      notesLayer: <text data-test="note" />,
    })
    expect(html).toMatch(/data-layer="notes"[^>]*><text data-test="note"/)
    expect(html).toMatch(/data-layer="objects"[^>]*><circle data-test="object"/)
    expect(html).toMatch(/data-layer="marks"[^>]*><circle data-test="mark" cx="44"/)
    expect(html).toMatch(/data-layer="people"[^>]*><circle data-test="person"/)
  })

  it('keeps pattern ids unique between scenes on one page', () => {
    const ids = (html: string) => [...html.matchAll(/<pattern id="([^"]+)"/g)].map((m) => m[1])
    const both = renderToStaticMarkup(
      <>
        <SceneView scene={tutorial} />
        <SceneView scene={tutorial} />
      </>,
    )
    const all = ids(both)
    expect(all.length).toBeGreaterThan(0)
    expect(new Set(all).size).toBe(all.length)
  })

  it('honours an explicit floor style per room', () => {
    const html = render({ scene: tutorial, roomStyles: { living: 'grass' } })
    expect(html).toMatch(/data-room="living" data-floor="grass"/)
  })
})
