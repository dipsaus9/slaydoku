import { deriveVictimCell } from '../engine/model/index.ts'
import type { Cell, Puzzle } from '../engine/model/index.ts'
import { hasMark, hasNote, isPlaced } from '../game/board.ts'
import { hintFor, nextStep } from '../game/hints.ts'
import type { Hint1, Hint2, Hint3, NextStep } from '../game/hints.ts'
import { initialState, reduce } from '../game/reducer.ts'
import type { GameAction, GameState } from '../game/types.ts'

/** One step of a full human solve: what the player is told at that moment, at all three levels. */
export interface WalkStep {
  /** 0-based position in the walk. */
  index: number
  next: NextStep
  level1: Hint1
  level2: Hint2
  level3: Hint3
}

export interface HintWalk {
  steps: WalkStep[]
  /** True when the walk ended with everybody placed on their true cell. */
  solved: boolean
  /** People still unplaced when the walk stopped (0 when solved). */
  unplaced: number
}

/** Upper bound on the steps of one walk; a step that changes nothing would otherwise loop for ever. */
const MAX_STEPS = 400

/**
 * Plays a level the way a player who follows every level-3 hint would: makes the notes or crosses out what the hint
 * asks for, puts down whoever it places, and asks for the next hint, until everybody stands on
 * their square or the hints run dry. The walk is what the audit checks; it is the same in every
 * place a puzzle comes from (house level, pack, generator).
 */
export function walkHints(puzzle: Puzzle): HintWalk {
  let state: GameState = initialState({ autoXOnPlace: true, preventXOnBlocked: true, showTimer: true })
  const steps: WalkStep[] = []
  while (steps.length < MAX_STEPS && state.status === 'playing') {
    const next = nextStep(puzzle, state)
    if (!next) break
    const level1 = hintFor(puzzle, next, 1)
    const level2 = hintFor(puzzle, next, 2)
    const level3 = hintFor(puzzle, next, 3)
    if (level1.level !== 1 || level2.level !== 2 || level3.level !== 3) break
    steps.push({ index: steps.length, next, level1, level2, level3 })
    if (next.placement) {
      state = reduce(puzzle, state, { type: 'place', personId: next.placement.personId, cell: next.placement.cell })
    } else {
      const before = state
      const actions: GameAction[] = next.focus
        ? next.focus.cells
            .filter((cell) => !hasNote(before.board, next.focus!.personId, cell))
            .map((cell): GameAction => ({ type: 'toggleNote', personId: next.focus!.personId, cell }))
        : (next.eliminations ?? next.step.eliminated)
            .filter((e) => !hasMark(before.board, e.personId, e.cell))
            .map((e): GameAction => ({ type: 'toggleMark', personId: e.personId, cell: e.cell }))
      state = actions.reduce((acc, action) => reduce(puzzle, acc, action), state)
    }
  }
  // The victim is never a hint subject (by design, since SLAY-9.5/SLAY-9.24): once hints run dry
  // with every suspect placed, a real player's next move needs no hint -- it is the one square
  // their rows and columns leave free. That final placement is the walk's own bookkeeping, not a
  // hint step: it is applied at most once, after the loop above is truly done, not recorded as a
  // WalkStep (no hint fired for it).
  if (state.status !== 'solved') {
    const victim = puzzle.people.find((p) => p.kind === 'victim')
    const suspects = puzzle.people.filter((p) => p.kind === 'suspect')
    if (victim && !isPlaced(state.board, victim.id) && suspects.every((p) => isPlaced(state.board, p.id))) {
      const cell = deriveVictimCell(
        puzzle.scene,
        suspects.map((p) => state.board.placements[p.id] as Cell),
      )
      // reduce()'s place() already no-ops on a blocked or occupied cell, so no extra guard is needed here.
      if (cell) state = reduce(puzzle, state, { type: 'place', personId: victim.id, cell })
    }
  }
  return { steps, solved: state.status === 'solved', unplaced: puzzle.people.length - Object.keys(state.board.placements).length }
}
