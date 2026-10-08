---
id: SLAY-18.9
title: Halloween theme
status: To Do
assignee: []
created_date: '2026-10-08 09:23'
updated_date: '2026-10-08 12:29'
labels:
  - needs-owner-review
dependencies:
  - SLAY-18.8
references:
  - src/content/themes/halloween.ts
  - src/content/themes/halloween.rooms.test.ts
  - src/content/themes/index.ts
  - src/render/icons/themes/
parent_task_id: SLAY-18
type: feature
ordinal: 133000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the Halloween theme for 17-31 October, built to the approved preview of SLAY-18.5, with allow-lists, EN and NL names, art in the approved look, registered as seasonal. Expected to miss 2026; the first real run is October 2027.
Type: deliverable
Branch: SLAY-18.9/halloween-theme
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The theme matches the owner-approved Halloween preview of SLAY-18.5
- [ ] #2 Every kind has an allow-list and an allowed room; a sweep finds no out-of-room placement (src/content/themes/halloween.rooms.test.ts)
- [ ] #3 Nothing gory or scary beyond a playful tone (fits a daily puzzle for everyone)
- [ ] #4 Registered as seasonal; the calendar picks it for 17-31 October, except days with a higher-priority rule (test)
- [ ] #5 bun run lint, typecheck and test --maxWorkers=1 pass
- [ ] #6 New drawings follow the approved look (docs/design/looks.md 'How to draw a new object' from SLAY-17.4) and pass the look-completeness test
- [ ] #7 Owner has seen rendered levels of the theme and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it.
<!-- SECTION:NOTES:END -->
