import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { averageSolveMs, DEFAULT_BASE_URL, fetchDay, formatReport } from './stats.ts'
import type { DayCounters } from '../api/_lib/kv.ts'

let server: Server | undefined
afterEach(() => {
  server?.close()
  server = undefined
})

/** A fake /api/stats: `respond` decides the day query's status/body, everything else 404s. */
function serve(respond: (day: string | null) => { status: number; body: unknown }): Promise<string> {
  return new Promise((resolve) => {
    server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://localhost')
      if (url.pathname !== '/api/stats') {
        res.writeHead(404).end()
        return
      }
      const { status, body } = respond(url.searchParams.get('day'))
      res.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(body))
    })
    server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${(server!.address() as AddressInfo).port}`))
  })
}

const DAY = '2026-10-14'
const counters = (over: Partial<DayCounters> = {}): DayCounters => ({ day: DAY, starts: 0, solves: 0, solveMsSum: 0, solveMsCount: 0, ...over })

describe('DEFAULT_BASE_URL', () => {
  it('is the production deployment', () => {
    expect(DEFAULT_BASE_URL).toBe('https://slaydoku.vercel.app')
  })
})

describe('averageSolveMs', () => {
  it('is undefined when no solve reported a time', () => {
    expect(averageSolveMs(counters({ solves: 3 }))).toBeUndefined()
  })

  it('divides the sum by the count', () => {
    expect(averageSolveMs(counters({ solves: 3, solveMsSum: 90_000, solveMsCount: 3 }))).toBe(30_000)
  })
})

describe('fetchDay', () => {
  it("reads a day's counters from a 200 response", async () => {
    const base = await serve((day) => ({ status: 200, body: counters({ day: day ?? '', starts: 5, solves: 3, solveMsSum: 90_000, solveMsCount: 3 }) }))
    const result = await fetchDay(base, DAY)
    expect(result).toEqual({ ok: true, counters: counters({ starts: 5, solves: 3, solveMsSum: 90_000, solveMsCount: 3 }) })
  })

  it("passes the day as a query param, not a path segment", async () => {
    const base = await serve((day) => ({ status: 200, body: counters({ day: day ?? '' }) }))
    const result = await fetchDay(base, '2026-01-05')
    expect(result).toEqual({ ok: true, counters: counters({ day: '2026-01-05' }) })
  })

  it('flags the exact KV-not-configured 500 shape (api/stats.ts) as notConfigured, never a hard failure', async () => {
    const base = await serve(() => ({ status: 500, body: { error: 'KV_REST_API_URL / KV_REST_API_TOKEN are not set.' } }))
    const result = await fetchDay(base, DAY)
    expect(result).toEqual({ ok: false, notConfigured: true, message: 'KV_REST_API_URL / KV_REST_API_TOKEN are not set.' })
  })

  it('treats any other 500 as a real failure', async () => {
    const base = await serve(() => ({ status: 500, body: { error: 'unexpected crash' } }))
    const result = await fetchDay(base, DAY)
    expect(result).toEqual({ ok: false, notConfigured: false, message: 'unexpected crash' })
  })

  it('treats a 400 (malformed day, per the endpoint) as a real failure', async () => {
    const base = await serve(() => ({ status: 400, body: { error: "day must be 'YYYY-MM-DD'" } }))
    const result = await fetchDay(base, DAY)
    expect(result).toEqual({ ok: false, notConfigured: false, message: "day must be 'YYYY-MM-DD'" })
  })

  it('reports an unreachable host without throwing', async () => {
    const result = await fetchDay('http://127.0.0.1:1', DAY)
    expect(result.ok).toBe(false)
    expect((result as { notConfigured: boolean }).notConfigured).toBe(false)
    expect((result as { message: string }).message).toContain('could not reach')
  })
})

describe('formatReport', () => {
  it('prints starts, solves and the average solve time', () => {
    const report = formatReport(DAY, { ok: true, counters: counters({ starts: 5, solves: 3, solveMsSum: 90_000, solveMsCount: 3 }) })
    expect(report).toBe(`${DAY}:\n  starts: 5\n  solves: 3\n  average solve time: 00:30`)
  })

  it("says 'no solve times reported yet' when nobody solved with a recorded time", () => {
    const report = formatReport(DAY, { ok: true, counters: counters({ starts: 5, solves: 3 }) })
    expect(report).toContain('average solve time: no solve times reported yet')
  })

  it('says no data yet for a day with zero starts and zero solves', () => {
    expect(formatReport(DAY, { ok: true, counters: counters() })).toBe(`${DAY}: no data yet — nobody has played this day so far.`)
  })

  it('says no data yet, distinctly, when the store is not provisioned', () => {
    const report = formatReport(DAY, { ok: false, notConfigured: true, message: 'KV_REST_API_URL / KV_REST_API_TOKEN are not set.' })
    expect(report).toContain('no data yet')
    expect(report).toContain("isn't provisioned")
  })

  it('reports a real failure without claiming no data yet', () => {
    const report = formatReport(DAY, { ok: false, notConfigured: false, message: 'boom' })
    expect(report).not.toContain('no data yet')
    expect(report).toContain('boom')
  })
})
