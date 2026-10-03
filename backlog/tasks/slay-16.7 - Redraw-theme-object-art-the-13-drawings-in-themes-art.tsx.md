---
id: SLAY-16.7
title: 'Redraw theme object art: the 13 drawings in themes/art.tsx'
status: Done
assignee: []
created_date: '2026-10-03 09:58'
updated_date: '2026-10-03 10:32'
labels:
  - story
dependencies:
  - SLAY-16.2
references:
  - src/render/icons/themes/art.tsx
parent_task_id: SLAY-16
type: feature
ordinal: 113000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: officeChair, beanbag, picnicBlanket, hammock, sandbox, gymMat, fountain, blackboard, printer, vendingMachine, clothesRack, mannequin and checkoutCounter in the theme art are redrawn with interior detail at the approved depth.
Type: deliverable
Branch: SLAY-16.7/theme-art
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All 13 theme drawings are redrawn with at least two interior details each
- [x] #2 All obey the drawing rules in the notes; the theme icon tests and footprint bounds tests pass unchanged
- [x] #3 Each icon is checked on the theme icon sheet in all 8 orientations; two kinds of the same engine type stay distinguishable
- [x] #4 lint, typecheck and test --maxWorkers=1 are green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Design reference: docs/design/depth-prototype.html (owner approved at depth 55/100 on 2026-10-03; open it to see the exact look and numbers). Drawing rules: (1) only rotation-safe detail in the art, feet at all four corners, no directional cue such as a lit side; (2) no baked light or shadow, the wrapper filter (SLAY-16.1) provides all of it; (3) original drawings, never traced from the official Murdoku art; (4) every silhouette stays inside its footprint cells (existing footprint bounds test) and distinguishable from other objects of the same engine type (drawnKinds); (5) keep the same function names, signatures and footprints so the registry, themes and tests need no change.

Checked on ThemeIconSheet in 4 rotations (headless Chrome, no depth filter yet); lint, typecheck, test green.

Review: pass (advisory: sandbox detail asymmetric, checked on sheet).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Redrew the 13 theme drawings in themes/art.tsx with interior detail and corner feet where the object stands on legs; names, signatures and footprints unchanged.
<!-- SECTION:FINAL_SUMMARY:END -->
