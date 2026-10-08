---
id: SLAY-17.3
title: 'Spike: 3D object look prototype for owner review'
status: Done
assignee: []
created_date: '2026-10-08 08:58'
updated_date: '2026-10-08 11:11'
labels:
  - needs-owner-review
dependencies: []
references:
  - docs/design/looks-prototype.html
  - docs/design/looks.md
  - docs/design/looks-shots/
parent_task_id: SLAY-17
type: spike
ordinal: 120000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: an HTML prototype (like docs/design/depth-prototype.html from SLAY-16) showing a more 3D render, not flat 2D with shadows, for chair, rug, table, bookshelf and a few more objects, in the board's 8 orientations, with 2-3 variants, so the owner can pick one together with Claude.
Type: spike
Spike justification: how a render looks has to be seen and judged by the owner; planning cannot settle it from the desk.
Branch: SLAY-17.3/look-3d-prototype
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 docs/design/looks-prototype.html shows chair, rug, table, bookshelf and at least 3 more objects in 2-3 3D look variants, in all 8 orientations
- [x] #2 docs/design/looks.md records the variants, their trade-offs and the recommendation
- [x] #3 Owner has seen the prototype with Claude and picked a look; the choice is written in docs/design/looks.md (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): present the prototype, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it.

Prototype: docs/design/looks-prototype.html (A block, B steps, C relief, 9 objects, 8 orientations). Recommendation B at reduced scale; A as fallback; skip C. AC 3 left for the owner.

Review: pass (AC 3 pending owner, advisory: Dutch labels in prototype are fine).

Round 2 (owner: A best, B and C out): A2 oblique and A3 isometric block models added, B and C removed from the page. Recommendation A2, A3 as next step. AC 3 still owner-only.

Round 2 review: pass.

Owner decision 2026-10-08: A2 and A3 both go to PoC SLAY-17.8 behind an Options switch; A3 judged on playability, A2 fallback; B, C rejected; bathtub water must read as water.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Prototype docs/design/looks-prototype.html (Nu, A, A2 oblique, A3 isometric; 9 objects, 8 orientations, furnished floor, phone size) and docs/design/looks.md with trade-offs and board-change costs. Owner decision: carry A2 and A3 to the in-app PoC SLAY-17.8, final pick there.
<!-- SECTION:FINAL_SUMMARY:END -->
