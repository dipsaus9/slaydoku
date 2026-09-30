---
id: SLAY-13.3
title: Normalize score v2's 'squares' part by grid size
status: To Do
assignee: []
created_date: '2026-09-30 11:36'
labels:
  - story
dependencies:
  - SLAY-13.1
references:
  - src/engine/difficulty/score.ts
  - src/engine/difficulty/types.ts
  - src/engine/difficulty/calibrate.ts
  - docs/difficulty/README.md
parent_task_id: SLAY-13
type: feature
ordinal: 85000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: score v2's 'squares' part (mean squares a placement's own cards leave) is expressed relative to grid size, like every other part, using SLAY-13.1's proposed normalization.
Type: deliverable
Branch: SLAY-13.3/normalize-squares-part-by-size
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 scoreParts/PART_RANGES in src/engine/difficulty/score.ts no longer treat 'squares' as a raw, un-normalized count; it scales with grid size (cells) using SLAY-13.1's proposal
- [ ] #2 DEFAULT_WEIGHTS/calibration in src/engine/difficulty/calibrate.ts are re-checked against the changed part (re-fit if the calibration shifts materially; document if not)
- [ ] #3 Existing score v2 tests are updated for the new 'squares' scaling; a new test confirms a small and a large grid puzzle with equivalent relative 'openness' now score similarly on this part
- [ ] #4 docs/difficulty/README.md's part table reflects the normalized 'squares' metric
- [ ] #5 bun run test --maxWorkers=1, lint and typecheck stay green
<!-- AC:END -->
