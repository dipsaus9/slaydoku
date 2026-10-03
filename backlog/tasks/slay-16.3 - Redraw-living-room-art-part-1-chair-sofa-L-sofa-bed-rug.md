---
id: SLAY-16.3
title: 'Redraw living-room art, part 1: chair, sofa, L-sofa, bed, rug'
status: Done
assignee: []
created_date: '2026-10-03 09:58'
updated_date: '2026-10-03 10:35'
labels:
  - story
dependencies:
  - SLAY-16.2
references:
  - src/render/icons/art/living.tsx
parent_task_id: SLAY-16
type: feature
ordinal: 109000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the chair, sofa, sofaL, bed and rug in art/living.tsx are redrawn with interior detail and corner feet at the approved depth.
Type: deliverable
Branch: SLAY-16.3/living-seating-art
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 chair, sofa, sofaL, bed and rug are redrawn: each has at least two interior details (e.g. cushion seams, pillow highlights, rug border) and corner feet where it stands on legs
- [x] #2 All five obey the drawing rules in the notes; the footprint bounds test and the drawnKinds distinctness tests pass unchanged
- [x] #3 Each icon is rendered on the contact sheet in all 8 orientations and inspected (screenshots kept outside the repo); light stays top-left and shadow bottom-right in every orientation
- [x] #4 lint, typecheck and test --maxWorkers=1 are green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Design reference: docs/design/depth-prototype.html (owner approved at depth 55/100 on 2026-10-03; open it to see the exact look and numbers). Drawing rules: (1) only rotation-safe detail in the art, feet at all four corners, no directional cue such as a lit side; (2) no baked light or shadow, the wrapper filter (SLAY-16.1) provides all of it; (3) original drawings, never traced from the official Murdoku art; (4) every silhouette stays inside its footprint cells (existing footprint bounds test) and distinguishable from other objects of the same engine type (drawnKinds); (5) keep the same function names, signatures and footprints so the registry, themes and tests need no change.

Rendered all 8 orientations in headless Chrome (screenshots in scratchpad, outside repo); depth filter SLAY-16.1 not merged, so judged the drawing itself. Glints removed from cushions/pillows as they would be a directional lit side. Collides on living.tsx with SLAY-16.4 (merge at PR time).

Review: pass. Advisory: white arm strokes are symmetric (chair copied from approved prototype); kept.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Redrew chair, sofa, sofaL, bed and rug in art/living.tsx with interior detail (seams, tufts, pillow creases, rug fringe/frame/medallion) and corner feet; rotation-safe, no baked light. Checked in all 8 orientations in headless Chrome (depth filter not yet merged).
<!-- SECTION:FINAL_SUMMARY:END -->
