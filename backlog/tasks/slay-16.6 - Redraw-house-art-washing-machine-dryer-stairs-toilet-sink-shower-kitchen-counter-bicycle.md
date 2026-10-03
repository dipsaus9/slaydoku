---
id: SLAY-16.6
title: >-
  Redraw house art: washing machine, dryer, stairs, toilet, sink, shower,
  kitchen counter, bicycle
status: Done
assignee: []
created_date: '2026-10-03 09:58'
updated_date: '2026-10-03 10:35'
labels:
  - story
dependencies:
  - SLAY-16.2
references:
  - src/render/icons/art/house.tsx
parent_task_id: SLAY-16
type: feature
ordinal: 112000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the eight icons in art/house.tsx are redrawn with interior detail at the approved depth.
Type: deliverable
Branch: SLAY-16.6/house-art
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 washingMachine, dryer, stairs, toilet, sink, shower, kitchenCounter and bicycle are redrawn with at least two interior details each (e.g. drum glass, tap and basin rim, counter edge)
- [x] #2 All eight obey the drawing rules in the notes; footprint bounds and drawnKinds distinctness tests pass unchanged
- [x] #3 Each icon is checked on the contact sheet in all 8 orientations; stairs keep a clear up/down reading under the depth filter
- [x] #4 lint, typecheck and test --maxWorkers=1 are green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Design reference: docs/design/depth-prototype.html (owner approved at depth 55/100 on 2026-10-03; open it to see the exact look and numbers). Drawing rules: (1) only rotation-safe detail in the art, feet at all four corners, no directional cue such as a lit side; (2) no baked light or shadow, the wrapper filter (SLAY-16.1) provides all of it; (3) original drawings, never traced from the official Murdoku art; (4) every silhouette stays inside its footprint cells (existing footprint bounds test) and distinguishable from other objects of the same engine type (drawnKinds); (5) keep the same function names, signatures and footprints so the registry, themes and tests need no change.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Redrew washingMachine, dryer, stairs, toilet, sink, shower, kitchenCounter, bicycle in art/house.tsx with interior detail, highlights and corner Feet; stairs gain side rails, nosed treads and an up-chevron. Checked in all 8 orientations in headless Chrome (without depth filter, SLAY-16.1 unmerged).
<!-- SECTION:FINAL_SUMMARY:END -->
