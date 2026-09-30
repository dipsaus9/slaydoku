---
id: SLAY-13.5
title: Raise or document the very-easy variety-gate tolerance for 9x9 and 16x16
status: Done
assignee: []
created_date: '2026-09-30 16:34'
updated_date: '2026-09-30 17:11'
labels: []
dependencies: []
references:
  - src/content/packs/gates.ts
  - src/engine/generator/ladder/
  - docs/authoring/scaling.md
parent_task_id: SLAY-13
type: chore
ordinal: 87000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: bun run validate:generation's default sweep no longer flags very-easy on 9x9/16x16 as under the minimum success rate, OR docs/authoring/scaling.md's documented floor for those cells is updated to match their real, measured rate -- so the sweep's pass/fail line reflects reality again.

Context (found while delivering SLAY-13.4, the schedule regeneration under SLAY-13.2's size-banded SOLVABLE_TIERS and SLAY-13.3's normalized score v2): a wide-sample A/B (200 seeds for 9-very-easy-school, 100 seeds for 16-very-easy-home) comparing the commit immediately before SLAY-13.2 (3f9046e) against after SLAY-13.2+13.3 found:

- 9-very-easy-school: 33% (66/200) before vs 37% (74/200) after -- healthy, not a regression, well clear of the 25% floor at this sample size.
- 16-very-easy-home: 26% (26/100) before vs 21% (21/100) after -- a real, modest decline (not sampling noise at n=100), crossing from just-above to just-below the 25% floor.

This is not a new problem: docs/authoring/scaling.md already named "very-easy at 9 and 16" as the sweep's weak cells before this epic, and 16x16 very-easy specifically as "the weakest cell" (historical ~25%). SLAY-13.2/13.3's size-banded tier requirements + normalized score v2 squares part appear to have nudged 16x16's already-marginal variety gate a few points further down. This does not affect the live schedule: the schedule never generates size 16 at all (src/schedule/pick.ts's SIZE_WEIGHTS only draw 6, 7, 9, 12 -- CLAUDE.md: "never 16x16"), so no player-facing puzzle is affected; this is purely a generator-health/pack-scaling concern for a future 16x16 pack or a future schedule size change.

Not fixed in SLAY-13.4 because the relevant code (the ladder generator's variety gate, src/content/packs/gates.ts / src/engine/generator/ladder/) is outside that story's References (src/content/schedule/ only).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 bun run validate:generation --sizes 16 --tiers very-easy --themes home --seeds 100 clears the 25% minimum, OR docs/authoring/scaling.md's documented floor/expectation for 16x16 very-easy (and 9x9 very-easy if still borderline) is updated to state the real measured rate, with a note on why
- [x] #2 If the variety gate is loosened, existing coverage (gates.test.ts and any generator matrix/sweep tests touching variety) is updated and still meaningfully guards against genuinely too-samey very-easy puzzles
- [x] #3 No committed schedule day or committed pack puzzle is affected (16x16 is not in either today) -- confirm with bun run test --maxWorkers=1 and bun run schedule:check
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Investigate the 16x16 very-easy variety decline empirically before touching code: reproduce the 21% (100 seeds, home) baseline with validate:generation on main, then probe a handful of failing seeds directly via buildEntry to read the exact varietyProblem message. Findings: rejections are dominated by kind-count/kind-share failures (only 2-3 distinct kinds, or one kind e.g. directlyNextToObject used >40% of cards), not by the line-clue share. Test the SLAY-13.2 hypothesis (large-band maxChain 2->3) by reverting just that one number locally and re-running the sweep: success recovers to 28% at 100 seeds, confirming maxChain=3 for the 'large' band (shared by 9, 12 and 16, calibrated from real 9x9/12x12 schedule population) is the direct cause for 16x16, the one size in that band nothing ever schedules or packs. Since the real fix is a 16x16-only size band recalibration of SOLVABLE_TIERS (src/engine/solvable/tiers.ts), which is outside this story's References (gates.ts, generator/ladder/, docs/authoring/scaling.md) and would need a real 16x16 population to calibrate against, choose AC1's documentation route: update docs/authoring/scaling.md with the real measured rate (21%), the root cause, and why it is left as is. No code changed, so AC2 (gate coverage) is vacuously satisfied, and AC3 is a clean confirmation run (no code touched).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decision (AC1's explicit either/or): documented, did not loosen the gate. Root cause confirmed empirically: SOLVABLE_TIERS['very-easy'].bySize.large.maxChain (src/engine/solvable/tiers.ts, SLAY-13.1/13.2) went from 2 to 3 for every size above 7; reverting it to 2 locally restored 16x16-very-easy-home to 28% at 100 seeds (from 21%), so the cause is that calibration -- fitted against the real 9x9/12x12 schedule population -- not the pack's variety gate (varietyProblem in src/content/packs/gates.ts, unchanged) nor a bug in the ladder generator. 16x16 is the one member of the 'large' size band nothing ever schedules or packs (CLAUDE.md: never 16x16), so it had no population in that calibration and is the one cell that got worse (9x9-very-easy-school improved 33%->37% over the same commits). A real fix needs a third, 16x16-only size band in SOLVABLE_TIERS, recalibrated against a 16x16 population that does not exist yet -- out of this story's References (gates.ts / generator/ladder / docs only), and not worth a speculative recalibration for a size that is never live. docs/authoring/scaling.md updated: the measured-rate table (25%->21%, footnoted), the seed-window/weak-cells prose (16 now the sole weak very-easy cell; 9 dropped off it, now 37%), and a new 'Known findings' entry with the full root-cause writeup and file/field pointers for whoever revisits this. AC2 is vacuously satisfied: no gate or generator code changed, gates.test.ts and the ladder matrix/sweep tests are untouched and still guard variety exactly as before. AC3 confirmed green with no code changes: bun run lint, bun run typecheck, bun run test --maxWorkers=1 (144 files, 3097 tests) and bun run schedule:check all pass; there is no committed pack file at all today (src/content/packs holds only source, no *.json), and the committed schedule (src/content/schedule) never draws size 16 (src/schedule/pick.ts SIZE_WEIGHTS), so neither was ever at risk.

Review gate: dipsaus-ai:story-reviewer verdict=pass, all 3 acceptance criteria met, no scope violations. One advisory finding addressed: clarified in docs/authoring/scaling.md that the 9x9-very-easy 37% figure is a newer, wider, single-theme (school, 200-seed) sample distinct from the table's older mixed-theme 44% figure, to avoid the two numbers reading as a contradiction.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Documented (did not code-fix) the real 16x16-very-easy variety success rate in docs/authoring/scaling.md: updated the measured-rate table (25%->21%, footnoted with the exact repro command and before/after A/B), the seed-window and weak-cells prose, and added a 'Known findings' entry with the root cause, confirmed empirically (SOLVABLE_TIERS['very-easy'].bySize.large.maxChain raised 2->3 in SLAY-13.2, calibrated against a 9x9/12x12 population 16x16 has no real analog of; reverting it locally restored 16x16 to 28%). Chose AC1's documentation path over a code fix because the real fix needs a 16x16-only size band in src/engine/solvable/tiers.ts, outside this story's References and with no real 16x16 population to calibrate against for a size the live schedule/pack never generates. No source code was touched, so gates.ts's variety gate, the ladder generator and all existing coverage (gates.test.ts, generator matrix/sweep tests) are unchanged and untested-by-necessity here (AC2 vacuous). AC3 confirmed: bun run lint, typecheck, test --maxWorkers=1 (144 files/3097 tests) and schedule:check all pass; there is no committed pack file today and the committed schedule never draws size 16, so neither was ever at risk. Reviewed by dipsaus-ai:story-reviewer: pass, no scope violations.
<!-- SECTION:FINAL_SUMMARY:END -->
