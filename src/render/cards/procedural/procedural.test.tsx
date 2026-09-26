import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Person } from '../../../engine/model/index.ts'
import { CAST } from '../cast.ts'
import { CardGrid } from '../CardGrid.tsx'
import { SuspectCard } from '../SuspectCard.tsx'
import { buildCast, buildCastForBoard, MAX_SUSPECTS, suspectsForSize } from './cast.tsx'
import { generateAvatar, generateAvatars } from './generate.ts'
import { GENDERED_NAMES, NAME_POOL } from './names.ts'
import { ProceduralAvatar } from './ProceduralAvatar.tsx'
import { createRng } from './rng.ts'
import { MIN_DISTANCE, traitDistance } from './traits.ts'

const markup = (a: ReturnType<typeof generateAvatar>) => renderToStaticMarkup(<ProceduralAvatar traits={a.traits} />)
const FIXED = ['Alice', 'Ben', 'Chloe', 'Dan', 'Emma', 'Frank', 'Grace', 'Henry']

describe('rng', () => {
  it('repeats itself for one seed and differs between seeds', () => {
    const run = (seed: string) => Array.from({ length: 5 }, () => 0).map(((r) => () => r.next())(createRng(seed)))
    expect(run('a')).toEqual(run('a'))
    expect(run('a')).not.toEqual(run('b'))
    expect(run('a').every((n) => n >= 0 && n < 1)).toBe(true)
  })
})

describe('generateAvatar', () => {
  it('is deterministic per seed and index', () => {
    expect(generateAvatar('alice', 3)).toEqual(generateAvatar('alice', 3))
    expect(generateAvatar('alice')).toEqual(generateAvatar('alice', 0))
  })

  it('gives other seeds other avatars', () => {
    const keys = new Set(['a', 'b', 'c', 'd', 'e', 'f'].map((s) => generateAvatar(s).key))
    expect(keys.size).toBeGreaterThan(4)
  })

  it('keeps earlier avatars when the set grows', () => {
    expect(generateAvatars('x', 15).slice(0, 7)).toEqual(generateAvatars('x', 7))
    expect(generateAvatar('x', 6)).toEqual(generateAvatars('x', 15)[6])
  })

  it.each(['slaydoku', 'alice', 'seed-3', 42])('15 avatars from seed %s are pairwise different', (seed) => {
    const avatars = generateAvatars(seed, 15)
    expect(avatars).toHaveLength(15)
    expect(new Set(avatars.map((a) => a.key)).size).toBe(15)
    expect(new Set(avatars.map(markup)).size).toBe(15)
    for (const [i, a] of avatars.entries()) {
      for (const b of avatars.slice(i + 1)) {
        expect(traitDistance(a.traits, b.traits)).toBeGreaterThanOrEqual(MIN_DISTANCE)
      }
    }
  })

  it('meets the distance rule for 15 avatars across 300 seeds', () => {
    for (let seed = 0; seed < 300; seed++) {
      const avatars = generateAvatars(seed, 15)
      for (const [i, a] of avatars.entries()) {
        for (const b of avatars.slice(i + 1)) {
          expect(traitDistance(a.traits, b.traits), `seed ${seed}`).toBeGreaterThanOrEqual(MIN_DISTANCE)
        }
      }
    }
  })

  it('stays pairwise different across the whole name pool', () => {
    const avatars = generateAvatars('big', NAME_POOL.length)
    expect(new Set(avatars.map((a) => a.key)).size).toBe(NAME_POOL.length)
  })
})

describe('ProceduralAvatar', () => {
  it('renders one 100x100 svg, named or decorative', () => {
    const traits = generateAvatar('t').traits
    const named = renderToStaticMarkup(<ProceduralAvatar traits={traits} title="Sanne" size={64} />)
    expect(named.startsWith('<svg')).toBe(true)
    expect(named).toContain('viewBox="0 0 100 100"')
    expect(named).toContain('width="64"')
    expect(named).toContain('aria-label="Sanne"')
    const hidden = renderToStaticMarkup(<ProceduralAvatar traits={traits} title="Sanne" decorative />)
    expect(hidden).toContain('aria-hidden="true"')
    expect(hidden).not.toContain('aria-label')
  })

  it('draws every style without leaving an unresolved value in the markup', () => {
    for (const a of generateAvatars('coverage', 60)) {
      const html = markup(a)
      expect(html).not.toMatch(/undefined|NaN|\[object/)
    }
  })
})

describe('name pool', () => {
  it('has at least 60 unique, plain names, none from the fixed cast', () => {
    expect(NAME_POOL.length).toBeGreaterThanOrEqual(60)
    const lower = NAME_POOL.map((n) => n.toLowerCase())
    expect(new Set(lower).size).toBe(NAME_POOL.length)
    for (const name of NAME_POOL) {
      expect(name).toMatch(/^[A-Z][a-z]{1,9}$/)
      expect(FIXED.map((f) => f.toLowerCase())).not.toContain(name.toLowerCase())
    }
  })
})

describe('buildCast', () => {
  it('uses the fixed eight first, in order, for boards up to 9x9', () => {
    expect(buildCast(8).names).toEqual(FIXED)
    expect(buildCast(5).names).toEqual(FIXED.slice(0, 5))
    expect(buildCastForBoard(9).names).toEqual(FIXED)
    expect(buildCast(8).entries.every((e) => e.drawn)).toBe(true)
    expect(CAST.map((m) => m.name)).toEqual(FIXED)
  })

  it('adds extras after the eight for bigger boards, without duplicates', () => {
    for (let size = 10; size <= 16; size++) {
      const cast = buildCastForBoard(size, 'seed')
      expect(cast.names).toHaveLength(suspectsForSize(size))
      expect(cast.names.slice(0, 8)).toEqual(FIXED)
      expect(new Set(cast.names.map((n) => n.toLowerCase())).size).toBe(cast.names.length)
      expect(cast.entries.slice(8).every((e) => !e.drawn && NAME_POOL.includes(e.name))).toBe(true)
    }
    expect(buildCastForBoard(16).names).toHaveLength(15)
  })

  it('is deterministic per seed and varies between seeds', () => {
    expect(buildCast(15, 's1').names).toEqual(buildCast(15, 's1').names)
    expect(buildCast(15, 's1').names).not.toEqual(buildCast(15, 's2').names)
  })

  it('gives the extras portraits that differ from each other', () => {
    const cast = buildCast(15, 's1')
    const portraits = cast.entries.map((e) => renderToStaticMarkup(<>{e.look.portrait}</>))
    expect(new Set(portraits).size).toBe(15)
  })

  it('can fill every pool name, then refuses more', () => {
    const cast = buildCast(MAX_SUSPECTS, 'full')
    expect(new Set(cast.names).size).toBe(MAX_SUSPECTS)
    expect(() => buildCast(MAX_SUSPECTS + 1)).toThrow(RangeError)
    expect(() => buildCast(-1)).toThrow(RangeError)
  })

  describe('genders (CAD-9.4)', () => {
    const count = (genders: readonly string[], gender: string) => genders.filter((g) => g === gender).length

    it('alternates the genders of the fixed eight', () => {
      expect(buildCast(8).genders).toEqual(['woman', 'man', 'woman', 'man', 'woman', 'man', 'woman', 'man'])
      expect(buildCastForBoard(9).genders).toEqual(buildCast(8).genders)
      expect(buildCast(5).genders).toEqual(['woman', 'man', 'woman', 'man', 'woman'])
      expect(CAST.map((m) => [m.name, m.gender])).toEqual([
        ['Alice', 'woman'], ['Ben', 'man'], ['Chloe', 'woman'], ['Dan', 'man'], ['Emma', 'woman'], ['Frank', 'man'], ['Grace', 'woman'], ['Henry', 'man'],
      ])
    })

    it('gives every extra a gender that fits the name, and keeps the whole cast balanced (alternating)', () => {
      const byName = new Map(GENDERED_NAMES.map((n) => [n.name, n.gender]))
      for (let size = 10; size <= 16; size++) {
        for (const seed of ['a', 'b', 'c']) {
          const cast = buildCastForBoard(size, seed)
          expect(cast.genders).toHaveLength(cast.names.length)
          cast.entries.slice(8).forEach((e) => expect(e.gender).toBe(byName.get(e.name)))
          // Four of each in the eight, then extras alternate: the cast never differs by more than one.
          expect(Math.abs(count(cast.genders, 'man') - count(cast.genders, 'woman'))).toBeLessThanOrEqual(1)
        }
      }
      expect(buildCastForBoard(12, 'a').genders.slice(8)).toEqual(['woman', 'man', 'woman'])
    })

    it('every pool name has a gender and the full cast still fills every name', () => {
      expect(GENDERED_NAMES.map((n) => n.name)).toEqual(NAME_POOL)
      expect(GENDERED_NAMES.every((n) => n.gender === 'man' || n.gender === 'woman')).toBe(true)
      expect(buildCast(MAX_SUSPECTS, 'full').genders).toHaveLength(MAX_SUSPECTS)
    })
  })

  it('finds a look by label, ignoring case', () => {
    const cast = buildCast(12, 's1')
    const extra = cast.entries[10]!
    expect(cast.lookFor(` ${extra.name.toUpperCase()} `)).toBe(extra.look)
    expect(cast.lookFor('Nobody')).toBeUndefined()
  })
})

describe('SuspectCard with a generated look', () => {
  const cast = buildCast(15, 'card')
  const extra = cast.entries[12]!
  const person: Person = { id: 'p13', kind: 'suspect', label: extra.name }

  it('shows the procedural portrait, name and colours for an extra suspect', () => {
    const html = renderToStaticMarkup(<SuspectCard person={person} clue="Zat in de tuin." look={extra.look} />)
    expect(html).toContain(`polaroid__name">${extra.name}<`)
    expect(html).toContain('<svg')
    expect(html).not.toContain('</text>')
    expect(html).toContain(extra.look.photo)
    expect(html).toContain(extra.look.bubble)
  })

  it('still falls back to the lettered silhouette without a look', () => {
    expect(renderToStaticMarkup(<SuspectCard person={person} clue="x" />)).toContain('</text>')
  })

  it('keeps the fixed avatar for a cast name even when a look is passed', () => {
    const alice: Person = { id: 'r', kind: 'suspect', label: 'Alice' }
    const withLook = renderToStaticMarkup(<SuspectCard person={alice} clue="x" look={extra.look} />)
    expect(withLook).toBe(renderToStaticMarkup(<SuspectCard person={alice} clue="x" />))
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
