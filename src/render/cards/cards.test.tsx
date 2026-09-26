import { readFileSync, readdirSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GIFT_NL, renderClue } from '../../engine/clues/nl.ts'
import type { Clue, Person } from '../../engine/model/index.ts'
import { CardGrid } from './CardGrid.tsx'
import { CAST } from './cast.ts'
import { SuspectCard } from './SuspectCard.tsx'
import { VictimCard } from './VictimCard.tsx'

const alice: Person = { id: 'alice', kind: 'suspect', label: 'Alice' }
const scene = { rooms: [{ id: 'living', name: 'Woonkamer' }] }
const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

describe('SuspectCard', () => {
  it('renders portrait, name and clue text', () => {
    const html = renderToStaticMarkup(<SuspectCard person={alice} clue="Alice zat op een stoel." />)
    expect(html).toContain('<svg')
    expect(html).toContain('polaroid__name">Alice<')
    expect(html).toContain('Alice zat op een stoel.')
  })

  it('shows the whole of a long clue, unclipped', () => {
    const long = `${'Alice was alleen met Chloe in de Grote slaapkamer bij een raam. '.repeat(5)}Einde.`
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
  it('alternates vrouw and man over the eight placeholder members', () => {
    expect(Object.fromEntries(CAST.map((m) => [m.name, m.gender]))).toEqual({
      Ben: 'man', Alice: 'vrouw', Dan: 'man', Chloe: 'vrouw', Emma: 'vrouw', Frank: 'man', Grace: 'vrouw', Henry: 'man',
    })
  })
})

describe('VictimCard', () => {
  const html = renderToStaticMarkup(<VictimCard />)

  it('is the gift, worded from nl.ts', () => {
    expect(html).toContain(GIFT_NL.title)
    expect(html).toContain(GIFT_NL.clue)
    expect(strip(html)).toContain('Het cadeau Was alleen met de dader.')
  })

  it('uses no murder wording anywhere in markup or card sources', () => {
    const words = /moord|vermoord|slachtoffer|murder|killer/i
    expect(html).not.toMatch(words)
    expect(html).not.toMatch(/victim/i)
    const dir = new URL('./', import.meta.url)
    const sources = [
      ...readdirSync(dir).filter((f) => /\.(tsx?|css)$/.test(f) && !/\.test\./.test(f)),
      ...readdirSync(new URL('./avatars/', import.meta.url)).map((f) => `avatars/${f}`),
    ]
    expect(sources.length).toBeGreaterThan(10)
    for (const file of sources) {
      const source = readFileSync(new URL(file, dir), 'utf8')
      expect(source.replace(/aloneWithMurderer/g, ''), file).not.toMatch(words)
    }
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

  it('renders a card per suspect plus the gift', () => {
    expect(html.match(/class="polaroid /g)).toHaveLength(9)
    expect(html).toContain('Het cadeau')
  })

  it('renders each clue through renderClue', () => {
    const context = { scene, people }
    expect(html).toContain(renderClue(clues[0] as never, context))
    expect(html).toContain('Alice was samen met Henry.')
  })

  it('carries the selected and placed states to the right cards', () => {
    expect(html.match(/data-selected="true"/g)).toHaveLength(1)
    expect(html.match(/data-placed="true"/g)).toHaveLength(1)
  })

  it('leaves out the gift card when the puzzle has no victim', () => {
    const none = renderToStaticMarkup(<CardGrid people={[alice]} clues={[]} scene={scene} />)
    expect(none).not.toContain('Het cadeau')
  })
})
