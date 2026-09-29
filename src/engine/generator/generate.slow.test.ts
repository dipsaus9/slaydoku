import { describe, expect, it } from 'vitest'
import { generate } from './generate.ts'
import { sample9 } from './generate.fixture.ts'

/**
 * Slow (`bun run test:slow`): the wall-clock generation budgets for generate.test.ts's
 * correctness cases. Split out (SLAY-11.1) because a hard ms budget flakes under GitHub
 * Actions' variable CPU.
 */
describe('generate (wall clock)', () => {
  it('makes 50 seeds on a 9x9 scene, slowest under 5000 ms', () => {
    let slowest = 0
    for (let seed = 1; seed <= 50; seed++) {
      const start = performance.now()
      generate(sample9, { seed })
      slowest = Math.max(slowest, performance.now() - start)
    }
    expect(slowest).toBeLessThan(5000)
  }, 120_000)

  it('generates one 9x9 puzzle in under 5 seconds', () => {
    const start = performance.now()
    generate(sample9, { seed: 99 })
    expect(performance.now() - start).toBeLessThan(5000)
  })
})
