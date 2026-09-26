import type { CatalogClue } from '../../clues/index.ts'
import { GeneratorError, Rng, SELF_CLUE_TYPES, enumerateTrueClues, makePeople, samplePlacement, selectClues } from '../../generator/index.ts'
import { validateSolution } from '../../model/index.ts'
import type { Cell, Person, Placement, Puzzle, Scene } from '../../model/index.ts'
import { solve } from '../solve.ts'
import type { HumanResult } from '../human/types.ts'
import { EXPERT_LEVEL, HARD_LEVEL } from './registry.ts'
import { solveAdvanced } from './solve.ts'

/** Which difficulty to aim for. `any` accepts whatever the sparsest solvable clue set turns out to be. */
export type AdvancedTarget = 'hard' | 'expert' | 'any'

export interface AdvancedGenerateOptions {
  /** Same scene + same seed (+ same options) always gives the same puzzle. */
  seed: number
  /** Pin the victim to this cell (0-based), like `generate`. */
  victimCell?: Cell
  /** Default `hard`. */
  target?: AdvancedTarget
  /** Placements to try before giving up. Default 60. */
  maxAttempts?: number
}

export interface AdvancedGenerateReport {
  puzzle: Puzzle
  /** The advanced solver's walk through the puzzle: steps, score and rating (band `hard` or `expert`, or whatever `any` gave). */
  human: HumanResult
  /** Placements tried before one produced a puzzle of the wanted difficulty (1 = first try). */
  attempts: number
}

const DEFAULT_ATTEMPTS = 60

/**
 * Generates a unique puzzle whose hardest step needs an advanced technique.
 *
 * The generator in `src/engine/generator` stops at clue sets its basic human
 * solver can finish, so its puzzles rate very easy to medium. Here every
 * attempt starts from such a set and then keeps dropping clues while the
 * puzzle stays unique and the ADVANCED solver still finishes it without
 * guessing. The sparser set then needs harder techniques. For `hard` the
 * advanced solver is limited to level 4 (no chain reasoning), so the result
 * is solvable with hard techniques alone; for `expert` it may use everything
 * and the attempt only counts when a level-5 technique was really needed.
 *
 * Deterministic per seed. Throws `GeneratorError` when no attempt reaches the
 * wanted rating, in which case another seed usually works.
 */
export function generateAdvanced(scene: Scene, options: AdvancedGenerateOptions): AdvancedGenerateReport {
  const target = options.target ?? 'hard'
  const maxLevel = target === 'hard' ? HARD_LEVEL : EXPERT_LEVEL
  const people = makePeople(scene.width)
  const rng = new Rng(options.seed)
  const attempts = options.maxAttempts ?? DEFAULT_ATTEMPTS
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const sampled = samplePlacement(scene, rng, { victimCell: options.victimCell })
    const suspectIds = people.filter((p) => p.kind === 'suspect').map((p) => p.id)
    const solution: Placement[] = [
      { personId: 'V', cell: sampled.victim },
      ...rng.shuffle(sampled.suspects).map((cell, i) => ({ personId: suspectIds[i] as string, cell })),
    ]
    const pool = enumerateTrueClues(scene, people, solution)
    const start = selectClues({ scene, people, solution, pool, rng })
    if (!start) continue
    const clues = pruneForAdvanced(scene, people, start.clues, maxLevel, rng)
    const human = solveAdvanced(scene, people, clues, { maxLevel })
    if (!human.solved) continue
    if (target !== 'any' && human.rating?.id !== target) continue
    const puzzle: Puzzle = { scene, people, solution, clues }
    if (!validateSolution(puzzle).ok) continue
    return { puzzle, human, attempts: attempt }
  }
  throw new GeneratorError(`No ${target} puzzle found after ${attempts} placements.`)
}

/**
 * Drops clues in random order while the puzzle stays unique and the advanced
 * solver (up to `maxLevel`) still finishes it; repeats until a full pass
 * removes nothing. The victim's card and every suspect's last self clue stay.
 */
export function pruneForAdvanced(
  scene: Scene,
  people: readonly Person[],
  start: readonly CatalogClue[],
  maxLevel: number,
  rng: Rng,
): CatalogClue[] {
  const suspects = people.filter((p) => p.kind === 'suspect')
  let clues = [...start]
  let removed = true
  while (removed) {
    removed = false
    for (const clue of rng.shuffle(clues)) {
      if (clue.type === 'aloneWithMurderer' || !keepsSelfClue(clues, clue, suspects)) continue
      const rest = clues.filter((c) => c !== clue)
      if (solve(scene, [...people], rest, { limit: 2 }).count !== 1) continue
      if (!solveAdvanced(scene, people, rest, { maxLevel }).solved) continue
      clues = rest
      removed = true
    }
  }
  const order = new Map(people.map((p, i) => [p.id, i]))
  return clues.sort((a, b) => (order.get(a.personId) ?? 0) - (order.get(b.personId) ?? 0))
}

function keepsSelfClue(clues: readonly CatalogClue[], clue: CatalogClue, suspects: readonly Person[]): boolean {
  if (!SELF_CLUE_TYPES.has(clue.type)) return true
  if (!suspects.some((s) => s.id === clue.personId)) return true
  return clues.some((c) => c !== clue && c.personId === clue.personId && SELF_CLUE_TYPES.has(c.type))
}
