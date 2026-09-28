/*
 * Vercel serverless function: anonymous daily play counters (SLAY-7.1).
 *
 *   POST /api/stats  { day: 'YYYY-MM-DD', event: 'start' | 'solve', elapsedMs?: number }
 *                     records one event; malformed input is rejected without touching KV.
 *   GET  /api/stats?day=YYYY-MM-DD
 *                     returns that day's current counters — this is how tools/stats.ts (SLAY-7.3)
 *                     reads them, without needing direct KV credentials on the client side.
 *
 * See api/_lib/kv.ts for the key shape and the validation/increment/read logic (unit-tested there
 * against a fake store); this file only wires that logic to HTTP and to the real KV store.
 *
 * vercel.json's catch-all rewrite (`/(.*)` -> /index.html) is expected not to intercept this route:
 * Vercel matches an existing Function before applying a rewrite. That expectation is exactly what
 * SLAY-7.1's AC3 needs verified against a real deployment, not only asserted here — see the task's
 * notes and this story's delivery report for why that check is still outstanding.
 *
 * No IP, cookie, session id or other per-player identifier is ever read from the request or stored
 * (SLAY-7.1 AC4): this handler touches only `req.method`, `req.query.day` and the three POST body
 * fields above.
 */
import { readDay, recordEvent } from './_lib/kv.ts'
import { redisStore } from './_lib/redis-store.ts'
import type { CounterStore } from './_lib/kv.ts'

interface StatsRequest {
  method?: string
  query: Record<string, string | string[] | undefined>
  body?: unknown
}

interface StatsResponse {
  status(code: number): StatsResponse
  json(body: unknown): void
}

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

/** Builds the request handler around a store factory, so tests can inject a fake store and never touch a real KV credential. */
export function createHandler(getStore: () => CounterStore) {
  return async function handler(req: StatsRequest, res: StatsResponse): Promise<void> {
    let store: CounterStore
    try {
      store = getStore()
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'KV store is not configured' })
      return
    }

    if (req.method === 'GET') {
      const day = firstString(req.query.day)
      if (!day) {
        res.status(400).json({ error: 'day query param is required' })
        return
      }
      const counters = await readDay(store, day)
      if (!counters) {
        res.status(400).json({ error: "day must be 'YYYY-MM-DD'" })
        return
      }
      res.status(200).json(counters)
      return
    }

    if (req.method === 'POST') {
      const body = (req.body ?? {}) as Record<string, unknown>
      const result = await recordEvent(store, { day: body.day, event: body.event, elapsedMs: body.elapsedMs })
      if (!result.ok) {
        res.status(400).json({ error: result.error })
        return
      }
      res.status(200).json({ ok: true })
      return
    }

    res.status(405).json({ error: 'method not allowed' })
  }
}

export default createHandler(redisStore)
