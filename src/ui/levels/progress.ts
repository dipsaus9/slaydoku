import { defaultStorage, loadGame, puzzleFingerprint, saveKey } from '../../game/index.ts'
import type { StorageLike } from '../../game/index.ts'
import type { Level } from './registry.ts'

/** Where level results are kept. Per-level board saves live under `slaydoku:game:<id>`. */
export const PROGRESS_KEY = 'slaydoku:progress'
/** 2: every record carries the fingerprint of the puzzle it solved (CAD-10.1); version 1 records are dropped. */
const PROGRESS_VERSION = 2

/** How a level was solved: who was alone with het cadeau, and how long it took. */
export interface SolvedRecord {
  murdererId: string
  elapsedMs: number
}

/**
 * Everything the level list needs. `solved` is persisted under PROGRESS_KEY; `started` (a saved
 * board exists) is read from the game store's own saves, never written here.
 */
export interface Progress {
  solved: Readonly<Record<string, SolvedRecord>>
  started: readonly string[]
}

export type LevelStatus = 'locked' | 'new' | 'inProgress' | 'solved'

export interface LevelEntry {
  level: Level
  /** 0-based position in the play order. */
  index: number
  status: LevelStatus
  /** Set when solved. */
  result?: SolvedRecord
}

export const EMPTY_PROGRESS: Progress = { solved: {}, started: [] }

/** Storage that lives as long as the page, for browsers that hand out no localStorage. */
export function createMemoryStorage(): StorageLike {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, String(value)),
    removeItem: (key) => void data.delete(key),
  }
}

/** localStorage when available, else an in-memory stand-in (progress then lasts until reload). */
export function progressStorage(): StorageLike {
  return defaultStorage() ?? createMemoryStorage()
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Stored records whose fingerprint equals the one `fpOf` gives for that level id; anything else is dropped. */
function parseSolved(raw: string | null, fpOf: (levelId: string) => string | undefined): Record<string, SolvedRecord> {
  if (raw === null) return {}
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return {}
  }
  if (!isRecord(data) || data.version !== PROGRESS_VERSION || !isRecord(data.solved)) return {}
  const out: Record<string, SolvedRecord> = {}
  for (const [id, value] of Object.entries(data.solved)) {
    if (!isRecord(value)) continue
    const { murdererId, elapsedMs, fp } = value
    if (typeof fp !== 'string' || fp !== fpOf(id)) continue
    if (typeof murdererId !== 'string' || typeof elapsedMs !== 'number' || !Number.isFinite(elapsedMs)) continue
    out[id] = { murdererId, elapsedMs: Math.max(0, elapsedMs) }
  }
  return out
}

/**
 * Reads progress for the registered levels.
 *  - solved: the stored records of an unchanged puzzle (same fingerprint), plus any level whose saved board is a solved one (covers a solve
 *    whose record was never written);
 *  - started: levels with a usable saved board that are not solved.
 * A record or board of a puzzle that has changed since (or one from before fingerprints) is ignored.
 * Corrupt or missing storage reads as "nothing done yet".
 */
export function readProgress(levels: readonly Level[], storage: StorageLike | null): Progress {
  let stored: Record<string, SolvedRecord> = {}
  try {
    const fps = new Map(levels.map((level) => [level.id, puzzleFingerprint(level.puzzle)]))
    stored = parseSolved(storage?.getItem(PROGRESS_KEY) ?? null, (id) => fps.get(id))
  } catch {
    stored = {}
  }
  const solved: Record<string, SolvedRecord> = {}
  const started: string[] = []
  for (const level of levels) {
    const record = stored[level.id]
    if (record) solved[level.id] = record
    const save = loadGame(storage, level.id, level.puzzle)
    if (!save) continue
    if (save.check?.solved) {
      solved[level.id] ??= { murdererId: save.check.murdererId, elapsedMs: save.check.elapsedMs }
    } else {
      started.push(level.id)
    }
  }
  return { solved, started }
}

/** Stores a solve. A later solve of the same level replaces the earlier one. */
export function recordSolve(progress: Progress, levelId: string, record: SolvedRecord): Progress {
  return {
    solved: { ...progress.solved, [levelId]: record },
    started: progress.started.filter((id) => id !== levelId),
  }
}

/** Writes the solved records of the given levels, each with its puzzle's fingerprint. Returns false when storage refuses. */
export function saveProgress(storage: StorageLike | null, progress: Progress, levels: readonly Level[]): boolean {
  if (!storage) return false
  try {
    const solved: Record<string, SolvedRecord & { fp: string }> = {}
    for (const level of levels) {
      const record = progress.solved[level.id]
      if (record) solved[level.id] = { ...record, fp: puzzleFingerprint(level.puzzle) }
    }
    storage.setItem(PROGRESS_KEY, JSON.stringify({ version: PROGRESS_VERSION, solved }))
    return true
  } catch {
    return false
  }
}

/** Level N + 1 is open once level N is solved; the first level is always open. Solved stays open. */
export function isUnlocked(levels: readonly Level[], progress: Progress, index: number): boolean {
  const level = levels[index]
  if (!level) return false
  if (index === 0 || level.id in progress.solved) return true
  const previous = levels[index - 1]
  return previous !== undefined && previous.id in progress.solved
}

/** The list model: every level with its status, in play order. */
export function levelEntries(levels: readonly Level[], progress: Progress): LevelEntry[] {
  return levels.map((level, index) => {
    const result = progress.solved[level.id]
    if (result) return { level, index, status: 'solved', result }
    if (!isUnlocked(levels, progress, index)) return { level, index, status: 'locked' }
    return { level, index, status: progress.started.includes(level.id) ? 'inProgress' : 'new' }
  })
}

/**
 * Watches the save slot of one level: `onSolved` fires when a write to `slaydoku:game:<id>`
 * turns the saved board from not-solved into solved (a level that is already solved when
 * watching starts, e.g. "view board", does not fire again on later writes such as an option). This is how the level flow learns about a solve without the play screen
 * needing a callback: PlayScreen writes through the storage it is given.
 */
export function observeSolve(
  storage: StorageLike,
  level: Level,
  onSolved: (record: SolvedRecord) => void,
): StorageLike {
  const key = saveKey(level.id)
  let wasSolved = false
  try {
    const raw = storage.getItem(key)
    wasSolved = raw !== null && loadSolved(raw, level) !== null
  } catch {
    wasSolved = false
  }
  return {
    getItem: (k) => storage.getItem(k),
    removeItem: (k) => storage.removeItem(k),
    setItem: (k, value) => {
      storage.setItem(k, value)
      if (k !== key) return
      const record = loadSolved(value, level)
      const fresh = record !== null && !wasSolved
      wasSolved = record !== null
      if (fresh) onSolved(record)
    },
  }
}

function loadSolved(raw: string, level: Level): SolvedRecord | null {
  const memory = createMemoryStorage()
  memory.setItem(saveKey(level.id), raw)
  const state = loadGame(memory, level.id, level.puzzle)
  return state?.check?.solved ? { murdererId: state.check.murdererId, elapsedMs: state.check.elapsedMs } : null
}
