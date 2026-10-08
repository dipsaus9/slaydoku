---
id: SLAY-18.7
title: Carnaval theme (Oeteldonk)
status: To Do
assignee: []
created_date: '2026-10-08 09:22'
labels:
  - needs-owner-review
dependencies:
  - SLAY-18.6
references:
  - src/content/themes/carnaval.ts
  - src/content/themes/carnaval.rooms.test.ts
  - src/content/themes/index.ts
  - src/render/icons/themes/
parent_task_id: SLAY-18
type: feature
ordinal: 131000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the Carnaval theme for 11 November in Oeteldonk style (Den Bosch: red, white and yellow, the frog, kroeg, confetti, optocht), built to the approved preview of SLAY-18.5, with allow-lists, EN and NL names, art in the approved look, registered as seasonal.
Type: deliverable
Branch: SLAY-18.7/carnaval-theme
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The theme matches the owner-approved carnaval preview of SLAY-18.5
- [ ] #2 Every kind has an allow-list and an allowed room; a sweep finds no out-of-room placement (src/content/themes/carnaval.rooms.test.ts)
- [ ] #3 Dutch room and object names are real Dutch carnival words; no trademarks or real brand logos
- [ ] #4 Registered as seasonal; the calendar picks it for 11 November and nothing else changes (test)
- [ ] #5 bun run lint, typecheck and test --maxWorkers=1 pass
- [ ] #6 Owner has seen rendered levels of the theme and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. Deadline for this year: 2026-11-11.
<!-- SECTION:NOTES:END -->
