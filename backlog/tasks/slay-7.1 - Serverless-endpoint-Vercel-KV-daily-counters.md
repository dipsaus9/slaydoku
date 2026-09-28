---
id: SLAY-7.1
title: Serverless endpoint + Vercel KV daily counters
status: Done
assignee: []
created_date: '2026-09-28 19:01'
updated_date: '2026-09-28 19:29'
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

Review gate (dipsaus-ai:story-reviewer): verdict=pass. AC1 met, AC2 met, AC4 met. AC3 met=false, noted as the documented owner follow-up (KV not provisioned, ignoreCommand blocks non-main preview builds) — reviewer confirmed the code itself is ready for that check (real Upstash-backed store, fails loudly without env vars, not a stub). No scope violations. Advisory findings (not blocking, left as-is): (1) no auth/rate-limiting on POST or GET — accepted tradeoff per story notes; (2) DAY_RE only checks YYYY-MM-DD shape, not calendar validity (e.g. 2026-13-40 would pass) — optional follow-up for SLAY-7.3 if it matters.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added api/stats.ts, a Vercel serverless function that records anonymous daily play counters in Vercel KV (Upstash Redis): POST /api/stats increments per-day starts/solves/solveMsSum/solveMsCount counters from a validated {day, event, elapsedMs?} body (malformed input never touches KV), and GET /api/stats?day=YYYY-MM-DD returns those counters for tools/stats.ts (SLAY-7.3) to read without direct KV credentials. Validation/increment/read logic lives in api/_lib/kv.ts, unit-tested (13 tests) against a fake CounterStore; api/_lib/redis-store.ts wires it to a real Upstash-backed store via @upstash/redis (chosen over the now-deprecated @vercel/kv), built lazily from KV_REST_API_URL/KV_REST_API_TOKEN so it never needs real credentials at import time. 25 new tests total, all green; independent review passed with AC1/2/4 met and no scope violations. AC3 (live-deployment routing check) is NOT done and is left as a documented owner follow-up: no Vercel KV store is provisioned for this project yet (owner-only, dashboard-gated), and this repo's vercel.json ignoreCommand additionally skips building any branch but main, so a PR-branch preview would not build to test against either. vercel.json's catch-all rewrite was deliberately left unchanged, relying on Vercel's documented Function-before-rewrite precedence rather than an unverifiable speculative routing change; api/vercel-routing.test.ts guards that assumption. Once KV is provisioned, the owner should merge to main (or deploy manually), curl POST and GET /api/stats on the live URL, confirm routing is not swallowed, and check off AC3.
<!-- SECTION:FINAL_SUMMARY:END -->
