import type { Puzzle } from '../../engine/model/index.ts'
import { createMemoryStorage } from '../memoryStorage.ts'
import { loadGame, saveKey } from '../persistence.ts'
import type { StorageLike } from '../persistence.ts'

/** The murderer and the time of a solved save. */
export interface SolveRecord {
  murdererId: string
  elapsedMs: number
}

/** The solve recorded in a raw save of `levelId`, or null when the save is not a solved one (or is unusable). */
export function solveIn(raw: string, levelId: string, puzzle: Puzzle): SolveRecord | null {
  const memory = createMemoryStorage()
  memory.setItem(saveKey(levelId), raw)
  const state = loadGame(memory, levelId, puzzle)
  return state?.check?.solved ? { murdererId: state.check.murdererId, elapsedMs: state.check.elapsedMs } : null
}

/**
 * Watches the save slot of one puzzle: `onSolved` fires when a write to `slaydoku:game:<levelId>` turns the saved board from not-solved
 * into solved (a board that is already solved when watching starts does not fire again on later writes such as an option). This is how the
 * daily flow learns about a solve without the play screen needing a callback: PlayScreen writes through the storage it is given.
 */
export function observeSolve(storage: StorageLike, levelId: string, puzzle: Puzzle, onSolved: (record: SolveRecord) => void): StorageLike {
  const key = saveKey(levelId)
  let wasSolved = false
  try {
    const raw = storage.getItem(key)
    wasSolved = raw !== null && solveIn(raw, levelId, puzzle) !== null
  } catch {
    wasSolved = false
  }
  return {
    getItem: (k) => storage.getItem(k),
    removeItem: (k) => storage.removeItem(k),
    setItem: (k, value) => {
      storage.setItem(k, value)
      if (k !== key) return
      const record = solveIn(value, levelId, puzzle)
      const fresh = record !== null && !wasSolved
      wasSolved = record !== null
      if (fresh) onSolved(record)
    },
  }
}
