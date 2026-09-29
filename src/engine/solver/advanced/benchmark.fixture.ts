import { parsePuzzle } from '../../model/index.ts'
import type { Placement, Puzzle } from '../../model/index.ts'
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
export const FIXTURES = [
  { name: 'hard, home, seed 1', text: hardHome1, theme: 'home', seed: 1, rating: 'hard' },
  { name: 'hard, office, seed 3', text: hardOffice3, theme: 'office', seed: 3, rating: 'hard' },
  { name: 'expert, home, seed 1', text: expertHome1, theme: 'home', seed: 1, rating: 'expert' },
  { name: 'expert, school, seed 2', text: expertSchool2, theme: 'school', seed: 2, rating: 'expert' },
] as const

/** Wall-clock solve+rate budget, checked in benchmark.slow.test.ts. */
export const BUDGET_MS = 3000

export function load(text: string): Puzzle {
  const parsed = parsePuzzle(text)
  if (!parsed.ok) throw new Error(parsed.issues.map((i) => i.message).join('; '))
  return parsed.value
}

export const sameCells = (a: readonly Placement[], b: readonly Placement[]) =>
  a.every((p) => b.find((q) => q.personId === p.personId)?.cell.row === p.cell.row && b.find((q) => q.personId === p.personId)?.cell.col === p.cell.col)

/** Fastest of a few runs, so one scheduler hiccup does not fail the budget. */
export function bestOf<T>(runs: number, run: () => T): { best: number; value: T } {
  let best = Infinity
  let value = run()
  for (let i = 0; i < runs; i++) {
    const start = performance.now()
    value = run()
    best = Math.min(best, performance.now() - start)
  }
  return { best, value }
}
