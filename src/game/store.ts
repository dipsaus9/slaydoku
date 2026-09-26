import type { Puzzle } from '../engine/model/index.ts'
import { getHint } from './hints.ts'
import type { Hint, HintLevel } from './hints.ts'
import { puzzleFingerprint } from './fingerprint.ts'
import { loadGame, loadOptions, saveGame, saveOptions, defaultStorage } from './persistence.ts'
import type { StorageLike } from './persistence.ts'
import { elapsedMs, initialState, reduce } from './reducer.ts'
import type { GameAction, GameState } from './types.ts'

export interface GameStoreConfig {
  levelId: string
  puzzle: Puzzle
  /** Where progress lives. Default: localStorage when available. `null` disables saving. */
  storage?: StorageLike | null
  /** Clock in ms. Default `Date.now`. */
  now?: () => number
}

export interface GameStore {
  getState(): GameState
  dispatch(action: GameAction): void
  /** Calls `listener` after every state change. Returns the unsubscribe function. */
  subscribe(listener: () => void): () => void
  /** Elapsed time on the clock right now. */
  elapsed(): number
  /** The hint of a level for the current state, or null when there is none. */
  hint(level: HintLevel): Hint | null
}

/**
 * Wires the reducer to a clock and to localStorage: resumes a saved level, saves after every
 * change (the clock included), starts the clock when the level is still open.
 */
export function createGameStore(config: GameStoreConfig): GameStore {
  const { levelId, puzzle } = config
  const storage = config.storage === undefined ? defaultStorage() : config.storage
  const now = config.now ?? Date.now
  const fp = puzzleFingerprint(puzzle)
  const options = loadOptions(storage)
  let state = loadGame(storage, levelId, puzzle, options) ?? initialState(options)
  const listeners = new Set<() => void>()

  const dispatch = (action: GameAction) => {
    const next = reduce(puzzle, state, { ...action, at: action.at ?? now() })
    if (next === state) return
    const optionsChanged = next.options !== state.options
    state = next
    saveGame(storage, levelId, fp, state, now())
    if (optionsChanged) saveOptions(storage, state.options)
    for (const listener of [...listeners]) listener()
  }

  if (state.status === 'playing') state = reduce(puzzle, state, { type: 'resume', at: now() })

  return {
    getState: () => state,
    dispatch,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    elapsed: () => elapsedMs(state, now()),
    hint: (level) => getHint(puzzle, state, level),
  }
}
