import { readFileSync, readdirSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { VICTIM_TEXT, renderClue } from '../../engine/clues/en.ts'
import { VICTIM_TEXT_NL } from '../../engine/clues/nl.ts'
import type { Clue, Person } from '../../engine/model/index.ts'
import { CardGrid } from './CardGrid.tsx'
import { CAST } from './cast.ts'
import { SuspectCard } from './SuspectCard.tsx'
import { VictimCard } from './VictimCard.tsx'

const alice: Person = { id: 'alice', kind: 'suspect', label: 'Alice' }
const scene = { rooms: [{ id: 'living', name: 'Living Room' }] }
const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

describe('SuspectCard', () => {
  it('renders portrait, name and clue text', () => {
    const html = renderToStaticMarkup(<SuspectCard person={alice} clue="Alice zat op een stoel." />)
    expect(html).toContain('<svg')
    expect(html).toContain('polaroid__name">Alice<')
    expect(html).toContain('Alice zat op een stoel.')
  })

  it('shows the whole of a long clue, unclipped', () => {
    const long = `${'Alice was alone with Chloe in the Large Bedroom next to a window. '.repeat(5)}The end.`
    const html = renderToStaticMarkup(<SuspectCard person={alice} clue={long} />)
    expect(html).toContain(long)
  })

  it('falls back to a lettered silhouette outside the cast', () => {
    const html = renderToStaticMarkup(
      <SuspectCard person={{ id: 'a', kind: 'suspect', label: 'A' }} clue="A was alleen." />,
    )
    expect(html).toContain('>A</text>')
  })

  it('marks selected and placed states, default none', () => {
    const plain = renderToStaticMarkup(<SuspectCard person={alice} clue="x" />)
    expect(plain).not.toContain('data-selected')
    expect(plain).not.toContain('data-placed')
    const both = renderToStaticMarkup(<SuspectCard person={alice} clue="x" selected placed />)
    expect(both).toContain('data-selected="true"')
    expect(both).toContain('data-placed="true"')
    expect(both).toContain('geselecteerd')
    expect(both).toContain('geplaatst')
  })

  it('is a toggle button only when it can be tapped', () => {
    expect(renderToStaticMarkup(<SuspectCard person={alice} clue="x" />)).not.toContain('<button')
    const html = renderToStaticMarkup(<SuspectCard person={alice} clue="x" selected onSelect={() => {}} />)
    expect(html).toContain('<button type="button"')
    expect(html).toContain('aria-pressed="true"')
  })

  it('wraps long text at word boundaries: no automatic hyphenation, a word only breaks when longer than a line, the card grows', () => {
    const css = readFileSync(new URL('./cards.css', import.meta.url), 'utf8')
    const clue = css.slice(css.indexOf('.polaroid__clue {'), css.indexOf('}', css.indexOf('.polaroid__clue {')))
    expect(clue).toContain('overflow-wrap: break-word')
    expect(clue).toContain('hyphens: manual')
    expect(clue).not.toContain('hyphens: auto')
    expect(clue).not.toMatch(/^\s*(height|max-height|white-space: nowrap|text-overflow)/m)
    expect(css).toMatch(/minmax\(var\(--card-min\), 1fr\)/)
  })
})

describe('the cast', () => {
  it('alternates woman and man over the eight sample members', () => {
    expect(Object.fromEntries(CAST.map((m) => [m.name, m.gender]))).toEqual({
      Ben: 'man', Alice: 'woman', Dan: 'man', Chloe: 'woman', Emma: 'woman', Frank: 'man', Grace: 'woman', Henry: 'man',
    })
  })
})

describe('VictimCard', () => {
  const html = renderToStaticMarkup(<VictimCard />)

  it('is the victim, worded from en.ts', () => {
    expect(html).toContain(VICTIM_TEXT.title)
    expect(html).toContain(VICTIM_TEXT.clue)
    expect(strip(html)).toContain('The victim Was alone with the murderer.')
  })

  it('is never a button: no card tap ever selects the victim (SLAY-9.24)', () => {
    expect(html).not.toContain('<button')
    const selectedHtml = renderToStaticMarkup(<VictimCard selected />)
    expect(selectedHtml).not.toContain('<button')
  })

  it('shows the same selected ("your turn") styling a suspect card gets, default none', () => {
    expect(html).not.toContain('data-selected')
    const selectedHtml = renderToStaticMarkup(<VictimCard selected />)
    expect(selectedHtml).toContain('data-selected="true"')
  })

  it('keeps the wording in en.ts: no card component spells out the victim rule itself', () => {
    const dir = new URL('./', import.meta.url)
    const sources = readdirSync(dir).filter((f) => /\.(tsx?|css)$/.test(f) && !/\.test\./.test(f))
    expect(sources.length).toBeGreaterThan(5)
    for (const file of sources) {
      const source = readFileSync(new URL(file, dir), 'utf8')
      expect(source, file).not.toMatch(/alone with the murderer/i)
    }
  })

  it('is the victim in Dutch, worded from nl.ts, when locale is nl (SLAY-3.2)', () => {
    const htmlNl = renderToStaticMarkup(<VictimCard locale="nl" />)
    expect(htmlNl).toContain(VICTIM_TEXT_NL.title)
    expect(htmlNl).toContain(VICTIM_TEXT_NL.clue)
    expect(strip(htmlNl)).toContain('Het slachtoffer Was alleen met de moordenaar.')
  })
})

describe('CardGrid', () => {
  const names = CAST.map((m) => m.name)
  const people: Person[] = [
    ...names.map((n) => ({ id: n, kind: 'suspect' as const, label: n })),
    { id: 'V', kind: 'victim', label: 'V' },
  ]
  const clues: Clue[] = [
    { personId: 'Ben', type: 'alone', args: { roomId: 'living' } },
    { personId: 'Alice', type: 'withPerson', args: { otherId: 'Henry' } },
  ]
  const html = renderToStaticMarkup(
    <CardGrid people={people} clues={clues} scene={scene} selectedId="Alice" placedIds={['Henry']} />,
  )

  it('renders a card per suspect plus the victim', () => {
    expect(html.match(/class="polaroid /g)).toHaveLength(9)
    expect(html).toContain('The victim')
  })

  it('renders each clue through renderClue', () => {
    const context = { scene, people }
    expect(html).toContain(renderClue(clues[0] as never, context))
    expect(html).toContain('Alice was with Henry.')
  })

  it('carries the selected and placed states to the right cards', () => {
    expect(html.match(/data-selected="true"/g)).toHaveLength(1)
    expect(html.match(/data-placed="true"/g)).toHaveLength(1)
  })

  it('leaves out the victim card when the puzzle has no victim', () => {
    const none = renderToStaticMarkup(<CardGrid people={[alice]} clues={[]} scene={scene} />)
    expect(none).not.toContain('Het cadeau')
  })

  it("shows the victim's own card as selected once selectedId is theirs, still with no onSelect wiring (SLAY-9.24 AC #3)", () => {
    const victimTurn = renderToStaticMarkup(
      <CardGrid people={people} clues={clues} scene={scene} selectedId="V" placedIds={names} />,
    )
    // Every suspect placed and selectedId on the victim: only the victim's card is selected now.
    expect(victimTurn.match(/data-selected="true"/g)).toHaveLength(1)
    expect(victimTurn.match(/data-placed="true"/g)).toHaveLength(8)
    expect(victimTurn).not.toContain('<button')
  })
})

describe('Spotlight selected state (SLAY-16.8)', () => {
  const css = readFileSync(new URL('./cards.css', import.meta.url), 'utf8')
  const block = (selector: string) => css.slice(css.indexOf(selector), css.indexOf('}', css.indexOf(selector)))

  it('has no outer ring, red glow or scale on a selected card', () => {
    const selected = block('.polaroid[data-selected] {')
    expect(selected).toContain('translateY(-3px)')
    expect(selected).not.toContain('scale')
    expect(block('.polaroid[data-selected] .polaroid__photo {')).not.toMatch(/179, 65, 62|0 0 0 3px/)
    expect(css).not.toContain('.polaroid[data-selected] .polaroid__clue')
  })

  it('draws a 1.5px hairline 3px inside the frame and a 12px pointer above it', () => {
    expect(block('.polaroid[data-selected] .polaroid__photo::before')).toMatch(/inset: 3px[\s\S]*1\.5px solid var\(--accent\)/)
    expect(block('.polaroid[data-selected] .polaroid__photo::after')).toMatch(/top: -13px[\s\S]*width: 12px/)
  })

  it('steps the other unplaced cards back to 0.62 with CSS only', () => {
    expect(block('.card-grid:has([data-selected]) .polaroid:not([data-selected]):not([data-placed])')).toContain('opacity: 0.62')
  })
})
