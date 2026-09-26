import type { CatalogClue } from '../clues/index.ts'
import type { Puzzle } from '../model/index.ts'
import { solveAdvanced } from '../solver/advanced/solve.ts'
import { ladderCheck } from './ladder.ts'
import type { LadderOptions, LadderResult } from './ladder.ts'
import { precision } from './precision.ts'

/** The human-solvability scale, easiest first. Not the generator's `TierId` list: same names, new meaning. */
export type SolvableTierId = 'very-easy' | 'easy' | 'easy-medium' | 'medium' | 'hard' | 'expert'

/**
 * One tier of the scale, as data. The ladder tiers (very-easy to medium) are decided by
 * `ladderCheck` with the numbers below; hard and expert are what is left (they need the
 * advanced techniques, `method: 'advanced'`).
 */
export interface SolvableTier {
  id: SolvableTierId
  /** 0 = easiest. */
  order: number
  method: 'ladder' | 'advanced'
  /** Most cards one placement may use. */
  maxCards: number
  /** Cards naming another person (with, direction, distance ...) may be used once that person is placed. */
  references: boolean
  /** Largest share of the placements that may use the tier's top count of cards (only when below 1). */
  maxTopShare: number
  /** People who must be placeable from their own card alone, before anything else is placed. */
  minPlaceableAlone: number
  /**
   * Most squares the cards of one placement may leave before any row or column of a placed person is crossed off
   * (CAD-8.7: a card informative on its own). 0 = not applicable (hard, expert).
   */
  maxSquaresFromCards: number
  /** The same cap for the last three placements (the free last one aside): there the rows and columns of the others help least. */
  lastSquaresFromCards: number
  /** Longest chain of placements that depend on placements just before them (`LadderStep.chain`). 0 = not applicable. */
  maxChain: number
  /**
   * The band of score v2 (`scoreV2` in src/engine/difficulty) this tier owns: inclusive, the bands of all tiers tile 0..100.
   * Fitted by the calibration (docs/difficulty/README.md); the score is a secondary number, `tierFor` decides the tier.
   */
  scoreBand: { min: number; max: number }
}

/**
 * The scale. N per tier, chosen in CAD-8.2 (see docs/solvability/README.md):
 * - very-easy: 1 card per placement, no person references, at least 2 people placeable from their own card alone.
 * - easy: 1 or 2 cards, no person references, at most one third of the placements use 2.
 * - easy-medium: at most 2 cards per placement, no person references.
 * - medium: chains of up to 3 cards, person references allowed (once the referent is placed).
 * - hard / expert: needs advanced techniques (scan, victim room, overload, chains ...), as before.
 */
export const SOLVABLE_TIERS: readonly SolvableTier[] = [
  { id: 'very-easy', order: 0, method: 'ladder', maxCards: 1, references: false, maxTopShare: 1, minPlaceableAlone: 2, maxSquaresFromCards: 4, lastSquaresFromCards: 3, maxChain: 2, scoreBand: { min: 0, max: 7 } },
  { id: 'easy', order: 1, method: 'ladder', maxCards: 2, references: false, maxTopShare: 1 / 3, minPlaceableAlone: 0, maxSquaresFromCards: 6, lastSquaresFromCards: 3, maxChain: 2, scoreBand: { min: 8, max: 15 } },
  { id: 'easy-medium', order: 2, method: 'ladder', maxCards: 2, references: false, maxTopShare: 1, minPlaceableAlone: 0, maxSquaresFromCards: 9, lastSquaresFromCards: 3, maxChain: 3, scoreBand: { min: 16, max: 25 } },
  { id: 'medium', order: 3, method: 'ladder', maxCards: 3, references: true, maxTopShare: 1, minPlaceableAlone: 0, maxSquaresFromCards: 14, lastSquaresFromCards: 3, maxChain: 3, scoreBand: { min: 26, max: 50 } },
  { id: 'hard', order: 4, method: 'advanced', maxCards: 0, references: true, maxTopShare: 1, minPlaceableAlone: 0, maxSquaresFromCards: 0, lastSquaresFromCards: 0, maxChain: 0, scoreBand: { min: 51, max: 87 } },
  { id: 'expert', order: 5, method: 'advanced', maxCards: 0, references: true, maxTopShare: 1, minPlaceableAlone: 0, maxSquaresFromCards: 0, lastSquaresFromCards: 0, maxChain: 0, scoreBand: { min: 88, max: 100 } },
]

/** The numbers a ladder tier holds `ladderCheck` to: cards per placement, references and the CAD-8.7 caps. */
export function ladderOptions(tier: SolvableTier): LadderOptions {
  return {
    maxCards: tier.maxCards,
    references: tier.references,
    maxSquaresFromCards: tier.maxSquaresFromCards,
    lastSquaresFromCards: tier.lastSquaresFromCards,
    maxChain: tier.maxChain,
  }
}

/** Whether a finished ladder meets a ladder tier's rules (the ladder must have been run with that tier's numbers). */
export function ladderMeetsTier(puzzle: Puzzle, ladder: LadderResult, tier: SolvableTier): boolean {
  if (tier.method !== 'ladder' || !ladder.ok) return false
  const cards = (step: { clues: number[] }) => step.clues.length
  if (ladder.steps.some((s) => cards(s) > tier.maxCards)) return false
  if (tier.maxTopShare < 1) {
    const top = ladder.steps.filter((s) => cards(s) === tier.maxCards).length
    if (top * 1 > ladder.steps.length * tier.maxTopShare + 1e-9) return false
  }
  if (tier.minPlaceableAlone > 0 && precision(puzzle).placeableAlone.length < tier.minPlaceableAlone) return false
  return true
}

/** The ladder run and verdict per ladder tier, easiest tier first. Steps are shared between tiers with the same numbers. */
export interface TierAssessment {
  /** The easiest tier whose rules the puzzle meets. */
  tier: SolvableTierId
  /** Per ladder tier: whether the puzzle meets its rules. */
  meets: Record<'very-easy' | 'easy' | 'easy-medium' | 'medium', boolean>
  /** The ladder of the tightest ladder tier that passed, or of medium when none did. */
  ladder: LadderResult
  /** Set when no ladder tier fit: the hint solver's verdict (hard/expert by the hardest technique needed). */
  advanced?: { solved: boolean; level: number }
}

const LADDER_TIERS = SOLVABLE_TIERS.filter((t) => t.method === 'ladder')

/** Runs every ladder tier and reports which the puzzle meets (see `tierFor`). */
export function assessTier(puzzle: Puzzle): TierAssessment {
  const runs = new Map<string, LadderResult>()
  const meets = { 'very-easy': false, easy: false, 'easy-medium': false, medium: false }
  let tier: SolvableTierId | null = null
  let ladder: LadderResult | null = null
  for (const rule of LADDER_TIERS) {
    const key = `${rule.id}`
    let run = runs.get(key)
    if (!run) {
      run = ladderCheck(puzzle, ladderOptions(rule))
      runs.set(key, run)
    }
    const passes = ladderMeetsTier(puzzle, run, rule)
    meets[rule.id as keyof typeof meets] = passes
    if (passes && tier === null) {
      tier = rule.id
      ladder = run
    }
  }
  if (tier !== null && ladder) return { tier, meets, ladder }
  const result = solveAdvanced(puzzle.scene, puzzle.people, puzzle.clues as CatalogClue[])
  const level = result.maxTechnique?.level ?? 0
  const medium = runs.get('medium') as LadderResult
  return {
    tier: result.solved && level < 5 ? 'hard' : 'expert',
    meets,
    ladder: medium,
    advanced: { solved: result.solved, level },
  }
}

/**
 * The tier a puzzle belongs to on the human-solvability scale: the easiest tier whose rules it
 * meets. A puzzle every ladder tier accepts is very-easy. The tiers are nested from easy-medium up
 * (whatever fits 2 cards fits 3), so the easiest fit is the honest label. A puzzle that fits no
 * ladder tier is hard, or expert when the hint solver needs a level-5 technique or fails.
 */
export function tierFor(puzzle: Puzzle): SolvableTierId {
  return assessTier(puzzle).tier
}

/**
 * The tier whose score v2 band holds a score (0..100, rounded and clamped). The band table is `SOLVABLE_TIERS[].scoreBand`, the
 * ONE table of the score bands: the generator gates, the pack gates and the calibration tool all read it. A secondary reading: the tier
 * of a puzzle is `tierFor`; the band only says what score a puzzle of that tier is expected to have.
 */
export function tierForScoreV2(score: number): SolvableTierId {
  const clamped = Math.min(100, Math.max(0, Math.round(score)))
  return (SOLVABLE_TIERS.find((t) => clamped >= t.scoreBand.min && clamped <= t.scoreBand.max) as SolvableTier).id
}
