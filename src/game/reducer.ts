import { inBounds, sameCell } from '../engine/model/index.ts'
import type { Cell, Puzzle } from '../engine/model/index.ts'
import {
  canMark,
  emptyBoard,
  hasMark,
  hasNote,
  isBlocked,
  isPlaced,
  occupantAt,
  withMark,
  withNote,
  withoutCellMarkings,
  withoutPersonMarkings,
} from './board.ts'
import { checkCompletion } from './check.ts'
import { DEFAULT_OPTIONS } from './types.ts'
import type { Board, GameAction, GameOptions, GameState } from './types.ts'

/** Undo depth. Boards share structure, so this is cheap. */
export const MAX_HISTORY = 200

export function initialState(options: GameOptions = DEFAULT_OPTIONS): GameState {
  return {
    board: emptyBoard(),
    history: { past: [], future: [] },
    options: { ...options },
    timer: { elapsedMs: 0, runningSince: null },
    status: 'playing',
    check: null,
  }
}

/** Milliseconds on the clock at `now`. */
export function elapsedMs(state: GameState, now: number): number {
  const { elapsedMs: banked, runningSince } = state.timer
  return banked + (runningSince === null ? 0 : Math.max(0, now - runningSince))
}

/**
 * The game reducer. Pure: same puzzle, state and action always give the same result, and a
 * no-op returns the very same state object. Impossible requests (unknown person, off-grid
 * cell, blocked or occupied cell) are ignored rather than thrown.
 */
export function reduce(puzzle: Puzzle, state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'setOption':
      return state.options[action.option] === action.value
        ? state
        : { ...state, options: { ...state.options, [action.option]: action.value } }
    case 'resume': {
      if (state.status !== 'playing' || state.timer.runningSince !== null) return state
      return { ...state, timer: { ...state.timer, runningSince: action.at ?? 0 } }
    }
    case 'pause': {
      if (state.timer.runningSince === null) return state
      return { ...state, timer: { elapsedMs: elapsedMs(state, action.at ?? state.timer.runningSince), runningSince: null } }
    }
    case 'restart': {
      const fresh = initialState(state.options)
      return { ...fresh, timer: { elapsedMs: 0, runningSince: action.at ?? null } }
    }
    default:
      break
  }
  // Everything below edits the grid; a solved level is locked.
  if (state.status === 'solved') return state

  let board = state.board
  let history = state.history
  switch (action.type) {
    case 'undo': {
      const previous = history.past[history.past.length - 1]
      if (!previous) return state
      history = { past: history.past.slice(0, -1), future: [...history.future, board] }
      board = previous
      break
    }
    case 'redo': {
      const next = history.future[history.future.length - 1]
      if (!next) return state
      history = { past: [...history.past, board], future: history.future.slice(0, -1) }
      board = next
      break
    }
    default: {
      const edited = edit(puzzle, state, board, action)
      if (edited === board) return state
      history = { past: [...history.past, board].slice(-MAX_HISTORY), future: [] }
      board = edited
    }
  }
  return settle(puzzle, { ...state, board, history }, action.at)
}

/** Runs the automatic check on a freshly edited state and freezes the clock when solved. */
function settle(puzzle: Puzzle, state: GameState, at: number | undefined): GameState {
  const now = at ?? state.timer.runningSince ?? 0
  const check = checkCompletion(puzzle, state.board, elapsedMs(state, now))
  if (check?.solved) {
    return { ...state, check, status: 'solved', timer: { elapsedMs: check.elapsedMs, runningSince: null } }
  }
  return { ...state, check }
}

type EditAction = Exclude<GameAction, { type: 'undo' | 'redo' | 'setOption' | 'pause' | 'resume' | 'restart' }>

/**
 * The edit itself: place/remove/notes/marks/eraseCell/clearAll. The victim is just another person
 * here -- their square is written only by an explicit `place` action naming them, exactly like a
 * suspect's (SLAY-9.24: the last remaining square is no longer auto-filled the instant every
 * suspect is placed; the player makes that final placement themselves).
 */
function edit(puzzle: Puzzle, state: GameState, board: Board, action: EditAction): Board {
  const { people, scene } = puzzle
  const known = (id: string) => people.some((p) => p.id === id)
  switch (action.type) {
    case 'toggleNote': {
      const { personId, cell } = action
      if (!known(personId) || !inBounds(scene, cell)) return board
      if (isPlaced(board, personId) || occupantAt(board, cell) !== null || isBlocked(puzzle, cell)) return board
      const on = !hasNote(board, personId, cell)
      // A note and an X of the same person on the same cell exclude each other.
      return withNote(withMark(board, people, cell, personId, false), people, cell, personId, on)
    }
    case 'toggleMark': {
      const { personId, cell } = action
      if (!known(personId) || !canMark(puzzle, state.options, cell)) return board
      if (isPlaced(board, personId) || occupantAt(board, cell) !== null) return board
      const on = !hasMark(board, personId, cell)
      return withMark(withNote(board, people, cell, personId, false), people, cell, personId, on)
    }
    case 'place':
      return place(puzzle, state.options, board, action.personId, action.cell)
    case 'remove': {
      if (!isPlaced(board, action.personId)) return board
      const placements = { ...board.placements }
      delete placements[action.personId]
      return { ...board, placements }
    }
    case 'eraseCell': {
      if (!inBounds(scene, action.cell)) return board
      const occupant = occupantAt(board, action.cell)
      let next = withoutCellMarkings(board, action.cell)
      if (occupant !== null) {
        const placements = { ...next.placements }
        delete placements[occupant]
        next = { ...next, placements }
      }
      return next
    }
    case 'clearAll': {
      const blank = Object.keys(board.notes).length + Object.keys(board.marks).length + Object.keys(board.placements).length
      return blank === 0 ? board : emptyBoard()
    }
  }
}

function place(puzzle: Puzzle, options: GameOptions, board: Board, personId: string, cell: Cell): Board {
  const { people, scene } = puzzle
  if (!people.some((p) => p.id === personId) || !inBounds(scene, cell) || isBlocked(puzzle, cell)) return board
  const occupant = occupantAt(board, cell)
  if (occupant !== null) return board // standing on it already, or somebody else does: nothing to do
  // The person leaves any earlier spot and drops all their notes and X marks.
  let next = withoutPersonMarkings(board, personId)
  next = withoutCellMarkings(next, cell)
  next = { ...next, placements: { ...next.placements, [personId]: cell } }
  if (options.autoXOnPlace) next = crossRowAndColumn(puzzle, options, next, cell)
  return next
}

/** X in the row and column of a fresh placement for everybody still unplaced. */
function crossRowAndColumn(puzzle: Puzzle, options: GameOptions, board: Board, placed: Cell): Board {
  const { people, scene } = puzzle
  const unplaced = people.filter((p) => !isPlaced(board, p.id))
  let next = board
  const cross = (cell: Cell) => {
    if (sameCell(cell, placed) || !canMark(puzzle, options, cell) || occupantAt(next, cell) !== null) return
    for (const person of unplaced) {
      next = withMark(withNote(next, people, cell, person.id, false), people, cell, person.id, true)
    }
  }
  for (let col = 0; col < scene.width; col++) cross({ row: placed.row, col })
  for (let row = 0; row < scene.height; row++) cross({ row, col: placed.col })
  return next
}
