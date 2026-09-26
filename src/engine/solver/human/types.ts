import type { CatalogClue } from '../../clues/index.ts'
import type { Cell, Person, Placement, Scene } from '../../model/index.ts'
import type { BoardView } from './board.ts'

/** The puzzle a human solve works on, plus a scratch memo techniques may use for expensive lookups. */
export interface HumanContext {
  scene: Scene
  people: readonly Person[]
  clues: readonly CatalogClue[]
  /** Per-solve cache. Keys are the technique's own business: prefix them with the technique id. */
  memo: Map<string, unknown>
}

/** A candidate removed from a person, by index (see `BoardView`). */
export interface Elimination {
  person: number
  cell: number
}

/**
 * What one technique application concludes. Either removes candidates, or
 * places a person (whose row and column then close to everybody else; the
 * solver adds those eliminations itself).
 */
export interface Deduction {
  place?: { person: number; cell: number }
  eliminate: Elimination[]
  /** Dutch explanation, written for a player. */
  explanation: string
  /** People the deduction talks about. */
  people: number[]
  /** Cells the deduction talks about (to highlight). */
  cells: number[]
  /** Index into the clue list when a clue triggered the deduction. */
  clueIndex?: number
}

/**
 * One solving technique. The catalog is plain data: a technique is an object
 * with an id, a difficulty level and a `find`. Adding a technique means
 * registering another object; nothing here is edited.
 */
export interface Technique {
  /** Stable machine id, e.g. `scan`. */
  id: string
  /** Dutch name shown to players, e.g. "Rij voor rij scannen". */
  title: string
  /**
   * Difficulty tier, 1 = obvious. Lower levels are tried first, and the
   * hardest level used decides the puzzle's rating.
   */
  level: number
  /**
   * Finds the first application that teaches something new (removes a
   * candidate or places somebody), or null. Never mutates the board, and
   * never returns a deduction that changes nothing.
   */
  find(board: BoardView, context: HumanContext): Deduction | null
}

/** A rating band: puzzles whose hardest technique has at least `minLevel`. */
export interface DifficultyBand {
  minLevel: number
  id: string
  /** Dutch label. */
  label: string
}

/** One recorded solving step. */
export interface HumanStep {
  /** 1-based position in the solution path. */
  index: number
  technique: string
  level: number
  /** Dutch explanation of the step. */
  explanation: string
  /** Ids of the people the step is about. */
  people: string[]
  /** Cells the step is about. */
  cells: Cell[]
  /** Set when the step puts somebody down for good. */
  placed?: Placement
  /** Candidates removed by this step, the row/column clean-up after a placement included. */
  eliminated: Placement[]
  /** Set when a clue card triggered the step (index into the clue list). */
  clueIndex?: number
}

export interface HumanResult {
  /** Everybody placed by techniques alone, and the result satisfies the rules and every clue. */
  solved: boolean
  /** True when the techniques ran into an impossible position (a wrong clue set, or a technique bug). */
  contradiction: boolean
  steps: HumanStep[]
  /** The hardest technique used, or null when no step was needed. */
  maxTechnique: { id: string; title: string; level: number } | null
  /** Difficulty: hardest level * 100 + number of steps. Higher is harder. */
  score: number
  /** Rating band for the hardest level, or null when unsolved. */
  rating: DifficultyBand | null
  /** Final positions of everyone the techniques managed to place (all of them when solved). */
  placements: Placement[]
  /** The murderer when solved. */
  murderer: string | null
}

export interface HumanOptions {
  /** Techniques to use instead of the registry's. Sorted by level for you. */
  techniques?: readonly Technique[]
  /** Rating bands instead of the registry's. */
  bands?: readonly DifficultyBand[]
}
