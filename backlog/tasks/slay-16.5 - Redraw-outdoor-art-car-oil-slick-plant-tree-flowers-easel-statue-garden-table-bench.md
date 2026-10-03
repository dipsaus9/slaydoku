---
id: SLAY-16.5
title: >-
  Redraw outdoor art: car, oil slick, plant, tree, flowers, easel, statue,
  garden table, bench
status: To Do
assignee: []
created_date: '2026-10-03 09:58'
labels:
  - story
dependencies:
  - SLAY-16.2
references:
  - src/render/icons/art/outdoor.tsx
parent_task_id: SLAY-16
type: feature
ordinal: 111000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the nine icons in art/outdoor.tsx are redrawn with interior detail at the approved depth (the plant follows the prototype: saucer ring, eight veined leaves, pot with soil).
Type: deliverable
Branch: SLAY-16.5/outdoor-art
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 car, oilSlick, plant, tree, flowers, easel, statue, gardenTable and bench are redrawn with at least two interior details each; plant matches docs/design/depth-prototype.html in structure
- [ ] #2 All nine obey the drawing rules in the notes; footprint bounds and drawnKinds distinctness tests pass unchanged
- [ ] #3 Each icon is checked on the contact sheet in all 8 orientations; the oil slick still reads as flat on the ground (no feet)
- [ ] #4 lint, typecheck and test --maxWorkers=1 are green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Design reference: docs/design/depth-prototype.html (owner approved at depth 55/100 on 2026-10-03; open it to see the exact look and numbers). Drawing rules: (1) only rotation-safe detail in the art, feet at all four corners, no directional cue such as a lit side; (2) no baked light or shadow, the wrapper filter (SLAY-16.1) provides all of it; (3) original drawings, never traced from the official Murdoku art; (4) every silhouette stays inside its footprint cells (existing footprint bounds test) and distinguishable from other objects of the same engine type (drawnKinds); (5) keep the same function names, signatures and footprints so the registry, themes and tests need no change.
<!-- SECTION:NOTES:END -->
