---
id: SLAY-17.6
title: Regenerate future schedule days and verify on screen
status: To Do
assignee: []
created_date: '2026-10-08 08:58'
updated_date: '2026-10-08 14:13'
labels:
  - needs-owner-review
dependencies:
  - SLAY-17.1
  - SLAY-17.2
  - SLAY-17.5
  - SLAY-18.4
references:
  - src/content/schedule/
  - docs/authoring/schedule.md
  - docs/verification/regen-days.ts
parent_task_id: SLAY-17
type: chore
ordinal: 123000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: schedule days from 2026-10-09 onward are regenerated with the new room rules, rooms and chair look (bun run schedule --overwrite, in two ranges so that 2026-10-14, the owner-approved Simpshouse day, is left alone), days up to and including today stay byte-identical, and rendered sample days from the five regular themes show no out-of-place objects. The puzzle data does not depend on the object art, so this story no longer waits for SLAY-17.4 (owner agreed 2026-10-08). Windows of seasonal themes that are not built yet (fall, carnaval, christmas, halloween) stay on the normal rotation here and are regenerated again by SLAY-18.10.
Type: deliverable
Branch: SLAY-17.6/regenerate-and-verify
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Days up to and including 2026-10-08 are byte-identical to main
- [ ] #2 Days from 2026-10-09 are regenerated; bun run schedule:check and bun run test --maxWorkers=1 pass
- [ ] #3 2026-10-14 (the approved Simpshouse day) is byte-identical to main; so is every day up to and including the current UTC date
- [ ] #4 A rendered check (docs/verification/regen-days.ts) of sample days of the five regular themes at 390 and 1024 wide shows no bed outside a sleeping room, no wet fixture outside a wet room, no vehicle in a room and one chair look
- [ ] #5 docs/authoring/schedule.md notes that unregistered seasonal windows are regenerated again by SLAY-18.10
- [ ] #6 Owner has seen the rendered sample days and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. A published day must never change: no --overwrite on days up to today. docs/handoff.md is updated by SLAY-18.10, not here.
<!-- SECTION:NOTES:END -->
