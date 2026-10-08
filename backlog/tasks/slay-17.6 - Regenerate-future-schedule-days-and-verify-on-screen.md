---
id: SLAY-17.6
title: Regenerate future schedule days and verify on screen
status: To Do
assignee: []
created_date: '2026-10-08 08:58'
updated_date: '2026-10-08 09:23'
labels:
  - needs-owner-review
dependencies:
  - SLAY-17.1
  - SLAY-17.2
  - SLAY-17.4
  - SLAY-17.5
  - SLAY-18.4
references:
  - src/content/schedule/
  - docs/authoring/schedule.md
  - docs/verification/
  - docs/handoff.md
parent_task_id: SLAY-17
type: chore
ordinal: 123000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: schedule days from 2026-10-09 onward are regenerated with the new room rules, rooms and art (bun run schedule --start 2026-10-09 --overwrite, through the last scheduled day), days up to and including today stay byte-identical, and rendered sample days from all five themes show no out-of-place objects. docs/handoff.md records that the 4 future delivery-van-in-bedroom days are closed and that puzzles for the same dates changed.
Type: deliverable
Branch: SLAY-17.6/regenerate-and-verify
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Days up to and including 2026-10-08 are byte-identical to main
- [ ] #2 Days from 2026-10-09 are regenerated; bun run schedule:check and bun run test --maxWorkers=1 pass
- [ ] #3 Rendered screens of sample days for all five themes show no bed outside a sleeping room, no wet fixture outside a wet room, no vehicle in a room and one chair look (docs/verification driver)
- [ ] #4 docs/handoff.md updated (delivery-van days closed, same-date puzzles changed, SLAY-17 summary)
- [ ] #5 Owner has seen the rendered sample days and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. A published day must never change: do not use --overwrite on days up to today.
<!-- SECTION:NOTES:END -->
