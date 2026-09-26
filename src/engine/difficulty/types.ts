/**
 * Score v2 inputs and outputs. Everything is plain JSON so the report tool can
 * write it as is.
 */

/** What a human solving walk-through of one puzzle looks like, measured. */
export interface DifficultyMetrics {
  /** People in the puzzle (suspects plus the gift). Metrics per person compare grids of any size. */
  people: number
  /** Clue cards in the puzzle. */
  clueCount: number
  /** True when the full technique set places everybody without guessing. Unsolved puzzles are measured on the steps that were found. */
  solved: boolean
  /** Human-solver steps. */
  steps: number
  /**
   * Longest chain of dependent deductions: a step sits one deeper than the
   * deepest earlier step whose eliminations it builds on. A first firing of a
   * clue card is a chain of 1 (it only reads the card).
   */
  longestChain: number
  /**
   * Mean number of different clue cards a step rests on, itself and everything
   * it builds on counted. Rises when the solver has to hold several cards in mind at once.
   */
  cluesPerStep: number
  /** Share (0..1) of cards that state a fact about one person and the scene directly: room, object, door, window or corner. The victim card is left out. */
  directClueShare: number
  /** Mean candidate squares the people a step talks about still had before the step. Rises when the board is still open. */
  candidatesPerStep: number
  /** Level of the hardest technique used (1 = read a clue .. 5 = expert), 0 when no step was needed. */
  hardestLevel: number
  /**
   * CAD-5.6: the same puzzle on the human-solvability ladder (`src/engine/solvable`). True when a person can place everybody
   * one at a time (some ladder tier fits); false for hard and expert, where the ladder parts below count as the hardest.
   */
  ladderSolved: boolean
  /** Mean cards per placement on the ladder of the easiest tier the puzzle meets, over the placements that use a card (0 when none). */
  cardsPerPlacement: number
  /** Share (0..1) of those placements that use a card naming another person or a gender. */
  referenceShare: number
  /** Mean squares the cards of a placement leave, before any row or column is crossed off (CAD-8.7), over the placements that use a card. */
  squaresFromCards: number
  /** Mean length of the chain of dependent placements (CAD-8.7), over the placements that use a card. */
  ladderChain: number
  /** Share (0..1) of the people placeable from their own card alone, with nobody else placed. */
  placeableAloneShare: number
}

/** Weights of the score v2 parts. They are relative: the score divides by their sum. */
export interface ScoreWeights {
  level: number
  steps: number
  chain: number
  cluesPerStep: number
  indirectClues: number
  candidates: number
  cards: number
  references: number
  squares: number
  ladderChain: number
  scarcity: number
}

/** Score v2 with its parts, each 0..1, so a report shows what drives it. */
export interface ScoreV2 {
  /** 0-100. Higher is harder. */
  score: number
  parts: Record<keyof ScoreWeights, number>
}
