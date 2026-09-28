/*
 * Anonymous daily play counters — pure logic, no network. See api/stats.ts for the endpoint that
 * wires this to a real Vercel KV (Upstash Redis) store, and SLAY-7.1's task notes for the contract
 * SLAY-7.2 (client calls) and SLAY-7.3 (CLI reader) both depend on.
 *
 * Key shape (day is 'YYYY-MM-DD', the scheduled UTC day — see docs/daily-flow.md):
 *   stats:<day>:starts        integer, +1 per 'start' event
 *   stats:<day>:solves        integer, +1 per 'solve' event
 *   stats:<day>:solveMsSum    integer, running sum of elapsedMs across 'solve' events that reported a time
 *   stats:<day>:solveMsCount  integer, how many of those 'solve' events reported a time
 *                             (average solve time = solveMsSum / solveMsCount)
 *
 * Nothing else is ever written: no IP, cookie, session id, or other per-player identifier touches
 * these keys or their values (SLAY-7 AC1, SLAY-7.1 AC4).
 */

export type StatsEvent = 'start' | 'solve'

export interface DayCounters {
  day: string
  starts: number
  solves: number
  solveMsSum: number
  solveMsCount: number
}

/** The slice of a Redis-like client this module needs — small enough to fake in tests, no real store required. */
export interface CounterStore {
  incr(key: string): Promise<number>
  incrby(key: string, amount: number): Promise<number>
  mget(keys: string[]): Promise<(number | string | null)[]>
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

function keysFor(day: string) {
  return {
    starts: `stats:${day}:starts`,
    solves: `stats:${day}:solves`,
    solveMsSum: `stats:${day}:solveMsSum`,
    solveMsCount: `stats:${day}:solveMsCount`,
  }
}

export interface RecordInput {
  day: unknown
  event: unknown
  elapsedMs?: unknown
}

export type RecordResult = { ok: true } | { ok: false; error: string }

/**
 * Validates a POST body and, only when it is well-formed, increments the matching counters.
 * Malformed input is rejected before the store is ever touched (SLAY-7.1 AC1).
 */
export async function recordEvent(store: CounterStore, input: RecordInput): Promise<RecordResult> {
  if (typeof input.day !== 'string' || !DAY_RE.test(input.day)) return { ok: false, error: "day must be a string in 'YYYY-MM-DD' form" }
  if (input.event !== 'start' && input.event !== 'solve') return { ok: false, error: "event must be 'start' or 'solve'" }

  const hasElapsed = input.elapsedMs !== undefined
  if (hasElapsed && (typeof input.elapsedMs !== 'number' || !Number.isFinite(input.elapsedMs) || input.elapsedMs < 0)) {
    return { ok: false, error: 'elapsedMs must be a non-negative finite number when present' }
  }

  const k = keysFor(input.day)
  if (input.event === 'start') {
    await store.incr(k.starts)
    return { ok: true }
  }

  await store.incr(k.solves)
  if (hasElapsed) {
    await store.incrby(k.solveMsSum, Math.round(input.elapsedMs as number))
    await store.incr(k.solveMsCount)
  }
  return { ok: true }
}

/** Reads one day's current counters. Callers never need direct KV credentials — only this function does (SLAY-7.1 AC2). */
export async function readDay(store: CounterStore, day: string): Promise<DayCounters | null> {
  if (typeof day !== 'string' || !DAY_RE.test(day)) return null
  const k = keysFor(day)
  const [starts, solves, solveMsSum, solveMsCount] = await store.mget([k.starts, k.solves, k.solveMsSum, k.solveMsCount])
  return {
    day,
    starts: toNumber(starts),
    solves: toNumber(solves),
    solveMsSum: toNumber(solveMsSum),
    solveMsCount: toNumber(solveMsCount),
  }
}

/** Redis returns integers as decimal strings (or null when a key was never written); this normalizes both to a number. */
function toNumber(value: number | string | null): number {
  if (value === null) return 0
  return typeof value === 'number' ? value : Number(value) || 0
}
