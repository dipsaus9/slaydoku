---
id: SLAY-1.4
title: 'Daily schedule tool: gated puzzle per UTC day'
status: Done
assignee: []
created_date: '2026-09-26 19:32'
updated_date: '2026-09-26 23:02'
labels:
  - story
dependencies:
  - SLAY-1.1
  - SLAY-1.3
references:
  - tools/schedule.ts
  - tools/schedule-check.ts
  - tools/schedule.test.ts
  - src/schedule/
  - src/content/schedule/
  - src/content/packs/build.ts
  - docs/authoring/
  - package.json
parent_task_id: SLAY-1
type: feature
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: bun run schedule --start YYYY-MM-DD --days N generates the puzzle for every UTC day and writes it to committed schedule files (one JSON file per month plus an index). Each entry holds the puzzle number (counting from the launch date), UTC date, board, clues, solution, cast (names, genders), size, tier, theme and a puzzle fingerprint. Size and tier per day follow the owner mix: 6x6 and 9x9 mostly, 7x7 and 12x12 occasionally, never 16x16; exactly one expert per UTC week on a seeded random weekday; hard and expert only on 9x9 and 12x12; the other days very-easy 15%, easy 30%, easy-medium 25%, medium 20%, hard 10%; themes rotate; two consecutive days never share size, tier and theme all at once. Every puzzle passes all gates (unique solution, human-solvable per its tier, hint audit, noun audit, cast audit, rendered-screen card check). Deterministic: a second run is byte-identical.
Type: deliverable
Branch: SLAY-1.4/daily-schedule
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 tools/schedule.ts and src/schedule/ (pure pickers for size, tier, theme, seed per date) with unit tests: over 365 days the counts match the mix within tolerance, exactly one expert per ISO/UTC week, no 16x16, expert/hard only on 9x9 and 12x12
- [x] #2 Every generated entry passes entryProblems-style gates plus cast audit and the rendered-screen check; failures retry with the next seed of that day (documented seed window); a report lists per day the attempts and the gate that rejected
- [x] #3 The first 120 days from a chosen launch date are generated and committed under src/content/schedule/, byte-identical on a second run, with docs/authoring/schedule.md explaining how to extend it safely
- [x] #4 bun run lint/typecheck/test (--maxWorkers=1), test:slow smoke and audit:personal pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. src/schedule: pure picker per UTC date (size, tier, expert per week, theme cycles, seed window), nominal cast chain, month/index format, status. 2. Node-side build/gates/check reusing buildEntry (cast argument added), entryProblems and missingCardText, with the 12x12 hard/expert fallback rule. 3. tools/schedule.ts (parallel workers, deterministic) and tools/schedule-check.ts. 4. Generate and commit the first 120 days. 5. Tests, docs/authoring/schedule.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verify: lint, typecheck, test --maxWorkers=1 (125 files, 2414 tests), build, audit:personal (0 hits), schedule:check (120 days left), slow smoke + schedule.slow re-verification of all 120 days green. Second run with --jobs 3 vs 12 byte-identical. 0 fallbacks in 120 days; 96 forced 12x12 hard/expert runs all passed (max 2 seeds).

Review (story-reviewer): pass, all 4 criteria met, no scope violations. Advisory: buildEntry got a 7th positional param (cast); could move to an options object later.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Daily schedule shipped. src/schedule holds the pure per-UTC-date picker (expert once per Monday-Sunday week on a seeded weekday, tier mix, size weights, hard/expert on 9 and 12 only, rotating themes, seed window of 50), a date-pure nominal cast chain and the month/index format; the node-side builder reuses buildEntry (new optional cast argument), entryProblems and missingCardText, retries seeds and applies a documented 12x12 hard/expert to 9x9 fallback. bun run schedule (parallel, byte-identical for any --jobs, refuses to change published days) wrote the first 120 days from 2026-10-12 to src/content/schedule (five month files plus index; 0 fallbacks, 96 of 96 forced 12x12 hard/expert runs passed). bun run schedule:check exits non-zero under 30 days left. Tests cover the picker over 365/730 days, determinism, file shape, fingerprints, a 10-day re-verification, and the slow suite re-verifies all 120 days. Docs in docs/authoring/schedule.md.
<!-- SECTION:FINAL_SUMMARY:END -->
