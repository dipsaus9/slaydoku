import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

interface VercelConfig {
  rewrites: { source: string; destination: string }[]
}

const VERCEL: VercelConfig = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'vercel.json'), 'utf8'))

describe('vercel.json routing vs. the new /api/stats endpoint (SLAY-7.1 AC3)', () => {
  it('keeps a single catch-all SPA rewrite, unchanged, which Vercel matches only after an existing Function', () => {
    // Vercel's documented routing order matches an existing Serverless/Edge Function (api/stats.ts
    // included) before applying a `rewrites` entry, so this catch-all to /index.html is not expected
    // to intercept /api/stats — no change to vercel.json was needed for that. What is still
    // outstanding is confirming that against a REAL deployment, per AC3: this repo's vercel.json
    // ignoreCommand skips building any branch but main, and no Vercel KV store is provisioned yet
    // (an owner-only, dashboard-gated prerequisite — see the SLAY-7.1 task notes and delivery
    // report). If this rewrite is ever broadened, re-check it does not start swallowing /api/*.
    expect(VERCEL.rewrites).toEqual([{ source: '/(.*)', destination: '/index.html' }])
  })
})
