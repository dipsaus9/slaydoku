import { describe, expect, it } from 'vitest'
import { PERF_CASES, bestOf, load } from './perf.fixture.ts'

/**
 * Slow (`bun run test:slow`): the wall-clock solve budgets for perf.test.ts's correctness cases.
 * Split out (SLAY-11.1) because a hard ms budget flakes under GitHub Actions' variable CPU.
 */
describe('solver performance (wall clock)', () => {
  for (const [name, text, budgetMs] of PERF_CASES) {
    it(`${name} solves within ${budgetMs} ms`, { timeout: 60_000 }, () => {
      const puzzle = load(text)
      const { best } = bestOf(3, puzzle)
      expect(best).toBeLessThan(budgetMs)
    })
  }
})
