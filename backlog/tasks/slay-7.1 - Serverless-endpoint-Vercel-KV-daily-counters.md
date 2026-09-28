---
id: SLAY-7.1
title: Serverless endpoint + Vercel KV daily counters
status: In Progress
assignee: []
created_date: '2026-09-28 19:01'
updated_date: '2026-09-28 19:23'
labels:
  - story
dependencies: []
references:
  - api/
  - vercel.json
  - package.json
parent_task_id: SLAY-7
type: feature
ordinal: 39000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: one serverless endpoint that records a 'start' or 'solve' event for a scheduled day, incrementing Vercel KV counters (day's starts, day's solves, day's solve-time sum and count) and nothing else — no IP, no cookie, no per-player id stored anywhere. Confirms the existing catch-all SPA rewrite in vercel.json does not swallow requests to the new endpoint.
Type: deliverable
Branch: SLAY-7.1/stats-kv-endpoint
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A new Vercel serverless function (e.g. api/stats.ts) accepts a POST with { day: 'YYYY-MM-DD', event: 'start' | 'solve', elapsedMs?: number } and increments the matching Vercel KV counters for that day; malformed input is rejected without touching KV
- [x] #2 The function can also return a day's current counters (starts, solves, solveMsSum, solveMsCount) for tools/stats.ts (SLAY-7.3) to read, without needing direct KV credentials on the client side
- [ ] #3 vercel.json's existing catch-all rewrite to index.html is confirmed (and adjusted if needed) to not intercept requests to the new endpoint; verified against an actual Vercel deployment, not only local dev, since routing precedence can differ
- [x] #4 No request body, header, or stored KV value contains an IP address, cookie value, session id, or any other per-player identifier
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add @vercel/kv (or @upstash/redis directly) as a dependency. 2. Write api/stats.ts: POST increments INCR/INCRBY counters keyed by day and event type (and a running sum/count for solve time); a read path (GET, or a query flag on the same function) returns the current counters for one day. 3. Deploy to a preview and curl both the POST and the read path against the live URL to confirm vercel.json's rewrite does not eat the route before touching anything else. 4. Document the KV key shape in a short comment for SLAY-7.2/7.3 to rely on.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Keep the key shape and request contract simple and documented in the endpoint's own comments — SLAY-7.2 (client calls) and SLAY-7.3 (CLI reader) both depend on this story and need to match it exactly. No auth/CAPTCHA on the write path is a deliberate, accepted tradeoff (no accounts, low stakes if someone spams fake counts) — do not add account-based protection. OWNER PREREQUISITE, not doable by the delivering agent: a Vercel KV (Upstash Redis) store must be provisioned and linked to this Vercel project in the dashboard before AC3 can be verified against a real deployment — that provisioning is account/dashboard-gated, the same category as the earlier Vercel Git-connection step. Write and unit-test the function logic against a mocked KV client regardless; if the real store is not yet provisioned when this story is delivered, say so plainly and leave AC3's live-deployment check as a follow-up for the owner to run once it is (documented steps, not skipped silently).

Implemented api/stats.ts (POST records start/solve, GET reads a day's counters) with pure, unit-tested logic in api/_lib/kv.ts against a fake CounterStore (13 tests) plus api/stats.ts handler tests (10 tests) and api/_lib/redis-store.ts tests (2 tests) — 25 new tests total, all green. Used @upstash/redis directly (not @vercel/kv, which npm marks deprecated as of this delivery — Vercel's own KV product is deprecated in favor of Marketplace Upstash Redis). Real store env vars expected: KV_REST_API_URL / KV_REST_API_TOKEN. AC3 (live-deployment routing check) is NOT done: no Vercel KV store is provisioned for this project yet (owner-only, dashboard-gated per this story's notes), AND vercel.json's ignoreCommand skips building any branch but main on this repo's hobby plan, so a PR-branch preview would not even build to test against. Left vercel.json's catch-all rewrite untouched (Vercel's documented precedence: an existing Function matches before a rewrite is applied) rather than making an unverifiable speculative routing change; added api/vercel-routing.test.ts as a regression guard + documented reliance. Owner follow-up once KV is provisioned: merge to main (or deploy manually), then curl POST and GET /api/stats on the live URL to confirm the rewrite does not swallow it, and check off AC3.
<!-- SECTION:NOTES:END -->
