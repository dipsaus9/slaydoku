// `bun tools/stats.ts <day> [--url <base>]` (SLAY-7.3): prints one day's anonymous play counters — starts, solves, and
// average solve time — by reading SLAY-7.1's GET /api/stats endpoint. See api/stats.ts and api/_lib/kv.ts for the read-path
// contract this reads against (day shape, key shape, response shape); this file only calls it and formats the reply.
//
// <day> is 'YYYY-MM-DD' (UTC, the scheduled day — see docs/daily-flow.md).
// --url overrides the base to read from (default: the production deployment, DEFAULT_BASE_URL below); point it at a local
// `vercel dev` server (its own /api/stats) to read local data instead.
//
// Exit codes: 0 the endpoint was read, including a day with no plays yet or a store not yet provisioned (an owner
// prerequisite — see SLAY-7.1's delivery notes: Vercel KV is not yet set up for this project, so production has no real
// data yet); 1 the endpoint could not be reached or answered something unexpected; 2 bad usage.
import { isDate } from '../src/schedule/dates.ts'
import { formatDuration } from '../src/share/format.ts'
import type { DayCounters } from '../api/_lib/kv.ts'

/** The deployed site (see src/brand/site.ts) — read from here unless --url overrides it. */
export const DEFAULT_BASE_URL = 'https://slaydoku.vercel.app'

export type StatsFetch = { ok: true; counters: DayCounters } | { ok: false; notConfigured: boolean; message: string }

/**
 * Calls GET /api/stats?day=<day> on `base` and normalizes the reply. `notConfigured` is set only for the exact shape
 * api/stats.ts returns when Vercel KV has no credentials yet (its 500 path, see api/stats.test.ts) — an owner
 * prerequisite, not a bug in this tool or a real failure to report loudly.
 */
export async function fetchDay(base: string, day: string, doFetch: typeof fetch = fetch): Promise<StatsFetch> {
  const url = `${base.replace(/\/+$/, '')}/api/stats?day=${encodeURIComponent(day)}`
  let res: Response
  try {
    res = await doFetch(url)
  } catch (error) {
    return { ok: false, notConfigured: false, message: `could not reach ${url}: ${error instanceof Error ? error.message : String(error)}` }
  }
  if (res.status === 200) return { ok: true, counters: (await res.json()) as DayCounters }
  let body: { error?: string } = {}
  try {
    body = (await res.json()) as { error?: string }
  } catch {}
  const message = body.error ?? `${url} -> ${res.status}`
  const notConfigured = res.status === 500 && /KV_REST_API|not configured/i.test(message)
  return { ok: false, notConfigured, message }
}

/** Average solve time in ms, or undefined when no 'solve' event so far reported a time (never a division by zero). */
export const averageSolveMs = (counters: DayCounters): number | undefined => (counters.solveMsCount > 0 ? counters.solveMsSum / counters.solveMsCount : undefined)

/** The printed report for one day: the three numbers, or a clear 'no data yet' line (AC1) for either reason a day has none. */
export function formatReport(day: string, result: StatsFetch): string {
  if (!result.ok) {
    return result.notConfigured
      ? `${day}: no data yet — the stats store isn't provisioned for this deployment yet (${result.message}).`
      : `${day}: could not read stats — ${result.message}`
  }
  const { counters } = result
  if (counters.starts === 0 && counters.solves === 0) return `${day}: no data yet — nobody has played this day so far.`
  const avg = averageSolveMs(counters)
  return [
    `${day}:`,
    `  starts: ${counters.starts}`,
    `  solves: ${counters.solves}`,
    `  average solve time: ${avg === undefined ? 'no solve times reported yet' : formatDuration(avg)}`,
  ].join('\n')
}

async function main(argv: string[]): Promise<number> {
  const [day, ...rest] = argv.filter((a) => !a.startsWith('--'))
  const urlIndex = argv.indexOf('--url')
  const base = urlIndex === -1 ? DEFAULT_BASE_URL : argv[urlIndex + 1]
  if (!day || !isDate(day) || (urlIndex !== -1 && !base) || rest.length > 0) {
    console.error('Usage: bun tools/stats.ts <day> [--url <base>]  (day is YYYY-MM-DD)')
    return 2
  }
  const result = await fetchDay(base as string, day)
  console.log(formatReport(day, result))
  return result.ok || result.notConfigured ? 0 : 1
}

if ((import.meta as { main?: boolean }).main) process.exit(await main(process.argv.slice(2)))
