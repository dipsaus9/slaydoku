import { captureAnonymousEvent } from '../analytics/posthog.ts'
import type { StorageLike } from './persistence.ts'

/**
 * Anonymous daily play counters (SLAY-7/SLAY-8.4): one 'puzzle_start' event the first time a
 * device opens a day's puzzle, one 'puzzle_solve' event (with elapsedMs) the first time it solves
 * it — de-duplicated per day so a reload or revisit never double-counts. Separate from
 * src/game/telemetry/ (the local-only lab-calibration recorder) and src/game/stats/ (the
 * player-visible streak UI): this is its own concern, an anonymous, aggregate count of how many
 * people played, never anything about this one player's own history.
 */
const KEY_PREFIX = 'slaydoku:stats-sent:'

type SentKind = 'start' | 'solve'

function alreadySent(storage: StorageLike | null, day: string, kind: SentKind): boolean {
  if (!storage) return false
  try {
    const raw = storage.getItem(KEY_PREFIX + day)
    if (raw === null) return false
    const data: unknown = JSON.parse(raw)
    return typeof data === 'object' && data !== null && (data as Record<string, unknown>)[kind] === true
  } catch {
    return false
  }
}

function markSent(storage: StorageLike | null, day: string, kind: SentKind): void {
  if (!storage) return
  try {
    const raw = storage.getItem(KEY_PREFIX + day)
    const data = raw !== null ? (JSON.parse(raw) as Record<string, unknown>) : {}
    storage.setItem(KEY_PREFIX + day, JSON.stringify({ ...data, [kind]: true }))
  } catch {
    // Private mode or a full disk: this device's count for today may be missed or repeated once.
  }
}

/** The side effect `recordPuzzleStart`/`recordPuzzleSolve` fire through — `captureAnonymousEvent`
 * in production, a fake in tests, matching this codebase's storage/clock injection pattern. */
export type CaptureFn = (name: string, properties?: Record<string, string | number>) => void

/** Call once when a device opens a day's puzzle. A repeat for the same day is silently skipped. */
export function recordPuzzleStart(storage: StorageLike | null, day: string, capture: CaptureFn = captureAnonymousEvent): void {
  if (alreadySent(storage, day, 'start')) return
  markSent(storage, day, 'start')
  capture('puzzle_start', { day })
}

/** Call once when a device solves a day's puzzle. A repeat for the same day is silently skipped. */
export function recordPuzzleSolve(storage: StorageLike | null, day: string, elapsedMs: number, capture: CaptureFn = captureAnonymousEvent): void {
  if (alreadySent(storage, day, 'solve')) return
  markSent(storage, day, 'solve')
  capture('puzzle_solve', { day, elapsedMs })
}
