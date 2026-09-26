import { describe, expect, it } from 'vitest'
import { BASIC_BANDS, BASIC_TECHNIQUES, TechniqueRegistry, defaultRegistry } from '../human/index.ts'
import { tutorialPuzzle } from '../../model/tutorial.fixture.ts'
import { uniquePuzzle } from '../testing.fixture.ts'
import { solveHuman } from '../human/index.ts'
import { ADVANCED_BANDS, ADVANCED_TECHNIQUES, advancedRegistry, registerAdvanced, solveAdvanced } from './index.ts'

describe('advanced catalog', () => {
  it('registers through the data-driven registry and leaves the basic catalog alone', () => {
    expect(defaultRegistry.list().map((t) => t.id)).toEqual(BASIC_TECHNIQUES.map((t) => t.id))
    expect(defaultRegistry.listBands().map((b) => b.id)).toEqual(BASIC_BANDS.map((b) => b.id))
    const ids = advancedRegistry.list().map((t) => t.id)
    expect(ids).toHaveLength(BASIC_TECHNIQUES.length + ADVANCED_TECHNIQUES.length)
    for (const basic of BASIC_TECHNIQUES) expect(advancedRegistry.list()).toContain(basic)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('tries basic techniques before hard ones and hard ones before expert ones', () => {
    const levels = advancedRegistry.list().map((t) => t.level)
    expect(levels).toEqual([...levels].sort((a, b) => a - b))
    expect(Math.max(...BASIC_TECHNIQUES.map((t) => t.level))).toBeLessThan(Math.min(...ADVANCED_TECHNIQUES.map((t) => t.level)))
  })

  it('registerAdvanced works on any registry, once', () => {
    const own = new TechniqueRegistry().register(...BASIC_TECHNIQUES).registerBand(...BASIC_BANDS)
    expect(registerAdvanced(own).list()).toHaveLength(BASIC_TECHNIQUES.length + ADVANCED_TECHNIQUES.length)
    expect(() => registerAdvanced(own)).toThrow(/already registered/)
  })

  it('extends the rating scale with a hard and an expert band above medium', () => {
    expect(advancedRegistry.listBands().map((b) => b.id)).toEqual(['very-easy', 'easy', 'medium', 'hard', 'expert'])
    expect(ADVANCED_BANDS.map((b) => b.minLevel)).toEqual([4, 5])
    const medium = BASIC_BANDS[BASIC_BANDS.length - 1]
    for (const band of ADVANCED_BANDS) expect(band.minLevel).toBeGreaterThan(medium?.minLevel ?? 0)
  })
})

describe('solveAdvanced', () => {
  it('rates easy puzzles exactly like the basic solver (same steps, same score)', () => {
    const { scene, people } = tutorialPuzzle
    const clues = [
      { personId: 'A', type: 'besideObject', args: { objectType: 'table' } },
      { personId: 'B', type: 'onObject', args: { objectType: 'bed' } },
      { personId: 'C', type: 'besideFeature', args: { feature: 'window' } },
      { personId: 'V', type: 'aloneWithMurderer', args: {} },
    ] as const
    const basic = solveHuman(scene, people, [...clues])
    const advanced = solveAdvanced(scene, people, [...clues])
    expect(advanced.steps.map((s) => s.technique)).toEqual(basic.steps.map((s) => s.technique))
    expect(advanced.score).toBe(basic.score)
    expect(advanced.rating?.id).toBe('very-easy')
  })

  // Deterministic random puzzles with exactly one solution (see the 4.6 tests): on the 6x6 boards seed 5 is hard, seed 1 is medium; on the 5x5 board seed 2 is expert.
  // (Re-picked for CAD-8.6: the whole-object direction rule changed which clues are true, so the old seeds rate differently.)
  const hard = uniquePuzzle(5, 6, 3)
  const expert = uniquePuzzle(2, 5, 2)
  const medium = uniquePuzzle(1, 6, 3)

  it('solves puzzles the basic solver gives up on', () => {
    for (const puzzle of [hard, expert]) {
      expect(solveHuman(puzzle.scene, puzzle.people, puzzle.clues).solved).toBe(false)
      const result = solveAdvanced(puzzle.scene, puzzle.people, puzzle.clues)
      expect(result.solved).toBe(true)
      for (const stored of puzzle.solution) {
        expect(result.placements.find((p) => p.personId === stored.personId)?.cell).toEqual(stored.cell)
      }
    }
  })

  it('gives hard and expert puzzles distinct scores above medium', () => {
    const rated = [medium, hard, expert].map((p) => solveAdvanced(p.scene, p.people, p.clues))
    expect(rated.map((r) => r.rating?.id)).toEqual(['medium', 'hard', 'expert'])
    const [m, h, e] = rated.map((r) => r.score) as [number, number, number]
    expect(m).toBeGreaterThanOrEqual(300)
    expect(m).toBeLessThan(400)
    expect(h).toBeGreaterThanOrEqual(400)
    expect(h).toBeLessThan(500)
    expect(e).toBeGreaterThanOrEqual(500)
    expect(e).toBeLessThan(600)
    expect(rated[1]?.maxTechnique?.level).toBe(4)
    expect(rated[2]?.maxTechnique?.level).toBe(5)
  })

  it('maxLevel leaves out the techniques above it', () => {
    expect(solveAdvanced(hard.scene, hard.people, hard.clues, { maxLevel: 3 }).solved).toBe(false)
    const capped = solveAdvanced(hard.scene, hard.people, hard.clues, { maxLevel: 4 })
    expect(capped.solved).toBe(true)
    expect(capped.steps.every((s) => s.level <= 4)).toBe(true)
    expect(solveAdvanced(expert.scene, expert.people, expert.clues, { maxLevel: 4 }).solved).toBe(false)
  })

  it('every hard or expert step carries a an explanation', () => {
    for (const puzzle of [hard, expert]) {
      const result = solveAdvanced(puzzle.scene, puzzle.people, puzzle.clues)
      const advanced = result.steps.filter((s) => s.level >= 4)
      expect(advanced.length).toBeGreaterThan(0)
      for (const step of advanced) {
        expect(step.explanation.length).toBeGreaterThan(30)
        expect(step.explanation).not.toContain('undefined')
        expect(step.explanation).not.toContain('NaN')
        expect(step.people.length).toBeGreaterThan(0)
        expect(step.eliminated.length > 0 || step.placed !== undefined).toBe(true)
      }
    }
  })
})
