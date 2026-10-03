---
id: SLAY-16.9
title: 'Verify the redrawn board and legend on real sizes, update docs'
status: To Do
assignee: []
created_date: '2026-10-03 09:59'
labels:
  - story
dependencies:
  - SLAY-16.1
  - SLAY-16.4
  - SLAY-16.5
  - SLAY-16.6
  - SLAY-16.7
  - SLAY-16.8
references:
  - docs/verification/
  - docs/handoff.md
  - docs/design/
parent_task_id: SLAY-16
type: chore
ordinal: 115000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the whole visual change is checked on the rendered screen at phone and iPad sizes, performance is checked, and the docs describe the new look so the cadeauko port can follow it.
Type: deliverable
Branch: SLAY-16.9/verify-visuals
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The board and the legend are rendered at 360x640, 390x844, 768x1024 and 1024x768 in en and nl; every object type appears in all 8 orientations somewhere (contact sheet or sample boards); no clipped shadows at the board edge, no object overlapping a wall label
- [ ] #2 On a 12x12 board with at least 40 objects a headless-Chrome trace of a pinch zoom and a pan reports no task over 100 ms attributable to the filter; if it does, the story records the finding and the follow-up
- [ ] #3 docs/handoff.md and docs/design/ describe the depth constants, the drawing rules and where the filter lives, with the screenshots' location noted
- [ ] #4 bun run verify:phone or the relevant docs/verification drivers pass (or the exact sandbox limitation is recorded); lint, typecheck and test --maxWorkers=1 are green
<!-- AC:END -->
