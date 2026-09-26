import type { Cell, Person, Placement, Puzzle, Scene } from '../model/index.ts'
import { validateSolution } from '../model/index.ts'
import type { HumanResult } from '../solver/human/index.ts'
import { GeneratorError, samplePlacement } from './placement.ts'
import { enumerateTrueClues } from './pool.ts'
import { Rng } from './rng.ts'
import { selectClues } from './select.ts'

export interface GenerateOptions {
  /** Same scene + same seed (+ same victim cell) always gives the same puzzle. */
  seed: number
  /** Pin the victim to this cell (0-based). It must be an occupiable cell of the scene. */
  victimCell?: Cell
}

export interface GenerateReport {
  puzzle: Puzzle
  /** Placements tried before one yielded a puzzle (1 = first try). */
  attempts: number
  /** The human solver's walk through the finished puzzle: steps, score and rating. */
  human: HumanResult
}

const MAX_ATTEMPTS = 40

/** Suspect ids A, B, C...; the victim is `V`. */
export function makePeople(size: number): Person[] {
  if (size < 3 || size > 27) throw new GeneratorError(`Unsupported grid size ${size}: use 3 to 27.`)
  return [
    { id: 'V', kind: 'victim', label: 'V' },
    ...Array.from({ length: size - 1 }, (_, i) => {
      const letter = String.fromCharCode(65 + i)
      return { id: letter, kind: 'suspect' as const, label: letter }
    }),
  ]
}

/**
 * Generates a puzzle on `scene`: samples a valid placement, enumerates every
 * true clue, then selects and prunes clues until the CP solver finds exactly
 * one solution AND the human solver finishes without guessing (see
 * `selectClues`). Any valid puzzle is accepted; difficulty tiers come later.
 * Throws GeneratorError when the scene cannot host a puzzle.
 */
export function generate(scene: Scene, options: GenerateOptions): Puzzle {
  return generateWithReport(scene, options).puzzle
}

export function generateWithReport(scene: Scene, options: GenerateOptions): GenerateReport {
  const people = makePeople(scene.width)
  const rng = new Rng(options.seed)
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const sampled = samplePlacement(scene, rng, { victimCell: options.victimCell })
    const suspectIds = people.filter((p) => p.kind === 'suspect').map((p) => p.id)
    const solution: Placement[] = [
      { personId: 'V', cell: sampled.victim },
      ...rng.shuffle(sampled.suspects).map((cell, i) => ({ personId: suspectIds[i] as string, cell })),
    ]
    const pool = enumerateTrueClues(scene, people, solution)
    const selection = selectClues({ scene, people, solution, pool, rng })
    if (!selection) continue
    const puzzle: Puzzle = { scene, people, solution, clues: selection.clues }
    if (!validateSolution(puzzle).ok) continue
    return { puzzle, attempts: attempt, human: selection.human }
  }
  throw new GeneratorError(`No puzzle found after ${MAX_ATTEMPTS} placements.`)
}
