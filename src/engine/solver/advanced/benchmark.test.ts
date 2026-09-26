import { describe, expect, it } from 'vitest'
import { generate } from '../../generator/index.ts'
import { parsePuzzle, validateSolution } from '../../model/index.ts'
import type { CatalogClue } from '../../clues/index.ts'
import type { Placement, Puzzle } from '../../model/index.ts'
import { generateScene } from '../../scenegen/index.ts'
import { solve } from '../solve.ts'
import { solveAdvanced } from './index.ts'
import expertHome1 from './fixtures/expert-16x16-home-1.json?raw'
import expertSchool2 from './fixtures/expert-16x16-school-2.json?raw'
import hardHome1 from './fixtures/hard-16x16-home-1.json?raw'
import hardOffice3 from './fixtures/hard-16x16-office-3.json?raw'

/**
 * 16x16 fixtures made by `generateScene({ width: 16, height: 16, theme, seed })`
 * and `generateAdvanced(scene, { seed, target })` (kept as JSON so the suite
 * does not spend a minute generating them; one of them is regenerated in benchmark.regeneration.slow.test.ts, which takes about two minutes and runs in `bun run test:slow`). Each has exactly one solution and needs the
 * advanced solver to finish without guessing. (CAD-8.6: the home and school fixtures were regenerated after the stairs left the
 * themes and the whole-object direction rule; the office fixture is unchanged: office scenes never had stairs and its clues still hold.)
 */
const FIXTURES = [
  { name: 'hard, home, seed 1', text: hardHome1, theme: 'home', seed: 1, rating: 'hard' },
  { name: 'hard, office, seed 3', text: hardOffice3, theme: 'office', seed: 3, rating: 'hard' },
  { name: 'expert, home, seed 1', text: expertHome1, theme: 'home', seed: 1, rating: 'expert' },
  { name: 'expert, school, seed 2', text: expertSchool2, theme: 'school', seed: 2, rating: 'expert' },
] as const

const BUDGET_MS = 3000

function load(text: string): Puzzle {
  const parsed = parsePuzzle(text)
  if (!parsed.ok) throw new Error(parsed.issues.map((i) => i.message).join('; '))
  return parsed.value
}

const sameCells = (a: readonly Placement[], b: readonly Placement[]) =>
  a.every((p) => b.find((q) => q.personId === p.personId)?.cell.row === p.cell.row && b.find((q) => q.personId === p.personId)?.cell.col === p.cell.col)

/** Fastest of a few runs, so one scheduler hiccup does not fail the budget. */
function bestOf<T>(runs: number, run: () => T): { best: number; value: T } {
  let best = Infinity
  let value = run()
  for (let i = 0; i < runs; i++) {
    const start = performance.now()
    value = run()
    best = Math.min(best, performance.now() - start)
  }
  return { best, value }
}

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

      it(`solves and rates (${fixture.rating}) in under ${BUDGET_MS} ms, solve plus rating`, () => {
        const { best, value } = bestOf(2, () => {
          const found = solve(puzzle.scene, puzzle.people, clues)
          return { found, human: solveAdvanced(puzzle.scene, puzzle.people, clues) }
        })
        expect(value.found.count).toBe(1)
        expect(value.human.solved).toBe(true)
        expect(value.human.rating?.id).toBe(fixture.rating)
        expect(sameCells(puzzle.solution, value.human.placements)).toBe(true)
        expect(best).toBeLessThan(BUDGET_MS)
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
    it(`generateScene + generate, seed ${seed}: solve plus rating under ${BUDGET_MS} ms`, { timeout: 120_000 }, () => {
      const scene = generateScene({ width: 16, height: 16, theme: 'home', seed })
      const puzzle = generate(scene, { seed })
      const clues = puzzle.clues as CatalogClue[]
      const { best, value } = bestOf(2, () => {
        const found = solve(scene, puzzle.people, clues)
        return { found, human: solveAdvanced(scene, puzzle.people, clues) }
      })
      expect(value.found.count).toBe(1)
      expect(value.human.solved).toBe(true)
      expect(best).toBeLessThan(BUDGET_MS)
    })
  }
})
