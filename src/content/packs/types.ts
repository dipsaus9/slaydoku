import type { Puzzle } from '../../engine/model/index.ts'
import type { TierId } from '../../engine/generator/tiers/index.ts'
import type { ThemeId } from '../themes/index.ts'

/** Bumped when the JSON layout of a pack file or the index changes. */
export const PACK_FORMAT = 1

/** How hard a pack puzzle turned out, as measured by the advanced human solver. */
export interface PackRating {
  /** 0-100 difficulty score; always inside the tier's band. */
  score: number
  /** Hardest technique level the human walk needed (1 = clue reading .. 5 = expert). */
  level: number
  /** Steps of the human walk. */
  steps: number
}

/** One committed pack puzzle: the playable puzzle plus what the UI lists. */
export interface PackEntry {
  /** Stable id: `<size>-<tier>-<theme>-<seed>`. */
  id: string
  size: number
  tier: TierId
  theme: ThemeId
  /** Seed of both the random scene and the puzzle search. */
  seed: number
  /** Dutch title. */
  title: string
  clueCount: number
  rating: PackRating
  /** Suspect names in seat order (labels of the suspects in `puzzle.people`). */
  cast: string[]
  puzzle: Puzzle
}

/** A committed pack file: all puzzles of one (size, tier). */
export interface PackFile {
  format: typeof PACK_FORMAT
  size: number
  tier: TierId
  puzzles: PackEntry[]
}

/** One line of `index.json`: what a pack browser needs without loading the puzzles. */
export interface IndexEntry {
  id: string
  size: number
  tier: TierId
  theme: ThemeId
  title: string
  clues: number
  rating: PackRating
  /** Pack file, relative to the packs folder. */
  file: string
  /** `puzzleFingerprint` of the stored puzzle (CAD-10.1): saves and solved records of this case are only used while it matches. */
  fp: string
}

export interface PackIndex {
  format: typeof PACK_FORMAT
  count: number
  puzzles: IndexEntry[]
}
