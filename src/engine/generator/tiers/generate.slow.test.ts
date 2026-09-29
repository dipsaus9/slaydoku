import { describe, expect, it } from 'vitest'
import { generateTier, TierError } from './generate.ts'
import { sample9 } from './generate.fixture.ts'

/**
 * Slow (`bun run test:slow`): the wall-clock budget for generate.test.ts's 'stops at the
 * wall-clock budget' correctness case. Split out (SLAY-11.1) because a hard ms budget flakes
 * under GitHub Actions' variable CPU.
 */
describe('bounds and refusals (wall clock)', () => {
  it('stops at the wall-clock budget within 1000 ms', () => {
    const started = performance.now()
    expect(() => generateTier(sample9, { seed: 1, tier: 'medium', timeBudgetMs: 0 })).toThrow(TierError)
    expect(performance.now() - started).toBeLessThan(1000)
  })
})
