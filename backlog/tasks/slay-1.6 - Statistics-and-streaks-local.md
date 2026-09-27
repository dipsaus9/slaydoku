---
id: SLAY-1.6
title: Statistics and streaks (local)
status: Done
assignee: []
created_date: '2026-09-26 19:32'
updated_date: '2026-09-27 00:22'
labels:
  - story
dependencies:
  - SLAY-1.5
references:
  - src/game/stats/
  - src/ui/stats/
  - src/ui/daily/
  - src/game/daily/
  - docs/daily-flow.md
  - docs/verification/
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
- [x] #1 src/game/stats/ computes stats from stored daily results with unit tests (streak across month and year boundary, a missed day, a day solved late, reset)
- [x] #2 A Stats screen or modal opens from the start screen and after solving, works on phone and iPad, and survives a schedule extension
- [x] #3 bun run lint/typecheck/test (--maxWorkers=1) and audit:personal pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1) src/game/stats: pure compute (streaks by UTC date, played/solved, median/best per tier, hints) + read/reset helpers; DailyResult gets optional tier. 2) src/ui/stats: StatsEntry (streak line + Stats button) in the start screen stats slot via DailyFlow, StatsPanel modal with numbers, bar list, Reset with confirm. 3) stats.ts verification driver in verify:phone, offline check, docs/daily-flow.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review gate round 1: pass, no blocking findings; two advisory nits fixed (spacing, late-solve test comment). References widened to src/game/daily/ (tier stored on DailyResult), docs/daily-flow.md, docs/verification/. Reset removes results, daily play records and daily board saves (a solved board would otherwise restore its result); documented. Verified: lint, typecheck, test (2549), build, audit:personal 0 hits, verify:phone at 390x844 and 1024x768: drive 107, zoom 43, legend 113, screens 99, stats 28, offline 35, 0 failures.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Local statistics and streaks. src/game/stats computes played and solved, solve rate, current and best streak of consecutive UTC days solved (a result counts for its own puzzle date; streak alive if the last solved day is today or yesterday), best and median time per difficulty tier, total and average hints, with unit tests (month, year and leap-day boundaries, missed day, gaps, ties, empty history, corrupt records) and a reset that removes results, daily play records and daily board saves. DailyResult stores the tier. The start screen stats slot now shows 'Streak N · Best M' and a Stats button (also after a solve) opening an accessible modal card with the numbers, a bar list of times per difficulty and a Reset stats button with confirmation. A stats driver (two consecutive days solved through the UI on the date override) joins verify:phone, the offline driver opens the card, docs/daily-flow.md documents the rules. Nothing leaves the device.
<!-- SECTION:FINAL_SUMMARY:END -->
