import type { Cell } from '../engine/model/index.ts'

/** The player's toggles, as in the official app's options. Shared by every level. */
export interface GameOptions {
  /** Placing somebody crosses out their row and column for everybody still unplaced. */
  autoXOnPlace: boolean
  /** X marks (manual and automatic) never land on cells nobody can occupy. */
  preventXOnBlocked: boolean
  /** Show the elapsed time. The clock itself always runs; this only says whether to display it. */
  showTimer: boolean
}

export const DEFAULT_OPTIONS: GameOptions = {
  autoXOnPlace: true,
  preventXOnBlocked: true,
  showTimer: true,
}

/**
 * What the player has written on the grid. Plain JSON. Cell keys are
 * `"row,col"` (0-based, see `cellKey`); person lists follow the puzzle's people order.
 *
 * Invariants the reducer keeps: an unplaced person has at most one of note or X per cell;
 * a placed person has no notes or X marks left; nothing but the placed person is written
 * on their cell; no two people share a cell.
 */
export interface Board {
  /** Small-letter candidate notes: people who might stand on the cell. */
  notes: Record<string, string[]>
  /** X marks: people who cannot stand on the cell. */
  marks: Record<string, string[]>
  /** Big letters: where each placed person stands, by person id. */
  placements: Record<string, Cell>
}

export interface History {
  /** Older boards, oldest first. */
  past: Board[]
  /** Boards undone, next redo last. */
  future: Board[]
}

export interface TimerState {
  /** Time banked while the clock was not running. */
  elapsedMs: number
  /** Timestamp the clock last started, or null while paused or finished. */
  runningSince: number | null
}

export type GameStatus = 'playing' | 'solved'

/**
 * The result of the automatic check once everybody is placed. When wrong it only says how
 * many people stand on their true cell, never who.
 */
export type CheckResult =
  | {
      solved: true
      /** The suspect who was alone with the gift (het cadeau): the murderer role. */
      murdererId: string
      /** Time it took, frozen at the moment of solving. */
      elapsedMs: number
    }
  | { solved: false; correctCount: number; total: number }

export interface GameState {
  board: Board
  history: History
  options: GameOptions
  timer: TimerState
  status: GameStatus
  /** Set while every person is placed: solved, or the wrong-count report. */
  check: CheckResult | null
}

/**
 * Everything the player can do. `at` is a clock reading in ms; the store fills it in, tests
 * pass their own, which keeps the reducer pure.
 */
export type GameAction = { at?: number } & (
  /** Add or remove the small-letter note of a person on a cell. */
  | { type: 'toggleNote'; personId: string; cell: Cell }
  /** Put a person down (moving them when already placed). */
  | { type: 'place'; personId: string; cell: Cell }
  /** Take a person off the grid. */
  | { type: 'remove'; personId: string }
  /** Add or remove the X of a person on a cell. */
  | { type: 'toggleMark'; personId: string; cell: Cell }
  /** Eraser, short press: clears notes, X marks and the placed person of one cell. */
  | { type: 'eraseCell'; cell: Cell }
  /** Eraser, long press: clears the whole grid. Undoable. */
  | { type: 'clearAll' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'setOption'; option: keyof GameOptions; value: boolean }
  | { type: 'pause' }
  | { type: 'resume' }
  /** Start the level over: empty grid, clock at zero, no history. */
  | { type: 'restart' }
)
