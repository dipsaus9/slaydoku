import type { CatalogClue } from '../clues/index.ts'
import type { Puzzle } from '../model/index.ts'
import { solveAdvanced } from '../solver/advanced/solve.ts'
import { ladderCheck } from './ladder.ts'
import type { LadderOptions, LadderResult } from './ladder.ts'
import { precision } from './precision.ts'

/** The human-solvability scale, easiest first. Not the generator's `TierId` list: same names, new meaning. */
export type SolvableTierId = 'very-easy' | 'easy' | 'easy-medium' | 'medium' | 'hard' | 'expert'

/**
 * The two grid-size bands `SOLVABLE_TIERS` gives distinct requirements for (SLAY-13.1): `'small'` is {6,7},
 * `'large'` is {9,12} (CLAUDE.md's grid sizes; 12 is the largest ever used). A calibration spike measured that a
 * flat cap is organically easier to clear on a small grid and closer to binding on a large one, in both
 * directions, so the caps below are banded instead of shared.
 */
export type SizeBandId = 'small' | 'large'

/** `size <= 7` is the `'small'` band ({6,7}), anything larger is `'large'` ({9,12}). */
export function sizeBandOf(size: number): SizeBandId {
  return size <= 7 ? 'small' : 'large'
}

/** The CAD-8.7 caps a ladder tier enforces, for one size band. */
export interface LadderCaps {
  /** Most squares the cards of one placement may leave before any row or column of a placed person is crossed off. */
  maxSquaresFromCards: number
  /** The same cap for the last three placements (the free last one aside): there the rows and columns of the others help least. */
  lastSquaresFromCards: number
  /** Longest chain of placements that depend on placements just before them (`LadderStep.chain`). */
  maxChain: number
}

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
  /** Most cards one placement may use. Left flat across size bands: SLAY-13.1 found no evidence it should be banded. */
  maxCards: number
  /** Cards naming another person (with, direction, distance ...) may be used once that person is placed. */
  references: boolean
  /** Largest share of the placements that may use the tier's top count of cards (only when below 1). */
  maxTopShare: number
  /** People who must be placeable from their own card alone, before anything else is placed. Left flat across size bands (SLAY-13.1). */
  minPlaceableAlone: number
  /**
   * The CAD-8.7 caps (squares a placement's own cards may leave, the tighter cap for the last three placements,
   * and the longest dependency chain), per size band: {6,7} tighter, {9,12} looser (SLAY-13.1's measured
   * numbers). 0-filled for hard/expert (not applicable there; see `scoreBandBySize` instead).
   */
  bySize: Record<SizeBandId, LadderCaps>
  /**
   * The band of score v2 (`scoreV2` in src/engine/difficulty) this tier owns, per size band: inclusive, the
   * bands of all tiers tile 0..100 within a band. Identical across bands for the four ladder tiers (SLAY-13.1
   * found no evidence to band them) and for hard/expert's `'large'` band (measured, within noise of the split
   * already used); hard/expert's `'small'` band mirrors `'large'`: it was a placeholder until SLAY-22 put hard
   * on 6x6 and 7x7 in the first 100 levels, and the SLAY-22 generation sweep passes every gate with it.
   */
  scoreBandBySize: Record<SizeBandId, { min: number; max: number }>
  /**
   * The band of score v2 this tier owns, size-agnostic: equal to `scoreBandBySize.large` (every tier's two bands
   * agree on this number today, see `scoreBandBySize`). Kept for callers that read one flat band, not per size.
   */
  scoreBand: { min: number; max: number }
}

const VERY_EASY_SCORE = { min: 0, max: 7 }
const EASY_SCORE = { min: 8, max: 15 }
const EASY_MEDIUM_SCORE = { min: 16, max: 25 }
const MEDIUM_SCORE = { min: 26, max: 50 }
const HARD_SCORE = { min: 51, max: 87 }
const EXPERT_SCORE = { min: 88, max: 100 }

/**
 * The scale. N per tier, chosen in CAD-8.2 (see docs/solvability/README.md), size-banded per tier in SLAY-13.1:
 * - very-easy: 1 card per placement, no person references, at least 2 people placeable from their own card alone.
 * - easy: 1 or 2 cards, no person references, at most one third of the placements use 2.
 * - easy-medium: at most 2 cards per placement, no person references.
 * - medium: chains of up to 3 cards, person references allowed (once the referent is placed).
 * - hard / expert: needs advanced techniques (scan, victim room, overload, chains ...), as before.
 */
export const SOLVABLE_TIERS: readonly SolvableTier[] = [
  {
    id: 'very-easy', order: 0, method: 'ladder', maxCards: 1, references: false, maxTopShare: 1, minPlaceableAlone: 2,
    bySize: {
      small: { maxSquaresFromCards: 4, lastSquaresFromCards: 3, maxChain: 2 },
      large: { maxSquaresFromCards: 4, lastSquaresFromCards: 3, maxChain: 3 },
    },
    scoreBandBySize: { small: VERY_EASY_SCORE, large: VERY_EASY_SCORE }, scoreBand: VERY_EASY_SCORE,
  },
  {
    id: 'easy', order: 1, method: 'ladder', maxCards: 2, references: false, maxTopShare: 1 / 3, minPlaceableAlone: 0,
    bySize: {
      small: { maxSquaresFromCards: 5, lastSquaresFromCards: 3, maxChain: 2 },
      large: { maxSquaresFromCards: 8, lastSquaresFromCards: 4, maxChain: 3 },
    },
    scoreBandBySize: { small: EASY_SCORE, large: EASY_SCORE }, scoreBand: EASY_SCORE,
  },
  {
    id: 'easy-medium', order: 2, method: 'ladder', maxCards: 2, references: false, maxTopShare: 1, minPlaceableAlone: 0,
    bySize: {
      small: { maxSquaresFromCards: 6, lastSquaresFromCards: 3, maxChain: 2 },
      large: { maxSquaresFromCards: 10, lastSquaresFromCards: 4, maxChain: 4 },
    },
    scoreBandBySize: { small: EASY_MEDIUM_SCORE, large: EASY_MEDIUM_SCORE }, scoreBand: EASY_MEDIUM_SCORE,
  },
  {
    id: 'medium', order: 3, method: 'ladder', maxCards: 3, references: true, maxTopShare: 1, minPlaceableAlone: 0,
    bySize: {
      small: { maxSquaresFromCards: 8, lastSquaresFromCards: 3, maxChain: 3 },
      large: { maxSquaresFromCards: 16, lastSquaresFromCards: 4, maxChain: 4 },
    },
    scoreBandBySize: { small: MEDIUM_SCORE, large: MEDIUM_SCORE }, scoreBand: MEDIUM_SCORE,
  },
  {
    id: 'hard', order: 4, method: 'advanced', maxCards: 0, references: true, maxTopShare: 1, minPlaceableAlone: 0,
    bySize: {
      small: { maxSquaresFromCards: 0, lastSquaresFromCards: 0, maxChain: 0 },
      large: { maxSquaresFromCards: 0, lastSquaresFromCards: 0, maxChain: 0 },
    },
    scoreBandBySize: { small: HARD_SCORE, large: HARD_SCORE }, scoreBand: HARD_SCORE,
  },
  {
    id: 'expert', order: 5, method: 'advanced', maxCards: 0, references: true, maxTopShare: 1, minPlaceableAlone: 0,
    bySize: {
      small: { maxSquaresFromCards: 0, lastSquaresFromCards: 0, maxChain: 0 },
      large: { maxSquaresFromCards: 0, lastSquaresFromCards: 0, maxChain: 0 },
    },
    scoreBandBySize: { small: EXPERT_SCORE, large: EXPERT_SCORE }, scoreBand: EXPERT_SCORE,
  },
]

/** The tier's CAD-8.7 caps for the size band `size` (a grid's width/height) falls in. */
export function ladderCapsFor(tier: SolvableTier, size: number): LadderCaps {
  return tier.bySize[sizeBandOf(size)]
}

/** The numbers a ladder tier holds `ladderCheck` to on a grid of `size`: cards per placement, references and the CAD-8.7 caps for that size's band. */
export function ladderOptions(tier: SolvableTier, size: number): LadderOptions {
  const caps = ladderCapsFor(tier, size)
  return {
    maxCards: tier.maxCards,
    references: tier.references,
    maxSquaresFromCards: caps.maxSquaresFromCards,
    lastSquaresFromCards: caps.lastSquaresFromCards,
    maxChain: caps.maxChain,
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
const HARD_TIER = SOLVABLE_TIERS.find((t) => t.id === 'hard') as SolvableTier
const EXPERT_TIER = SOLVABLE_TIERS.find((t) => t.id === 'expert') as SolvableTier

/**
 * hard vs. expert (SLAY-13.1): the hint solver's hardest technique level is the coarse guard (level < 5 is a
 * hard candidate, else expert), same as before. When the caller can supply the puzzle's score v2, it refines
 * the guess by the size-banded band `SOLVABLE_TIERS[].scoreBandBySize` owns, agreeing with the generation gate
 * (`scoreBandProblem`) downstream. `scoreV2` is threaded in rather than computed here on purpose: computing it
 * needs `computeMetrics`, which itself calls `assessTier` (src/engine/difficulty/metrics.ts's `ladderMetrics`),
 * so calling it from inside `assessTier` would recurse without end.
 */
function classifyAdvanced(size: number, solved: boolean, level: number, scoreV2?: number): 'hard' | 'expert' {
  const guess: 'hard' | 'expert' = solved && level < 5 ? 'hard' : 'expert'
  if (scoreV2 === undefined) return guess
  const band = sizeBandOf(size)
  const clamped = Math.min(100, Math.max(0, Math.round(scoreV2)))
  const inBand = (t: SolvableTier) => clamped >= t.scoreBandBySize[band].min && clamped <= t.scoreBandBySize[band].max
  if (inBand(HARD_TIER)) return 'hard'
  if (inBand(EXPERT_TIER)) return 'expert'
  return guess
}

/**
 * Runs every ladder tier and reports which the puzzle meets (see `tierFor`). `scoreV2`, when the caller has
 * it, refines the hard/expert split (see `classifyAdvanced`); every ladder tier's own caps are always resolved
 * from the puzzle's own grid size (`SOLVABLE_TIERS[].bySize`, SLAY-13.1).
 */
export function assessTier(puzzle: Puzzle, scoreV2?: number): TierAssessment {
  const size = Math.max(puzzle.scene.width, puzzle.scene.height)
  const runs = new Map<string, LadderResult>()
  const meets = { 'very-easy': false, easy: false, 'easy-medium': false, medium: false }
  let tier: SolvableTierId | null = null
  let ladder: LadderResult | null = null
  for (const rule of LADDER_TIERS) {
    const key = `${rule.id}`
    let run = runs.get(key)
    if (!run) {
      run = ladderCheck(puzzle, ladderOptions(rule, size))
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
    tier: classifyAdvanced(size, result.solved, level, scoreV2),
    meets,
    ladder: medium,
    advanced: { solved: result.solved, level },
  }
}

/**
 * The tier a puzzle belongs to on the human-solvability scale: the easiest tier whose rules it
 * meets. A puzzle every ladder tier accepts is very-easy. The tiers are nested from easy-medium up
 * (whatever fits 2 cards fits 3), so the easiest fit is the honest label. A puzzle that fits no
 * ladder tier is hard, or expert when the hint solver needs a level-5 technique or fails (see
 * `assessTier` for how a known score v2 refines that split).
 */
export function tierFor(puzzle: Puzzle, scoreV2?: number): SolvableTierId {
  return assessTier(puzzle, scoreV2).tier
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
