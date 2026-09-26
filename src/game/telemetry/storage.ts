import { defaultStorage } from '../persistence.ts'
import type { StorageLike } from '../persistence.ts'
import type { TelemetryRecord } from './types.ts'

export const TELEMETRY_KEY = 'slaydoku:telemetry'
/** Bump when the stored shape changes; other versions are ignored, never crashed on. */
export const TELEMETRY_VERSION = 1
/** Oldest records fall off first, so the store cannot grow without bound. */
export const MAX_RECORDS = 500

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const count = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0

/** Keeps a stored entry only when it has the shape of a record; numbers are made safe. */
function parseRecord(value: unknown): TelemetryRecord | null {
  if (!isRecord(value) || typeof value.sessionId !== 'string' || typeof value.puzzleId !== 'string') return null
  const hints = isRecord(value.hints) ? value.hints : {}
  return {
    sessionId: value.sessionId,
    puzzleId: value.puzzleId,
    startedAt: count(value.startedAt),
    activeSeconds: count(value.activeSeconds),
    hints: { 1: count(hints[1]), 2: count(hints[2]), 3: count(hints[3]) },
    hintPlacements: count(value.hintPlacements),
    wrongPlacements: count(value.wrongPlacements),
    failedChecks: count(value.failedChecks),
    undos: count(value.undos),
    outcome: value.outcome === 'solved' ? 'solved' : 'abandoned',
  }
}

/** All stored records, oldest first. Anything unusable (missing, corrupt, throwing storage) reads as empty. */
export function loadTelemetry(storage: StorageLike | null = defaultStorage()): TelemetryRecord[] {
  if (!storage) return []
  try {
    const raw = storage.getItem(TELEMETRY_KEY)
    const data: unknown = raw === null ? null : JSON.parse(raw)
    if (!isRecord(data) || data.version !== TELEMETRY_VERSION || !Array.isArray(data.records)) return []
    return data.records.map(parseRecord).filter((r): r is TelemetryRecord => r !== null)
  } catch {
    return []
  }
}

/** Adds a record, or replaces the one with the same session id. Returns false when storage refuses. */
export function saveTelemetryRecord(storage: StorageLike | null, record: TelemetryRecord): boolean {
  if (!storage) return false
  try {
    const records = loadTelemetry(storage)
    const at = records.findIndex((r) => r.sessionId === record.sessionId)
    if (at === -1) records.push(record)
    else records[at] = record
    storage.setItem(
      TELEMETRY_KEY,
      JSON.stringify({ version: TELEMETRY_VERSION, records: records.slice(-MAX_RECORDS) }),
    )
    return true
  } catch {
    return false
  }
}

/** Everything recorded so far as pretty JSON, for saving to a file. Never throws. */
export function exportTelemetry(storage: StorageLike | null = defaultStorage()): string {
  return JSON.stringify({ version: TELEMETRY_VERSION, records: loadTelemetry(storage) }, null, 2)
}

/** Empties the store. Never throws. */
export function clearTelemetry(storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.removeItem(TELEMETRY_KEY)
  } catch {
    // an unavailable store has nothing to clear
  }
}
