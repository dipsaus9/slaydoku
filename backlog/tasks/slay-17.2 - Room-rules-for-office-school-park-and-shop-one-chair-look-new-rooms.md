---
id: SLAY-17.2
title: 'Room rules for office, school, park and shop, one chair look, new rooms'
status: Done
assignee: []
created_date: '2026-10-08 08:58'
updated_date: '2026-10-08 11:13'
labels:
  - story
dependencies:
  - SLAY-17.1
references:
  - >-
    src/content/themes/office.ts src/content/themes/school.ts
    src/content/themes/park.ts src/content/themes/shop.ts
    src/content/themes/drawn.ts src/content/themes/themes.test.ts
    src/content/themes/rooms.test.ts src/content/themes/types.ts
    src/render/icons/themes/art.tsx src/render/icons/themes/registry.ts
    src/render/icons/themes/types.ts src/engine/clues/en.test.ts
    src/engine/clues/objectNames.test.ts src/ui/help/Legend.test.tsx
    src/engine/generator/scale/gates.test.ts src/schedule/build.test.ts
    tools/schedule.test.ts src/engine/solver/advanced/soundness.test.ts
    docs/authoring/room-rules.md docs/authoring/rules.md
    docs/authoring/theme-and-icons.md
  - src/engine/solver/advanced/soundness.slow.test.ts
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
- [x] #1 Every kind in office, school, park and shop has an allow-list; no bed/hammock outside sleeping rooms, no vehicle outside garage/parking areas, no wet fixture outside wet rooms
- [x] #2 Each of the four themes gains 2-3 new rooms (EN and NL names) with a signature object and allow-list
- [x] #3 officeChair, beanbag and poof are removed; all remaining chair kinds draw the plain chair
- [x] #4 Legend and clue text still name chairs correctly (no group with several kinds claims a specific noun)
- [x] #5 Every kind has an allowed room and every favours entry is allowed in its own room, for all five themes (test)
- [x] #6 A sweep over many seeds finds zero out-of-allow-list placements in all five themes
- [x] #7 bun run lint, typecheck and test --maxWorkers=1 pass
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review: pass (advisory only: task file bookkeeping). Committed schedule files untouched; rebuild-vs-committed tests relaxed to plan fields because themes changed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Allow-lists on every kind in office, school, park and shop; 3 new rooms per theme with signature objects (EN/NL); officeChair, beanbag, poof removed with their art, all chair kinds draw the plain chair; allowedRoomTypes now required; room-rule tests and seed sweep cover all five themes. Committed schedule untouched; tests that rebuilt committed days byte for byte now compare plan fields.
<!-- SECTION:FINAL_SUMMARY:END -->
