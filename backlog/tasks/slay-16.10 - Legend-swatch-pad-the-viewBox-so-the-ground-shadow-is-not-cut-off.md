---
id: SLAY-16.10
title: 'Legend swatch: pad the viewBox so the ground shadow is not cut off'
status: To Do
assignee: []
created_date: '2026-10-03 12:52'
labels:
  - story
dependencies:
  - SLAY-16.9
references:
  - src/ui/help/Legend.tsx
  - src/ui/play/play.css
  - docs/verification/depth.ts
  - docs/design/depth.md
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
- [ ] #1 On the rendered legend at true 360x640, 390x844, 768x1024 and 1024x768 in en and nl, no object swatch has its ground shadow cut off, checked for every object type with a footprint of more than one cell as well as the single-cell ones
- [ ] #2 The object itself is drawn at the same size as before: the viewBox is padded on the right and bottom (about 8 units, enough for the 6.7 down and 4.9 right shadow reach) and the svg box in play.css grows by the same ratio
- [ ] #3 The legend layout at 360px has no new horizontal overflow and no row changes height by more than the padding
- [ ] #4 docs/verification/depth.ts (from SLAY-16.9) passes its swatch-clipping check; lint, typecheck and test --maxWorkers=1 are green
<!-- AC:END -->
