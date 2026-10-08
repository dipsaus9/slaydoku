---
id: SLAY-18.10
title: Regenerate seasonal windows and verify on screen
status: To Do
assignee: []
created_date: '2026-10-08 09:23'
labels:
  - needs-owner-review
dependencies:
  - SLAY-18.9
  - SLAY-17.6
references:
  - src/content/schedule/
  - docs/authoring/schedule.md
  - docs/handoff.md
  - docs/verification/
parent_task_id: SLAY-18
type: chore
ordinal: 134000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: schedule days that fall in a seasonal window and are still in the future are regenerated with their seasonal theme (bun run schedule --start <first future day> --overwrite, per window), days up to and including today stay byte-identical, rendered sample days of each seasonal theme are checked on screen, and docs/handoff.md and docs/authoring/schedule.md describe the calendar, the seasonal flag and how to add a Simpshouse date.
Type: deliverable
Branch: SLAY-18.10/regenerate-seasonal
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Days up to and including the current UTC date are byte-identical to main
- [ ] #2 Every future scheduled day in a seasonal window has its seasonal theme; all other days keep theme and cast; bun run schedule:check and bun run test --maxWorkers=1 pass
- [ ] #3 Rendered screens of a sample day per seasonal theme at 390 and 1024 wide show a sensible house, one chair look and no out-of-place objects
- [ ] #4 docs/handoff.md and docs/authoring/schedule.md updated (calendar, seasonal flag, Simpshouse date list, Halloween 2026 missed)
- [ ] #5 Owner has seen the rendered sample days and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. A published day must never change: no --overwrite on days up to today.
<!-- SECTION:NOTES:END -->
