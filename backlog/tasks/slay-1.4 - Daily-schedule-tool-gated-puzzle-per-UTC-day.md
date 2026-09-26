---
id: SLAY-1.4
title: 'Daily schedule tool: gated puzzle per UTC day'
status: To Do
assignee: []
created_date: '2026-09-26 19:32'
labels:
  - story
dependencies:
  - SLAY-1.1
  - SLAY-1.3
references:
  - tools/schedule.ts
  - src/schedule/
  - src/content/schedule/
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
- [ ] #1 tools/schedule.ts and src/schedule/ (pure pickers for size, tier, theme, seed per date) with unit tests: over 365 days the counts match the mix within tolerance, exactly one expert per ISO/UTC week, no 16x16, expert/hard only on 9x9 and 12x12
- [ ] #2 Every generated entry passes entryProblems-style gates plus cast audit and the rendered-screen check; failures retry with the next seed of that day (documented seed window); a report lists per day the attempts and the gate that rejected
- [ ] #3 The first 120 days from a chosen launch date are generated and committed under src/content/schedule/, byte-identical on a second run, with docs/authoring/schedule.md explaining how to extend it safely
- [ ] #4 bun run lint/typecheck/test (--maxWorkers=1), test:slow smoke and audit:personal pass
<!-- AC:END -->
