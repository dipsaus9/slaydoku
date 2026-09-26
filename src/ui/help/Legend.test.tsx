import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { generatedPuzzles } from '../../content/generated.testing.ts'
import { demoLevels } from '../../content/levels.ts'
import { themeObjectOf } from '../../content/themes/drawn.ts'
import { objectNouns } from '../../engine/clues/nl.ts'
import { OBJECT_CATALOG, cellKey } from '../../engine/model/index.ts'
import type { PlacedObject, Puzzle, Scene } from '../../engine/model/index.ts'
import { help } from '../../content/help/help.ts'
import { castFor, colorsFor, noteTags } from '../play/people.ts'
import { Legend } from './Legend.tsx'
import { legendOf } from './legend.ts'

/** The drawn kind of an object, written independently of legend.ts: engine type plus theme icon. */
const kindOf = (o: Pick<PlacedObject, 'id' | 'type'>) => `${o.type}:${themeObjectOf(o)?.themeIcon ?? 'engine'}`

interface Subject {
  name: string
  puzzle: Puzzle
}
const houses: Subject[] = demoLevels.map((l) => ({ name: `level ${l.id}`, puzzle: l.puzzle }))
/** Generated puzzles of every theme: two chair kinds side by side, beanbags, hammocks, several sofas that look alike. */
const picked: Subject[] = generatedPuzzles().map((e) => ({ name: `generated puzzle ${e.id}`, puzzle: e.puzzle }))
const everyPack: Subject[] = picked

function expectRowsMatchScene(scene: Scene) {
  const legend = legendOf(scene)
  const onBoard = new Set(scene.objects.map(kindOf))
  // exactly one row per object kind on the board, and no row for a kind that is not there
  expect(legend.objects.map((r) => r.key).sort()).toEqual([...onBoard].sort())
  expect(new Set(legend.objects.map((r) => r.key)).size).toBe(legend.objects.length)
  for (const row of legend.objects) {
    const members = scene.objects.filter((o) => kindOf(o) === row.key)
    // the can / cannot flag is the engine catalog's
    expect(row.occupiable).toBe(OBJECT_CATALOG[row.type].occupiable)
    // the noun is one the clue cards use for this type
    expect(objectNouns(scene.objects, row.type)).toContain(row.noun)
    // it flashes exactly the squares of its objects
    const squares = new Set(members.flatMap((o) => o.cells.map(cellKey)))
    expect(new Set(row.cells.map(cellKey))).toEqual(squares)
    expect(row.cells).toHaveLength(squares.size)
    expect(members.map((o) => o.id)).toContain(row.sample.id)
  }
  // catalog order is kept, people-can-stand-on-it first
  const flags = legend.objects.map((r) => r.occupiable)
  expect(flags).toEqual([...flags].sort((a, b) => Number(b) - Number(a)))
  // doors and windows: a row for each kind that occurs, none for one that does not
  expect(legend.edges.map((e) => e.kind)).toEqual(
    (['door', 'window'] as const).filter((k) => scene.edgeFeatures.some((f) => f.kind === k)),
  )
  return legend
}

function renderLegend(puzzle: Puzzle): string {
  return renderToStaticMarkup(
    <Legend puzzle={puzzle} cast={castFor(puzzle)} tags={noteTags(puzzle.people)} colors={colorsFor(puzzle.people)} onShow={() => {}} />,
  )
}

describe('legendOf on the demo level', () => {
  for (const { name, puzzle } of houses) {
    it(`${name}: one row per object kind on the board, with the clue noun and the right flag`, () => {
      const legend = expectRowsMatchScene(puzzle.scene)
      expect(legend.objects.length).toBeGreaterThan(0)
      for (const row of legend.objects) expect(row.themeIcon).toBeUndefined() // demo objects draw the engine icons
    })
  }

  it('says a bed, sofa and chair can be occupied and a plant, cabinet and dining table cannot (demo level)', () => {
    const rows = houses.flatMap(({ puzzle }) => legendOf(puzzle.scene).objects)
    const flag = (type: string) => new Set(rows.filter((r) => r.type === type).map((r) => r.occupiable))
    for (const type of ['bed', 'sofa', 'chair']) if (rows.some((r) => r.type === type)) expect(flag(type)).toEqual(new Set([true]))
    for (const type of ['diningTable', 'plant', 'cabinet', 'washingMachine']) if (rows.some((r) => r.type === type)) expect(flag(type)).toEqual(new Set([false]))
    expect(rows.some((r) => r.type === 'bed')).toBe(true)
    expect(rows.some((r) => r.type === 'plant')).toBe(true)
  })
})

describe('legendOf on generated scenes', () => {
  for (const { name, puzzle } of picked) {
    it(`${name}: one row per object kind, right noun and flag`, () => {
      expectRowsMatchScene(puzzle.scene)
    })
  }

  it('lists mixed chairs by their own names: a poef next to a tuinstoel are two rows', () => {
    const scene: Scene = {
      width: 3,
      height: 1,
      rooms: [{ id: 'r', name: 'Tuin' }],
      cellRooms: [['r', 'r', 'r']],
      objects: [
        { id: 'tuinstoel-1', type: 'chair', cells: [{ row: 0, col: 0 }] },
        { id: 'poef-1', type: 'chair', cells: [{ row: 0, col: 1 }] },
        { id: 'tuinstoel-2', type: 'chair', cells: [{ row: 0, col: 2 }] },
      ],
      edgeFeatures: [],
    }
    const legend = expectRowsMatchScene(scene)
    expect(legend.objects.map((r) => [r.noun, r.occupiable, r.cells.length])).toEqual([
      ['tuinstoel', true, 2],
      ['poef', true, 1],
    ])
    expect(legend.objects[0]!.themeIcon).toBeUndefined()
    expect(legend.objects[1]!.themeIcon).toBe('beanbag')
  })

  it('names chairs that look alike (tuinstoel, schoolstoel) with the plain noun and lists the others as "ook"', () => {
    const scene: Scene = {
      width: 2,
      height: 1,
      rooms: [{ id: 'r', name: 'Tuin' }],
      cellRooms: [['r', 'r']],
      objects: [
        { id: 'tuinstoel-1', type: 'chair', cells: [{ row: 0, col: 0 }] },
        { id: 'schoolstoel-1', type: 'chair', cells: [{ row: 0, col: 1 }] },
      ],
      edgeFeatures: [],
    }
    const [row, ...rest] = expectRowsMatchScene(scene).objects
    expect(rest).toHaveLength(0)
    expect(row!.noun).toBe('stoel')
    expect(row!.alsoNouns).toEqual(['tuinstoel', 'schoolstoel'])
  })

  it('holds on every generated scene, and the sample has mixed chairs to prove it', () => {
    let mixed = 0
    for (const { puzzle } of everyPack) {
      const legend = expectRowsMatchScene(puzzle.scene)
      if (legend.objects.filter((r) => r.type === 'chair').length > 1) mixed += 1
    }
    expect(mixed).toBeGreaterThan(0)
  })

  it('has no row for a kind that is not on the board, even when the theme has it', () => {
    const legend = legendOf(generatedPuzzles().find((p) => p.theme === 'shop')!.puzzle.scene)
    expect(legend.objects.some((r) => r.noun === 'tuinstoel')).toBe(false)
  })
})

describe('<Legend/>', () => {
  for (const { name, puzzle } of [...houses, ...picked]) {
    it(`${name}: one button per row, each with its noun and flag`, () => {
      const html = renderLegend(puzzle)
      const legend = legendOf(puzzle.scene)
      const objectList = html.slice(html.indexOf('data-legend-list="objects"'), html.indexOf('</ul>', html.indexOf('data-legend-list="objects"')))
      expect((objectList.match(/<button\b/g) ?? []).length).toBe(legend.objects.length)
      for (const row of legend.objects) {
        const button = objectList.match(new RegExp(`<button[^>]*data-legend="${row.key}"[\\s\\S]*?</button>`))?.[0]
        expect(button, row.key).toBeDefined()
        expect(button).toContain(`<strong>${row.noun}</strong>`)
        expect(button).toContain(row.occupiable ? help.legend.canOccupy : help.legend.blocked)
        expect(button).not.toContain(row.occupiable ? help.legend.blocked : help.legend.canOccupy)
        expect(button).toContain('<svg') // drawn as its icon
      }
    })
  }

  it('shows door and window rows only when the level has them', () => {
    for (const { puzzle } of [...houses, ...picked]) {
      const html = renderLegend(puzzle)
      for (const kind of ['door', 'window'] as const) {
        const has = puzzle.scene.edgeFeatures.some((f) => f.kind === kind)
        expect(html.includes(`data-legend="${kind}"`), kind).toBe(has)
      }
    }
    // the demo level and the sample have at least one of each kind between them
    const all = [...houses, ...picked].map((h) => renderLegend(h.puzzle)).join('')
    expect(all).toContain('data-legend="door"')
    expect(all).toContain('data-legend="window"')
  })

  it('explains the room label, the four marks and the gift rule, in Dutch', () => {
    const html = renderLegend(houses[0]!.puzzle)
    for (const id of ['room-label', 'mark-note', 'mark-cross', 'mark-person', 'mark-gift']) expect(html).toContain(`data-legend="${id}"`)
    expect(html).toContain(help.legend.rule)
    expect(html).toContain('Het cadeau')
    expect(html).toContain(help.legend.canOccupy)
    expect(html).toContain(help.legend.blocked)
  })

  it('draws the marks with the glyphs of the board (letter, cross, portrait, gift)', () => {
    const puzzle = houses[0]!.puzzle
    const html = renderLegend(puzzle)
    const suspect = puzzle.people.find((p) => p.kind === 'suspect')!
    expect(html).toContain(`>${noteTags(puzzle.people)[suspect.id]}</text>`)
    expect(html).toMatch(/data-mark-sample="cross"[\s\S]*?<path d="M24 24 L76 76 M76 24 L24 76"/)
    expect(html).toContain('data-mark-sample="person"')
    expect(html).toContain('data-mark-sample="gift"')
  })
})
