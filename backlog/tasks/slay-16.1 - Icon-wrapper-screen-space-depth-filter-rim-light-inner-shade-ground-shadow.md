---
id: SLAY-16.1
title: >-
  Icon wrapper: screen-space depth filter (rim light, inner shade, ground
  shadow)
status: To Do
assignee: []
created_date: '2026-10-03 09:58'
labels:
  - story
dependencies: []
references:
  - src/render/icons/ObjectIcon.tsx
  - src/render/icons/SceneObjectIcons.tsx
  - src/render/icons/SceneObjectIcons.test.tsx
  - src/render/icons/icons.test.tsx
  - src/render/icons/ContactSheetView.tsx
  - src/render/scene/SceneView.tsx
  - src/ui/help/Legend.tsx
parent_task_id: SLAY-16
type: feature
ordinal: 107000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: ObjectIconGlyph wraps the already rotated and mirrored art in a group with an SVG depth filter, so light always comes from the top-left and the shadow falls bottom-right in all 8 orientations, on the board, in the legend and on the contact sheet. The filter is defined once per rendered SVG.
Type: deliverable
Branch: SLAY-16.1/icon-depth-filter
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ObjectIconGlyph renders a filtered group around the group that carries the orientation matrix (filter outside, orientation inside); a test checks the markup order for all 8 orientations
- [ ] #2 The filter uses the approved depth-55 values as one exported constant: bevel offset 2.9, rim highlight white opacity 0.48 blur 0.8, inner shade #2a1a10 opacity 0.27 blur 1, ground shadow #2a1a10 opacity 0.29 blur 2.6 offset dx 2.4 dy 5.3, filter region x -25% y -25% width 160% height 175%
- [ ] #3 A scene with N objects contains exactly one filter definition (not N), also on the legend and contact sheet; a test counts the filter elements
- [ ] #4 Walls and room labels still draw on top of the object shadows, shadows are not clipped at the board edge, and hit-testing, gestures and the hit layer are unchanged
- [ ] #5 Existing icon and scene tests, lint, typecheck and test --maxWorkers=1 are green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Prototype of the filter chain: docs/design/depth-prototype.html (function filterDef). Apply the filter on an outer group so it works in screen space after the orientation transform.
<!-- SECTION:NOTES:END -->
