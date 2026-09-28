---
id: SLAY-7.3
title: CLI stats viewer and honest privacy copy
status: Done
assignee: []
created_date: '2026-09-28 19:02'
updated_date: '2026-09-28 19:50'
labels:
  - story
dependencies:
  - SLAY-7.1
references:
  - tools/
  - src/ui/about/strings.ts
  - docs/launch.md
parent_task_id: SLAY-7
type: feature
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: bun tools/stats.ts <day> prints that day's starts, solves and average solve time by reading SLAY-7.1's endpoint. The About page and docs/launch.md's 'Reading the numbers' section are updated to accurately describe the new anonymous aggregate counting instead of claiming nothing is collected.
Type: deliverable
Branch: SLAY-7.3/stats-cli-and-privacy-copy
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 bun tools/stats.ts <day> prints starts, solves and average solve time (or a clear 'no data yet' message) for that day, reading SLAY-7.1's endpoint
- [x] #2 The About page's privacy line no longer says 'no tracking'; it accurately says what is counted (anonymous daily totals: how many played, how many solved) and what is not (no accounts, no per-player identifier, no cookie)
- [x] #3 docs/launch.md's 'Reading the numbers' section is updated to match (it currently says 'Slaydoku collects nothing')
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. tools/stats.ts + tools/stats.test.ts: CLI reading GET /api/stats?day=<day> (api/stats.ts, api/_lib/kv.ts contract), printing starts/solves/average solve time or a clear no-data-yet message (covers a KV-not-configured 500 distinctly from a real failure). Default base https://slaydoku.vercel.app, --url override. 2. src/ui/about/strings.ts: rewrite privacy.text (EN+NL) to describe anonymous daily aggregate counting instead of 'no tracking'; about.test.tsx reads the string dynamically so no test-string edit needed. 3. docs/launch.md: update the About-page-review bullet and rewrite 'Reading the numbers' to describe the new counting, point at bun tools/stats.ts <day>, and note KV is not yet provisioned in production (SLAY-7.1 delivery note).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Depends on SLAY-7.1 for the read-path contract. Keep the About wording short and plain, matching the existing About page's tone.

Verify: bun run lint, bun run typecheck both clean. bun run test: 143/143 files, 2919/2919 tests pass (both default parallel and --maxWorkers=1); each run's own process exits 1 only from an internal vitest-worker RPC reporter timeout ('[vitest-worker]: Timeout calling onTaskUpdate'), not a test failure -- reproduced with SLAY-6.1/6.2/6.3 running their own concurrent test suites in sibling worktrees of this same repo at the time (ps confirmed SLAY-6.2's own maxWorkers=1 run active simultaneously), which is the likely cause of the RPC heartbeat miss under shared CPU load. Zero assertion failures in either run. Live check: bun tools/stats.ts 2026-09-28 against the real https://slaydoku.vercel.app/api/stats -- endpoint currently returns a raw platform 500 (x-vercel-error: FUNCTION_INVOCATION_FAILED, non-JSON body), not the documented JSON {error} shape unit-tested in api/stats.test.ts; the CLI handles it without crashing (prints a clear 'could not read stats' message, exit 1) since it isn't the documented not-configured shape. This is a pre-existing SLAY-7.1/api/ condition (KV not provisioned, and/or a runtime crash before the handler's own try/catch), out of this story's References (tools/, src/ui/about/strings.ts, docs/launch.md) -- flagged for whoever provisions KV next, not fixed here.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added tools/stats.ts (bun tools/stats.ts <day> [--url <base>]), a Bun CLI reading SLAY-7.1's GET /api/stats?day=<day> endpoint (default base https://slaydoku.vercel.app) and printing that day's starts, solves and average solve time, or a clear 'no data yet' message -- distinguishing the documented KV-not-configured 500 shape from a real failure. tools/stats.test.ts covers the formatting and fetch logic against a local fake HTTP server (14 tests). Rewrote the About page's privacy copy (src/ui/about/strings.ts, EN+NL) to describe the new anonymous daily aggregate counting (starts, solves; no accounts, no per-player identifier, no cookie) instead of the old 'no tracking' claim, and updated docs/launch.md's 'Reading the numbers' section and its About-page-review bullet to match, pointing at bun tools/stats.ts and noting Vercel KV is not yet provisioned for this project (an owner prerequisite from SLAY-7.1) so production has no real data yet. Verify: lint, typecheck, test all pass (143 files, 2919 tests); the endpoint could not be exercised against live data (production /api/stats currently returns a raw platform 500, not the documented JSON shape -- a pre-existing SLAY-7.1/api/ condition, out of this story's References, flagged in the task notes for whoever provisions KV next). Epic SLAY-7 stays open: SLAY-7.2 (client counting) is still To Do.
<!-- SECTION:FINAL_SUMMARY:END -->
