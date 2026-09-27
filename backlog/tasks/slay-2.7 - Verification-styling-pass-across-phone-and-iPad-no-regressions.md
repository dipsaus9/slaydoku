---
id: SLAY-2.7
title: 'Verification: styling pass across phone and iPad, no regressions'
status: To Do
assignee: []
created_date: '2026-09-27 12:21'
labels:
  - story
dependencies:
  - SLAY-2.2
  - SLAY-2.3
  - SLAY-2.4
  - SLAY-2.5
  - SLAY-2.6
references:
  - docs/verification/
parent_task_id: SLAY-2
type: chore
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: after every restyled screen has landed (SLAY-2.2 to SLAY-2.6), a full browser verification run confirms the warm evidence-board pass introduced no regressions, and a short note is added to docs/verification recording the change.
Type: deliverable
Branch: SLAY-2.7/styling-verification
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 bun run verify:phone (all six viewports) reports 0 failures
- [ ] #2 ALL=1 SUITES=screens (the all-days rendered-screen sweep) reports 0 failures
- [ ] #3 bun run lint, typecheck, test --maxWorkers=1 and build are green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Run the full verify:phone suite and the all-days screens sweep. 2. Fix any regression found (should be none, since every consuming story kept its own suites green) or report back to the relevant story if one is found. 3. Append a short dated note to docs/verification/report.md: what changed (the warm evidence-board pass), counts, 0 failures, screenshot locations.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
This story only verifies and documents; it does not restyle anything itself. If a regression is found, fix it in the owning story's files (still within that story's declared References), not here.
<!-- SECTION:NOTES:END -->
