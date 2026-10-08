---
id: SLAY-18.8
title: Christmas theme
status: In Progress
assignee: []
created_date: '2026-10-08 09:22'
updated_date: '2026-10-08 19:58'
labels:
  - needs-owner-review
dependencies:
  - SLAY-18.4
  - SLAY-18.5
  - SLAY-17.4
  - SLAY-18.11
references:
  - src/content/themes/christmas.ts
  - src/content/themes/christmas.rooms.test.ts
  - src/render/icons/themes/christmasArt.ts
  - src/render/icons/themes/christmasArt.tsx
  - src/render/icons/themes/christmasIcons.ts
  - docs/themes/seasonal/christmas.theme.ts
  - docs/design/looks-shots/slay-18.8/
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
- [x] #2 At least 15 rooms; every kind has an allow-list and an allowed room; a sweep finds no out-of-room placement (src/content/themes/christmas.rooms.test.ts)
- [x] #3 A generated December (31 days) shows no two consecutive days with the same room set (test over the seeds of the schedule)
- [ ] #4 Registered as seasonal; the calendar picks it for 1-31 December and nothing else changes (test)
- [ ] #5 bun run lint, typecheck and test --maxWorkers=1 pass
- [x] #6 New drawings follow the approved look (docs/design/looks.md 'How to draw a new object' from SLAY-17.4) and pass the look-completeness test
- [ ] #7 Owner has seen rendered levels of the theme and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Build christmasTheme from the approved draft (18 rooms, allow-lists, Dutch nouns, plain chair only, no stairs, sleigh only in the shed), 17 A2 block models in christmasArt.ts (.ts: the worker may import no .tsx), registered in christmasIcons.ts. Coordinator decision: do not register (CHRISTMAS_THEME stays undefined, SLAY-18.10 flips it); christmas.rooms.test.ts runs every theme rule against christmasTheme directly. Screenshots in docs/design/looks-shots/slay-18.8/.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. Deadline for this year: 2026-12-01.

Plan change 2026-10-08: the four seasonal themes no longer run as a chain. After SLAY-18.11 each theme only touches its own module and icon files, so 18.6 to 18.9 can be built in parallel.

Registration deferred to SLAY-18.10 (coordinator 2026-10-08): registering now breaks the schedule tests because the committed December still has rotation themes. For SLAY-18.10: (1) gates.ts pairProblems rejects two consecutive days with the same size, tier and theme; in a 31-day window the plan gives that (2026-12-12/13 both 6x6 easy-medium), and no seed retry can fix it, so the rule must become 'different room set' for consecutive days of one seasonal window (a test version exists in christmas.rooms.test.ts). (2) src/content/objectClues.test.ts expects lower-case nouns after 'than a'; 'a Christmas tree' needs [A-Za-z]. (3) pick.test.ts 'never repeats a theme two days in a row' must exempt seasonal windows. (4) christmas.rooms.test.ts has an it.skip 'SLAY-18.10 enables' for the picker. Changes from the draft: armchair -> Home chair; bed/sofa/wardrobe/toyChest/diningTable/kitchenCounter reuse existing kinds; stairs dropped; Santa's Workshop -> Elf Workshop (clues say 'the <room>'); Snowman Meadow NL Sneeuwpoppenweide; Ice Rink NL IJsbaan; theme NL Kerstdorp (the Dutch-text guard flags 'de'); hay bale and fireplace use ids stableHay/stockingFireplace to avoid a clash with fall.
<!-- SECTION:NOTES:END -->
