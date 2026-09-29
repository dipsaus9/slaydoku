import { describe, expect, it } from 'vitest'
import type { Placement } from '../model/index.ts'
import { PERF_CASES, cellOf, load, solveOnce } from './perf.fixture.ts'

describe('solver performance', () => {
  for (const [name, text] of PERF_CASES) {
    it(`${name} solves uniquely`, { timeout: 60_000 }, () => {
      const puzzle = load(text)
      const result = solveOnce(puzzle)
      expect(result.count).toBe(1)
      for (const { personId, cell } of puzzle.solution) {
        expect(cellOf(result.solutions[0] as Placement[], personId)).toEqual(cell)
      }
    })
  }
})
