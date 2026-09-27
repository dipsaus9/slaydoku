import type { TierId } from '../../engine/generator/tiers/index.ts'
import type { StorageLike } from '../persistence.ts'

/**
 * The result of every solved daily puzzle, on this device. Statistics and streaks (SLAY-1.6) and the share card (SLAY-1.7) read it;
 * the daily flow writes it once, when a day is solved. A day that has a result cannot be played again for a new time: the first result stays.
 *
 * Shape in localStorage under RESULTS_KEY: `{ "version": 1, "results": { "<n>": DailyResult } }`. Every read and write is guarded: a missing,
 * full, blocked or corrupt store reads as "no results" and a failed write returns false, so play is never interrupted.
 */

/** Where the results live. Board saves of a day are separate, under `slaydoku:game:daily-<n>`. */
export const RESULTS_KEY = 'slaydoku:daily-results'
/** Bump when the stored shape changes; other versions are ignored (read as empty), never crashed on. */
export const RESULTS_VERSION = 1

export interface DailyResult {
  /** Puzzle number (1 on the launch date). */
  n: number
  /** UTC date of the puzzle, `YYYY-MM-DD`. */
  date: string
  /** Difficulty tier of the puzzle. Absent on results stored before statistics existed (SLAY-1.6): they count everywhere except in the times per tier. */
  tier?: TierId
  /** Fingerprint of the puzzle that was solved; a result of another puzzle with the same number is not used. */
  fp: string
  /** Time it took, ms (the game clock: it stops while the tab is in the background). */
  elapsedMs: number
  /** How many times a hint was opened while solving this day (all sessions of the day). */
  hints: number
  /** How many times every person was placed but the check said it was not right. */
  wrongChecks: number
  /** The suspect who was alone with the victim (person id of the puzzle). */
  murdererId: string
}

/** The tier ids, easiest first (the order of `SOLVABLE_TIERS`; a test keeps them equal). Listed here so this file does not pull the solver into the app. */
export const RESULT_TIERS: readonly TierId[] = ['very-easy', 'easy', 'easy-medium', 'medium', 'hard', 'expert']

const isRecord =(value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const count = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0

/** A stored entry as a result, or null when it does not have the shape of one. Numbers are made safe. */
function parseResult(value: unknown): DailyResult | null {
  if (!isRecord(value)) return null
  const { n, date, fp, elapsedMs, murdererId } = value
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 1) return null
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  if (typeof fp !== 'string' || fp === '' || typeof murdererId !== 'string') return null
  if (typeof elapsedMs !== 'number' || !Number.isFinite(elapsedMs)) return null
  const tier = RESULT_TIERS.find((id) => id === value.tier)
  return {
    n,
    date,
    fp,
    ...(tier ? { tier } : {}),
    elapsedMs: Math.max(0, elapsedMs),
    hints: count(value.hints),
    wrongChecks: count(value.wrongChecks),
    murdererId,
  }
}

/** Every stored result by puzzle number. Anything unusable reads as empty. */
function readTable(storage: StorageLike | null): Map<number, DailyResult> {
  const table = new Map<number, DailyResult>()
  if (!storage) return table
  try {
    const raw = storage.getItem(RESULTS_KEY)
    const data: unknown = raw === null ? null : JSON.parse(raw)
    if (!isRecord(data) || data.version !== RESULTS_VERSION || !isRecord(data.results)) return table
    for (const value of Object.values(data.results)) {
      const result = parseResult(value)
      if (result) table.set(result.n, result)
    }
  } catch {
    // corrupt or unreadable: no results
  }
  return table
}

/**
 * Stores the result of a day. The first result of a puzzle number stays: a second call for the same number changes nothing and returns
 * false, which is what stops a solved day from being replayed for a better time. Returns false too when the store refuses the write.
 */
export function recordResult(storage: StorageLike | null, result: DailyResult): boolean {
  if (!storage) return false
  const clean = parseResult(result)
  if (!clean) return false
  try {
    const table = readTable(storage)
    if (table.has(clean.n)) return false
    table.set(clean.n, clean)
    const results = Object.fromEntries([...table].sort(([a], [b]) => a - b).map(([n, value]) => [String(n), value]))
    storage.setItem(RESULTS_KEY, JSON.stringify({ version: RESULTS_VERSION, results }))
    return true
  } catch {
    return false
  }
}

/** The result of puzzle number `n`, or null. With `fp`, a result of a different puzzle (another fingerprint) counts as none. */
export function readResult(storage: StorageLike | null, n: number, fp?: string): DailyResult | null {
  const result = readTable(storage).get(n) ?? null
  return result && (fp === undefined || result.fp === fp) ? result : null
}

/** All stored results, oldest puzzle first. */
export function readAllResults(storage: StorageLike | null): DailyResult[] {
  return [...readTable(storage).values()].sort((a, b) => a.n - b.n)
}
