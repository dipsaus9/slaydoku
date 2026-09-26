import type { ScaleRejection } from '../../engine/generator/scale/index.ts'
import type { TierId } from '../../engine/generator/tiers/index.ts'
import type { Gender, Puzzle } from '../../engine/model/index.ts'
import type { PackEntry } from '../../content/packs/types.ts'
import type { ThemeId } from '../../content/themes/index.ts'

/** What the generate form asks the worker for. */
export interface GenerateRequest {
  size: number
  tier: TierId
  theme: ThemeId
  seed: number
  /** Pin the gift to this 0-based cell. */
  victim?: { row: number; col: number }
  /** Wall clock for the whole search. */
  budgetMs: number
  /** Genders of the suspects in order (the cast of the board): the search may then draw gender cards. See `withCastGenders`. */
  genders?: readonly Gender[]
}

/** Steps the worker reports, in order. */
export type LabPhase = 'scene' | 'search' | 'check'

/** A generated puzzle in the shape of a pack entry, plus what the lab shows about the run. */
export interface LabPuzzle extends PackEntry {
  attempts: number
  elapsedMs: number
  /** Pack checks (`entryProblems`) the puzzle does not pass. It stays playable; the lab shows them. */
  warnings: string[]
}

export interface LabFailure {
  reason: string
  timedOut: boolean
  attempts: number
  elapsedMs: number
  rejections: Partial<Record<ScaleRejection, number>>
}

/** What the worker found: the raw puzzle from the tier generator plus its measurements. */
export interface FoundPuzzle {
  puzzle: Puzzle
  attempts: number
  score: number
  level: number
  steps: number
  elapsedMs: number
}

export type SearchOutcome = { ok: true; found: FoundPuzzle } | { ok: false; failure: LabFailure }

export type GenerationOutcome = { ok: true; puzzle: LabPuzzle } | { ok: false; failure: LabFailure }

/** Worker to page. */
export type WorkerMessage = { type: 'phase'; phase: LabPhase } | { type: 'done'; outcome: SearchOutcome }
