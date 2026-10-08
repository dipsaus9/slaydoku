---
id: SLAY-17.3
title: 'Spike: 3D object look prototype for owner review'
status: In Progress
assignee: []
created_date: '2026-10-08 08:58'
updated_date: '2026-10-08 09:18'
labels:
  - needs-owner-review
dependencies: []
references:
  - docs/design/looks-prototype.html
  - docs/design/looks.md
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
- [ ] #3 Owner has seen the prototype with Claude and picked a look; the choice is written in docs/design/looks.md (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): present the prototype, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it.

Prototype: docs/design/looks-prototype.html (A block, B steps, C relief, 9 objects, 8 orientations). Recommendation B at reduced scale; A as fallback; skip C. AC 3 left for the owner.

Review: pass (AC 3 pending owner, advisory: Dutch labels in prototype are fine).
<!-- SECTION:NOTES:END -->
