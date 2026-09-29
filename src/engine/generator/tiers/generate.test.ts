import { describe, expect, it } from 'vitest'
import { DEMO_VICTIM_CELLS, demoScene } from '../../../content/demo/scene.ts'
import { checkClue, evaluate } from '../../clues/index.ts'
import type { CatalogClue } from '../../clues/index.ts'
import { validateSolution } from '../../model/index.ts'
import type { Cell, Puzzle, Scene } from '../../model/index.ts'
import { solve } from '../../solver/index.ts'
import { solveHuman } from '../../solver/human/index.ts'
import { generateTier, generateTierWithReport, TierError } from './generate.ts'
import { sample9 } from './generate.fixture.ts'
import { measureTier } from './report.ts'
import { RELATIONAL_DISTANCE_KINDS, allowsKind, difficultyScore, tierById, tierForScore } from './tiers.ts'
import type { TierId } from './tiers.ts'

const NOW_TIERS: TierId[] = ['very-easy', 'easy', 'easy-medium', 'medium']

/** Valid, unique, human-deducible, rated inside the tier, and only the tier's clue kinds. */
function expectInTier(puzzle: Puzzle, id: TierId) {
  const tier = tierById(id)
  const clues = puzzle.clues as CatalogClue[]
  expect(validateSolution(puzzle).ok).toBe(true)
  for (const clue of clues) {
    expect(checkClue(clue, puzzle)).toEqual([])
    expect(evaluate(clue, puzzle.scene, puzzle.solution)).toBe(true)
    expect(allowsKind(tier, clue.type), `${clue.type} is not allowed in ${id}`).toBe(true)
  }
  expect(solve(puzzle.scene, puzzle.people, clues).count).toBe(1)
  const human = solveHuman(puzzle.scene, puzzle.people, clues)
  expect(human.solved).toBe(true)
  const level = human.maxTechnique?.level ?? 0
  expect(level).toBeGreaterThanOrEqual(tier.minTechniqueLevel)
  expect(level).toBeLessThanOrEqual(tier.maxTechniqueLevel)
  const score = difficultyScore(human, puzzle.people.length)
  expect(tierForScore(score).id).toBe(id)
  // Clue card policy: about one per person, a few extras at most.
  expect(clues.length).toBeGreaterThanOrEqual(puzzle.people.length)
  expect(clues.length).toBeLessThanOrEqual(puzzle.people.length + tier.clues.maxExtraClues)
  const perHolder = new Map<string, number>()
  for (const c of clues) perHolder.set(c.personId, (perHolder.get(c.personId) ?? 0) + 1)
  expect(Math.max(...perHolder.values())).toBeLessThanOrEqual(tier.clues.maxCluesPerSuspect)
}

describe('generateTier on a 9x9 scene', () => {
  for (const id of NOW_TIERS) {
    it(`gives 20 seeds of ${id}, all rated inside the band`, async () => {
      const usedKinds = new Set<string>()
      for (let seed = 1; seed <= 20; seed++) {
        // Yield between seeds: a long synchronous test starves the vitest worker RPC ("Timeout calling onTaskUpdate").
        await new Promise((resolve) => setTimeout(resolve, 0))
        const report = generateTierWithReport(sample9, { seed, tier: id })
        expectInTier(report.puzzle, id)
        expect(report.tier.id).toBe(id)
        expect(tierForScore(report.score).id).toBe(id)
        for (const clue of report.puzzle.clues) usedKinds.add(clue.type)
      }
      if (id === 'very-easy' || id === 'easy' || id === 'easy-medium') {
        for (const kind of RELATIONAL_DISTANCE_KINDS) expect(usedKinds.has(kind), `${id} used ${kind}`).toBe(false)
      }
    }, 180_000)
  }

  it('is deterministic per seed and tier', () => {
    const a = generateTier(sample9, { seed: 5, tier: 'easy-medium' })
    expect(generateTier(sample9, { seed: 5, tier: 'easy-medium' })).toEqual(a)
    expect(generateTier(sample9, { seed: 6, tier: 'easy-medium' })).not.toEqual(a)
  })

  it('makes the bands differ: medium needs level 3, easy stays at level 2', () => {
    const easy = generateTierWithReport(sample9, { seed: 3, tier: 'easy' })
    const medium = generateTierWithReport(sample9, { seed: 3, tier: 'medium' })
    expect(easy.human.maxTechnique?.level).toBe(2)
    expect(medium.human.maxTechnique?.level).toBe(3)
    expect(medium.score).toBeGreaterThan(easy.score)
  })
})

describe('generateTier on the demo house with a pinned victim', () => {
  const houses: [string, Scene, readonly Cell[]][] = [['demo house', demoScene, DEMO_VICTIM_CELLS]]
  for (const [name, scene, cells] of houses) {
    for (const id of ['easy', 'easy-medium', 'medium'] as const) {
      it(`${name}: ${id} on the first gift cell`, () => {
        const victimCell = cells[0] as Cell
        const puzzle = generateTier(scene, { seed: 1, tier: id, victimCell })
        expect(puzzle.solution.find((p) => p.personId === 'V')?.cell).toEqual(victimCell)
        expectInTier(puzzle, id)
      }, 90_000)
    }
  }
})

describe('bounds and refusals', () => {
  it('stops at the attempt cap and reports the rejection counts', () => {
    expect(() => generateTier(sample9, { seed: 1, tier: 'medium', maxAttempts: 0 })).toThrow(/after 0 placements/)
  })

  it('stops at the wall-clock budget', () => {
    expect(() => generateTier(sample9, { seed: 1, tier: 'medium', timeBudgetMs: 0 })).toThrow(TierError)
  })

  it('refuses hard and expert until level 4 and 5 techniques exist (story CAD-4.24)', () => {
    for (const id of ['hard', 'expert'] as const) {
      expect(() => generateTier(sample9, { seed: 1, tier: id })).toThrow(TierError)
      expect(() => generateTier(sample9, { seed: 1, tier: id })).toThrow(/CAD-4\.22/)
    }
  })
})

describe('measureTier', () => {
  it('collects rating, clue count and time per seed', () => {
    const d = measureTier(sample9, 'medium', [1, 2, 3])
    expect(d.failures).toBe(0)
    expect(d.samples).toHaveLength(3)
    for (const s of d.samples) {
      expect(s.level).toBe(3)
      expect(tierForScore(s.score).id).toBe('medium')
      expect(s.clues).toBeGreaterThanOrEqual(9)
    }
  })
})
