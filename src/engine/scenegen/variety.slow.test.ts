import { describe, expect, it } from 'vitest'
import { REGULAR_THEMES, SIZES, chairShare, distinctPerRoom, measureVariety, topKindShare } from './variety.testing.ts'

/** SLAY-17.6 sweep: 200 scenes per theme (50 each of the sizes 6, 7, 9 and 12). Before the change: chairs 31% to 54% per theme, 2.0 to 2.3 distinct kinds per room. */
describe('object variety sweep (SLAY-17.6)', () => {
  const perSize = 200 / SIZES.length
  for (const theme of REGULAR_THEMES) {
    it(`${theme}: at most 15% chairs, 3 per kind per room, more variety, signature objects kept`, () => {
      const s = measureVariety(theme, perSize)
      expect(s.scenes).toBe(200)
      expect(chairShare(s)).toBeLessThanOrEqual(0.15)
      expect(s.violations).toEqual([])
      expect(distinctPerRoom(s)).toBeGreaterThan(2.3)
      expect(topKindShare(s).share).toBeLessThanOrEqual(0.22)
      expect(s.neverPlaced).toEqual([])
    })
  }
})
