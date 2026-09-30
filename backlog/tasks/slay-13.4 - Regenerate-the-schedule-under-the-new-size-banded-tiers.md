---
id: SLAY-13.4
title: Regenerate the schedule under the new size-banded tiers
status: To Do
assignee: []
created_date: '2026-09-30 11:36'
labels:
  - story
dependencies:
  - SLAY-13.2
  - SLAY-13.3
references:
  - src/content/schedule/
parent_task_id: SLAY-13
type: chore
ordinal: 86000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: every not-yet-played scheduled day (2026-10-01 through 2027-01-24) is rebuilt under the new size-banded SOLVABLE_TIERS and score v2, and passes every existing gate.
Type: deliverable
Branch: SLAY-13.4/regenerate-schedule-size-banded-tiers

Today, 2026-09-30 (and everything before it) is already live/playable and stays untouched. Follow docs/authoring/schedule.md's regeneration procedure exactly (bun run schedule, the report under reports/schedule/, the fallback-to-9x9 rule, the existing seed/day budgets).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The schedule is rebuilt for every date from 2026-10-01 through 2027-01-24 inclusive; 2026-09-27 through 2026-09-30 are untouched (a diff shows only 2026-10-01 onward changed, plus index.json's bookkeeping if applicable)
- [ ] #2 The regenerated days pass scheduleProblems (src/schedule/check.ts) and the full bun run test:slow re-verification of committed days
- [ ] #3 bun run validate:generation passes on the regenerated range
- [ ] #4 The regeneration report (reports/schedule/, gitignored) is reviewed for anomalies -- fallback-to-9x9 rate, rejected-seed rate materially worse than the existing 120-day baseline documented in docs/authoring/schedule.md -- and any concerning finding is written up in this story's notes before committing
- [ ] #5 src/content/schedule/*.json and index.json are committed with the regenerated days
<!-- AC:END -->
