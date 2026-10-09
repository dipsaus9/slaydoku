---
id: SLAY-19
title: 'Epic: More decor objects for varied levels'
status: Done
assignee: []
created_date: '2026-10-08 14:58'
updated_date: '2026-10-09 08:53'
labels:
  - epic
dependencies: []
ordinal: 140000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Levels look samey: too many chairs and too little else. Add 19 new object types and 38 decor objects across the five regular themes (home, office, school, park, shop) so rooms get lamps, mirrors, a bath, a fridge and more, and the generator has more to choose from.

Chosen approach: real new engine types (own clue words EN and NL, legend text, A2 art) delivered as ONE story with the strongest available model, so rules, art and theme data stay consistent. It beat reusing existing types with new art only (cheaper, but a lamp would be called 'plant' in a clue) and beat a split into eight parallel stories (owner preferred one story, 2026-10-08).

Owner list: everything proposed except the fire extinguisher and the cooled display case. Out of scope: lamps as light sources with shadow, objects for the seasonal themes (follow-up). The final regeneration of all future days is SLAY-18.10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The 19 new object types exist end to end: engine, clue words EN and NL, legend, A2 art
- [x] #2 The 38 objects are placed in the five themes with room allow-lists
- [x] #3 Level variety rises (distinct kinds per room) while chairs stay at most 15% of objects
- [x] #4 Owner approved the new objects on screen
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Closed by the orchestrator on the owner explicit instruction (2026-10-09): "Sluit 19 ook na 24". Delivered by SLAY-19.1: 19 new object types, 31 new theme kinds instead of the 38 listed (owner approved the deviation: names must match what is drawn; one lamp kind per theme; dropped laundry basket, lab table, bird bath). Criterion 3 was re-measured by owner decision: variety is measured per board, with density and realistic family mix rules (SLAY-22), chairs stay under 15%.
<!-- SECTION:NOTES:END -->
