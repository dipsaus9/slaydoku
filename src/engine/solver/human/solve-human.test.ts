import { describe, expect, it } from 'vitest'
import type { CatalogClue } from '../../clues/index.ts'
import type { Person, Placement, Scene } from '../../model/index.ts'
import { tutorialPuzzle } from '../../model/tutorial.fixture.ts'
import { solve } from '../solve.ts'
import { uniquePuzzle } from '../testing.fixture.ts'
import { BASIC_BANDS, BASIC_TECHNIQUES, TechniqueRegistry, defaultRegistry, solveHuman } from './index.ts'
import type { Technique } from './index.ts'

const tutorialClues: CatalogClue[] = [
  { personId: 'A', type: 'besideObject', args: { objectType: 'table' } },
  { personId: 'B', type: 'onObject', args: { objectType: 'bed' } },
  { personId: 'C', type: 'besideFeature', args: { feature: 'window' } },
  { personId: 'V', type: 'aloneWithMurderer', args: {} },
]

const sameCell = (a: Placement | undefined, b: Placement | undefined) =>
  a !== undefined && b !== undefined && a.cell.row === b.cell.row && a.cell.col === b.cell.col

describe('solveHuman: result shape', () => {
  const { scene, people } = tutorialPuzzle
  const result = solveHuman(scene, people, tutorialClues)

  it('solves the tutorial without guessing and names the murderer', () => {
    expect(result.solved).toBe(true)
    expect(result.contradiction).toBe(false)
    expect(result.murderer).toBe('A')
    expect(result.placements).toHaveLength(people.length)
    for (const stored of tutorialPuzzle.solution) {
      expect(sameCell(result.placements.find((p) => p.personId === stored.personId), stored)).toBe(true)
    }
  })

  it('records ordered steps with technique id, people, cells and an English explanation', () => {
    expect(result.steps.length).toBeGreaterThan(0)
    result.steps.forEach((step, i) => {
      expect(step.index).toBe(i + 1)
      expect(step.technique).toMatch(/^[a-z-]+$/)
      expect(step.explanation.length).toBeGreaterThan(10)
      expect(step.people.length).toBeGreaterThan(0)
      expect(step.cells.length).toBeGreaterThan(0)
      expect(step.placed !== undefined || step.eliminated.length > 0).toBe(true)
    })
    const placed = result.steps.flatMap((s) => (s.placed ? [s.placed.personId] : []))
    expect(placed.sort()).toEqual(people.map((p) => p.id).sort())
    expect(result.steps.some((s) => /can only stand on one square now: row \d+, column \d+/.test(s.explanation))).toBe(true)
  })

  it('scores by hardest technique and step count, and rates the puzzle', () => {
    expect(result.maxTechnique).toEqual({ id: 'clue', title: 'Use a clue', level: 1 })
    expect(result.score).toBe(100 + result.steps.length)
    expect(result.rating?.id).toBe('very-easy')
  })

  it('every removed candidate is a real elimination and never the true position', () => {
    for (const step of result.steps) {
      for (const gone of step.eliminated) {
        const truth = tutorialPuzzle.solution.find((s) => s.personId === gone.personId)
        expect(sameCell(gone, truth)).toBe(false)
      }
    }
  })
})

describe('solveHuman: no guessing', () => {
  it('reports an ambiguous puzzle as unsolved', () => {
    const { scene, people } = tutorialPuzzle
    expect(solve(scene, people, tutorialClues.slice(0, 2)).count).toBe(2)
    const result = solveHuman(scene, people, tutorialClues.slice(0, 2))
    expect(result.solved).toBe(false)
    expect(result.murderer).toBeNull()
    expect(result.rating).toBeNull()
  })

  it('reports a unique puzzle that needs search as unsolved', () => {
    // Seed 3: exactly one solution, yet none of the basic techniques gets past the clues.
    const puzzle = uniquePuzzle(3, 5, 2)
    expect(solve(puzzle.scene, puzzle.people, puzzle.clues).count).toBe(1)
    const result = solveHuman(puzzle.scene, puzzle.people, puzzle.clues)
    expect(result.solved).toBe(false)
    expect(result.contradiction).toBe(false)
    expect(result.placements.length).toBeLessThan(puzzle.people.length)
  })

  it('reports contradicting clues as unsolved', () => {
    const { scene, people } = tutorialPuzzle
    const clues: CatalogClue[] = [
      ...tutorialClues,
      { personId: 'B', type: 'inRoom', args: { roomId: 'living' } },
    ]
    const result = solveHuman(scene, people, clues)
    expect(result.solved).toBe(false)
    expect(result.contradiction).toBe(true)
  })

  it('needs exactly one victim', () => {
    const { scene, people } = tutorialPuzzle
    expect(solveHuman(scene, people.slice(0, 3), []).solved).toBe(false)
  })

  it('a weaker catalog stalls where the full one solves', () => {
    const puzzle = uniquePuzzle(1, 5, 2)
    expect(solveHuman(puzzle.scene, puzzle.people, puzzle.clues).solved).toBe(true)
    const clueOnly = BASIC_TECHNIQUES.filter((t) => t.id === 'clue')
    expect(solveHuman(puzzle.scene, puzzle.people, puzzle.clues, { techniques: clueOnly }).solved).toBe(false)
  })
})

describe('solveHuman: generated puzzles', () => {
  for (const seed of [1, 11, 5]) {
    it(`5x5 seed ${seed}: solved, and equal to the unique solution`, () => {
      const puzzle = uniquePuzzle(seed, 5, 2)
      const result = solveHuman(puzzle.scene, puzzle.people, puzzle.clues)
      expect(result.solved).toBe(true)
      for (const stored of puzzle.solution) {
        expect(sameCell(result.placements.find((p) => p.personId === stored.personId), stored)).toBe(true)
      }
    })
  }

  it('never removes the true position, solved or not (25 puzzles)', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const puzzle = uniquePuzzle(seed, seed % 2 === 0 ? 6 : 5, seed % 2 === 0 ? 3 : 2)
      const result = solveHuman(puzzle.scene, puzzle.people, puzzle.clues)
      for (const step of result.steps) {
        for (const gone of step.eliminated) {
          const truth = puzzle.solution.find((s) => s.personId === gone.personId)
          expect(sameCell(gone, truth), `seed ${seed} step ${step.index} (${step.technique})`).toBe(false)
        }
      }
    }
  })

  it('harder techniques give a higher score than easier ones', () => {
    const easy = uniquePuzzle(1, 5, 2)
    const harder = uniquePuzzle(11, 5, 2)
    const a = solveHuman(easy.scene, easy.people, easy.clues)
    const b = solveHuman(harder.scene, harder.people, harder.clues)
    expect(a.maxTechnique?.level).toBeLessThan(b.maxTechnique?.level ?? 0)
    expect(a.score).toBeLessThan(b.score)
    expect(a.rating?.minLevel).toBeLessThan(b.rating?.minLevel ?? 0)
  })
})

describe('technique catalog is data', () => {
  const people: Person[] = [
    { id: 'A', kind: 'suspect', label: 'A' },
    { id: 'V', kind: 'victim', label: 'V' },
  ]
  const scene: Scene = {
    width: 2,
    height: 2,
    rooms: [{ id: 'r', name: 'Chamber' }],
    cellRooms: [['r', 'r'], ['r', 'r']],
    objects: [],
    edgeFeatures: [],
  }

  it('the default registry holds the basic techniques and bands, easiest first', () => {
    expect(defaultRegistry.list().map((t) => t.id)).toEqual([
      'clue',
      'single-candidate',
      'scan',
      'victim-room',
      'overload',
      'intersect',
    ])
    expect(defaultRegistry.listBands()).toEqual(BASIC_BANDS)
  })

  it('a technique registered from outside is used, without editing the others', () => {
    const custom: Technique = {
      id: 'test-pin',
      title: 'Test',
      level: 9,
      find(board) {
        if (board.isPlaced(0)) return null
        return { place: { person: 0, cell: 0 }, eliminate: [], explanation: 'Testzet.', people: [0], cells: [0] }
      },
    }
    const registry = new TechniqueRegistry()
      .register(...BASIC_TECHNIQUES, custom)
      .registerBand(...BASIC_BANDS, { minLevel: 9, id: 'test', label: 'Testniveau' })
    const result = solveHuman(scene, people, [], {
      techniques: registry.list(),
      bands: registry.listBands(),
    })
    expect(result.steps[0]?.technique).toBe('test-pin')
    expect(result.maxTechnique?.level).toBe(9)
    expect(result.solved).toBe(true) // the built-in single-candidate step finishes the victim
    expect(defaultRegistry.list().some((t) => t.id === 'test-pin')).toBe(false)
  })

  it('refuses a duplicate id', () => {
    const registry = new TechniqueRegistry().register(...BASIC_TECHNIQUES)
    expect(() => registry.register(BASIC_TECHNIQUES[0] as Technique)).toThrow(/already registered/)
  })
})
