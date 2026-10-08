import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MONKEY_FUR, CAST_POOL, PORTRAIT_DESIGNS, castFor, portraitsFor, traitsOf } from '../../../content/cast/index.ts'
import type { Person } from '../../../engine/model/index.ts'
import { CardGrid } from '../CardGrid.tsx'
import { SuspectCard } from '../SuspectCard.tsx'
import { buildCast, buildCastForBoard, buildCastFromPeople, cardLookOf, MAX_SUSPECTS, suspectsForSize } from './cast.tsx'
import { ProceduralAvatar } from './ProceduralAvatar.tsx'
import { createRng } from './rng.ts'
import { traitDistance } from './traits.ts'

describe('rng', () => {
  it('repeats itself for one seed and differs between seeds', () => {
    const run = (seed: string) => Array.from({ length: 5 }, () => 0).map(((r) => () => r.next())(createRng(seed)))
    expect(run('a')).toEqual(run('a'))
    expect(run('a')).not.toEqual(run('b'))
    expect(run('a').every((n) => n >= 0 && n < 1)).toBe(true)
  })
})

describe('ProceduralAvatar', () => {
  const traits = traitsOf(portraitsFor(['woman'], 't')[0]!)

  it('renders one 100x100 svg, named or decorative', () => {
    const named = renderToStaticMarkup(<ProceduralAvatar traits={traits} title="Sara" size={64} />)
    expect(named.startsWith('<svg')).toBe(true)
    expect(named).toContain('viewBox="0 0 100 100"')
    expect(named).toContain('width="64"')
    expect(named).toContain('aria-label="Sara"')
    const hidden = renderToStaticMarkup(<ProceduralAvatar traits={traits} title="Sara" decorative />)
    expect(hidden).toContain('aria-hidden="true"')
    expect(hidden).not.toContain('aria-label')
  })

  it('draws every design in every colour without leaving an unresolved value in the markup', () => {
    for (let seed = 0; seed < 30; seed++) {
      for (const look of portraitsFor(PORTRAIT_DESIGNS.map((d) => d.gender), seed)) {
        expect(renderToStaticMarkup(<ProceduralAvatar traits={traitsOf(look)} />)).not.toMatch(/undefined|NaN|\[object/)
      }
    }
  })
})

describe('buildCast', () => {
  it.each([6, 7, 9, 12, 16])('gives a %sx%s board its suspects, from castFor, with a portrait each', (size) => {
    const cast = buildCastForBoard(size, 'seed')
    expect(cast.names).toHaveLength(suspectsForSize(size))
    expect(cast.names).toEqual(castFor(size, 'seed').names)
    expect(cast.genders).toEqual(castFor(size, 'seed').genders)
    expect(new Set(cast.entries.map((e) => renderToStaticMarkup(<>{e.look.portrait}</>))).size).toBe(suspectsForSize(size))
  })

  it('is deterministic per seed and differs between seeds', () => {
    expect(buildCast(11, 's1').names).toEqual(buildCast(11, 's1').names)
    expect(buildCast(11, 's1').names).not.toEqual(buildCast(11, 's2').names)
  })

  it('holds one suspect per first letter at most', () => {
    expect(buildCast(MAX_SUSPECTS, 'full').names).toHaveLength(MAX_SUSPECTS)
    expect(() => buildCast(MAX_SUSPECTS + 1)).toThrow(RangeError)
    expect(() => buildCast(-1)).toThrow(RangeError)
  })

  it('finds a look by label, ignoring case and spaces', () => {
    const cast = buildCast(9, 's1')
    const entry = cast.entries[4]!
    expect(cast.lookFor(` ${entry.name.toUpperCase()} `)).toBe(entry.look)
    expect(cast.lookFor('Nobody')).toBeUndefined()
  })

  it('draws a portrait from the gender slot and the seed, not from the name', () => {
    const people = (names: string[]) => names.map((name, i) => ({ name, gender: i % 2 === 0 ? ('woman' as const) : ('man' as const) }))
    const a = buildCastFromPeople(people(['Amy', 'Bob', 'Clara', 'Dan']), 'x')
    const b = buildCastFromPeople(people(['Anna', 'Ben', 'Chloe', 'David']), 'x')
    const draw = (built: typeof a) => built.entries.map((e) => renderToStaticMarkup(<>{e.look.portrait}</>).replace(/aria-label="[^"]*"/g, ''))
    expect(draw(a)).toEqual(draw(b))
    expect(draw(a)).not.toEqual(draw(buildCastFromPeople(people(['Amy', 'Bob', 'Clara', 'Dan']), 'y')))
  })

  it('uses the pool gender for a name without one, and alternates for an unknown name', () => {
    const built = buildCastFromPeople([{ name: 'Ben' }, { name: 'Zed' }, { name: 'Zoe' }])
    expect(built.genders).toEqual(['man', 'man', 'woman'])
  })
})

describe('portraits', () => {
  it('has at least four female-coded and four male-coded designs, all different in hair and accessory', () => {
    expect(PORTRAIT_DESIGNS.filter((d) => d.gender === 'woman').length).toBeGreaterThanOrEqual(4)
    expect(PORTRAIT_DESIGNS.filter((d) => d.gender === 'man').length).toBeGreaterThanOrEqual(4)
    expect(new Set(PORTRAIT_DESIGNS.map((d) => d.id)).size).toBe(PORTRAIT_DESIGNS.length)
    expect(new Set(PORTRAIT_DESIGNS.map((d) => `${d.hairStyle}|${d.accessory}`)).size).toBe(PORTRAIT_DESIGNS.length)
    expect(new Set(PORTRAIT_DESIGNS.map((d) => `${d.gender}|${d.hairStyle}|${d.clothesStyle}|${d.accessory}`)).size).toBe(PORTRAIT_DESIGNS.length)
  })

  it('is deterministic per genders and seed', () => {
    const genders = castFor(9, 'p').genders
    expect(portraitsFor(genders, 'p')).toEqual(portraitsFor(genders, 'p'))
    expect(portraitsFor(genders, 'p')).not.toEqual(portraitsFor(genders, 'q'))
  })

  it.each([6, 9, 12, 16])('makes everybody of a %s-person puzzle look different', (size) => {
    for (let seed = 0; seed < 60; seed++) {
      const { genders } = castFor(size, seed)
      const looks = portraitsFor(genders, seed)
      const traits = looks.map(traitsOf)
      expect(new Set(looks.map((l) => l.design)).size, `seed ${seed}`).toBe(looks.length)
      expect(new Set(looks.map((l) => l.clothesColor)).size, `seed ${seed}`).toBe(Math.min(looks.length, 10))
      for (const [i, a] of traits.entries()) {
        for (const b of traits.slice(i + 1)) expect(traitDistance(a, b), `seed ${seed}`).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('codes the design to the gender slot', () => {
    const looks = portraitsFor(['woman', 'man', 'man', 'woman'], 3)
    expect(looks.map((l) => l.design.charAt(0))).toEqual(['f', 'm', 'm', 'f'])
  })

  it('carries no name: a portrait is plain data', () => {
    for (const look of portraitsFor(['woman', 'man'], 1)) {
      const text = JSON.stringify(look)
      for (const { name } of CAST_POOL) expect(text).not.toContain(name)
    }
  })
})

describe('SuspectCard with a look', () => {
  const cast = buildCast(15, 'card')
  const entry = cast.entries[12]!
  const person: Person = { id: 'p13', kind: 'suspect', label: entry.name }

  it('shows the portrait, name and colours of the look', () => {
    const html = renderToStaticMarkup(<SuspectCard person={person} clue="Was in the garden." look={entry.look} />)
    expect(html).toContain(`polaroid__name">${entry.name}<`)
    expect(html).toContain('<svg')
    expect(html).not.toContain('</text>')
    expect(html).toContain(entry.look.photo)
    expect(html).toContain(entry.look.bubble)
  })

  it('falls back to the lettered silhouette without a look, whatever the name', () => {
    expect(renderToStaticMarkup(<SuspectCard person={person} clue="x" />)).toContain('</text>')
    const alice: Person = { id: 'r', kind: 'suspect', label: 'Alice' }
    expect(renderToStaticMarkup(<SuspectCard person={alice} clue="x" />)).toContain('</text>')
  })

  it('lets CardGrid give all 15 suspects a portrait', () => {
    const people: Person[] = [
      ...cast.names.map((n) => ({ id: n, kind: 'suspect' as const, label: n })),
      { id: 'V', kind: 'victim', label: 'V' },
    ]
    const html = renderToStaticMarkup(
      <CardGrid people={people} clues={[]} scene={{ rooms: [] }} lookFor={cast.lookFor} />,
    )
    expect(html.match(/class="polaroid /g)).toHaveLength(16)
    expect(html).not.toContain('</text>')
  })
})

describe('the monkey Biko', () => {
  const people = [{ name: 'Anne', gender: 'woman' as const }, { name: 'Biko', gender: 'man' as const }, { name: 'Ruben', gender: 'man' as const }]
  it('is a monkey on every cast build, and only Biko is', () => {
    for (const seed of ['a', 'b', 'c']) {
      const built = buildCastFromPeople(people, seed)
      const html = (n: string) => renderToStaticMarkup(<>{built.lookFor(n)!.portrait}</>)
      expect(html('Biko')).toContain(MONKEY_FUR)
      expect(html('Anne')).not.toContain(MONKEY_FUR)
      expect(html('Ruben')).not.toContain(MONKEY_FUR)
    }
  })
  it('renders from a baked look too', () => {
    const cast = castFor(12, 'monkey-seed', [], 'simpshouse')
    const i = cast.names.indexOf('Biko')
    if (i >= 0) expect(renderToStaticMarkup(<>{cardLookOf(cast.portraits[i]!, 'Biko').portrait}</>)).toContain('<svg')
  })
})
