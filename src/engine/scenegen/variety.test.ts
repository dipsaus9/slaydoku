import { getTheme } from '../../content/themes/index.ts'
import { describe, expect, it } from 'vitest'
import { REGULAR_THEMES, chairShare, distinctPerRoom, measureVariety } from './variety.testing.ts'

/** SLAY-17.6: fewer chairs, more variety. A fast sample (12 scenes per size and theme); the 200-scene sweep is variety.slow.test.ts. */
describe('object variety (SLAY-17.6)', () => {
  const all = REGULAR_THEMES.map((t) => measureVariety(t, 12))

  it('keeps chairs to at most 15% of placed objects overall (it was 37% on the same seeds)', () => {
    const chairs = all.reduce((n, s) => n + s.chairs, 0)
    const objects = all.reduce((n, s) => n + s.objects, 0)
    expect(chairs / objects).toBeLessThanOrEqual(0.15)
    for (const s of all) expect(chairShare(s), s.theme).toBeLessThanOrEqual(0.2)
  })

  it('never puts more than 3 of a kind in a room, and never more than 2 chairs away from a table, desk or counter', () => {
    for (const s of all) expect(s.violations, s.theme).toEqual([])
  })

  it('puts more different kinds in a room than before (2.0 to 2.3 distinct per room)', () => {
    for (const s of all) expect(distinctPerRoom(s), s.theme).toBeGreaterThan(2.3)
  })

  it('still places the signature objects (the exact per-room check is in the slow sweep)', () => {
    for (const s of all) {
      const signature = new Set(getTheme(s.theme as never).rooms.flatMap((r) => r.favours))
      const placed = [...signature].filter((k) => s.kinds.has(k))
      expect(placed.length / signature.size, s.theme).toBeGreaterThanOrEqual(0.85)
    }
  })
})
