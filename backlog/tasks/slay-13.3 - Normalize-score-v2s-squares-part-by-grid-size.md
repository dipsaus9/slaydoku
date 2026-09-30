---
id: SLAY-13.3
title: Normalize score v2's 'squares' part by grid size
status: Done
assignee: []
created_date: '2026-09-30 11:36'
updated_date: '2026-09-30 12:48'
labels:
  - story
dependencies:
  - SLAY-13.1
references:
  - src/engine/difficulty/score.ts
  - src/engine/difficulty/types.ts
  - src/engine/difficulty/calibrate.ts
  - docs/difficulty/README.md
  - src/engine/difficulty/exceptions.ts
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
- [x] #1 scoreParts/PART_RANGES in src/engine/difficulty/score.ts no longer treat 'squares' as a raw, un-normalized count; it scales with grid size (cells) using SLAY-13.1's proposal
- [x] #2 DEFAULT_WEIGHTS/calibration in src/engine/difficulty/calibrate.ts are re-checked against the changed part (re-fit if the calibration shifts materially; document if not)
- [x] #3 Existing score v2 tests are updated for the new 'squares' scaling; a new test confirms a small and a large grid puzzle with equivalent relative 'openness' now score similarly on this part
- [x] #4 docs/difficulty/README.md's part table reflects the normalized 'squares' metric
- [x] #5 bun run test --maxWorkers=1, lint and typecheck stay green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Normalize scoreParts' squares by dividing metrics.squaresFromCards by people (matching steps/chain), per SLAY-13.1's proposal. Measure the real committed schedule (120 days) and re-fit PART_RANGES.squares plus DEFAULT_WEIGHTS.squares/cards to minimize regressions against the frozen SOLVABLE_TIERS score bands (out of scope to edit, owned by SLAY-13.2), since SLAY-13.1's starting-point range {0.12,0.30} saturated small-grid puzzles and pushed several committed 6x6 puzzles out of band. Add the one remaining unavoidable borderline puzzle to BAND_EXCEPTIONS. Update tests and docs.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation: scoreParts() now scales metrics.squaresFromCards / people (was the raw count), matching how steps/chain normalize. types.ts unchanged (squaresFromCards itself stays the raw per-placement metric; only the score-v2 part normalizes it).

AC#2 (re-check calibration): calibrate.ts itself needed no code change -- it operates purely on already-0..1 parts and is agnostic to how a part's raw metric is scaled, so it is formula-agnostic by design. But SLAY-13.1's proposed starting-point PART_RANGES.squares={0.12,0.30} turned out materially wrong once checked against real data, not just a "starting point to maybe nudge":
- The real committed schedule (src/content/schedule, 120 committed days -- production data) surfaced this: re-verifying every committed day's score v2 against SLAY-13.1's proposed range put 19 of 120 real puzzles (mostly 6x6) outside their tier's SOLVABLE_TIERS.scoreBand, because raw squaresFromCards barely grows with grid size (~1.4 at 6x6 to ~2.0 at 12x12) while people grows 2x (6->12), so dividing by people compresses small-grid puzzles' shares toward the range's ceiling and saturates them to 1.
- I could not re-fit SOLVABLE_TIERS.scoreBand itself (src/engine/solvable/tiers.ts is SLAY-13.2's live scope this session, explicitly out of my References and flagged read-only), so I instead re-fit what score.ts DOES own: PART_RANGES.squares and DEFAULT_WEIGHTS. I grid-searched {from,to} plus the squares/cards weight split against all 120 committed days' actual computeMetrics()+scoreV2() output (a real, not synthetic, calibration substrate) to minimize out-of-band regressions.
- Landed on PART_RANGES.squares={from:0.15,to:0.9} (vs SLAY-13.1's {0.12,0.30} proposal -- the range needed to be much WIDER, not tighter, to stop saturating small grids) and DEFAULT_WEIGHTS moved 1 unit from squares (5->4) to cards (22->23), which reduces regressions further without materially changing what the score measures (cards was already the largest ladder-part weight at 22).
- Net result: 119/120 committed days re-verify with zero score-band problems (bun run test confirms: dayProblems()/entryProblems() are clean). The one irreducible case (6-easy-school-1038600, 2026-11-05... -- 2026-11-15 6x6 easy, scores 16 vs band max 15) is a genuine one-point-over edge case -- exactly what BAND_EXCEPTIONS (src/engine/difficulty/exceptions.ts) exists for ("a puzzle that just fails a tier on one such rule scores close to the tier below it"); added it there with a SLAY-13.3-referenced reason. No amount of range/weight tuning eliminated it without SOLVABLE_TIERS.scoreBand also moving, which is out of this story's scope.
- DEFAULT_WEIGHTS beyond the cards/squares 1-point shift were not re-run through calibrate.ts's search(): there is no committed CalibrationRow dataset to run it against (the CLI and dataset were dropped before this repo's first commit, per docs/difficulty/README.md's own note) -- this re-fit used the committed schedule directly as the calibration substrate instead, which is the best real data available.

Verification: bun run test --maxWorkers=1 (3086/3086 pass, including the 120-day schedule re-verification, the generation sweep, and build.test.ts's byte-for-byte rebuild check), bun run lint, bun run typecheck all green.

Correction: the one irreducible band exception is 6-easy-school-1038600, dated 2026-11-15 (6x6 easy, scores 16 vs band max 15) -- the '2026-11-05...' text in the note above was a leftover draft artifact, ignore it.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Normalized score v2's 'squares' part (src/engine/difficulty/score.ts) by dividing metrics.squaresFromCards by people, matching how steps/chain already scale by grid size, per SLAY-13.1's proposal. Re-fit PART_RANGES.squares (0.15-0.9, widened from SLAY-13.1's 0.12-0.30 starting point) and shifted 1 weight unit from squares to cards (4/23) after measuring the real 120-day committed schedule directly with the new formula: the narrower starting-point range saturated small-grid puzzles' score, pushing 19/120 real committed days out of their SOLVABLE_TIERS band. The re-fit range/weights bring that to 1 unmovable case (6-easy-school-1038600, one point over its band), added to BAND_EXCEPTIONS with a documented reason, since moving SOLVABLE_TIERS.scoreBand itself is SLAY-13.2's scope, not this story's. Added a test proving equal relative openness now scores the same across grid sizes, and updated score.test.ts's fixture/assertions and docs/difficulty/README.md's part table for the new per-person 'squares' metric. bun run test --maxWorkers=1 (3086/3086), lint and typecheck all green.
<!-- SECTION:FINAL_SUMMARY:END -->
