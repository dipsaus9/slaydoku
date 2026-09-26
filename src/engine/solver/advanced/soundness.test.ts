import { describe, expect, it } from 'vitest'
import { evaluate } from '../../clues/index.ts'
import type { CatalogClue } from '../../clues/index.ts'
import { validateSolution } from '../../model/index.ts'
import type { Person, Placement, Scene } from '../../model/index.ts'
import { BASIC_TECHNIQUES, solveHuman } from '../human/index.ts'
import { solve } from '../solve.ts'
import { makePeople, randomScene, randomSolution, rng, trueClues } from '../testing.fixture.ts'
import { ADVANCED_TECHNIQUES, solveAdvanced } from './index.ts'
import { ambiguousCase, unsoundSteps } from './testing.fixture.ts'
import type { Case } from './testing.fixture.ts'

/**
 * The advanced techniques must never remove a true position. The truth is the
 * complete list of solutions of a clue set; the clue sets below are left
 * ambiguous or barely unique on purpose, so the solvers stop in the middle of
 * a puzzle, where the hard techniques do their work. For every set the full
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
  it('30 sets with few solutions', { timeout: 120_000 }, () => {
    for (let seed = 1; seed <= 30; seed++) check(ambiguousCase(9, seed, 20))
  })

  it('30 sets with many solutions', { timeout: 120_000 }, () => {
    for (let seed = 31; seed <= 60; seed++) check(ambiguousCase(9, seed))
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

/** Every solution by trying every assignment of people to rows and columns: no solver, no pruning. */
function exhaustive(scene: Scene, people: Person[], clues: CatalogClue[]): Placement[][] {
  const n = people.length
  const perms = permutations(n)
  const out: Placement[][] = []
  for (const rows of perms) {
    for (const cols of perms) {
      const placements = people.map((p, i) => ({ personId: p.id, cell: { row: rows[i] as number, col: cols[i] as number } }))
      if (!validateSolution({ scene, people, solution: placements, clues: [] }).ok) continue
      if (clues.every((clue) => evaluate(clue, scene, placements))) out.push(placements)
    }
  }
  return out
}

function permutations(n: number): number[][] {
  const out: number[][] = []
  const rest = Array.from({ length: n }, (_, i) => i)
  const build = (chosen: number[], left: number[]) => {
    if (left.length === 0) {
      out.push(chosen)
      return
    }
    left.forEach((v, i) => build([...chosen, v], [...left.slice(0, i), ...left.slice(i + 1)]))
  }
  build([], rest)
  return out
}

describe('advanced techniques against exhaustive enumeration: 5x5', () => {
  it('matches every assignment of people to squares, for 12 clue sets', { timeout: 120_000 }, () => {
    let checked = 0
    for (let seed = 1; seed <= 12; seed++) {
      const random = rng(seed)
      const scene = randomScene(5, 2, random)
      const people = makePeople(5)
      const solution = randomSolution(scene, people, random)
      // A random handful of true clues: ambiguous most of the time.
      const pool = trueClues(scene, people, solution)
      const clues: CatalogClue[] = []
      const victim = pool.find((c) => c.type === 'aloneWithMurderer')
      if (victim) clues.push(victim)
      for (let i = 0; i < 4 + (seed % 4); i++) clues.push(pool[Math.floor(random() * pool.length)] as CatalogClue)
      const truth = exhaustive(scene, people, clues)
      const cp = solve(scene, people, clues, { limit: 100_000 })
      expect(cp.count, `seed ${seed}: solver vs exhaustive`).toBe(truth.length)
      for (const technique of [undefined, ...ADVANCED_TECHNIQUES]) {
        const result = technique
          ? solveHuman(scene, people, clues, { techniques: [...BASIC_TECHNIQUES, technique] })
          : solveAdvanced(scene, people, clues)
        expect(unsoundSteps(result, truth), `seed ${seed} ${technique?.id ?? 'full'}`).toEqual([])
      }
      checked++
    }
    expect(checked).toBe(12)
  })
})
