import { describe, expect, it } from 'vitest'
import type { CatalogClue } from '../../clues/index.ts'
import { GeneratorError } from '../../generator/index.ts'
import { serializePuzzle, validateSolution } from '../../model/index.ts'
import { generateScene } from '../../scenegen/index.ts'
import { solveHuman } from '../human/index.ts'
import { solve } from '../solve.ts'
import { generateAdvanced, solveAdvanced } from './index.ts'

const scene9 = (seed: number) => generateScene({ width: 9, height: 9, theme: 'home', seed })

describe('generateAdvanced', () => {
  it('makes a unique hard puzzle the basic solver cannot finish, deterministically', { timeout: 60_000 }, () => {
    const scene = scene9(1)
    const first = generateAdvanced(scene, { seed: 1, target: 'hard' })
    const again = generateAdvanced(scene, { seed: 1, target: 'hard' })
    expect(serializePuzzle(first.puzzle)).toBe(serializePuzzle(again.puzzle))
    const { puzzle, human } = first
    expect(validateSolution(puzzle).ok).toBe(true)
    const clues = puzzle.clues as CatalogClue[]
    expect(solve(puzzle.scene, puzzle.people, clues).count).toBe(1)
    expect(human.solved).toBe(true)
    expect(human.rating?.id).toBe('hard')
    expect(human.maxTechnique?.level).toBe(4)
    expect(solveHuman(puzzle.scene, puzzle.people, clues).solved).toBe(false)
    expect(solveAdvanced(puzzle.scene, puzzle.people, clues).score).toBe(human.score)
  })

  it('makes an expert puzzle that needs a level-5 technique', { timeout: 60_000 }, () => {
    const scene = scene9(5)
    const { puzzle, human } = generateAdvanced(scene, { seed: 5, target: 'expert' })
    const clues = puzzle.clues as CatalogClue[]
    expect(solve(puzzle.scene, puzzle.people, clues).count).toBe(1)
    expect(human.rating?.id).toBe('expert')
    expect(human.maxTechnique?.level).toBe(5)
    expect(human.score).toBeGreaterThan(500)
    // Hard techniques alone are not enough for it.
    expect(solveAdvanced(puzzle.scene, puzzle.people, clues, { maxLevel: 4 }).solved).toBe(false)
  })

  it('honours a pinned victim cell', { timeout: 60_000 }, () => {
    const scene = scene9(2)
    const victimCell = generateAdvanced(scene, { seed: 2, target: 'any' }).puzzle.solution.find((p) => p.personId === 'V')?.cell
    if (!victimCell) throw new Error('no victim')
    const { puzzle } = generateAdvanced(scene, { seed: 9, target: 'any', victimCell })
    expect(puzzle.solution.find((p) => p.personId === 'V')?.cell).toEqual(victimCell)
  })

  it('throws a GeneratorError when no attempt is allowed', () => {
    expect(() => generateAdvanced(scene9(1), { seed: 1, maxAttempts: 0 })).toThrow(GeneratorError)
  })
})
