---
id: SLAY-13.2
title: Size-band SOLVABLE_TIERS across all six tiers
status: To Do
assignee: []
created_date: '2026-09-30 11:36'
labels:
  - story
dependencies:
  - SLAY-13.1
references:
  - src/engine/solvable/tiers.ts
  - src/engine/solvable/ladder.ts
  - src/engine/solvable/caps.test.ts
  - src/engine/solvable/ladder.test.ts
  - src/engine/solvable/tiers.test.ts
  - src/engine/generator/ladder/generate.ts
  - src/engine/generator/ladder/generate.test.ts
  - src/engine/generator/ladder/matrix.demo.test.ts
  - src/engine/generator/ladder/matrix.generated.test.ts
  - docs/solvability/README.md
parent_task_id: SLAY-13
type: feature
ordinal: 84000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: SOLVABLE_TIERS (src/engine/solvable/tiers.ts) has distinct, measured requirements for the {6,7} and {9,12} size bands across all six tiers -- the four ladder tiers via their existing cap fields (maxCards, maxChain, maxSquaresFromCards, lastSquaresFromCards, minPlaceableAlone), and hard/expert via a new size-banded threshold, using SLAY-13.1's proposed numbers exactly (or documents why they were adjusted).
Type: deliverable
Branch: SLAY-13.2/size-band-solvable-tiers

Ladder tiers and hard/expert are merged into one story because they live in the same SOLVABLE_TIERS table/file -- splitting them would just be an artificial collision (same References) with no real independence between the halves.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SOLVABLE_TIERS (or a size-aware wrapper around it) exposes distinct requirements for {6,7} and {9,12} per tier, using SLAY-13.1's proposed numbers exactly, or states why a number was adjusted
- [ ] #2 ladderCheck/ladderMeetsTier/ladderOptions (src/engine/solvable/ladder.ts) take the puzzle's actual grid size into account when picking which caps to enforce for the four ladder tiers -- no more one-size-fits-all constants
- [ ] #3 assessTier's advanced-solver branch (hard/expert) applies the new size-banded threshold from SLAY-13.1, not just the existing flat technique-level cutoff
- [ ] #4 generateLadder (src/engine/generator/ladder/generate.ts) and any other call site reading the old flat caps are updated to resolve size correctly
- [ ] #5 tierFor/assessTier still return the same six tier ids in the same order -- only the requirements behind each tier change, never the tier vocabulary
- [ ] #6 Existing coverage (caps.test.ts, ladder.test.ts, tiers.test.ts, generate.test.ts, matrix.demo.test.ts, matrix.generated.test.ts) is updated for the new size-banded numbers; new tests cover that a small-grid puzzle must clear a relatively stricter bar than a large-grid puzzle to land on the same tier, for both ladder and advanced tiers
- [ ] #7 docs/solvability/README.md's tier table is updated to show both size bands' numbers for all six tiers
- [ ] #8 bun run test --maxWorkers=1, lint and typecheck stay green
<!-- AC:END -->
