---
id: SLAY-13
title: 'Epic: fold board size into the ladder difficulty tiers'
status: To Do
assignee: []
created_date: '2026-09-30 11:35'
updated_date: '2026-09-30 16:35'
labels:
  - epic
dependencies: []
ordinal: 82000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a puzzle's tier (very-easy through expert) reflects size-relative solving effort, not just absolute technique sophistication -- so a 6x6 'medium' has to earn that label relative to its own size, and a 12x12 gets a genuine, fair shot at landing on 'easy'/'very-easy' too, instead of both being judged against one flat, size-blind set of numbers.

Owner's report: a 6x6 grid labelled 'medium' currently feels more like 'easy-medium', because small boards are inherently easier (fewer suspects/variables to track) regardless of the reasoning technique required. The owner explicitly does not want a hard categorical block (a 6x6 CAN legitimately be very hard, a 12x12 CAN legitimately be easy -- that stays possible); the ask is a general, relative correction across the whole difficulty range, hard/expert included, not just the four ladder tiers.

Alternatives considered and rejected (required justification):
- Bias which sizes each tier draws in src/schedule/pick.ts (SIZE_WEIGHTS/sizesFor): cheaper, no engine change -- rejected because it only changes how OFTEN a small 'medium' puzzle occurs, not how the puzzle itself feels when it does. The label would still be dishonest on the sizes it still allows.
- Adjust the legacy difficultyScore/LEVEL_SPANS in src/engine/generator/tiers.ts: rejected after tracing the live generation call graph (src/content/packs/build.ts) -- very-easy through medium are built by generateLadder, which reads SOLVABLE_TIERS (src/engine/solvable/tiers.ts), not this legacy scorer. A change there would have no visible effect on what actually gets generated.

Chosen: make SOLVABLE_TIERS' per-tier requirements size-banded across two bands ({6,7} and {9,12}, matching the existing SIZE_WEIGHTS/ADVANCED_SIZES grouping) for ALL SIX tiers -- the ladder tiers (very-easy, easy, easy-medium, medium) via their absolute caps (maxCards, maxChain, maxSquaresFromCards, lastSquaresFromCards, minPlaceableAlone), and hard/expert via an equivalent size-banded threshold (today they have zero size signal at all: every score-v2 part that could carry one is either already per-person normalized or hardcoded to its hardest value once a puzzle falls off the ladder). Both bands get recalibrated relative to each other from measured data -- NOT just tightening {6,7} against an unchanged {9,12} baseline: today's flat caps are themselves proportionally tighter on a big grid (a room/row/column clue naturally leaves more open candidates the bigger the grid is), which is the likely reason very-easy/easy 12x12 puzzles are hard to produce honestly today too.

Schedule impact: src/content/schedule/ is fully pre-generated and committed through 2027-01-24. Every not-yet-played day (2026-10-01 onward) gets regenerated once the new caps land.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SOLVABLE_TIERS (src/engine/solvable/tiers.ts) has distinct, measured (not guessed) requirements for the {6,7} and {9,12} size bands, across all six tiers -- the four ladder tiers via their existing cap fields, hard/expert via a new size-banded threshold mechanism
- [x] #2 Both size bands are recalibrated relative to each other from actual measured puzzle data, not by only tightening the small-board band against an unchanged large-board baseline
- [x] #3 Score v2's one size-unaware metric (the 'squares' part in src/engine/difficulty/score.ts) is normalized by grid size like every other part
- [ ] #4 The schedule from 2026-10-01 through 2027-01-24 is regenerated under the new size-banded tiers and re-passes every existing gate (entryProblems, scheduleProblems, validate:generation)
- [x] #5 docs/solvability/README.md and docs/difficulty/README.md reflect the new size-banded numbers
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SLAY-13.1, SLAY-13.2, SLAY-13.3 and SLAY-13.4 are all Done. ACs 1, 2, 3 and 5 are satisfied (measured, size-banded SOLVABLE_TIERS across all six tiers from SLAY-13.1/13.2; score v2's squares part normalized by SLAY-13.3; docs/solvability/README.md and docs/difficulty/README.md updated by 13.2/13.3) and checked off.

AC4 is left UNCHECKED and this epic is left OPEN rather than closed, deliberately, per "an epic never closes on a technicality": AC4 requires the regenerated schedule to "re-pass every existing gate (entryProblems, scheduleProblems, validate:generation)". entryProblems and scheduleProblems both pass cleanly on the regenerated 2026-10-01..2027-01-24 range (SLAY-13.4). validate:generation's default sweep, however, still exits 1: one cell, 16-very-easy-home, shows a real (if modest, 26%->21% on a 100-seed sample) decline after this epic's changes. It is not a schedule-content problem (the schedule never generates size 16 at all -- CLAUDE.md, "never 16x16" -- and no committed day is affected), and it was already the sweep's documented weakest cell before this epic (docs/authoring/scaling.md), but the literal AC text is not met today. Filed as SLAY-13.5 ("Raise or document the very-easy variety-gate tolerance for 9x9 and 16x16"), a new child of this epic, to close that gap. Once SLAY-13.5 lands, AC4 can be checked and this epic closed.
<!-- SECTION:NOTES:END -->
