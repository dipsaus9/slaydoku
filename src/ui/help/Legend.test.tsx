import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { generatedPuzzles } from '../../content/generated.testing.ts'
import { demoPuzzle } from '../../content/demo/puzzle.ts'
import { themeObjectOf } from '../../content/themes/drawn.ts'
import { objectNouns } from '../../engine/clues/en.ts'
import { OBJECT_WORDS_NL } from '../../engine/clues/nl.ts'
import { OBJECT_CATALOG, cellKey } from '../../engine/model/index.ts'
import type { PlacedObject, Puzzle, Scene } from '../../engine/model/index.ts'
import { HELP_CONTENT, help } from '../../content/help/help.ts'
import { LocaleProvider } from '../../locale/index.ts'
import type { Locale } from '../../locale/index.ts'
import { castFor, colorsFor, noteTags } from '../play/people.ts'
import { Legend } from './Legend.tsx'
import { legendOf } from './legend.ts'

/** The drawn kind of an object, written independently of legend.ts: engine type plus theme icon. */
const kindOf = (o: Pick<PlacedObject, 'id' | 'type'>) => `${o.type}:${themeObjectOf(o)?.themeIcon ?? 'engine'}`

/** The browser language `LocaleProvider` defaults from, per `Locale` (SLAY-3.4), same mapping every other test uses. */
const BROWSER_LANGUAGE: Record<Locale, string> = { en: 'en-US', nl: 'nl-NL' }

interface Subject {
  name: string
  puzzle: Puzzle
}
const houses: Subject[] = [{ name: 'level demo', puzzle: demoPuzzle }]
/** Generated puzzles of every theme: two chair kinds side by side, beanbags, hammocks, several sofas that look alike. */
const picked: Subject[] = generatedPuzzles().map((e) => ({ name: `generated puzzle ${e.id}`, puzzle: e.puzzle }))
const everyPack: Subject[] = picked

function expectRowsMatchScene(scene: Scene, locale: Locale = 'en') {
  const legend = legendOf(scene, locale)
  const onBoard = new Set(scene.objects.map(kindOf))
  // exactly one row per object kind on the board, and no row for a kind that is not there
  expect(legend.objects.map((r) => r.key).sort()).toEqual([...onBoard].sort())
  expect(new Set(legend.objects.map((r) => r.key)).size).toBe(legend.objects.length)
  for (const row of legend.objects) {
    const members = scene.objects.filter((o) => kindOf(o) === row.key)
    // the can / cannot flag is the engine catalog's
    expect(row.occupiable).toBe(OBJECT_CATALOG[row.type].occupiable)
    if (locale === 'nl') {
      // Dutch never names the specific theme kind (SLAY-6.2's nl.ts precedent): always the type's one generic noun, nothing "also"
      expect(row.noun).toBe(OBJECT_WORDS_NL[row.type].noun)
      expect(row.alsoNouns).toEqual([])
    } else {
      // the noun is one the clue cards use for this type
      expect(objectNouns(scene.objects, row.type)).toContain(row.noun)
    }
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

function renderLegend(puzzle: Puzzle, locale: Locale = 'en'): string {
  return renderToStaticMarkup(
    <LocaleProvider storage={null} browserLanguage={BROWSER_LANGUAGE[locale]}>
      <Legend puzzle={puzzle} cast={castFor(puzzle)} tags={noteTags(puzzle.people)} colors={colorsFor(puzzle.people)} onShow={() => {}} />
    </LocaleProvider>,
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
    const rows = houses.flatMap(({ puzzle }) => legendOf(puzzle.scene, 'en').objects)
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

  it('lists mixed chairs by their own names: a poof next to a garden chair are two rows', () => {
    const scene: Scene = {
      width: 3,
      height: 1,
      rooms: [{ id: 'r', name: 'Garden' }],
      cellRooms: [['r', 'r', 'r']],
      objects: [
        { id: 'gardenChair-1', type: 'chair', cells: [{ row: 0, col: 0 }] },
        { id: 'poof-1', type: 'chair', cells: [{ row: 0, col: 1 }] },
        { id: 'gardenChair-2', type: 'chair', cells: [{ row: 0, col: 2 }] },
      ],
      edgeFeatures: [],
    }
    const legend = expectRowsMatchScene(scene)
    expect(legend.objects.map((r) => [r.noun, r.occupiable, r.cells.length])).toEqual([
      ['garden chair', true, 2],
      ['poof', true, 1],
    ])
    expect(legend.objects[0]!.themeIcon).toBeUndefined()
    expect(legend.objects[1]!.themeIcon).toBe('beanbag')
  })

  it('names chairs that look alike (garden chair, school chair) with the plain noun and lists the others as "also"', () => {
    const scene: Scene = {
      width: 2,
      height: 1,
      rooms: [{ id: 'r', name: 'Garden' }],
      cellRooms: [['r', 'r']],
      objects: [
        { id: 'gardenChair-1', type: 'chair', cells: [{ row: 0, col: 0 }] },
        { id: 'schoolChair-1', type: 'chair', cells: [{ row: 0, col: 1 }] },
      ],
      edgeFeatures: [],
    }
    const [row, ...rest] = expectRowsMatchScene(scene).objects
    expect(rest).toHaveLength(0)
    expect(row!.noun).toBe('chair')
    expect(row!.alsoNouns).toEqual(['garden chair', 'school chair'])
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
    const legend = legendOf(generatedPuzzles().find((p) => p.theme === 'shop')!.puzzle.scene, 'en')
    expect(legend.objects.some((r) => r.noun === 'garden chair')).toBe(false)
  })
})

describe('legendOf, nl locale', () => {
  for (const { name, puzzle } of [...houses, ...picked]) {
    it(`${name}: one row per object kind, the type's real Dutch noun and the right flag`, () => {
      expectRowsMatchScene(puzzle.scene, 'nl')
    })
  }

  it('collapses look-alike kinds to the one Dutch noun: a poof and a garden chair both say "stoel", nothing "also"', () => {
    const scene: Scene = {
      width: 3,
      height: 1,
      rooms: [{ id: 'r', name: 'Garden' }],
      cellRooms: [['r', 'r', 'r']],
      objects: [
        { id: 'gardenChair-1', type: 'chair', cells: [{ row: 0, col: 0 }] },
        { id: 'poof-1', type: 'chair', cells: [{ row: 0, col: 1 }] },
        { id: 'gardenChair-2', type: 'chair', cells: [{ row: 0, col: 2 }] },
      ],
      edgeFeatures: [],
    }
    const legend = expectRowsMatchScene(scene, 'nl')
    expect(legend.objects.map((r) => [r.noun, r.alsoNouns])).toEqual([
      [OBJECT_WORDS_NL.chair.noun, []],
      [OBJECT_WORDS_NL.chair.noun, []],
    ])
  })

  it('names chairs that look alike (garden chair, school chair) with the generic Dutch noun too, unlike English which keeps them apart', () => {
    const scene: Scene = {
      width: 2,
      height: 1,
      rooms: [{ id: 'r', name: 'Garden' }],
      cellRooms: [['r', 'r']],
      objects: [
        { id: 'gardenChair-1', type: 'chair', cells: [{ row: 0, col: 0 }] },
        { id: 'schoolChair-1', type: 'chair', cells: [{ row: 0, col: 1 }] },
      ],
      edgeFeatures: [],
    }
    const [row, ...rest] = expectRowsMatchScene(scene, 'nl').objects
    expect(rest).toHaveLength(0)
    expect(row!.noun).toBe(OBJECT_WORDS_NL.chair.noun)
    expect(row!.alsoNouns).toEqual([])
  })
})

describe('<Legend/>', () => {
  for (const { name, puzzle } of [...houses, ...picked]) {
    for (const locale of ['en', 'nl'] as const) {
      it(`${name}, ${locale}: one button per row, each with its ${locale} noun and flag`, () => {
        const html = renderLegend(puzzle, locale)
        const legend = legendOf(puzzle.scene, locale)
        const t = HELP_CONTENT[locale].legend
        const objectList = html.slice(html.indexOf('data-legend-list="objects"'), html.indexOf('</ul>', html.indexOf('data-legend-list="objects"')))
        expect((objectList.match(/<button\b/g) ?? []).length).toBe(legend.objects.length)
        for (const row of legend.objects) {
          const button = objectList.match(new RegExp(`<button[^>]*data-legend="${row.key}"[\\s\\S]*?</button>`))?.[0]
          expect(button, row.key).toBeDefined()
          expect(button).toContain(`<strong>${row.noun}</strong>`)
          expect(button).toContain(row.occupiable ? t.canOccupy : t.blocked)
          expect(button).not.toContain(row.occupiable ? t.blocked : t.canOccupy)
          expect(button).toContain('<svg') // drawn as its icon
        }
      })
    }
  }

  it('switches the object nouns when the active locale is nl instead of en: same puzzle, two renders, real Dutch nouns (proves legendOf reads locale reactively, not a hardcoded English import)', () => {
    const puzzle = houses[0]!.puzzle
    const en = renderLegend(puzzle, 'en')
    const nl = renderLegend(puzzle, 'nl')
    const legendNl = legendOf(puzzle.scene, 'nl')
    expect(legendNl.objects.length).toBeGreaterThan(0)
    for (const row of legendNl.objects) {
      expect(nl).toContain(`<strong>${row.noun}</strong>`)
      // the nl noun is the type's real Dutch generic noun, not whatever English rendered for the same row key
      expect(row.noun).toBe(OBJECT_WORDS_NL[row.type].noun)
    }
    expect(en).not.toBe(nl)
  })

  it('switches the surrounding chrome text (section headings, the occupied/blocked flag, the rule) too, not only the object nouns (SLAY-9.4: this text used to come from a hardcoded English-only import)', () => {
    const puzzle = houses[0]!.puzzle
    const nl = renderLegend(puzzle, 'nl')
    const tNl = HELP_CONTENT.nl.legend
    expect(nl).toContain(tNl.objectsTitle)
    expect(nl).toContain(tNl.marksTitle)
    expect(nl).toContain(tNl.rule)
    expect(nl).not.toContain(help.legend.objectsTitle) // the English fallback text must not leak into an nl render
    expect(nl).not.toContain(help.legend.rule)
  })

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

  it('explains the room label, the four marks and the gift rule', () => {
    const html = renderLegend(houses[0]!.puzzle)
    for (const id of ['room-label', 'mark-note', 'mark-cross', 'mark-person', 'mark-gift']) expect(html).toContain(`data-legend="${id}"`)
    expect(html).toContain(help.legend.rule)
    expect(html).toContain('The victim')
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
