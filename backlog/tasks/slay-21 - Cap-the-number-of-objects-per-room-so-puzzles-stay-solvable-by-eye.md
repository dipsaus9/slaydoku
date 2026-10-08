---
id: SLAY-21
title: Cap the number of objects per room so puzzles stay solvable by eye
status: To Do
assignee: []
created_date: '2026-10-08 19:23'
labels:
  - story
  - needs-owner-review
dependencies:
  - SLAY-19.1
references:
  - src/engine/scenegen/
  - src/content/themes/rooms.test.ts
  - src/content/themes/variety.test.ts
  - src/engine/scenegen/variety.test.ts
  - docs/authoring/room-rules.md
  - docs/verification/
  - docs/design/looks-shots/
type: feature
ordinal: 142000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: owner feedback 2026-10-08: too many objects are placed in a single room, which makes the puzzle harder to read. The scene generator limits the object density per room: a cap on placed objects per room that scales with the room's size (squares), with the cap measured first on the baked schedule (objects per room and per square, per theme and board size) and chosen so rooms look furnished but not crowded; structural kinds (rugs, plants) count too, rooms keep their signature objects, and the room allow-list rules and the chair caps of SLAY-17.6 stay. Clue difficulty and the solver tiers must still hold (the generator still finds a unique puzzle for every tier and size). Future days are regenerated afterwards by SLAY-18.10 (do not regenerate here).
Type: deliverable
Branch: SLAY-21/object-density-cap
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Baseline measured on the baked schedule and on 200 generated scenes per theme and size (6, 7, 9, 12): objects per room, objects per square, the share of rooms above the new cap; numbers are recorded in docs/authoring/room-rules.md
- [ ] #2 The generator never places more objects in a room than the cap (cap grows with room squares, tested over many seeds in a unit test and a slow sweep); no room is left bare: every room still gets at least its minimum when it has the squares for it
- [ ] #3 The room allow-list rules, the chair caps, the per-kind caps and the variety numbers of SLAY-17.6/19.1 still hold (existing variety tests pass)
- [ ] #4 A sweep over fresh seeds (bun run validate:generation or the slow generation sweep) still generates a unique, verified puzzle for every tier and size within budget, and the share of rooms with more than the cap is zero
- [ ] #5 Rendered sample boards (home, office, school, park, shop; 9x9 and 12x12; phone and desktop) show rooms that are furnished but not crowded; screenshots in the PR
- [ ] #6 The schedule files are not changed by this story (SLAY-18.10 regenerates); schedule:check and the full test run pass; bun run lint and typecheck pass
- [ ] #7 Owner has seen the rendered sample boards and approved (only the owner ticks this)
<!-- AC:END -->
