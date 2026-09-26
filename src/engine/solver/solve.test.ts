import { describe, expect, it } from 'vitest'
import { evaluate } from '../clues/index.ts'
import type { CatalogClue } from '../clues/index.ts'
import { deriveMurderer, isOccupiable, validatePlacement } from '../model/index.ts'
import { tutorialPuzzle } from '../model/tutorial.fixture.ts'
import type { Person, Placement, Scene } from '../model/index.ts'
import { generateScene } from '../scenegen/index.ts'
import { solve } from './solve.ts'
import { makePeople, randomScene, randomSolution, rng, trueClues, uniquePuzzle } from './testing.fixture.ts'

/** Reference implementation: try every placement, keep those the catalog accepts. */
function bruteForce(scene: Scene, people: Person[], clues: CatalogClue[]): Placement[][] {
  const found: Placement[][] = []
  const chosen: Placement[] = []
  const visit = (i: number) => {
    if (i === people.length) {
      const puzzle = { scene, people }
      if (
        validatePlacement(puzzle, chosen).ok &&
        deriveMurderer(puzzle, chosen) !== null &&
        clues.every((clue) => evaluate(clue, scene, chosen))
      ) {
        found.push(chosen.map((p) => ({ ...p })))
      }
      return
    }
    for (let row = 0; row < scene.height; row++) {
      for (let col = 0; col < scene.width; col++) {
        const cell = { row, col }
        if (!isOccupiable(scene, cell)) continue
        if (chosen.some((p) => p.cell.row === row || p.cell.col === col)) continue
        chosen.push({ personId: (people[i] as Person).id, cell })
        visit(i + 1)
        chosen.pop()
      }
    }
  }
  visit(0)
  return found
}

const key = (solution: Placement[]) =>
  solution.map((p) => `${p.personId}@${p.cell.row},${p.cell.col}`).join(' ')

/** Tutorial clue cards (own reconstruction): A beside the table, B on the bed, C beside the window. */
const tutorialClues: CatalogClue[] = [
  { personId: 'A', type: 'besideObject', args: { objectType: 'table' } },
  { personId: 'B', type: 'onObject', args: { objectType: 'bed' } },
  { personId: 'C', type: 'besideFeature', args: { feature: 'window' } },
  { personId: 'V', type: 'aloneWithMurderer', args: {} },
]

describe('solve: tutorial', () => {
  const { scene, people, solution } = tutorialPuzzle

  it('finds the unique solution and the murderer', () => {
    const result = solve(scene, people, tutorialClues)
    expect(result.count).toBe(1)
    expect(key(result.solutions[0] as Placement[])).toBe(
      key(people.map((p) => solution.find((s) => s.personId === p.id) as Placement)),
    )
    expect(deriveMurderer({ scene, people }, result.solutions[0] as Placement[])).toBe('A')
  })

  it('reports 0 solutions for a contradictory clue', () => {
    const clues: CatalogClue[] = [
      ...tutorialClues,
      { personId: 'A', type: 'inRoom', args: { roomId: 'bedroom' } },
    ]
    expect(solve(scene, people, clues)).toEqual({ count: 0, solutions: [] })
  })

  it('reports several solutions when a clue is missing, capped at 2', () => {
    const result = solve(scene, people, tutorialClues.slice(1))
    expect(result.count).toBe(2)
    expect(result.solutions).toHaveLength(2)
  })

  it('honours a custom limit', () => {
    expect(solve(scene, people, [], { limit: 1 }).count).toBe(1)
    expect(solve(scene, people, [], { limit: 3 }).count).toBe(3)
  })

  it('finds nothing when a clue names an unknown person', () => {
    const clues: CatalogClue[] = [{ personId: 'Z', type: 'inRoom', args: { roomId: 'living' } }]
    expect(solve(scene, people, clues).count).toBe(0)
  })

  it('finds nothing without exactly one victim', () => {
    const noVictim = people.map((p) => ({ ...p, kind: 'suspect' as const }))
    expect(solve(scene, noVictim, []).count).toBe(0)
  })
})

describe('solve: rules without clues', () => {
  it('never lets two people share a row or column and always leaves a murderer', () => {
    const { scene, people } = tutorialPuzzle
    const { solutions } = solve(scene, people, [], { limit: 50 })
    expect(solutions.length).toBeGreaterThan(2)
    for (const solution of solutions) {
      expect(validatePlacement({ scene, people }, solution).ok).toBe(true)
      expect(deriveMurderer({ scene, people }, solution)).not.toBeNull()
    }
  })

  it('keeps people off blocked cells', () => {
    const { scene, people } = tutorialPuzzle
    for (const solution of solve(scene, people, [], { limit: 50 }).solutions) {
      for (const { cell } of solution) expect(isOccupiable(scene, cell)).toBe(true)
    }
  })
})

describe('solve agrees with brute force', () => {
  const cases: [size: number, block: number, seeds: number[]][] = [
    [4, 2, Array.from({ length: 30 }, (_, i) => i + 1)],
    [5, 2, Array.from({ length: 6 }, (_, i) => i + 101)],
  ]
  for (const [size, block, seeds] of cases) {
    for (const seed of seeds) {
      it(`${size}x${size} seed ${seed}`, () => {
        const random = rng(seed)
        const scene = randomScene(size, block, random)
        const people = makePeople(size)
        const clues: CatalogClue[] = []
        // Mostly clues true for one placement, plus one from another: sets range from
        // several solutions through a unique one to a contradiction.
        const first = randomSolution(scene, people, random)
        const second = randomSolution(scene, people, random)
        for (const [base, wanted] of [[first, 3], [second, 1]] as const) {
          const pool = trueClues(scene, people, base, true)
          for (let i = 0; i < wanted && pool.length; i++) {
            clues.push(pool.splice(Math.floor(random() * pool.length), 1)[0] as CatalogClue)
          }
        }
        const expected = bruteForce(scene, people, clues)
        const result = solve(scene, people, clues, { limit: 100000 })
        expect(result.solutions.map(key).sort()).toEqual(expected.map(key).sort())
        expect(result.count).toBe(expected.length)
      })
    }
  }

  it('non-square grids only forbid sharing a row or column', () => {
    const scene: Scene = {
      width: 4,
      height: 2,
      rooms: [
        { id: 'left', name: 'Left' },
        { id: 'right', name: 'Right' },
      ],
      cellRooms: [
        ['left', 'left', 'right', 'right'],
        ['left', 'left', 'right', 'right'],
      ],
      objects: [],
      edgeFeatures: [],
    }
    const people = makePeople(2)
    expect(solve(scene, people, [], { limit: 1000 }).count).toBe(bruteForce(scene, people, []).length)
  })
})

describe('solve: unique puzzles', () => {
  for (const seed of [1, 2, 3]) {
    it(`generated 5x5 puzzle ${seed} has exactly its own solution`, () => {
      const puzzle = uniquePuzzle(seed, 5, 2)
      const result = solve(puzzle.scene, puzzle.people, puzzle.clues)
      expect(result.count).toBe(1)
      const stored = puzzle.people.map((p) => puzzle.solution.find((s) => s.personId === p.id) as Placement)
      expect(key(result.solutions[0] as Placement[])).toBe(key(stored))
    })
  }
})

describe('solve shouldStop (CAD-4.24)', () => {
  it('abandons an open-ended search when the callback says stop and flags the result as aborted', () => {
    const scene = generateScene({ width: 12, height: 12, theme: 'home', seed: 1 })
    let polls = 0
    const stopped = solve(scene, makePeople(12), [], { limit: 1_000_000, shouldStop: () => ++polls > 2 })
    expect(polls).toBeGreaterThan(2)
    expect(stopped.aborted).toBe(true)
    expect(stopped.count).toBeLessThan(1_000_000)
  })

  it('leaves normal runs untouched: no flag, same solutions', () => {
    const { scene, people, clues } = tutorialPuzzle
    const plain = solve(scene, people, clues as CatalogClue[])
    const watched = solve(scene, people, clues as CatalogClue[], { shouldStop: () => false })
    expect(watched.aborted).toBeUndefined()
    expect(watched).toEqual(plain)
  })
})
