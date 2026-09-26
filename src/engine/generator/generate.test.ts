import { describe, expect, it } from 'vitest'
import { DEMO_GIFT_CELLS, demoScene } from '../../content/demo/scene.ts'
import { checkClue, evaluate } from '../clues/index.ts'
import type { CatalogClue } from '../clues/index.ts'
import { deriveMurderer, parsePuzzle, serializePuzzle, validateSolution } from '../model/index.ts'
import type { Puzzle, Scene } from '../model/index.ts'
import { solve, verifyPuzzle } from '../solver/index.ts'
import { solveHuman } from '../solver/human/index.ts'
import nine from '../solver/fixtures/synthetic-9x9.json?raw'
import { randomScene, rng as testRng } from '../solver/testing.fixture.ts'
import { generate, generateWithReport } from './generate.ts'
import { GeneratorError } from './placement.ts'
import { SELF_CLUE_TYPES } from './pool.ts'
import { isUniqueAndDeducible } from './select.ts'

const sample9: Scene = (JSON.parse(nine) as Puzzle).scene

/** Everything a generated puzzle promises. */
function expectValidPuzzle(puzzle: Puzzle) {
  const { scene, people, solution } = puzzle
  const clues = puzzle.clues as CatalogClue[]
  expect(validateSolution(puzzle).ok).toBe(true)
  expect(deriveMurderer(puzzle, solution)).not.toBeNull()
  for (const clue of clues) {
    expect(checkClue(clue, puzzle)).toEqual([])
    expect(evaluate(clue, scene, solution)).toBe(true)
  }
  // Exactly one solution, and it is the planted one.
  const cp = solve(scene, people, clues)
  expect(cp.count).toBe(1)
  expect(cp.solutions[0]).toEqual(people.map((p) => solution.find((s) => s.personId === p.id)))
  // A human finishes it without guessing.
  const human = solveHuman(scene, people, clues)
  expect(human.solved).toBe(true)
  expect(human.contradiction).toBe(false)
  // Victim card plus a clue about every suspect.
  expect(clues.filter((c) => c.personId === 'V')).toEqual([{ personId: 'V', type: 'aloneWithMurderer', args: {} }])
  for (const person of people.filter((p) => p.kind === 'suspect')) {
    expect(clues.some((c) => c.personId === person.id && SELF_CLUE_TYPES.has(c.type))).toBe(true)
  }
}

/** No clue can go: without it the puzzle is ambiguous, stalls the human, or a suspect is left without a clue. */
function expectMinimal(puzzle: Puzzle) {
  const clues = puzzle.clues as CatalogClue[]
  clues.forEach((clue, i) => {
    if (clue.type === 'aloneWithMurderer') return
    const rest = clues.filter((_, j) => j !== i)
    const holderKeepsOne = rest.some((c) => c.personId === clue.personId && SELF_CLUE_TYPES.has(c.type))
    if (!holderKeepsOne) return
    expect(isUniqueAndDeducible(puzzle.scene, puzzle.people, rest), `clue ${i} (${clue.type}) is redundant`).toBe(false)
  })
}

describe('generate', () => {
  it('is deterministic per seed and differs between seeds', () => {
    const a = generate(sample9, { seed: 12 })
    expect(generate(sample9, { seed: 12 })).toEqual(a)
    expect(serializePuzzle(generate(sample9, { seed: 12 }))).toBe(serializePuzzle(a))
    expect(generate(sample9, { seed: 13 })).not.toEqual(a)
  })

  it('makes a valid, unique, human-deducible and minimal puzzle for 50 seeds on a 9x9 scene', () => {
    let slowest = 0
    for (let seed = 1; seed <= 50; seed++) {
      const start = performance.now()
      const puzzle = generate(sample9, { seed })
      slowest = Math.max(slowest, performance.now() - start)
      expectValidPuzzle(puzzle)
      expectMinimal(puzzle)
    }
    expect(slowest).toBeLessThan(5000)
  }, 120_000)

  it('generates one 9x9 puzzle in under 5 seconds', () => {
    const start = performance.now()
    generate(sample9, { seed: 99 })
    expect(performance.now() - start).toBeLessThan(5000)
  })

  it('works on smaller and larger random scenes', () => {
    for (const [size, block, seed] of [[5, 2, 1], [6, 3, 2], [7, 3, 3], [12, 4, 4]] as const) {
      const scene = randomScene(size, block, testRng(seed))
      const puzzle = generate(scene, { seed })
      expectValidPuzzle(puzzle)
    }
  }, 60_000)

  it('survives the verify round trip (JSON, schema, solver)', () => {
    const puzzle = generate(sample9, { seed: 4 })
    const parsed = parsePuzzle(serializePuzzle(puzzle))
    expect(parsed.ok).toBe(true)
    expect(verifyPuzzle(serializePuzzle(puzzle)).ok).toBe(true)
  })

  it('reports how the puzzle was made', () => {
    const report = generateWithReport(sample9, { seed: 6 })
    expect(report.attempts).toBeGreaterThanOrEqual(1)
    expect(report.human.solved).toBe(true)
    expect(report.human.murderer).toBe(deriveMurderer(report.puzzle, report.puzzle.solution))
  })

  describe('pinned victim cell', () => {
    const houses: [string, Scene, readonly { row: number; col: number }[]][] = [['demo house', demoScene, DEMO_GIFT_CELLS]]
    for (const [name, scene, cells] of houses) {
      it(`puts the victim on the gift cell on ${name}`, () => {
        expect(cells.length).toBeGreaterThan(0)
        for (const [i, cell] of cells.entries()) {
          const puzzle = generate(scene, { seed: 10 + i, victimCell: cell })
          expect(puzzle.solution.find((p) => p.personId === 'V')?.cell).toEqual(cell)
          expectValidPuzzle(puzzle)
          expectMinimal(puzzle)
        }
      })
    }

    it('rejects a blocked victim cell', () => {
      expect(() => generate(demoScene, { seed: 1, victimCell: { row: 0, col: 1 } })).toThrow(GeneratorError)
    })
  })
})
