import { STRUCTURAL_CLUE_TYPES } from '../../clues/index.ts'
import type { CatalogClue } from '../../clues/index.ts'
import { RELATIONAL_CLUE_TYPES } from '../../clues/relational/types.ts'
import type { HumanResult } from '../../solver/human/index.ts'
import { SOLVABLE_TIERS } from '../../solvable/tiers.ts'
import type { SolvableTierId } from '../../solvable/tiers.ts'

export type ClueKind = CatalogClue['type']

/**
 * The tier ids are those of the human-solvability scale (`SOLVABLE_TIERS` in src/engine/solvable/tiers.ts, CAD-5.6): one table of tiers. What this
 * file adds per tier is what the generator needs (label, clue kinds, clue policy, technique levels); the order comes from that table.
 */
export type TierId = SolvableTierId

const orderOf = (id: TierId): number => (SOLVABLE_TIERS.find((t) => t.id === id) as { order: number }).order

/**
 * How many clue cards a puzzle of this tier may carry. The faithful game has
 * one card per person (the victim's included), so the target is `people` cards.
 * The CAD-4.7 generator found that forcing exactly one clue per suspect stalls
 * the human solver, so a tier allows a small number of EXTRA cards on top,
 * more in the tiers that ask for more clue kinds to be combined.
 */
export interface CluePolicy {
  /** Cards beyond one per person that are still accepted. 0 = strictly one card each. */
  maxExtraClues: number
  /** Cards a single suspect may hold (a self clue plus extras). */
  maxCluesPerSuspect: number
}

export interface TierDefinition {
  id: TierId
  /** Name for the UI. */
  label: string
  /** 0 = easiest; taken from `SOLVABLE_TIERS`. */
  order: number
  /** The clue kinds the generator may use. `aloneWithMurderer` (the victim card) is always in. */
  allowedKinds: readonly ClueKind[]
  /** Allowed kinds that only make dull puzzles when they dominate; the generator reaches for them last. */
  fallbackKinds: readonly ClueKind[]
  /** Hardest human technique the puzzle may need, and the least it must need. Levels as in the human solver's registry. */
  minTechniqueLevel: number
  maxTechniqueLevel: number
  /**
   * Inclusive range of the OLD 0-100 score (`difficultyScore`, technique level plus steps) that the technique-based generators (`generateTier`, `generateForScene`)
   * still steer by; the ranges of all tiers tile 0..100. Not the tier bands: those are score v2 and live in `SOLVABLE_TIERS[].scoreBand`, and the
   * pack and hard/expert generator gates use them (CAD-5.6).
   */
  minScore: number
  maxScore: number
  clues: CluePolicy
  /**
   * `now` tiers work with the basic techniques of story CAD-4.6. `advanced`
   * tiers need the level 4+ techniques of story CAD-4.22; `generateTier`
   * refuses them until such a technique is registered in `defaultRegistry`
   * (it never is: they are opt-in). `generateForScene` in `../scale` opts in
   * through `advancedRegistry` and is how hard and expert puzzles are made.
   */
  availability: 'now' | 'advanced'
}

const BASE_KINDS = ['aloneWithMurderer', 'onObject', 'squareWithObject', 'inRoom', 'alone', 'onlyOnObject'] as const satisfies readonly ClueKind[]

/**
 * Very easy and easy share the clue kinds and differ in the technique cap:
 * very easy must be solvable with clue reading and single candidates only,
 * easy may also use scanning and the victim room. A smaller very-easy set
 * (objects and rooms only) cannot pin nine suspects down, so it was not used.
 */
const EASY_KINDS = [
  ...BASE_KINDS,
  'besideObject', 'inRoomOr', 'emptyRoom', 'inCorner', 'besideFeature', 'inFrontOfDoor',
  // Plain row/column numbers: without them easy puzzles on the house scenes (few objects, big rooms) cannot be made.
  'inRow', 'inColumn',
  // Top/bottom row or left/right column of a room (CAD-9.2): a structural single card, like a corner.
  'inRoomEdge',
] as const satisfies readonly ClueKind[]

const EASY_MEDIUM_KINDS = [
  ...EASY_KINDS,
  // "with X" clues and the room relations between people.
  'withPerson', 'aloneWith', 'sameRoom', 'differentRoom', 'notWith',
  // Ordinals: first/last/middle row or column.
  'onLine',
  // Directions (no counting of squares yet).
  'directionOf', 'directionOfObject', 'directlyNextToObject', 'notBesideObject',
  // Combined card (CAD-9.3): two facts about the holder on one card. The ladder generator draws it from here on
  // (its parts follow the tier: no person references below medium).
  'both',
] as const satisfies readonly ClueKind[]

/** What easy and easy-medium puzzles must never contain: distances, diagonals and quadrants. */
export const RELATIONAL_DISTANCE_KINDS = ['exactDistance', 'diagonal', 'quadrant'] as const satisfies readonly ClueKind[]

/**
 * Kinds about who else stands in the holder's room, by gender (CAD-9.1): person references without naming a person, so
 * like the other person cards they come with medium (see `GENDER_CLUE_TYPES` and the solvability scale).
 */
const GENDER_KINDS = ['roomHasGender', 'aloneWithGender'] as const satisfies readonly ClueKind[]

const MEDIUM_KINDS = [...EASY_MEDIUM_KINDS, ...RELATIONAL_DISTANCE_KINDS, ...GENDER_KINDS] as const satisfies readonly ClueKind[]

/** Hard and expert allow the whole catalog. */
const ALL_KINDS: readonly ClueKind[] = [...STRUCTURAL_CLUE_TYPES, ...RELATIONAL_CLUE_TYPES]

/**
 * The difficulty bands as data, easiest first.
 *
 * Score ranges follow `difficultyScore`: level 1 techniques fill 0-19, level 2
 * 20-54 (split into easy and easy-medium by the number of steps), level 3
 * 55-69, level 4 70-84, level 5+ 85-100. Hard and expert are defined here but
 * only become reachable when story CAD-4.22 registers level 4/5 techniques.
 */
export const TIERS: readonly TierDefinition[] = [
  {
    id: 'very-easy', label: 'Very easy', order: orderOf('very-easy'), allowedKinds: EASY_KINDS, fallbackKinds: ['inRow', 'inColumn'],
    minTechniqueLevel: 1, maxTechniqueLevel: 1, minScore: 0, maxScore: 19,
    clues: { maxExtraClues: 4, maxCluesPerSuspect: 2 }, availability: 'now',
  },
  {
    id: 'easy', label: 'Easy', order: orderOf('easy'), allowedKinds: EASY_KINDS, fallbackKinds: ['inRow', 'inColumn'],
    minTechniqueLevel: 2, maxTechniqueLevel: 2, minScore: 20, maxScore: 34,
    clues: { maxExtraClues: 4, maxCluesPerSuspect: 2 }, availability: 'now',
  },
  {
    id: 'easy-medium', label: 'Easy-medium', order: orderOf('easy-medium'), allowedKinds: EASY_MEDIUM_KINDS, fallbackKinds: ['inRow', 'inColumn'],
    minTechniqueLevel: 2, maxTechniqueLevel: 2, minScore: 35, maxScore: 54,
    clues: { maxExtraClues: 5, maxCluesPerSuspect: 3 }, availability: 'now',
  },
  {
    id: 'medium', label: 'Medium', order: orderOf('medium'), allowedKinds: MEDIUM_KINDS, fallbackKinds: [],
    minTechniqueLevel: 3, maxTechniqueLevel: 3, minScore: 55, maxScore: 69,
    clues: { maxExtraClues: 5, maxCluesPerSuspect: 3 }, availability: 'now',
  },
  {
    id: 'hard', label: 'Hard', order: orderOf('hard'), allowedKinds: ALL_KINDS, fallbackKinds: [],
    minTechniqueLevel: 4, maxTechniqueLevel: 4, minScore: 70, maxScore: 84,
    clues: { maxExtraClues: 6, maxCluesPerSuspect: 3 }, availability: 'advanced',
  },
  {
    id: 'expert', label: 'Expert', order: orderOf('expert'), allowedKinds: ALL_KINDS, fallbackKinds: [],
    minTechniqueLevel: 5, maxTechniqueLevel: 99, minScore: 85, maxScore: 100,
    clues: { maxExtraClues: 6, maxCluesPerSuspect: 3 }, availability: 'advanced',
  },
]

export const tierById = (id: TierId): TierDefinition => {
  const tier = TIERS.find((t) => t.id === id)
  if (!tier) throw new Error(`Unknown difficulty tier "${id}".`)
  return tier
}

/** The named band a 0-100 difficulty score falls in. Scores are clamped to 0..100. */
export function tierForScore(score: number): TierDefinition {
  const clamped = Math.min(100, Math.max(0, Math.round(score)))
  return TIERS.find((t) => clamped >= t.minScore && clamped <= t.maxScore) as TierDefinition
}

export const allowsKind = (tier: TierDefinition, kind: string): boolean =>
  (tier.allowedKinds as readonly string[]).includes(kind)

/**
 * Score span a hardest-technique level owns, and the steps per person that
 * place a puzzle at its bottom and top (level 5 and up share the last span).
 * The spans tile 0..100, so the tiers never overlap whatever the grid size.
 *
 * Calibrated in two rounds. CAD-4.8 on 9x9 puzzles (levels 1-3). CAD-4.24 on
 * 10 random puzzles per tier at 6x6, 7x7, 9x9, 12x12 and 16x16 (measured
 * distributions are in the task notes): steps per person barely depends on the
 * grid size (very easy 2.0-3.0, easy 2.1-2.8, easy-medium 2.9-3.8, medium
 * 2.2-5.3, hard 2.4-5.4, expert 3.0-6.4), which is why the score is taken per
 * person. Hard and expert use 3 to 5.5 (was 3 to 6) so their puzzles fill the
 * band instead of piling up in its lower half.
 */
export const LEVEL_SPANS: readonly { level: number; from: number; to: number; lowSteps: number; highSteps: number }[] = [
  { level: 1, from: 0, to: 19, lowSteps: 2, highSteps: 3 },
  { level: 2, from: 20, to: 54, lowSteps: 2, highSteps: 4 },
  { level: 3, from: 55, to: 69, lowSteps: 3, highSteps: 5 },
  { level: 4, from: 70, to: 84, lowSteps: 3, highSteps: 5.5 },
  { level: 5, from: 85, to: 100, lowSteps: 3, highSteps: 5.5 },
]

/**
 * Maps a human-solver walk-through to a 0-100 difficulty score: the hardest
 * technique picks the span, the step count (per person, so grids of any size
 * compare) picks the place inside it. The human solver's own score
 * (`level * 100 + steps`) stays the raw measure; this is the same idea on a
 * fixed scale so the tiers can name ranges.
 */
export function difficultyScore(human: Pick<HumanResult, 'steps' | 'maxTechnique'>, peopleCount: number): number {
  const level = Math.max(1, human.maxTechnique?.level ?? 1)
  const span = LEVEL_SPANS[Math.min(level, LEVEL_SPANS.length) - 1] as (typeof LEVEL_SPANS)[number]
  const perPerson = human.steps.length / Math.max(1, peopleCount)
  const fraction = Math.min(1, Math.max(0, (perPerson - span.lowSteps) / (span.highSteps - span.lowSteps)))
  return Math.round(span.from + fraction * (span.to - span.from))
}
