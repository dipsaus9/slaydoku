---
id: SLAY-16
title: 'Epic: depth in the board objects and a calmer selected card'
status: Done
assignee: []
created_date: '2026-10-03 09:57'
updated_date: '2026-10-03 20:43'
labels:
  - epic
dependencies: []
ordinal: 106000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the objects drawn on the board (chair, plant, table, shelf, ...) read as solid objects with detail, feet, rim light and a ground shadow, and the selected suspect card gets one clean 'spotlight' state. Visual change only: no change to game rules, controls or hit areas.

Chosen approach: lighting lives in one place, the wrapper that draws each object on the board (ObjectIconGlyph), as a screen-space SVG filter around the already rotated and mirrored art, so light always comes from the top-left and the shadow falls bottom-right in all 8 orientations. The drawings themselves only gain rotation-safe detail (interior detail, four corner feet). Look approved by the owner on 2026-10-03 at depth 55/100: rim light 0.48, inner shade 0.27, ground shadow opacity 0.29 with offset dx 2.4 / dy 5.3 and blur 2.6, bevel offset 2.9. The approved prototype is docs/design/depth-prototype.html.
Why it beat the alternatives: (a) only a gradient layer over the old flat shapes (three variants shown, all rejected by the owner as still too flat); (b) light and shadow baked into each of the ~43 drawings (would rotate with the object, so the shadow would point a different way per orientation); (c) an isometric redraw (breaks the top-down grid that clues and cell geometry rely on).
Drawing rules for every redrawn icon: only rotation-safe detail in the art, feet at all four corners, no baked light or shadow; original drawings, never traced from the official Murdoku art (the owner's reference photo is a depth benchmark only); each silhouette stays inside its footprint cells and distinguishable from other objects of the same engine type (existing bounds and drawnKinds tests).
Cards: owner picked variant C 'Spotlight': a fine accent hairline inside the paper frame, a small pointer above the selected card, the other cards step back; the old double ring, red glow and enlargement go.
Follow-up (not in this epic): once this is delivered and checked, the same visuals move to the private cadeauko project as part of its CAD-11.1 story, and CAD-11.1 and CAD-11.2 are then approved to run (owner decision, 2026-10-03).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All stories SLAY-16.1 to SLAY-16.9 are Done
- [x] #2 The owner has seen the redrawn board and the new selected card on a real phone and approved them (manual check)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Closed on 2026-10-03 on the owner's instruction (Sluit alles). All stories are Done and merged. The manual criteria (live reminder check / owner check on a real phone) were accepted by the owner and were NOT independently verified by the agent.
<!-- SECTION:NOTES:END -->
