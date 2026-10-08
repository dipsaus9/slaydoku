import { describe, expect, it } from 'vitest'
import { validateSolution } from '../../model/index.ts'
import { defaultRegistry } from '../../solver/human/index.ts'
import { TIERS, TierError, generateTier } from '../tiers/index.ts'
import type { TierId } from '../tiers/index.ts'
import { DEFAULT_BUDGET_MS } from './budget.ts'
import { ScaleError, generateForScene, generateForSceneWithReport, tryGenerateForScene } from './generate.ts'
import { sceneForSeed } from './measure.ts'
import { expectGoodPuzzle } from './sweep.fixture.ts'

describe('generateForScene', () => {
  it('makes a puzzle for every tier on a 7x7 scene', { timeout: 120_000 }, () => {
    for (const tier of TIERS) {
      const report = generateForSceneWithReport(sceneForSeed(7, 4), { tier: tier.id, seed: 4 })
      expect(report.tier.id).toBe(tier.id)
      expect(report.size).toBe(7)
      expectGoodPuzzle(report, tier.id)
    }
  })

  it('returns the bare puzzle from the single entry point', () => {
    const puzzle = generateForScene(sceneForSeed(6, 1), { tier: 'hard', seed: 1 })
    expect(validateSolution(puzzle).ok).toBe(true)
    expect(puzzle.people).toHaveLength(6)
  })

  it('is deterministic per scene, seed and tier', () => {
    const scene = sceneForSeed(7, 3)
    const a = generateForScene(scene, { tier: 'easy-medium', seed: 3 })
    const b = generateForScene(scene, { tier: 'easy-medium', seed: 3 })
    expect(b).toEqual(a)
    expect(generateForScene(scene, { tier: 'easy-medium', seed: 4 })).not.toEqual(a)
  })

  it('pins the victim when asked', () => {
    const scene = sceneForSeed(7, 5)
    const first = generateForScene(scene, { tier: 'medium', seed: 5 })
    const victimCell = first.solution.find((p) => p.personId === 'V')?.cell
    const pinned = generateForScene(scene, { tier: 'easy', seed: 6, victimCell })
    expect(pinned.solution.find((p) => p.personId === 'V')?.cell).toEqual(victimCell)
  })

  it('opts in to the advanced techniques without touching the basic registry', () => {
    generateForScene(sceneForSeed(6, 1), { tier: 'hard', seed: 1 })
    expect(Math.max(...defaultRegistry.list().map((t) => t.level))).toBe(3)
    // The 4.8 entry point keeps refusing hard and expert.
    expect(() => generateTier(sceneForSeed(6, 1), { tier: 'hard', seed: 1 })).toThrow(TierError)
  })

  it('reports how the attempts went', { timeout: 60_000 }, () => {
    const report = generateForSceneWithReport(sceneForSeed(6, 3), { tier: 'hard', seed: 3 })
    expect(report.attempts).toBeGreaterThanOrEqual(1)
    const rejected = Object.values(report.rejections).reduce((sum, n) => sum + n, 0)
    expect(rejected).toBe(report.attempts - 1)
    expect(report.budgetMs).toBe(DEFAULT_BUDGET_MS)
  })
})

describe('failing seeds are reported', () => {
  it('throws a ScaleError naming seed, tier, size and rejections when the budget is too small', () => {
    const scene = sceneForSeed(16, 3)
    let caught: unknown
    try {
      generateForScene(scene, { tier: 'expert', seed: 3, budgetMs: 1 })
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(ScaleError)
    const { failure, message } = caught as ScaleError
    expect(failure).toMatchObject({ tier: 'expert' as TierId, seed: 3, size: 16, budgetMs: 1, timedOut: true })
    expect(message).toContain('seed 3')
    expect(message).toContain('expert')
    expect(message).toContain('16x16')
    expect(Object.keys(failure.rejections)).toContain('rating-out-of-band')
  })

  it('never returns a puzzle from a failed run', () => {
    const result = tryGenerateForScene(sceneForSeed(16, 2), { tier: 'hard', seed: 2, budgetMs: 1 })
    expect(result.ok).toBe(false)
  })

  it('stops at the attempt cap and says so', () => {
    const result = tryGenerateForScene(sceneForSeed(6, 1), { tier: 'expert', seed: 1, maxAttempts: 1 })
    // Seed 1 needs more than one expert placement on this 6x6 scene (see the measured distribution).
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.failure.attempts).toBe(1)
      expect(result.failure.timedOut).toBe(false)
      expect(result.failure.message).toContain('1 placements')
    }
  })

  it('refuses non-square scenes with a readable failure', () => {
    const scene = { ...sceneForSeed(7, 1), height: 6 }
    const result = tryGenerateForScene(scene, { tier: 'easy', seed: 1 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.failure.message).toContain('square')
  })
})
