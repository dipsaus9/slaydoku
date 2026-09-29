import type { CatalogClue } from '../engine/clues/index.ts'
import { cellKey, sameCell } from '../engine/model/index.ts'
import type { Cell, Person, Placement, Puzzle } from '../engine/model/index.ts'
import { advancedRegistry, HARD_LEVEL } from '../engine/solver/advanced/registry.ts'
import { solveHuman } from '../engine/solver/human/index.ts'
import type { HumanStep } from '../engine/solver/human/index.ts'
import type { Locale } from '../locale/types.ts'
import { hasMark, hasNote, occupantAt } from './board.ts'
import { focusHint, stepHint } from './hintText.ts'
import { chainTo, knowledge, knownCards, rankCards } from './knowledge.ts'
import type { Focus, Knowledge } from './knowledge.ts'
import type { GameState } from './types.ts'

export type { Focus } from './knowledge.ts'

/** 1: which card and person, and how many squares. 2: which squares. 3: why, and what to do about it. */
export type HintLevel = 1 | 2 | 3

/**
 * A hint. Each level carries only its own fields on top of the one below, so a level-1 hint
 * has no `cells` and no `explanation` at all, and a level-2 hint has no `explanation`.
 */
export interface Hint1 {
  level: 1
  /** People the next step is about. */
  personIds: string[]
  /** Areas (room ids) the next step is about. */
  roomIds: string[]
  /** Text of this level, in plain words. */
  text: string
}

export interface Hint2 extends Omit<Hint1, 'level'> {
  level: 2
  /** The cells to look at: the one to place on, or the squares the person can still stand on. */
  cells: Cell[]
}

export interface Hint3 extends Omit<Hint2, 'level'> {
  level: 3
  /** Why, in short plain sentences (no technique names). */
  explanation: string
  /** What to do, as the last sentence: "Place Alice on row 3, column 4." or "Note squares for Alice on ...". */
  instruction: string
  /** For the record only, never shown to the player. */
  technique: { id: string; title: string }
  /** Set when the step puts somebody down. */
  placement?: Placement
}

export type Hint = Hint1 | Hint2 | Hint3

/** The next thing to tell the player from their current position. */
export interface NextStep {
  step: HumanStep
  /** The one cell the step settles, when it places somebody. */
  placement?: Placement
  /** For a step that only rules squares out: the ones the player has not crossed out yet. */
  eliminations?: Placement[]
  /**
   * Set when the hint is about one person and the squares they can stand on (all cards applied together):
   * a placement when there is one square, else a note on the few possible squares.
   */
  focus?: Focus
  /**
   * For an elimination hint (no `focus`): who to name in the hint's own words -- the step's own
   * people, minus the victim and anybody already correctly placed (AC4: a hint never names somebody
   * the player has already solved, even when the technique's own reasoning still mentions them).
   * Undefined for a placement (its `personId` alone is always the right, already-filtered answer).
   */
  subjects?: string[]
  /**
   * For an elimination hint: the earlier steps this one leans on, same idea as `Focus.chain` but
   * seeded from the step's own (unfiltered) people, so it may legitimately walk back through steps
   * about the victim or an already-placed suspect -- that is background derivation, never the
   * hint's own target. Undefined for a placement (`focus.chain` already carries this).
   */
  chain?: HumanStep[]
}

/** A person with at most this many possible squares is worth a note; with more, the cards say too little. */
export const MAX_POSSIBLE_SQUARES = 6

/** A hint that crosses squares out never asks for more than this many. */
export const MAX_CROSSED_SQUARES = 12

/**
 * The most useful next move from the player's current position. All the cards apply together and the
 * suspects the player put on their true cell count as known (wrong placements are ignored, so the answer
 * always follows the puzzle's real solution). The victim is never the subject: they are never placed by
 * the player (see `withAutoVictim` in board.ts), so a hint never asks for them either.
 *
 * 1. somebody has exactly one possible square: place them;
 * 2. else the person with the fewest possible squares (at most six): note those squares;
 * 3. else, or once that note is made, the solver's next deduction with a technique beyond the cards
 *    (rows and columns, pairs, rectangles, chains): place who it settles, or cross out what it rules out.
 *
 * Null when every suspect is right already (the victim then fills in on their own) or the solver has
 * nothing (a puzzle it cannot do without guessing).
 */
export function nextStep(puzzle: Puzzle, state: GameState, locale: Locale = 'en'): NextStep | null {
  const suspects = puzzle.people.filter((p) => p.kind === 'suspect')
  const victimId = puzzle.people.find((p) => p.kind === 'victim')?.id
  const truth = new Map(puzzle.solution.map((p) => [p.personId, p.cell]))
  const known = suspects.filter((p) => {
    const at = state.board.placements[p.id]
    const cell = truth.get(p.id)
    return at !== undefined && cell !== undefined && sameCell(at, cell)
  })
  if (known.length === suspects.length) return null

  const know = knowledge(puzzle, known, truth)
  if (know.placement && know.placement.focus.personId !== victimId) {
    return { step: know.placement.step, placement: know.placement.step.placed, focus: know.placement.focus }
  }
  return noteStep(puzzle, state, known, know) ?? deduction(puzzle, state, known, truth, know, locale, victimId)
}

/** The suspect with the fewest possible squares, when few enough and the player has not made the note yet. */
function noteStep(puzzle: Puzzle, state: GameState, known: readonly Person[], know: Knowledge): NextStep | null {
  const knownIds = new Set(known.map((p) => p.id))
  let fewest: { personId: string; cells: Cell[] } | null = null
  for (const p of puzzle.people) {
    if (p.kind !== 'suspect' || knownIds.has(p.id)) continue
    const cells = know.possible.get(p.id) ?? []
    if (cells.length > 0 && (fewest === null || cells.length < fewest.cells.length)) fewest = { personId: p.id, cells }
  }
  if (!fewest || fewest.cells.length > MAX_POSSIBLE_SQUARES) return null
  const { personId } = fewest
  // Squares the player crossed out or that somebody stands on are not for a note.
  const cells = fewest.cells.filter((c) => !hasMark(state.board, personId, c) && occupantAt(state.board, c) === null)
  if (cells.length === 0 || cells.every((c) => hasNote(state.board, personId, c))) return null
  const focus: Focus = { personId, cells, cards: rankCards(puzzle, know.byCard.get(personId), personId), placed: known.length > 0, chain: [] }
  const step: HumanStep = { index: 0, technique: 'candidates', level: 1, explanation: '', people: [personId], cells, eliminated: [] }
  return { step, focus }
}

/**
 * The solver's next step beyond what the cards say, with the whole technique catalog (basic first, then
 * the hard and expert ones). Steps that only repeat what the player already crossed out, or what a placed
 * person's row, column or cell already rules out, are skipped. The victim never surfaces as the subject
 * (see `nextStep`): the full person list still goes to the solver itself (the victim-room technique needs
 * it), only the steps offered back to the player are filtered.
 */
function deduction(
  puzzle: Puzzle,
  state: GameState,
  known: readonly Person[],
  truth: ReadonlyMap<string, Cell>,
  know: Knowledge,
  locale: Locale = 'en',
  victimId?: string,
): NextStep | null {
  const real = puzzle.clues as CatalogClue[]
  const knownIds = new Set(known.map((p) => p.id))
  const result = solveHuman(puzzle.scene, puzzle.people, [...real, ...knownCards(known, truth)], {
    techniques: advancedRegistry.list(),
    bands: advancedRegistry.listBands(),
    locale,
  })
  const stillPossible = (personId: string, cell: Cell) => know.possible.get(personId)?.some((c) => sameCell(c, cell)) ?? false

  // Once the player is past a technique beyond the basic ones, what follows leans on it: it is worked out
  // in the placement it leads to, not crossed out square by square.
  let leaning = false
  for (const [i, step] of result.steps.entries()) {
    if (step.clueIndex !== undefined && step.clueIndex >= real.length) continue // our own bookkeeping
    if (step.placed) {
      if (knownIds.has(step.placed.personId) || step.placed.personId === victimId) continue
      const personId = step.placed.personId
      const focus: Focus = {
        personId,
        cells: [step.placed.cell],
        cards: rankCards(puzzle, know.byCard.get(personId), personId),
        placed: known.length > 0,
        chain: chainTo(result.steps.slice(0, i), [personId], real.length),
      }
      return { step, placement: step.placed, focus }
    }
    // News for the player: a person still to find, on a square the cards did not rule out already.
    const news = step.eliminated.filter(
      (e) =>
        e.personId !== victimId &&
        !knownIds.has(e.personId) &&
        stillPossible(e.personId, e.cell) &&
        !hasMark(state.board, e.personId, e.cell) &&
        occupantAt(state.board, e.cell) === null &&
        !known.some((p) => (truth.get(p.id) as Cell).row === e.cell.row || (truth.get(p.id) as Cell).col === e.cell.col),
    )
    if (news.length > 0 && (step.level >= HARD_LEVEL || !leaning)) {
      // AC4: the step's own people can include the victim or somebody already correctly placed
      // (a card's owner, a room's other sure occupant) purely as reasoning context -- never the
      // hint's own target. AC1/AC5: the chain is seeded from the unfiltered people instead, so it
      // may legitimately walk back through steps about them: that is exactly the derivation the
      // step leans on, even though neither is ever named as who the player should look at.
      const subjects = [...new Set(step.people)].filter((id) => id !== victimId && !knownIds.has(id))
      const chain = chainTo(result.steps.slice(0, i), step.people, real.length)
      return { step, eliminations: capSquares(news), subjects, chain }
    }
    if (step.level >= HARD_LEVEL) leaning = true
  }
  return null
}

/** The first eliminations that stay within `MAX_CROSSED_SQUARES` different squares. */
function capSquares(eliminations: Placement[]): Placement[] {
  const squares = new Set<string>()
  return eliminations.filter((e) => {
    squares.add(cellKey(e.cell))
    return squares.size <= MAX_CROSSED_SQUARES
  })
}

/**
 * The hint of `level` for the current state, or null when there is none. Never carries more
 * than the requested level asks for.
 */
export function getHint(puzzle: Puzzle, state: GameState, level: HintLevel, locale: Locale = 'en'): Hint | null {
  const next = nextStep(puzzle, state, locale)
  if (!next) return null
  return hintFor(puzzle, next, level, locale)
}

/** The hint of `level` for `next`. A step without a person to look at is told as the solver's own reasoning. */
export const hintFor = (puzzle: Puzzle, next: NextStep, level: HintLevel, locale: Locale = 'en'): Hint =>
  next.focus ? focusHint(puzzle, next, next.focus, level, locale) : stepHint(puzzle, next, level, locale)
