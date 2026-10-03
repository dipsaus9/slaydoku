---
id: SLAY-16.10
title: 'Legend swatch: pad the viewBox so the ground shadow is not cut off'
status: Done
assignee: []
created_date: '2026-10-03 12:52'
updated_date: '2026-10-03 13:20'
labels:
  - story
dependencies:
  - SLAY-16.9
references:
  - src/ui/help/Legend.tsx
  - src/ui/play/play.css
  - docs/verification/depth.ts
  - docs/design/depth.md
  - docs/handoff.md
parent_task_id: SLAY-16
type: feature
ordinal: 116000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the object swatches in the legend show the full ground shadow of the depth filter instead of cutting it flat at the right and bottom edge (seen on the garden chair and the picnic table in SLAY-16.9's findings), without changing the size at which an object is drawn.
Type: deliverable
Branch: SLAY-16.10/legend-swatch-padding
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 On the rendered legend at true 360x640, 390x844, 768x1024 and 1024x768 in en and nl, no object swatch has its ground shadow cut off, checked for every object type with a footprint of more than one cell as well as the single-cell ones
- [x] #2 The object itself is drawn at the same size as before: the viewBox is padded on the right and bottom (about 8 units, enough for the 6.7 down and 4.9 right shadow reach) and the svg box in play.css grows by the same ratio
- [x] #3 The legend layout at 360px has no new horizontal overflow and no row changes height by more than the padding
- [x] #4 docs/verification/depth.ts (from SLAY-16.9) passes its swatch-clipping check; lint, typecheck and test --maxWorkers=1 are green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review: pass (round 2; round 1 blocked on scope only: docs/handoff.md, References widened). Advisory: art centring not asserted by the driver.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Legend swatch viewBox padded 8 units right and bottom (SWATCH_SHADOW_PAD); svg box grows by the same ratio and is shifted back to centre via CSS vars in play.css, so objects keep their size. depth.ts swatch part now checks all 40 legend rows (24 multi-cell) in en and nl at 4 viewports geometrically (art size diff <=0.01px vs main, row heights identical, no sideways scroll); the check fails 72 times on old code and passes on the fix.
<!-- SECTION:FINAL_SUMMARY:END -->
