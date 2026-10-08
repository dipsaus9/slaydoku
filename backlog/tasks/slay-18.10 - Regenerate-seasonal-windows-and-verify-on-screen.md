---
id: SLAY-18.10
title: Regenerate seasonal windows and verify on screen
status: To Do
assignee: []
created_date: '2026-10-08 09:23'
updated_date: '2026-10-08 20:10'
labels:
  - needs-owner-review
dependencies:
  - SLAY-18.6
  - SLAY-18.7
  - SLAY-18.8
  - SLAY-18.9
  - SLAY-17.6
  - SLAY-17.10
  - SLAY-19.1
  - SLAY-20
  - SLAY-22
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
- [ ] #2 Rendered screens of a sample day per seasonal theme at 390 and 1024 wide show a sensible house, one chair look and no out-of-place objects
- [ ] #3 docs/handoff.md and docs/authoring/schedule.md updated (calendar, seasonal flag, Simpshouse date list, Halloween 2026 missed)
- [ ] #4 This is the FINAL regeneration: every future scheduled day (after the current UTC date) is regenerated with everything on main (room rules, chair cap, new decor objects, seasonal themes); days in a seasonal window get their seasonal theme, 2026-10-14 (Simpshouse) and all days up to today stay byte-identical; casts of days outside themed pools stay as the chain gives them
- [ ] #5 bun run schedule:check, the per-day gates and bun run test --maxWorkers=1 pass
- [ ] #6 Owner has seen the rendered sample days and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. A published day must never change: no --overwrite on days up to today.

Scope widened 2026-10-08: besides the seasonal windows this story regenerates ALL future days once more, after SLAY-19.1 (decor objects) and the four seasonal themes, so players see the final content. SLAY-17.6 only does the first pass.

Plan change 2026-10-08: waits for SLAY-20 (UI feedback) and SLAY-21 (object density cap) so the final regeneration uses the capped generator.

Plan change 2026-10-08: also waits for SLAY-22 (first 100 levels max 9x9, hard from day one) so the final regeneration uses the new size and tier rules.

SLAY-21 (object density cap) was merged into SLAY-22 on 2026-10-08 so the generator rules are measured, swept and approved once.

From the Christmas review: the December test only checks the first seed of each day; after regenerating, check that no two consecutive December days share a set of rooms in the committed schedule.
<!-- SECTION:NOTES:END -->
