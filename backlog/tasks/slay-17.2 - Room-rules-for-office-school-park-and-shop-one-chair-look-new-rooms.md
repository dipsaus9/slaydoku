---
id: SLAY-17.2
title: 'Room rules for office, school, park and shop, one chair look, new rooms'
status: To Do
assignee: []
created_date: '2026-10-08 08:58'
labels:
  - story
dependencies:
  - SLAY-17.1
references:
  - src/content/themes/office.ts
  - src/content/themes/school.ts
  - src/content/themes/park.ts
  - src/content/themes/shop.ts
  - src/content/themes/drawn.ts
  - src/content/themes/themes.test.ts
  - src/content/themes/rooms.test.ts
parent_task_id: SLAY-17
type: feature
ordinal: 119000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: allow-lists for every kind in the office, school, park and shop themes, 2-3 new rooms per theme (each with a signature object), and exactly one chair drawing: officeChair, beanbag and poof are removed and the remaining chair kinds (meeting, school, garden, fitting stool) all draw the plain chair; legend and clue nouns still read correctly.
Type: deliverable
Branch: SLAY-17.2/room-rules-other-themes
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every kind in office, school, park and shop has an allow-list; no bed/hammock outside sleeping rooms, no vehicle outside garage/parking areas, no wet fixture outside wet rooms
- [ ] #2 Each of the four themes gains 2-3 new rooms (EN and NL names) with a signature object and allow-list
- [ ] #3 officeChair, beanbag and poof are removed; all remaining chair kinds draw the plain chair
- [ ] #4 Legend and clue text still name chairs correctly (no group with several kinds claims a specific noun)
- [ ] #5 Every kind has an allowed room and every favours entry is allowed in its own room, for all five themes (test)
- [ ] #6 A sweep over many seeds finds zero out-of-allow-list placements in all five themes
- [ ] #7 bun run lint, typecheck and test --maxWorkers=1 pass
<!-- AC:END -->
