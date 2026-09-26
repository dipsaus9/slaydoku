import type { DifficultyMetrics, ScoreV2, ScoreWeights } from './types.ts'

/**
 * The fitted weights of the score v2 parts (CAD-5.6). Whole numbers, relative: the score divides by their sum.
 * They are the output of the calibration (`docs/difficulty/README.md`).
 */
export const DEFAULT_WEIGHTS: ScoreWeights = {
  level: 40,
  steps: 9,
  chain: 2,
  cluesPerStep: 2,
  indirectClues: 2,
  candidates: 4,
  cards: 22,
  references: 10,
  squares: 5,
  ladderChain: 2,
  scarcity: 2,
}

/**
 * Where each part reaches 0 and 1. Per person where the metric grows with the
 * grid, so 6x6 and 16x16 puzzles sit on one scale. Chosen from the spread of the
 * metrics over a sample of puzzles (see docs/difficulty/README.md); only the weights are fitted.
 */
export const PART_RANGES = {
  /** Hardest technique level 1..5. */
  level: { from: 1, to: 5 },
  /** Steps per person. */
  steps: { from: 2, to: 5 },
  /** Longest chain per person. */
  chain: { from: 0.5, to: 3 },
  /** Distinct cards a step rests on, as a share of all cards. */
  cluesPerStep: { from: 0.2, to: 0.6 },
  /** Candidates per step, as a share of the grid's squares. */
  candidates: { from: 0.05, to: 0.5 },
  /** Mean cards per placement on the ladder. */
  cards: { from: 1, to: 2 },
  /** Share of the placements that use a card naming another person. */
  references: { from: 0, to: 0.5 },
  /** Mean squares a placement's cards leave before the lines are crossed off. */
  squares: { from: 1, to: 6 },
  /** Mean chain of dependent placements on the ladder. */
  ladderChain: { from: 0, to: 1.5 },
  /** Share of the people placeable from their own card alone at which the scarcity part reaches 0 (it is 1 at none). */
  scarcity: { from: 0, to: 0.5 },
} as const

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x))
const scaled = (value: number, range: { from: number; to: number }): number => clamp01((value - range.from) / (range.to - range.from))
const round = (value: number, digits: number): number => Math.round(value * 10 ** digits) / 10 ** digits

/** Weight keys, in the order the parts are listed everywhere. */
export const PART_KEYS = Object.keys(DEFAULT_WEIGHTS) as (keyof ScoreWeights)[]

/**
 * The parts of score v2: each metric becomes a 0..1 number (see `PART_RANGES`). The ladder parts are 1 (the hardest)
 * when no ladder tier fits the puzzle (hard, expert): nobody can place the people one at a time there. Pure.
 * `cells` is the grid's square count; when omitted it is taken as people squared (the grids are square, one person per row).
 */
export function scoreParts(metrics: DifficultyMetrics, cells: number = metrics.people * metrics.people): ScoreV2['parts'] {
  const people = Math.max(1, metrics.people)
  const onLadder = (part: number): number => (metrics.ladderSolved ? part : 1)
  return {
    level: metrics.hardestLevel === 0 ? 0 : scaled(metrics.hardestLevel, PART_RANGES.level),
    steps: scaled(metrics.steps / people, PART_RANGES.steps),
    chain: scaled(metrics.longestChain / people, PART_RANGES.chain),
    cluesPerStep: scaled(metrics.cluesPerStep / Math.max(1, metrics.clueCount), PART_RANGES.cluesPerStep),
    indirectClues: clamp01(1 - metrics.directClueShare),
    candidates: scaled(metrics.candidatesPerStep / Math.max(1, cells), PART_RANGES.candidates),
    cards: onLadder(scaled(metrics.cardsPerPlacement, PART_RANGES.cards)),
    references: onLadder(scaled(metrics.referenceShare, PART_RANGES.references)),
    squares: onLadder(scaled(metrics.squaresFromCards, PART_RANGES.squares)),
    ladderChain: onLadder(scaled(metrics.ladderChain, PART_RANGES.ladderChain)),
    scarcity: clamp01(1 - metrics.placeableAloneShare / PART_RANGES.scarcity.to),
  }
}

/** The 0-100 score of parts under weights: their weighted mean. */
export function combineParts(parts: ScoreV2['parts'], weights: ScoreWeights): number {
  const total = PART_KEYS.reduce((sum, k) => sum + weights[k], 0)
  const weighted = PART_KEYS.reduce((sum, k) => sum + weights[k] * parts[k], 0)
  return total <= 0 ? 0 : Math.round((100 * weighted) / total)
}

/**
 * Score v2: a 0-100 number that combines the felt-difficulty metrics as a secondary number next to the tier
 * (the tier, `tierFor` in `src/engine/solvable`, is what decides the level a puzzle belongs to; the score orders
 * puzzles inside and across tiers, and each tier has a band of it: `SOLVABLE_TIERS[].scoreBand`). Each metric becomes a
 * 0..1 part (`scoreParts`), the parts are averaged with `weights`. Pure and deterministic.
 */
export function scoreV2(
  metrics: DifficultyMetrics,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
  cells: number = metrics.people * metrics.people,
): ScoreV2 {
  const parts = scoreParts(metrics, cells)
  return {
    score: combineParts(parts, weights),
    parts: Object.fromEntries(PART_KEYS.map((k) => [k, round(parts[k], 3)])) as ScoreV2['parts'],
  }
}
