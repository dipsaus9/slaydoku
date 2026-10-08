---
id: SLAY-18.9
title: Halloween theme
status: In Progress
assignee: []
created_date: '2026-10-08 09:23'
updated_date: '2026-10-08 19:28'
labels:
  - needs-owner-review
dependencies:
  - SLAY-18.4
  - SLAY-18.5
  - SLAY-17.4
  - SLAY-18.11
references:
  - src/content/themes/halloween.ts
  - src/content/themes/halloween.rooms.test.ts
  - src/render/icons/themes/halloweenArt.ts
  - src/render/icons/themes/halloweenIcons.ts
  - docs/design/looks-shots/slay-18.9/
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

Plan change 2026-10-08: the four seasonal themes no longer run as a chain. After SLAY-18.11 each theme only touches its own module and icon files, so 18.6 to 18.9 can be built in parallel.

Art file is halloweenArt.ts (not .tsx): types.ts imports sets.ts at runtime, so a .tsx art module enters the generator worker graph and fails src/ui/lab/worker.test.ts ('imports no .tsx module'). The same applies to fall/carnaval/christmas. Registering the theme fails shared schedule tests (calendar.test 'themeOf gives the committed theme for every scheduled day', schedule.test plan/check for the committed 2026-10-17..31 days, pick.test 'never repeats a theme two days in a row' and 'never two consecutive days the same size, tier and theme', e.g. 2027-10-19 9/hard/halloween twice); those files are outside this story and need an orchestrator decision (SLAY-18.10 regenerates the window).
<!-- SECTION:NOTES:END -->
