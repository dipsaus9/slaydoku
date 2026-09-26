import type { CatalogClue } from '../../clues/index.ts'
import { validateSolution } from '../../model/index.ts'
import type { Puzzle } from '../../model/index.ts'
import { solve } from '../../solver/index.ts'
import type { HumanResult } from '../../solver/human/index.ts'
import { SELF_CLUE_TYPES } from '../pool.ts'
import { scoreBandProblem } from '../../difficulty/index.ts'
import { tierForScore } from '../tiers/index.ts'
import type { CluePolicy, TierDefinition } from '../tiers/index.ts'

/** Why a finished candidate puzzle was refused. */
export type GateFailure =
  | 'invalid'
  | 'not-unique'
  | 'not-deducible'
  | 'rating-out-of-band'
  | 'too-many-clues'
  | 'trivial'

/** A puzzle needs at least this many human-solver steps per person, or the board practically gives itself away. */
export const MIN_STEPS_PER_PERSON = 1.5

/**
 * Hard and expert puzzles must lean on their tier's techniques, not brush
 * against them once: at least this many steps at or above the tier's minimum
 * technique level. A puzzle whose single level-4 step could be swapped for a
 * basic one by a lucky clue would be rated hard for no good reason.
 */
export const MIN_TOP_LEVEL_STEPS = 2

export interface GateInput {
  puzzle: Puzzle
  /** The puzzle's clues as catalog clues (what the solvers take). */
  clues: readonly CatalogClue[]
  tier: TierDefinition
  /** The walk of the tier's solver (capped technique set) over the final clues. */
  human: HumanResult
  /** 0-100 difficulty of that walk. */
  score: number
}

/**
 * Quality gates every generated puzzle must pass, whatever size or tier. They
 * re-check the selector's own claims from scratch (own solver runs, not the
 * selector's bookkeeping), so a bug or an unlucky cap can never leak a bad
 * puzzle:
 *
 * - invalid: the planted solution breaks a rule or a clue;
 * - not-unique: the CP solver finds a second solution (a guess would be needed);
 * - not-deducible: the human walk does not place everybody without guessing,
 *   or places somebody differently from the planted solution;
 * - rating-out-of-band: hardest technique or score outside the tier (hard and expert: score v2 outside the tier's band, `SOLVABLE_TIERS[].scoreBand`);
 * - too-many-clues: more cards than the tier's policy (one per person plus a few);
 * - trivial: too few steps per person, a suspect without a clue about themself,
 *   a duplicate card, or (hard/expert) fewer than `MIN_TOP_LEVEL_STEPS` steps at
 *   the tier's level.
 *
 * Returns the first failing gate, or null when the puzzle is good.
 */
export function qualityGate({ puzzle, clues, tier, human, score }: GateInput): GateFailure | null {
  if (!validateSolution(puzzle).ok) return 'invalid'
  if (solve(puzzle.scene, [...puzzle.people], [...clues], { limit: 2 }).count !== 1) return 'not-unique'
  if (!human.solved || human.contradiction || !placesPlantedSolution(puzzle, human)) return 'not-deducible'
  const level = human.maxTechnique?.level ?? 0
  if (level < tier.minTechniqueLevel || level > tier.maxTechniqueLevel) return 'rating-out-of-band'
  // Hard and expert are held to the score v2 band of the one tier table (CAD-5.6), the same the pack gate uses; the easier tiers of this legacy path keep the old score band.
  if (tier.availability === 'advanced' ? scoreBandProblem(puzzle, tier.id) !== null : tierForScore(score).id !== tier.id) return 'rating-out-of-band'
  if (!withinCluePolicy(clues, puzzle.people.length, tier)) return 'too-many-clues'
  if (isTrivial(puzzle, clues, tier, human)) return 'trivial'
  return null
}

function placesPlantedSolution(puzzle: Puzzle, human: HumanResult): boolean {
  return puzzle.solution.every((p) => {
    const found = human.placements.find((q) => q.personId === p.personId)
    return found !== undefined && found.cell.row === p.cell.row && found.cell.col === p.cell.col
  })
}

/**
 * The tier's clue policy for a grid with this many people. The tier table
 * counts extra cards on a 9x9 board; a 16x16 board has 16 suspects to pin down,
 * so the allowance grows with the board (never below the table's own number).
 */
export function cluePolicyFor(tier: TierDefinition, peopleCount: number): CluePolicy {
  const scale = peopleCount / REFERENCE_PEOPLE
  return {
    maxExtraClues: Math.max(tier.clues.maxExtraClues, Math.round(tier.clues.maxExtraClues * scale)),
    maxCluesPerSuspect: tier.clues.maxCluesPerSuspect,
  }
}

/** The board size the tier table's clue policy was written for. */
const REFERENCE_PEOPLE = 9

function withinCluePolicy(clues: readonly CatalogClue[], peopleCount: number, tier: TierDefinition): boolean {
  const policy = cluePolicyFor(tier, peopleCount)
  if (clues.length > peopleCount + policy.maxExtraClues) return false
  const perHolder = new Map<string, number>()
  for (const clue of clues) perHolder.set(clue.personId, (perHolder.get(clue.personId) ?? 0) + 1)
  return [...perHolder.values()].every((n) => n <= policy.maxCluesPerSuspect)
}

function isTrivial(puzzle: Puzzle, clues: readonly CatalogClue[], tier: TierDefinition, human: HumanResult): boolean {
  if (human.steps.length < MIN_STEPS_PER_PERSON * puzzle.people.length) return true
  const keys = clues.map((c) => JSON.stringify(c))
  if (new Set(keys).size !== keys.length) return true
  const suspects = puzzle.people.filter((p) => p.kind === 'suspect')
  const hasSelfClue = (id: string) => clues.some((c) => c.personId === id && SELF_CLUE_TYPES.has(c.type))
  if (!suspects.every((s) => hasSelfClue(s.id))) return true
  if (tier.availability === 'advanced') {
    const top = human.steps.filter((s) => s.level >= tier.minTechniqueLevel).length
    if (top < MIN_TOP_LEVEL_STEPS) return true
  }
  return false
}
