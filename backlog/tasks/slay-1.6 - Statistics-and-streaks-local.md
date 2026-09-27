---
id: SLAY-1.6
title: Statistics and streaks (local)
status: To Do
assignee: []
created_date: '2026-09-26 19:32'
updated_date: '2026-09-27 00:02'
labels:
  - story
dependencies:
  - SLAY-1.5
references:
  - src/game/stats/
  - src/ui/stats/
  - src/ui/daily/
parent_task_id: SLAY-1
type: feature
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a Stats card on the device only: puzzles played and solved, current and best streak of consecutive UTC days solved, best and median time per difficulty, hints used. Stored under a versioned localStorage key with try/catch; nothing leaves the device; a Reset button.
Type: deliverable
Branch: SLAY-1.6/stats-streaks
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/game/stats/ computes stats from stored daily results with unit tests (streak across month and year boundary, a missed day, a day solved late, reset)
- [ ] #2 A Stats screen or modal opens from the start screen and after solving, works on phone and iPad, and survives a schedule extension
- [ ] #3 bun run lint/typecheck/test (--maxWorkers=1) and audit:personal pass
<!-- AC:END -->
