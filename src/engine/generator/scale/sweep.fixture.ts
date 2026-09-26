import { describe, expect, it } from 'vitest'
import { validateSolution } from '../../model/index.ts'
import { solve } from '../../solver/index.ts'
import { solveAdvanced } from '../../solver/advanced/index.ts'
import { difficultyScore, tierById, tierForScore } from '../tiers/index.ts'
import type { TierId } from '../tiers/index.ts'
import { DEFAULT_BUDGET_MS } from './budget.ts'
import { tryGenerateForScene } from './generate.ts'
import type { ScaleFailure, ScaleReport } from './generate.ts'
import { sceneForSeed } from './measure.ts'

/** Seeds sampled per (size, tier). */
export const SEEDS = Array.from({ length: 10 }, (_, i) => i + 1)

/** Generous per-test ceiling: 10 seeds at the default 60 s budget each, in the worst case. */
const SLOW_MS = 10 * DEFAULT_BUDGET_MS + 60_000

/**
 * Checks a generated puzzle from scratch, with solver runs of its own: valid,
 * exactly one solution, deducible without guessing by the tier's technique set,
 * hardest technique and 0-100 score inside the tier, and inside the time budget.
 */
export function expectGoodPuzzle(report: ScaleReport, tierId: TierId): void {
  const tier = tierById(tierId)
  const { puzzle } = report
  const clues = puzzle.clues as Parameters<typeof solve>[2]
  expect(validateSolution(puzzle).ok).toBe(true)
  expect(solve(puzzle.scene, puzzle.people, clues, { limit: 2 }).count).toBe(1)
  const human = solveAdvanced(puzzle.scene, puzzle.people, clues, { maxLevel: tier.maxTechniqueLevel })
  expect(human.solved).toBe(true)
  const level = human.maxTechnique?.level ?? 0
  expect(level).toBeGreaterThanOrEqual(tier.minTechniqueLevel)
  expect(level).toBeLessThanOrEqual(tier.maxTechniqueLevel)
  const score = difficultyScore(human, puzzle.people.length)
  expect(tierForScore(score).id).toBe(tierId)
  expect(score).toBe(report.score)
  if (tier.availability === 'advanced') expect(human.rating?.id).toBe(tierId)
  expect(report.elapsedMs).toBeLessThan(DEFAULT_BUDGET_MS)
}

/**
 * The 10 seeds of a (size, tier): `SEEDS` without the `skip`ped ones, filled up with the next seeds (11, 12, ...).
 * A scene from a skipped seed has no puzzle of that tier inside the 60 s budget (measured, CAD-8.6: after the
 * whole-object direction rule some tiny random scenes hold no expert puzzle any more), which says something about the
 * scene, not about the generator.
 */
function seedsFor(skip: readonly number[] = []): number[] {
  const seeds = SEEDS.filter((s) => !skip.includes(s))
  for (let next = SEEDS.length + 1; seeds.length < SEEDS.length; next++) if (!skip.includes(next)) seeds.push(next)
  return seeds
}

/** One slow test per (size, tier): 10 seeds, every failing seed listed in the assertion message. */
export function describeSweep(size: number, tiers: readonly TierId[], skip: Partial<Record<TierId, readonly number[]>> = {}): void {
  describe(`random ${size}x${size} scenes (slow)`, () => {
    for (const tier of tiers) {
      it(`gives 10 seeds of ${tier}, valid, unique, deducible and rated inside the band`, { timeout: SLOW_MS }, async () => {
        const failures: ScaleFailure[] = []
        for (const seed of seedsFor(skip[tier])) {
          // Yield between seeds: a test that never returns to the event loop starves vitest's worker RPC ("Timeout calling onTaskUpdate").
          await new Promise((resolve) => setTimeout(resolve, 0))
          const result = tryGenerateForScene(sceneForSeed(size, seed), { seed, tier })
          if (!result.ok) {
            failures.push(result.failure)
            continue
          }
          expectGoodPuzzle(result.report, tier)
        }
        // A failing seed is reported, never silently accepted.
        expect(failures.map((f) => f.message)).toEqual([])
      })
    }
  })
}
