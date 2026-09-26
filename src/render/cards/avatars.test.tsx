import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CAST, type AvatarTraits } from './cast.ts'

const names = ['Alice', 'Ben', 'Chloe', 'Dan', 'Emma', 'Frank', 'Grace', 'Henry']
const html = (m: (typeof CAST)[number], size?: number) =>
  renderToStaticMarkup(<m.Avatar size={size} />)

/** Every solid colour an avatar uses, as a set. */
function palette(markup: string): Set<string> {
  return new Set(markup.match(/#[0-9a-f]{6}/gi)?.map((c) => c.toLowerCase()))
}

describe('sample cast', () => {
  it('has the eight sample members in order', () => {
    expect(CAST.map((m) => m.name)).toEqual(names)
  })

  it.each(CAST.map((m) => [m.name, m] as const))('%s renders one 64px svg', (name, member) => {
    const markup = html(member, 64)
    expect(markup.startsWith('<svg')).toBe(true)
    expect(markup).toContain('viewBox="0 0 100 100"')
    expect(markup).toContain('width="64"')
    expect(markup).toContain(`aria-label="${name}"`)
  })

  it('can hide an avatar from assistive tech when the name is printed next to it', () => {
    const member = CAST[0]!
    const markup = renderToStaticMarkup(<member.Avatar decorative />)
    expect(markup).toContain('aria-hidden="true"')
    expect(markup).not.toContain('aria-label')
  })

  it('draws eight different pictures', () => {
    expect(new Set(CAST.map((m) => html(m))).size).toBe(CAST.length)
  })

  describe('pairwise distinguishable at 64px', () => {
    const keys = ['skin', 'hairColor', 'hairStyle', 'accessory', 'clothes'] as const
    const pairs = CAST.flatMap((a, i) => CAST.slice(i + 1).map((b) => [a, b] as const))

    it.each(pairs.map(([a, b]) => [`${a.name} / ${b.name}`, a, b] as const))(
      '%s differ in the shirt and in hair style or accessory',
      (_label, a, b) => {
        const differing = keys.filter((k: keyof AvatarTraits) => a.traits[k] !== b.traits[k])
        expect(differing).toContain('clothes')
        expect(differing.some((k) => k === 'hairStyle' || k === 'accessory')).toBe(true)
        expect(differing.length).toBeGreaterThanOrEqual(3)
      },
    )

    it.each(pairs.map(([a, b]) => [`${a.name} / ${b.name}`, a, b] as const))(
      '%s share fewer than 3/4 of their colours',
      (_label, a, b) => {
        const pa = palette(html(a))
        const pb = palette(html(b))
        const shared = [...pa].filter((c) => pb.has(c)).length
        // the shared anatomy (ink, feature shading) may overlap; the rest may not
        expect(shared / Math.min(pa.size, pb.size)).toBeLessThan(0.75)
      },
    )

    it('gives each member a different photo backdrop', () => {
      expect(new Set(CAST.map((m) => m.photo)).size).toBe(CAST.length)
    })
  })
})
