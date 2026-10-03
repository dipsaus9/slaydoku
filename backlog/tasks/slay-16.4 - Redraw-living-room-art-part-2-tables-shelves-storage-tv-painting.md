---
id: SLAY-16.4
title: 'Redraw living-room art, part 2: tables, shelves, storage, tv, painting'
status: Done
assignee: []
created_date: '2026-10-03 09:58'
updated_date: '2026-10-03 11:39'
labels:
  - story
dependencies:
  - SLAY-16.2
  - SLAY-16.3
references:
  - src/render/icons/art/living.tsx
parent_task_id: SLAY-16
type: feature
ordinal: 110000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: table, diningTable, bookshelf, chest, cabinet, wardrobe, desk, tv and framedPainting in art/living.tsx are redrawn with interior detail and corner feet at the approved depth.
Type: deliverable
Branch: SLAY-16.4/living-storage-art
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 table, diningTable, bookshelf, chest, cabinet, wardrobe, desk, tv and framedPainting are redrawn with at least two interior details each (e.g. double table border, books on three shelves, door panels, screen glare)
- [x] #2 All nine obey the drawing rules in the notes; footprint bounds and drawnKinds distinctness tests pass unchanged
- [x] #3 Each icon is checked on the contact sheet in all 8 orientations at 1x1 and at its widest footprint; light stays top-left in every orientation
- [x] #4 lint, typecheck and test --maxWorkers=1 are green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Design reference: docs/design/depth-prototype.html (owner approved at depth 55/100 on 2026-10-03; open it to see the exact look and numbers). Drawing rules: (1) only rotation-safe detail in the art, feet at all four corners, no directional cue such as a lit side; (2) no baked light or shadow, the wrapper filter (SLAY-16.1) provides all of it; (3) original drawings, never traced from the official Murdoku art; (4) every silhouette stays inside its footprint cells (existing footprint bounds test) and distinguishable from other objects of the same engine type (drawnKinds); (5) keep the same function names, signatures and footprints so the registry, themes and tests need no change.

Rendered all 8 orientations at 1x1 and widest footprint in headless Chrome with the depth filter; light stays top-left. lint, typecheck, test green.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Redrew table, diningTable, bookshelf, chest, cabinet, wardrobe, desk, tv and framedPainting in art/living.tsx with interior detail and corner feet (Feet helper), rotation-safe, no baked light; checked in all 8 orientations at 1x1 and widest footprint with the depth filter. Reviewer passed.
<!-- SECTION:FINAL_SUMMARY:END -->
