---
id: SLAY-7.3
title: CLI stats viewer and honest privacy copy
status: Done
assignee: []
created_date: '2026-09-28 19:02'
updated_date: '2026-09-29 08:58'
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
Superseded by SLAY-8.4: the CLI viewer (tools/stats.ts) read the /api/stats endpoint built in SLAY-7.1, which was removed. Reading the numbers now means the PostHog project dashboard directly.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added tools/stats.ts (bun tools/stats.ts <day> [--url <base>]), a Bun CLI reading SLAY-7.1's GET /api/stats?day=<day> endpoint (default base https://slaydoku.vercel.app) and printing that day's starts, solves and average solve time, or a clear 'no data yet' message -- distinguishing the documented KV-not-configured 500 shape from a real failure. tools/stats.test.ts covers the formatting and fetch logic against a local fake HTTP server (14 tests). Rewrote the About page's privacy copy (src/ui/about/strings.ts, EN+NL) to describe the new anonymous daily aggregate counting (starts, solves; no accounts, no per-player identifier, no cookie) instead of the old 'no tracking' claim, and updated docs/launch.md's 'Reading the numbers' section and its About-page-review bullet to match, pointing at bun tools/stats.ts and noting Vercel KV is not yet provisioned for this project (an owner prerequisite from SLAY-7.1) so production has no real data yet. Verify: lint, typecheck, test all pass (143 files, 2919 tests); the endpoint could not be exercised against live data (production /api/stats currently returns a raw platform 500, not the documented JSON shape -- a pre-existing SLAY-7.1/api/ condition, out of this story's References, flagged in the task notes for whoever provisions KV next). Epic SLAY-7 stays open: SLAY-7.2 (client counting) is still To Do.
<!-- SECTION:FINAL_SUMMARY:END -->
