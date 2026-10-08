import { describe, expect, it } from 'vitest'
import type { Placement } from '../../model/index.ts'
import { BASIC_TECHNIQUES, solveHuman } from '../human/index.ts'
import { ADVANCED_TECHNIQUES, solveAdvanced } from './index.ts'
import { ambiguousCase, unsoundSteps } from './testing.fixture.ts'
import type { Case } from './testing.fixture.ts'

/**
 * The advanced techniques must never remove a true position. The truth is the
 * complete list of solutions of a clue set; the clue sets below are left
 * ambiguous or barely unique on purpose, so the solvers stop in the middle of
 * a puzzle, where the hard techniques do their work. This is the wide sweep (SLAY-17.2:
 * the themes changed what the seeds draw, so more sets are needed before every technique
 * has fired); `bun run test:slow` runs it, the fast sample is soundness.test.ts. For every set the full
 * advanced solver is checked, and then each advanced technique ALONE on top of
 * the basic ones, so a technique cannot hide behind the others.
 */

const fired = new Map<string, number>()

function check(c: Case): void {
  expect(c.solutions, `${c.label}: too many solutions to list`).not.toBeNull()
  const solutions = c.solutions as Placement[][]
  const full = solveAdvanced(c.scene, c.people, c.clues)
  expect(unsoundSteps(full, solutions), `${c.label}: full`).toEqual([])
  for (const step of full.steps) fired.set(step.technique, (fired.get(step.technique) ?? 0) + 1)
  for (const technique of ADVANCED_TECHNIQUES) {
    const alone = solveHuman(c.scene, c.people, c.clues, { techniques: [...BASIC_TECHNIQUES, technique] })
    expect(unsoundSteps(alone, solutions), `${c.label}: ${technique.id} alone`).toEqual([])
    if (alone.steps.some((s) => s.technique === technique.id)) {
      fired.set(`alone:${technique.id}`, (fired.get(`alone:${technique.id}`) ?? 0) + 1)
    }
  }
  // A solved puzzle must be THE solution.
  if (full.solved) {
    expect(solutions).toHaveLength(1)
    for (const { personId, cell } of solutions[0] as Placement[]) {
      expect(full.placements.find((p) => p.personId === personId)?.cell).toEqual(cell)
    }
  }
}

describe('advanced techniques never remove a true position: 9x9', () => {
  it('90 sets with few solutions (widened in SLAY-17.2: the themes changed what the seeds draw)', { timeout: 300_000 }, () => {
    for (let seed = 1; seed <= 90; seed++) check(ambiguousCase(9, seed, 20))
  })

  it('90 sets with many solutions', { timeout: 300_000 }, () => {
    for (let seed = 101; seed <= 190; seed++) check(ambiguousCase(9, seed))
  })

  it('60 sets on 6x6 scenes, where rooms are tight', { timeout: 120_000 }, () => {
    for (let seed = 1; seed <= 60; seed++) check(ambiguousCase(6, seed, 60))
  })

  it('a 6x6 set where the rectangle technique fires (rare; CAD-8.6 moved which sets it fires on)', { timeout: 120_000 }, () => {
    for (const seed of [183, 206]) check(ambiguousCase(6, seed, 60))
  })

  it('every advanced technique fired on these sets (so the checks above exercised it)', () => {
    const missing = ADVANCED_TECHNIQUES.filter((t) => !fired.has(`alone:${t.id}`)).map((t) => t.id)
    expect(missing).toEqual([])
  })
})
