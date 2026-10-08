---
id: SLAY-17.5
title: Room labels readable when a room is full of people
status: To Do
assignee: []
created_date: '2026-10-08 08:58'
labels:
  - needs-owner-review
dependencies: []
references:
  - src/render/scene/labels.ts
  - src/render/scene/labels.test.ts
  - src/render/scene/layers/
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
- [ ] #1 A label is readable on a crowded room at 360, 390, 768 and 1024 wide (rendered check)
- [ ] #2 Long Dutch labels no longer cover objects such as the bookshelf and checkout counter on 2026-11-30 12x12
- [ ] #3 Label tests updated and passing; bun run lint, typecheck and test --maxWorkers=1 pass
- [ ] #4 Owner has seen screenshots in the PR and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. Use the dev date override (?date=...), see docs/daily-flow.md.
<!-- SECTION:NOTES:END -->
