import { describe, expect, it } from 'vitest'
import { generate } from '../../generator/index.ts'
import type { CatalogClue } from '../../clues/index.ts'
import { generateScene } from '../../scenegen/index.ts'
import { solve } from '../solve.ts'
import { solveAdvanced } from './index.ts'
import { BUDGET_MS, FIXTURES, bestOf, load } from './benchmark.fixture.ts'

/**
 * Slow (`bun run test:slow`): the wall-clock solve+rate budgets for benchmark.test.ts's
 * correctness cases. Split out (SLAY-11.1) because a hard ms budget flakes under GitHub
 * Actions' variable CPU.
 */
describe('16x16 fixtures (wall clock)', () => {
  for (const fixture of FIXTURES) {
    it(`${fixture.name}: solves and rates in under ${BUDGET_MS} ms, solve plus rating`, () => {
      const puzzle = load(fixture.text)
      const clues = puzzle.clues as CatalogClue[]
      const { best } = bestOf(2, () => {
        const found = solve(puzzle.scene, puzzle.people, clues)
        return { found, human: solveAdvanced(puzzle.scene, puzzle.people, clues) }
      })
      expect(best).toBeLessThan(BUDGET_MS)
    })
  }
})

describe('fresh 16x16 puzzles from the plain generator (wall clock)', () => {
  for (const seed of [2, 3]) {
    it(`generateScene + generate, seed ${seed}: solve plus rating under ${BUDGET_MS} ms`, { timeout: 120_000 }, () => {
      const scene = generateScene({ width: 16, height: 16, theme: 'home', seed })
      const puzzle = generate(scene, { seed })
      const clues = puzzle.clues as CatalogClue[]
      const { best } = bestOf(2, () => {
        const found = solve(scene, puzzle.people, clues)
        return { found, human: solveAdvanced(scene, puzzle.people, clues) }
      })
      expect(best).toBeLessThan(BUDGET_MS)
    })
  }
})
