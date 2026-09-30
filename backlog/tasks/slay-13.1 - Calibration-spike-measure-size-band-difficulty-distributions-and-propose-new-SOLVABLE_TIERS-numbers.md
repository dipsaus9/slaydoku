---
id: SLAY-13.1
title: >-
  Calibration spike: measure size-band difficulty distributions and propose new
  SOLVABLE_TIERS numbers
status: To Do
assignee: []
created_date: '2026-09-30 11:36'
labels:
  - story
dependencies: []
references:
  - docs/solvability/README.md
  - docs/difficulty/README.md
  - src/engine/difficulty/calibrate.ts
  - src/engine/generator/ladder/measure.ts
  - src/engine/solvable/report.ts
parent_task_id: SLAY-13
type: spike
ordinal: 83000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a written, evidence-based proposal for size-banded SOLVABLE_TIERS requirements (all six tiers, both {6,7} and {9,12} bands, recalibrated relative to each other) and a normalization approach for score v2's 'squares' part -- not yet wired into any live table, that is SLAY-13.2/13.3's job.
Type: spike
Branch: SLAY-13.1/size-band-calibration-spike

Why this needs delivery-time experimentation, not a desk decision: concrete new numbers require generating and measuring a meaningful sample of puzzles per size band per tier (reusing/extending src/engine/difficulty/calibrate.ts, which is a live, working calibration engine whose CLI/dataset was dropped but whose logic is intact -- see docs/difficulty/README.md's 'rebuild it around the puzzles you keep' note -- and src/engine/generator/ladder/measure.ts, a measurement harness for the ladder generator). This mirrors the two prior calibration rounds cited in src/engine/generator/tiers.ts's comments (CAD-4.8 on 9x9, CAD-4.24 across 6x6/7x7/9x9/12x12/16x16), which planning cannot reproduce from the desk.

Scope note on both bands: do not anchor {9,12} at today's flat numbers and only tighten {6,7}. Today's flat absolute caps (e.g. medium's maxSquaresFromCards <=14) are themselves proportionally TIGHTER on a big grid, since a room/row/column clue naturally leaves more open candidates the bigger the grid is -- likely why honest very-easy/easy puzzles are already hard to produce on 12x12 today. Measure both bands against a shared difficulty scale and rebalance in both directions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 For each ladder tier (very-easy, easy, easy-medium, medium) and each size band ({6,7}, {9,12}), measure the actual distribution of cards-per-placement, squaresFromCards, chain and placeableAlone-share across a meaningful generated sample, under TODAY's flat caps
- [ ] #2 For hard and expert, measure the actual score-v2 distribution (and any other distinguishing signal the advanced solver produces, e.g. technique variety or total step count) per size band under today's rules, to establish whether -- and how -- they already differ by size
- [ ] #3 The measurement explicitly checks both directions of the hypothesis: that {6,7} puzzles under-shoot their tier's 'true' relative difficulty, AND that {9,12} puzzles may over-shoot it (struggle to honestly qualify for easier tiers) -- report the actual findings either way, even if they contradict the hypothesis
- [ ] #4 Propose concrete new per-band numeric requirements for every one of the six tiers in SOLVABLE_TIERS (ladder caps for the four ladder tiers, an explicit new threshold mechanism plus concrete numbers for hard/expert), written up in the story's notes/final summary, ready for SLAY-13.2 to wire in directly with no further guessing
- [ ] #5 Propose a concrete grid-size normalization for score v2's 'squares' part (PART_RANGES/scoreParts in src/engine/difficulty/score.ts), ready for SLAY-13.3
- [ ] #6 No production logic under src/engine/solvable or src/engine/difficulty is changed by this story (calibrate.ts/measure.ts may be extended as measurement tooling, not as the live tables) -- this is measurement and a written proposal only
<!-- AC:END -->
