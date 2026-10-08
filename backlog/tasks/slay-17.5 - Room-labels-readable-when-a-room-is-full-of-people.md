---
id: SLAY-17.5
title: Room labels readable when a room is full of people
status: In Progress
assignee: []
created_date: '2026-10-08 08:58'
updated_date: '2026-10-08 11:35'
labels:
  - needs-owner-review
dependencies: []
references:
  - src/render/scene/labels.ts
  - src/render/scene/labels.test.ts
  - src/render/scene/layers/
  - src/render/scene/geometry.test.ts
  - docs/verification/
  - docs/handoff.md
  - src/render/scene/SceneView.tsx
  - src/render/scene/SceneView.test.tsx
  - src/ui/play/Board.tsx
  - docs/design/label-treatments/
parent_task_id: SLAY-17
type: feature
ordinal: 122000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: room names stay readable when many pieces stand in the room (for example a halo or pill behind the text, or placement in free cells). Includes the open 'Speelgoedafdeling' case from the SLAY-16.9 notes in docs/handoff.md.
Type: deliverable
Branch: SLAY-17.5/room-label-legibility
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A room name stays readable on the play board when people are placed and crosses and notes are in that room, at 360, 390, 768 and 1024 wide (rendered check)
- [x] #2 A rendered driver covers that state (docs/verification/labelshots.ts: crowded board in en and nl) and passes
- [x] #3 Label tests updated and passing; bun run lint, typecheck and test --maxWorkers=1 pass
- [ ] #4 Owner has seen the treatment comparison and screenshots in the PR and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Column runs (label turned a quarter), pick the run with the largest font, hyphenate single long words; tests + data and rendered checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. Use the dev date override (?date=...), see docs/daily-flow.md.

Rendered check: docs/verification/labelshots.ts at 360/390/768/1024, en+nl, days 2026-11-30, 2026-12-30, 2027-01-22. 2026-11-30 has no object under a label. Residual: 9 labels in one/two-cell rooms (e.g. 2026-12-30) still touch an object. AC4 left for the owner.

Review: pass (story-reviewer). Advisories fixed (hyphenate doc placement, test limit 9). Status stays In Progress, AC4 owner-only.

Redo after owner feedback: the real problem is people, X marks and notes drawn over the room label. Objects-under-label work (rotation, hyphenation) reverted. Chosen default shipped: labels above marks and people, see-through pill + halo, avoid placed-people squares (treatment D); A/B/C compared in docs/design/label-treatments. AC4 owner only.

Review: pass (story-reviewer); advisory on the conditional test fixed.
<!-- SECTION:NOTES:END -->
