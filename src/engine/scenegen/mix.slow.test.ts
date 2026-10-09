import { describe, expect, it } from 'vitest'
import { generateScene } from './generate.ts'
import { boardMixProblems, densityCap } from './mix.ts'
import { REGULAR_THEMES } from './variety.testing.ts'

/**
 * SLAY-22 sweep: 200 fresh boards per theme and size (6, 7, 8, 9, 12). Every board the generator returns keeps the board rules (mix.ts);
 * the share inside the tolerance must be at least 95% (it is 100%, because a board outside it is drawn again), and objects per square fall
 * as the board grows. Without the re-draw 96.4% of the boards are inside it (measured, docs/authoring/room-rules.md).
 */
describe('board mix sweep (SLAY-22)', () => {
  for (const theme of [...REGULAR_THEMES, 'simpshouse'] as const) {
    it(`${theme}: 200 boards per size inside the mix tolerance, density falling with size`, () => {
      const perSquare: number[] = []
      for (const size of [6, 7, 8, 9, 12]) {
        let inside = 0
        let objects = 0
        for (let i = 1; i <= 200; i++) {
          const scene = generateScene({ width: size, height: size, theme, seed: 400_000 + i * 41 + size })
          if (boardMixProblems(scene.objects, size, size, theme).length === 0) inside++
          objects += scene.objects.length
          expect(scene.objects.length / (size * size)).toBeLessThanOrEqual(densityCap(size))
        }
        expect(inside / 200, `${theme} ${size}x${size}`).toBeGreaterThanOrEqual(0.95)
        perSquare.push(objects / (200 * size * size))
      }
      for (let k = 1; k < perSquare.length; k++) expect(perSquare[k]!, `${theme}: size ${k}`).toBeLessThan(perSquare[k - 1]! + 0.005)
      expect(perSquare[4]!).toBeLessThan(perSquare[0]! - 0.03)
    })
  }
})
