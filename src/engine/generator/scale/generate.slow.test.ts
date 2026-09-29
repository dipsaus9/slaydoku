import { describe, expect, it } from 'vitest'
import { DEFAULT_BUDGET_MS } from './budget.ts'
import { generateForSceneWithReport, tryGenerateForScene } from './generate.ts'
import { sceneForSeed } from './measure.ts'

/**
 * Slow (`bun run test:slow`): the wall-clock budgets for scale/generate.test.ts's correctness
 * cases. Split out (SLAY-11.1) because a hard ms budget flakes under GitHub Actions' variable CPU.
 */
describe('generateForScene (wall clock)', () => {
  it('reports elapsed time under its own budget', () => {
    const report = generateForSceneWithReport(sceneForSeed(6, 3), { tier: 'hard', seed: 3 })
    expect(report.budgetMs).toBe(DEFAULT_BUDGET_MS)
    expect(report.elapsedMs).toBeLessThan(report.budgetMs)
  })
})

describe('time budget (wall clock)', () => {
  it('keeps to a small budget even on 16x16 (deadline hooks in the solver and selector)', () => {
    const started = performance.now()
    tryGenerateForScene(sceneForSeed(16, 3), { tier: 'easy-medium', seed: 3, budgetMs: 2000 })
    // Slack for one solver poll interval and the current human-solver call.
    expect(performance.now() - started).toBeLessThan(2000 + 4000)
  }, 30_000)
})
