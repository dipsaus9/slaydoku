---
id: SLAY-18.8
title: Christmas theme
status: To Do
assignee: []
created_date: '2026-10-08 09:22'
updated_date: '2026-10-08 12:29'
labels:
  - needs-owner-review
dependencies:
  - SLAY-18.7
references:
  - src/content/themes/christmas.ts
  - src/content/themes/christmas.rooms.test.ts
  - src/content/themes/index.ts
  - src/render/icons/themes/
parent_task_id: SLAY-18
type: feature
ordinal: 132000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the Christmas theme for all of December, built to the approved preview of SLAY-18.5, with about 15 rooms so 31 days in a row stay varied, allow-lists, EN and NL names, art in the approved look, registered as seasonal.
Type: deliverable
Branch: SLAY-18.8/christmas-theme
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The theme matches the owner-approved Christmas preview of SLAY-18.5
- [ ] #2 At least 15 rooms; every kind has an allow-list and an allowed room; a sweep finds no out-of-room placement (src/content/themes/christmas.rooms.test.ts)
- [ ] #3 A generated December (31 days) shows no two consecutive days with the same room set (test over the seeds of the schedule)
- [ ] #4 Registered as seasonal; the calendar picks it for 1-31 December and nothing else changes (test)
- [ ] #5 bun run lint, typecheck and test --maxWorkers=1 pass
- [ ] #6 New drawings follow the approved look (docs/design/looks.md 'How to draw a new object' from SLAY-17.4) and pass the look-completeness test
- [ ] #7 Owner has seen rendered levels of the theme and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. Deadline for this year: 2026-12-01.
<!-- SECTION:NOTES:END -->
