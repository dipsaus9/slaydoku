import { describe, expect, it } from 'vitest'
import { bothParts, checkClue, evaluate, isBothClue, PART_CLUE_TYPES } from '../clues/index.ts'
import type { BothClue, CatalogClue, PartClue } from '../clues/index.ts'
import { serializePuzzle, validateSolution } from '../model/index.ts'
import type { Gender, Person, Placement, Scene } from '../model/index.ts'
import { genderLadder } from '../solvable/testing.fixture.ts'
import { ADVANCED_TECHNIQUES, solveAdvanced } from './advanced/index.ts'
import { unsoundSteps } from './advanced/testing.fixture.ts'
import { BASIC_TECHNIQUES, solveHuman } from './human/index.ts'
import { solve } from './solve.ts'
import { makePeople, randomScene, randomSolution, rng, trueClues } from './testing.fixture.ts'
import { verifyPuzzle } from './verify.ts'

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

/** The tutorial ladder with B's two cards ("in column 2", "alone with a man") merged into one combined card. */
const merged = (): typeof genderLadder => ({
  ...genderLadder,
  clues: [
    ...genderLadder.clues.filter((c) => c.personId !== 'B'),
    {
      personId: 'B',
      type: 'both',
      args: { a: { type: 'inColumn', args: { index: 1 } }, b: { type: 'aloneWithGender', args: { gender: 'man' } } },
    },
  ],
})

describe('the combined card in the solvers', () => {
  it('a puzzle with a combined card solves to the same one solution as with its two parts as separate cards', () => {
    const result = verifyPuzzle(serializePuzzle(merged()))
    expect(result).toMatchObject({ ok: true, solutionCount: 1, matchesStored: true })
    expect(verifyPuzzle(serializePuzzle(genderLadder))).toMatchObject({ ok: true, solutionCount: 1 })
  })

  it('the human solver uses the card and explains that it has two parts', () => {
    const puzzle = merged()
    const result = solveHuman(puzzle.scene, puzzle.people, puzzle.clues as CatalogClue[])
    expect(result.solved).toBe(true)
    const text = result.steps.map((s) => s.explanation).join('\n')
    expect(text).toContain('B stond in de 2e kolom en was alleen met een man.')
    expect(text).toContain('Deze kaart heeft twee delen: "B stond in de 2e kolom" en "B was alleen met een man". Beide delen moeten kloppen.')
  })

  it('never remove a true position and count exactly the solutions, on 12 random 5x5 sets with combined cards', { timeout: 120_000 }, () => {
    let withCombined = 0
    for (let seed = 1; seed <= 12; seed++) {
      const random = rng(seed)
      const scene = randomScene(5, 2, random)
      const base = makePeople(5)
      const people: Person[] = base.map((p) => {
        const roll = random()
        const gender: Gender | undefined = p.kind === 'victim' || roll < 0.2 ? undefined : roll < 0.6 ? 'vrouw' : 'man'
        return gender ? { ...p, gender } : p
      })
      const solution = randomSolution(scene, people, random)
      const pool = trueClues(scene, people, solution)
      const gendered: PartClue[] = []
      for (const holder of people.filter((p) => p.kind === 'suspect')) {
        for (const type of ['roomHasGender', 'aloneWithGender'] as const) {
          for (const gender of ['vrouw', 'man'] as const) {
            const clue = { personId: holder.id, type, args: { gender } } as PartClue
            if (checkClue(clue, { scene, people }).length === 0 && evaluate(clue, scene, solution, people)) gendered.push(clue)
          }
        }
      }
      // True parts of one holder: the pool's own structural clues about them, plus the gender ones.
      const partsOf = (holder: string): PartClue[] =>
        [...pool, ...gendered].filter(
          (c): c is PartClue => c.personId === holder && (PART_CLUE_TYPES as readonly string[]).includes(c.type) && checkClue(c, { scene, people }).length === 0,
        )
      const combined: BothClue[] = []
      for (const holder of people.filter((p) => p.kind === 'suspect')) {
        const parts = partsOf(holder.id)
        for (let tries = 0; tries < 2 && parts.length >= 2; tries++) {
          const a = parts[Math.floor(random() * parts.length)] as PartClue
          const b = parts[Math.floor(random() * parts.length)] as PartClue
          const card: BothClue = { personId: holder.id, type: 'both', args: { a: { type: a.type, args: a.args } as never, b: { type: b.type, args: b.args } as never } }
          if (checkClue(card, { scene, people }).length === 0) combined.push(card)
        }
      }
      const victim = pool.find((c) => c.type === 'aloneWithMurderer')
      const clues: CatalogClue[] = [...(victim ? [victim] : []), ...combined.slice(0, 3), pool[Math.floor(random() * pool.length)] as CatalogClue]
      if (clues.some(isBothClue)) withCombined++
      const split = clues.flatMap((c) => (isBothClue(c) ? bothParts(c) : [c]))

      const truth = exhaustive(scene, people, clues)
      expect(truth.length, `seed ${seed}: the planted solution is a solution`).toBeGreaterThan(0)
      expect(solve(scene, people, clues, { limit: 100_000 }).count, `seed ${seed}: solver vs exhaustive`).toBe(truth.length)
      expect(solve(scene, people, split, { limit: 100_000 }).count, `seed ${seed}: as separate cards`).toBe(truth.length)
      for (const technique of [undefined, ...ADVANCED_TECHNIQUES]) {
        const result = technique
          ? solveHuman(scene, people, clues, { techniques: [...BASIC_TECHNIQUES, technique] })
          : solveAdvanced(scene, people, clues)
        expect(unsoundSteps(result, truth), `seed ${seed} ${technique?.id ?? 'full'}`).toEqual([])
      }
    }
    expect(withCombined).toBeGreaterThan(6)
  })
})
