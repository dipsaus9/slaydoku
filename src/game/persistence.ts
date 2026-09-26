import { cellKey, inBounds, isOccupiable } from '../engine/model/index.ts'
import type { Cell, Puzzle } from '../engine/model/index.ts'
import { emptyBoard } from './board.ts'
import { checkCompletion } from './check.ts'
import { puzzleFingerprint } from './fingerprint.ts'
import { initialState } from './reducer.ts'
import { DEFAULT_OPTIONS } from './types.ts'
import type { Board, GameOptions, GameState } from './types.ts'

/**
 * Bump when the stored shape of a board save changes; older or newer payloads are then ignored,
 * never crashed on. 2: saves carry the puzzle fingerprint (CAD-10.1), so version 1 saves are dropped.
 */
export const SAVE_VERSION = 2
/** Same rule for the options record, which is global and has not changed shape. */
export const OPTIONS_VERSION = 1

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const saveKey = (levelId: string): string => `slaydoku:game:${levelId}`
export const OPTIONS_KEY = 'slaydoku:game-options'

/** localStorage when the browser hands it out (it can throw or be missing), else null. */
export function defaultStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

/** What is stored for one level. Undo history and the running clock are not part of it. */
interface SavedGame {
  version: number
  levelId: string
  /** Fingerprint of the puzzle the board belongs to; a save of another puzzle is not used. */
  fp: string
  board: Board
  /** Clock reading when saved. */
  elapsedMs: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function parseCell(value: unknown, puzzle: Puzzle): Cell | null {
  if (!isRecord(value)) return null
  const { row, col } = value
  if (typeof row !== 'number' || typeof col !== 'number') return null
  const cell = { row, col }
  return inBounds(puzzle.scene, cell) ? cell : null
}

/** Keeps only what makes sense for this puzzle: known people, in-grid cells, no double bookings. */
function sanitizeBoard(value: unknown, puzzle: Puzzle): Board {
  const board = emptyBoard()
  if (!isRecord(value)) return board
  const ids = new Set(puzzle.people.map((p) => p.id))
  const rank = new Map(puzzle.people.map((p, i) => [p.id, i]))

  const taken = new Set<string>()
  if (isRecord(value.placements)) {
    for (const [personId, raw] of Object.entries(value.placements)) {
      const cell = parseCell(raw, puzzle)
      if (!ids.has(personId) || !cell || !isOccupiable(puzzle.scene, cell) || taken.has(cellKey(cell))) continue
      taken.add(cellKey(cell))
      board.placements[personId] = cell
    }
  }

  const readLists = (raw: unknown): Record<string, string[]> => {
    const out: Record<string, string[]> = {}
    if (!isRecord(raw)) return out
    for (const [key, list] of Object.entries(raw)) {
      const [row, col] = key.split(',').map(Number)
      if (!Array.isArray(list) || !inBounds(puzzle.scene, { row: row ?? NaN, col: col ?? NaN })) continue
      if (key !== cellKey({ row: row as number, col: col as number }) || taken.has(key)) continue
      const kept = [...new Set(list.filter((id): id is string => typeof id === 'string' && ids.has(id)))]
        .filter((id) => !(id in board.placements))
        .sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0))
      if (kept.length > 0) out[key] = kept
    }
    return out
  }
  board.notes = readLists(value.notes)
  board.marks = readLists(value.marks)
  // A person cannot have both a note and an X on one cell; the X wins.
  for (const [key, marked] of Object.entries(board.marks)) {
    const notes = (board.notes[key] ?? []).filter((id) => !marked.includes(id))
    if (notes.length > 0) board.notes[key] = notes
    else delete board.notes[key]
  }
  return board
}

/** Rebuilds a playable state from a board and a clock reading, running the completion check. */
function stateFrom(puzzle: Puzzle, options: GameOptions, board: Board, elapsedMs: number): GameState {
  const base = initialState(options)
  const check = checkCompletion(puzzle, board, elapsedMs)
  return {
    ...base,
    board,
    timer: { elapsedMs, runningSince: null },
    status: check?.solved ? 'solved' : 'playing',
    check,
  }
}

/** Serializes the state of one level of the puzzle with fingerprint `fp`. `now` folds a running clock into the saved time. */
export function serializeGame(levelId: string, fp: string, state: GameState, now: number): string {
  const running = state.timer.runningSince
  const saved: SavedGame = {
    version: SAVE_VERSION,
    levelId,
    fp,
    board: state.board,
    elapsedMs: state.timer.elapsedMs + (running === null ? 0 : Math.max(0, now - running)),
  }
  return JSON.stringify(saved)
}

/**
 * Reads a saved level back. Returns null for anything unusable: not JSON, wrong version, wrong
 * level, missing or different puzzle fingerprint (the puzzle changed since the save), wrong shape. Damaged parts of an otherwise fine save are dropped instead.
 */
export function deserializeGame(
  raw: string,
  levelId: string,
  puzzle: Puzzle,
  options: GameOptions = DEFAULT_OPTIONS,
): GameState | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isRecord(data) || data.version !== SAVE_VERSION || data.levelId !== levelId) return null
  if (data.fp !== puzzleFingerprint(puzzle)) return null
  const elapsed = typeof data.elapsedMs === 'number' && Number.isFinite(data.elapsedMs) ? Math.max(0, data.elapsedMs) : 0
  return stateFrom(puzzle, options, sanitizeBoard(data.board, puzzle), elapsed)
}

/** Writes one level's progress. Returns false when storage refuses (full, blocked, missing). */
export function saveGame(
  storage: StorageLike | null,
  levelId: string,
  fp: string,
  state: GameState,
  now: number,
): boolean {
  if (!storage) return false
  try {
    storage.setItem(saveKey(levelId), serializeGame(levelId, fp, state, now))
    return true
  } catch {
    return false
  }
}

/** Loads one level's progress, or null when there is none or it is unusable. */
export function loadGame(
  storage: StorageLike | null,
  levelId: string,
  puzzle: Puzzle,
  options: GameOptions = DEFAULT_OPTIONS,
): GameState | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(saveKey(levelId))
    return raw === null ? null : deserializeGame(raw, levelId, puzzle, options)
  } catch {
    return null
  }
}

/**
 * True when a usable-looking save of the puzzle with fingerprint `fp` exists, without needing the
 * puzzle itself (the extra cases list decides its status from the pack index).
 */
export function hasSavedGame(storage: StorageLike | null, levelId: string, fp: string): boolean {
  try {
    const raw = storage?.getItem(saveKey(levelId)) ?? null
    const data: unknown = raw === null ? null : JSON.parse(raw)
    return isRecord(data) && data.version === SAVE_VERSION && data.levelId === levelId && data.fp === fp
  } catch {
    return false
  }
}

export function clearGame(storage: StorageLike | null, levelId: string): void {
  try {
    storage?.removeItem(saveKey(levelId))
  } catch {
    // nothing to do: an unavailable store has nothing to clear
  }
}

/** Options are global, not per level. Unknown or non-boolean fields fall back to defaults. */
export function loadOptions(storage: StorageLike | null): GameOptions {
  const options = { ...DEFAULT_OPTIONS }
  if (!storage) return options
  try {
    const raw = storage.getItem(OPTIONS_KEY)
    const data: unknown = raw === null ? null : JSON.parse(raw)
    if (!isRecord(data) || data.version !== OPTIONS_VERSION || !isRecord(data.options)) return options
    for (const key of Object.keys(options) as (keyof GameOptions)[]) {
      const value = data.options[key]
      if (typeof value === 'boolean') options[key] = value
    }
  } catch {
    // corrupt: use the defaults
  }
  return options
}

export function saveOptions(storage: StorageLike | null, options: GameOptions): boolean {
  if (!storage) return false
  try {
    storage.setItem(OPTIONS_KEY, JSON.stringify({ version: OPTIONS_VERSION, options }))
    return true
  } catch {
    return false
  }
}
