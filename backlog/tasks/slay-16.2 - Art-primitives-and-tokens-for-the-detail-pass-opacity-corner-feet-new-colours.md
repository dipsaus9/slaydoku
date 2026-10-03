---
id: SLAY-16.2
title: >-
  Art primitives and tokens for the detail pass (opacity, corner feet, new
  colours)
status: Done
assignee: []
created_date: '2026-10-03 09:58'
updated_date: '2026-10-03 10:15'
labels:
  - story
dependencies: []
references:
  - src/render/icons/art/shapes.tsx
  - src/render/icons/art/shapes.test.tsx
  - src/render/icons/art/tokens.ts
parent_task_id: SLAY-16
type: feature
ordinal: 108000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the shape primitives and colour tokens the redrawn icons need exist: opacity on shapes, a helper that draws four symmetric corner feet, and the extra colours of the approved prototype. No existing icon changes.
Type: deliverable
Branch: SLAY-16.2/art-primitives-tokens
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Box, Disc, Oval, Stroke and Shape accept an optional opacity, and a stroke of none draws no outline; an existing icon renders byte-identical markup before and after (test)
- [x] #2 A Feet helper draws four small corner feet inside a cols x rows footprint, symmetric under all 8 orientations and inside the footprint bounds (test)
- [x] #3 New tokens added with the existing naming and no existing value changed: creamDark #d8c9a6, woodDeep #5b3f2b, goldDark #a98438, yellowLight #ecdc9a, terraDark #8a4a36, soil #5a3a2b
- [x] #4 lint, typecheck and test --maxWorkers=1 are green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Design reference: docs/design/depth-prototype.html (owner approved at depth 55/100 on 2026-10-03; open it to see the exact look and numbers). Drawing rules: (1) only rotation-safe detail in the art, feet at all four corners, no directional cue such as a lit side; (2) no baked light or shadow, the wrapper filter (SLAY-16.1) provides all of it; (3) original drawings, never traced from the official Murdoku art; (4) every silhouette stays inside its footprint cells (existing footprint bounds test) and distinguishable from other objects of the same engine type (drawnKinds); (5) keep the same function names, signatures and footprints so the registry, themes and tests need no change.

Review gate: pass, no findings, no scope violations.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added optional opacity to Box/Disc/Oval/Stroke/Shape, a Feet helper (four square corner feet, symmetric under all 8 orientations, inside footprint) and six new colour tokens. No existing icon output changes; tests in shapes.test.tsx.
<!-- SECTION:FINAL_SUMMARY:END -->
