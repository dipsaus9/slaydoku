import { describe, expect, it } from 'vitest'
import { generate } from '../../generator/index.ts'
import { validateSolution } from '../../model/index.ts'
import type { CatalogClue } from '../../clues/index.ts'
import type { Placement } from '../../model/index.ts'
import { generateScene } from '../../scenegen/index.ts'
import { solve } from '../solve.ts'
import { solveAdvanced } from './index.ts'
import { FIXTURES, load, sameCells } from './benchmark.fixture.ts'

describe('16x16 fixtures', () => {
  for (const fixture of FIXTURES) {
    describe(fixture.name, () => {
      const puzzle = load(fixture.text)
      const clues = puzzle.clues as CatalogClue[]

      it('is a valid 16x16 puzzle with one solution, the stored one', () => {
        expect(puzzle.scene.width).toBe(16)
        expect(puzzle.scene.height).toBe(16)
        expect(puzzle.people).toHaveLength(16)
        expect(validateSolution(puzzle).ok).toBe(true)
        const found = solve(puzzle.scene, puzzle.people, clues)
        expect(found.count).toBe(1)
        expect(sameCells(puzzle.solution, found.solutions[0] as Placement[])).toBe(true)
      })

      it(`solves and rates (${fixture.rating}), solve plus rating (wall-clock budget: benchmark.slow.test.ts)`, () => {
        const found = solve(puzzle.scene, puzzle.people, clues)
        const human = solveAdvanced(puzzle.scene, puzzle.people, clues)
        expect(found.count).toBe(1)
        expect(human.solved).toBe(true)
        expect(human.rating?.id).toBe(fixture.rating)
        expect(sameCells(puzzle.solution, human.placements)).toBe(true)
      })

      it('scores in the band of its rating, above every medium score', () => {
        const human = solveAdvanced(puzzle.scene, puzzle.people, clues)
        const level = fixture.rating === 'hard' ? 4 : 5
        expect(human.maxTechnique?.level).toBe(level)
        expect(human.score).toBe(level * 100 + human.steps.length)
        expect(human.score).toBeGreaterThan(399)
      })
    })
  }

  it('hard scores stay below expert scores', () => {
    const scores = FIXTURES.map((f) => {
      const p = load(f.text)
      return { rating: f.rating, score: solveAdvanced(p.scene, p.people, p.clues as CatalogClue[]).score }
    })
    const top = (rating: string) => Math.max(...scores.filter((s) => s.rating === rating).map((s) => s.score))
    const bottom = (rating: string) => Math.min(...scores.filter((s) => s.rating === rating).map((s) => s.score))
    expect(top('hard')).toBeLessThan(bottom('expert'))
  })

})

describe('fresh 16x16 puzzles from the plain generator', () => {
  for (const seed of [2, 3]) {
    it(`generateScene + generate, seed ${seed}: solves and rates (wall-clock budget: benchmark.slow.test.ts)`, { timeout: 120_000 }, () => {
      const scene = generateScene({ width: 16, height: 16, theme: 'home', seed })
      const puzzle = generate(scene, { seed })
      const clues = puzzle.clues as CatalogClue[]
      const found = solve(scene, puzzle.people, clues)
      const human = solveAdvanced(scene, puzzle.people, clues)
      expect(found.count).toBe(1)
      expect(human.solved).toBe(true)
    })
  }
})
