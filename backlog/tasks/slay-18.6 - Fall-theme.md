---
id: SLAY-18.6
title: Fall theme
status: To Do
assignee: []
created_date: '2026-10-08 09:22'
updated_date: '2026-10-08 14:14'
labels:
  - needs-owner-review
dependencies:
  - SLAY-18.4
  - SLAY-18.5
  - SLAY-17.4
  - SLAY-18.11
references:
  - src/content/themes/fall.ts
  - src/content/themes/fall.rooms.test.ts
  - src/render/icons/themes/fallArt.tsx
  - src/render/icons/themes/fallIcons.ts
parent_task_id: SLAY-18
type: feature
ordinal: 130000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the Fall theme (1-16 October and 1-30 November except the 11th), built to the approved preview of SLAY-18.5: rooms with EN and NL names, objects with allow-lists, one chair look, art in the approved 3D look, registered as seasonal.
Type: deliverable
Branch: SLAY-18.6/fall-theme
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The theme matches the owner-approved fall preview of SLAY-18.5
- [ ] #2 Every kind has an allow-list and an allowed room; a sweep over many seeds finds no out-of-room placement (src/content/themes/fall.rooms.test.ts)
- [ ] #3 New art follows the look chosen in SLAY-17.3/17.4 and the plain chair is the only chair
- [ ] #4 Registered as seasonal; the calendar picks it for fall days and the themes of all other days are unchanged (test)
- [ ] #5 bun run lint, typecheck and test --maxWorkers=1 pass
- [ ] #6 New drawings follow the approved look (docs/design/looks.md 'How to draw a new object' from SLAY-17.4) and pass the look-completeness test
- [ ] #7 Owner has seen rendered levels of the theme and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it.

Plan change 2026-10-08: the four seasonal themes no longer run as a chain. After SLAY-18.11 each theme only touches its own module and icon files, so 18.6 to 18.9 can be built in parallel.
<!-- SECTION:NOTES:END -->
