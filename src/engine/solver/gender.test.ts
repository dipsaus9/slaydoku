import { describe, expect, it } from 'vitest'
import { checkClue, evaluate } from '../clues/index.ts'
import type { CatalogClue } from '../clues/index.ts'
import { serializePuzzle, validateSolution } from '../model/index.ts'
import type { Gender, Person, Placement, Scene } from '../model/index.ts'
import { ADVANCED_TECHNIQUES, solveAdvanced } from './advanced/index.ts'
import { unsoundSteps } from './advanced/testing.fixture.ts'
import { BASIC_TECHNIQUES, solveHuman } from './human/index.ts'
import { solve } from './solve.ts'
import { makePeople, randomScene, randomSolution, rng, trueClues } from './testing.fixture.ts'
import { verifyPuzzle } from './verify.ts'
import { genderLadder } from '../solvable/testing.fixture.ts'

/** Every solution by trying every assignment of people to rows and columns: no solver, no pruning. */
function exhaustive(scene: Scene, people: Person[], clues: CatalogClue[]): Placement[][] {
  const perms = permutations(people.length)
  const out: Placement[][] = []
  for (const rows of perms) {
    for (const cols of perms) {
      const placements = people.map((p, i) => ({ personId: p.id, cell: { row: rows[i] as number, col: cols[i] as number } }))
      if (!validateSolution({ scene, people, solution: placements, clues: [] }).ok) continue
      if (clues.every((clue) => evaluate(clue, scene, placements, people))) out.push(placements)
    }
  }
  return out
}

function permutations(n: number): number[][] {
  const out: number[][] = []
  const build = (chosen: number[], left: number[]) => {
    if (left.length === 0) return void out.push(chosen)
    left.forEach((v, i) => build([...chosen, v], [...left.slice(0, i), ...left.slice(i + 1)]))
  }
  build([], Array.from({ length: n }, (_, i) => i))
  return out
}

describe('the gender clues in the solvers', () => {
  it('solve a hand-made puzzle to its one solution, the stored one', () => {
    const result = verifyPuzzle(serializePuzzle(genderLadder))
    expect(result).toMatchObject({ ok: true, solutionCount: 1, matchesStored: true })
  })

  it('the human solver places everybody and explains the gender card in Dutch', () => {
    const result = solveHuman(genderLadder.scene, genderLadder.people, genderLadder.clues as CatalogClue[])
    expect(result.solved).toBe(true)
    const text = result.steps.map((s) => s.explanation).join('\n')
    expect(text).toContain('B was alleen met een man.')
  })

  it('never remove a true position and count exactly the solutions, on 12 random 5x5 sets', { timeout: 120_000 }, () => {
    let withGenderCards = 0
    for (let seed = 1; seed <= 12; seed++) {
      const random = rng(seed)
      const scene = randomScene(5, 2, random)
      const base = makePeople(5)
      // Random genders, some people without one; the victim has none.
      const people: Person[] = base.map((p) => {
        const roll = random()
        const gender: Gender | undefined = p.kind === 'victim' || roll < 0.2 ? undefined : roll < 0.6 ? 'vrouw' : 'man'
        return gender ? { ...p, gender } : p
      })
      const solution = randomSolution(scene, people, random)
      const gendered: CatalogClue[] = []
      for (const holder of people.filter((p) => p.kind === 'suspect')) {
        for (const type of ['roomHasGender', 'aloneWithGender'] as const) {
          for (const gender of ['vrouw', 'man'] as const) {
            const clue = { personId: holder.id, type, args: { gender } } as CatalogClue
            if (checkClue(clue, { scene, people }).length === 0 && evaluate(clue, scene, solution, people)) gendered.push(clue)
          }
        }
      }
      const pool = trueClues(scene, people, solution)
      const clues: CatalogClue[] = []
      const victim = pool.find((c) => c.type === 'aloneWithMurderer')
      if (victim) clues.push(victim)
      for (let i = 0; i < 2; i++) clues.push(pool[Math.floor(random() * pool.length)] as CatalogClue)
      for (let i = 0; i < 3 && gendered.length > 0; i++) clues.push(gendered[Math.floor(random() * gendered.length)] as CatalogClue)
      if (clues.some((c) => c.type === 'roomHasGender' || c.type === 'aloneWithGender')) withGenderCards++

      const truth = exhaustive(scene, people, clues)
      expect(truth.length, `seed ${seed}: the planted solution is a solution`).toBeGreaterThan(0)
      expect(solve(scene, people, clues, { limit: 100_000 }).count, `seed ${seed}: solver vs exhaustive`).toBe(truth.length)
      for (const technique of [undefined, ...ADVANCED_TECHNIQUES]) {
        const result = technique
          ? solveHuman(scene, people, clues, { techniques: [...BASIC_TECHNIQUES, technique] })
          : solveAdvanced(scene, people, clues)
        expect(unsoundSteps(result, truth), `seed ${seed} ${technique?.id ?? 'full'}`).toEqual([])
      }
    }
    expect(withGenderCards).toBeGreaterThan(6)
  })
})
