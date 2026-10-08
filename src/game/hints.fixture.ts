import { buildEntry, seedBase } from '../content/packs/build.ts'
import type { CatalogClue } from '../engine/clues/index.ts'
import type { Puzzle } from '../engine/model/index.ts'
import { solveHuman } from '../engine/solver/human/index.ts'
import { hasMark, hasNote, isPlaced } from './board.ts'
import { getHint, nextStep } from './hints.ts'
import type { NextStep } from './hints.ts'
import { initialState, reduce } from './reducer.ts'
import type { GameAction, GameState } from './types.ts'

/** One hint of the walk-through: what levels 1, 2 and 3 say at that moment. */
export interface HintPathStep {
  technique: string
  /** Set when the hint puts somebody down. */
  placed: boolean
  level1: string
  level2: string
  level3: string
}

/**
 * The hints a player sees when they follow every level-3 hint to the end: notes are made, squares are
 * crossed out, placements are made, until the level is solved (or the solver runs dry). Test support: the
 * hint texts of a level, in order, for pinning and reviewing.
 */
export function hintPath(puzzle: Puzzle): HintPathStep[] {
  const options = { autoXOnPlace: true, preventXOnBlocked: true, showTimer: true }
  let state: GameState = initialState(options)
  const path: HintPathStep[] = []
  for (let i = 0; i < 100 && state.status === 'playing'; i++) {
    const next = nextStep(puzzle, state)
    const h1 = getHint(puzzle, state, 1)
    const h2 = getHint(puzzle, state, 2)
    const h3 = getHint(puzzle, state, 3)
    if (!next || h1?.level !== 1 || h2?.level !== 2 || h3?.level !== 3) break
    path.push({ technique: h3.technique.id, placed: next.placement !== undefined, level1: h1.text, level2: h2.text, level3: h3.text })
    if (next.placement) {
      state = reduce(puzzle, state, { type: 'place', personId: next.placement.personId, cell: next.placement.cell })
    } else {
      const s = state
      const actions: GameAction[] = next.focus
        ? next.focus.cells
            .filter((cell) => !hasNote(s.board, next.focus!.personId, cell))
            .map((cell): GameAction => ({ type: 'toggleNote', personId: next.focus!.personId, cell }))
        : (next.eliminations ?? next.step.eliminated)
            .filter((e) => !hasMark(s.board, e.personId, e.cell))
            .map((e): GameAction => ({ type: 'toggleMark', personId: e.personId, cell: e.cell }))
      state = actions.reduce((acc, a) => reduce(puzzle, acc, a), state)
    }
  }
  return path
}

let hard: Puzzle | null = null

/**
 * A small hard puzzle (6x6, home theme), built on the spot from the first seed whose first hint is a note (test support). On these the
 * cards alone do not settle anybody at first, so the hints start with a note. Deterministic: same code, same puzzle.
 */
export function hardPuzzle(): Puzzle {
  if (hard) return hard
  for (let seed = seedBase('hard'); seed < seedBase('hard') + 100; seed++) {
    const built = buildEntry(6, 'hard', 'home', seed, 60_000)
    if (!built.ok) continue
    const state = initialState({ autoXOnPlace: true, preventXOnBlocked: true, showTimer: true })
    const first = nextStep(built.entry.puzzle, state)
    if (!first?.focus || first.placement) continue
    // The pinned texts also want the first note to span rows and columns ("row 3, column 4 ...")
    // and the solver to need an intersect step somewhere.
    const level2 = getHint(built.entry.puzzle, state, 2)?.text ?? ''
    if (!/^\S+ can only stand on row \d+, column \d+/.test(level2)) continue
    const { scene, people, clues } = built.entry.puzzle
    const steps = solveHuman(scene, people, clues as CatalogClue[]).steps
    if (!steps.some((s) => s.technique === 'intersect' && s.placed === undefined)) continue
    return (hard = built.entry.puzzle)
  }
  throw new Error('no hard 6x6 puzzle with a note as its first hint in 100 seeds')
}

let expert: Puzzle | null = null

/**
 * A 9x9 expert puzzle, built on the spot from the first working seed (test support, SLAY-8.3): the
 * one difficulty tier that needs the advanced solver's hard/expert techniques throughout, so it
 * exercises `deduction()`'s fallback path (not just single-candidate placements). Deterministic:
 * same code, same puzzle.
 */
export function expertPuzzle(): Puzzle {
  if (expert) return expert
  for (let seed = seedBase('expert'); seed < seedBase('expert') + 100; seed++) {
    const built = buildEntry(9, 'expert', 'home', seed, 60_000)
    if (built.ok) return (expert = built.entry.puzzle)
  }
  throw new Error('no expert 9x9 puzzle in 100 seeds')
}

/**
 * Once every suspect stands right, hints run dry (the victim is never a hint subject) -- a real
 * player's next move needs no hint: it is the one square the suspects leave free. Test support for
 * the raw hint-follow loops below, which otherwise stall at "every suspect placed, victim still
 * empty" now that the victim is no longer auto-filled (SLAY-9.24).
 */
export function finishVictim(p: Puzzle, s: GameState): GameState {
  if (s.status === 'solved') return s
  const victim = p.people.find((person) => person.kind === 'victim')
  const cell = victim && p.solution.find((sol) => sol.personId === victim.id)?.cell
  return victim && cell && !isPlaced(s.board, victim.id) ? reduce(p, s, { type: 'place', personId: victim.id, cell }) : s
}

/** Does what the hint asks for: puts the person down, makes the notes, or crosses the squares out. */
export function follow(p: Puzzle, s: GameState, next: NextStep): GameState {
  if (next.placement) return reduce(p, s, { type: 'place', personId: next.placement.personId, cell: next.placement.cell })
  const actions: GameAction[] = next.focus
    ? next.focus.cells
        .filter((cell) => !hasNote(s.board, next.focus!.personId, cell))
        .map((cell): GameAction => ({ type: 'toggleNote', personId: next.focus!.personId, cell }))
    : (next.eliminations ?? []).filter((e) => !hasMark(s.board, e.personId, e.cell)).map((e): GameAction => ({ type: 'toggleMark', personId: e.personId, cell: e.cell }))
  return actions.reduce((acc, action) => reduce(p, acc, action), s)
}

/**
 * Follows every hint to the end (hint walk, SLAY-8.3 AC5) and reports the placements that were not the
 * true cell, plus the final status. A sound walk has no wrong placements and ends solved.
 */
export function walkHints(p: Puzzle): { wrong: string[]; status: GameState['status'] } {
  let s: GameState = initialState({ autoXOnPlace: true, preventXOnBlocked: true, showTimer: true })
  const wrong: string[] = []
  for (let i = 0; i < 400 && s.status === 'playing'; i++) {
    const next = nextStep(p, s)
    if (!next) break
    if (next.placement) {
      const truth = p.solution.find((sol) => sol.personId === next.placement?.personId)
      if (truth?.cell.row !== next.placement.cell.row || truth?.cell.col !== next.placement.cell.col) wrong.push(next.placement.personId)
    }
    s = follow(p, s, next)
  }
  return { wrong, status: finishVictim(p, s).status }
}
