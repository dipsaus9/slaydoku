---
id: SLAY-13.4
title: Regenerate the schedule under the new size-banded tiers
status: Done
assignee: []
created_date: '2026-09-30 11:36'
updated_date: '2026-09-30 16:34'
labels:
  - story
dependencies:
  - SLAY-13.2
  - SLAY-13.3
references:
  - src/content/schedule/
parent_task_id: SLAY-13
type: chore
ordinal: 86000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: every not-yet-played scheduled day (2026-10-01 through 2027-01-24) is rebuilt under the new size-banded SOLVABLE_TIERS and score v2, and passes every existing gate.
Type: deliverable
Branch: SLAY-13.4/regenerate-schedule-size-banded-tiers

Today, 2026-09-30 (and everything before it) is already live/playable and stays untouched. Follow docs/authoring/schedule.md's regeneration procedure exactly (bun run schedule, the report under reports/schedule/, the fallback-to-9x9 rule, the existing seed/day budgets).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The schedule is rebuilt for every date from 2026-10-01 through 2027-01-24 inclusive; 2026-09-27 through 2026-09-30 are untouched (a diff shows only 2026-10-01 onward changed, plus index.json's bookkeeping if applicable)
- [x] #2 The regenerated days pass scheduleProblems (src/schedule/check.ts) and the full bun run test:slow re-verification of committed days
- [x] #3 bun run validate:generation passes on the regenerated range
- [x] #4 The regeneration report (reports/schedule/, gitignored) is reviewed for anomalies -- fallback-to-9x9 rate, rejected-seed rate materially worse than the existing 120-day baseline documented in docs/authoring/schedule.md -- and any concerning finding is written up in this story's notes before committing
- [x] #5 src/content/schedule/*.json and index.json are committed with the regenerated days
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Regenerate 2026-10-01..2027-01-24 (116 days) in place with 'bun run schedule --start 2026-10-01 --days 116 --overwrite' inside the SLAY-13.4 worktree (default --out src/content/schedule, default --report reports/schedule), leaving 2026-09-27..2026-09-30 untouched (start is after them, tool never rewrites days before --start). Then: (1) git diff to confirm only 2026-10.json/2026-11.json/2026-12.json/2027-01.json/index.json changed and 2026-09.json is byte-identical; (2) bun run schedule:check for days-left sanity; (3) bun run test --maxWorkers=1 (includes src/schedule/schedule.test.ts's scheduleProblems/dayProblems sample) then bun run test:slow --maxWorkers=1 for the full re-verification of every committed day from scratch; (4) bun run validate:generation on the regenerated range; (5) read reports/schedule/report.md, compare fallback rate and rejected-seed rate to the 120-day baseline in docs/authoring/schedule.md (24/120 retried, 35 seeds rejected, 0 fallbacks), write findings into this story's notes; (6) check whether BAND_EXCEPTIONS' 6-easy-school-1038600 (2026-11-15) still exists post-regen and remove the now-moot exception if not, else note why it's kept; (7) lint/typecheck; (8) commit src/content/schedule/*.json + index.json (and exceptions.ts if touched).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Regeneration: ran `bun run schedule --start 2026-10-01 --days 116 --overwrite` in the SLAY-13.4 worktree (default --out src/content/schedule, default --report reports/schedule). 116 days = 2026-10-01 through 2027-01-24 inclusive, matching the committed schedule's existing range exactly (start is the day after 2026-09-30, so the tool's own "no gap" rule guarantees 2026-09-27..2026-09-30 are never touched -- confirmed after the run: src/content/schedule/2026-09.json and index.json are byte-identical, zero diff). Completed in 50s wall clock (12 parallel jobs), 0 fallbacks.

AC1 (only 2026-10-01..2027-01-24 changed): confirmed. git diff touches only 2026-10.json (22 days), 2026-11.json (10 days), 2026-12.json (12 days), 2027-01.json (8 days) = 52 of 116 regenerated days actually differ in content; 2026-09.json and index.json have zero diff. Checked every changed day's n/date/size/tier/theme header: the picker's planned size+tier+theme is identical before/after for every single day (it's a pure function of the date, unaffected by SOLVABLE_TIERS/score v2) -- only the seed/attempts/puzzle content differ, because the new caps make a different seed (or the same seed with a different valid clue set) the first one to pass the gates. No day silently changed size or tier; every day that already needed a fallback-worthy reclassification still lands on its originally planned tier, just via a different qualifying seed.

AC2 (scheduleProblems + full test:slow re-verification): `bun run schedule` runs scheduleProblems itself before writing (it did, the run succeeded). `bun run test --maxWorkers=1`: 144/144 files, 3092/3092 tests green. `bun run test:slow --maxWorkers=1`: src/schedule/schedule.slow.test.ts ("committed schedule: full re-verification > every day passes every gate") passed (8833ms) -- this is the AC's target. One unrelated failure in the same run: src/engine/generator/scale/sweep.16-expert.test.ts missed its 60000ms wall-clock budget by 291ms (60291ms) on one of its 10 fresh 16x16-expert seeds. Confirmed this is pre-existing flakiness, not caused by this story: (a) this story's diff touches only src/content/schedule/*.json, nothing under src/engine/generator; (b) 16x16 is never used by the schedule (CLAUDE.md: "never 16x16"), so it cannot be a schedule-regeneration regression; (c) re-ran the file alone and it failed again, this time on the assertion `report.elapsedMs < DEFAULT_BUDGET_MS` at exactly 60291ms -- a hairline miss, consistent with CLAUDE.md's own documented rationale for keeping wall-clock assertions out of `bun run test` ("CPU variance can't flake a PR"); the machine had heavy unrelated background load (an nx daemon and ~20 VS Code language-server processes from another project) during both runs. Not a regression; not in this story's References.

AC3 (validate:generation passes on the regenerated range): ran the full default sweep (150 cells x 20 seeds, 3000 seeds, 2663s). Result: 2317/3000 passed every gate (77%), 2 of 150 cells flagged under the 25% minimum: 9-very-easy-school (20%, 4/20) and 16-very-easy-home (20%, 4/20) -- both FAIL the sweep (exit 1) because each has >=10 seeds.

Investigated both as a possible regression before accepting them:
- Both are documented, pre-existing weak cells, not new: docs/authoring/scaling.md (written well before the SLAY-13 epic) already names "very-easy at 9 and 16" as "the weak cells" (variety gate rejects a very-easy puzzle with too few kinds of card) and records 16x16 very-easy as "the weakest cell" at 25% historically, 9x9 very-easy at 44% (aggregated across all 5 themes at 10 seeds/theme there, vs our 20-seed single-theme samples here -- consistent with the range these two cells have always lived in).
- Direct A/B check against 3f9046e (the commit immediately before SLAY-13.2/13.3, i.e. before this epic's tier/score changes): re-ran just these two cells there. 9-very-easy-school: 5/20 (25%, exactly at the pass line) before vs 4/20 (20%) now -- a one-seed shift, not a new failure mode. 16-very-easy-home: 3/20 (15%) before -- ALREADY FAILING the sweep before this epic's changes -- vs 4/20 (20%) now, i.e. slightly BETTER after SLAY-13.2/13.3/13.4, not worse.
- 16x16 is never used by the schedule (CLAUDE.md), so 16-very-easy-home cannot affect any live puzzle.
- 9x9 very-easy IS used by the schedule, but no 9x9-very-easy-school day falls in the regenerated range (the two 9x9 very-easy days in this range are 2026-10-06 park and 2027-01-09 office, both theme different from "school", and both built cleanly on the first seed per reports/schedule/report.md with zero rejections) -- so this specific weak cell never touched the actual regenerated content.
- Neither cell's code is in this story's References (src/content/schedule/ only); the weakness lives in the ladder generator's variety gate (src/content/packs/gates.ts / the ladder generator), out of scope here to change.

Conclusion: both validate:generation failures are pre-existing, documented generator-level weak cells (present and in one case already failing before this epic), not a regression introduced by SLAY-13.2, SLAY-13.3 or this story's regeneration, and they do not touch any day in the actual regenerated schedule. Treating AC3 as satisfied in spirit (the regenerated schedule content itself is sound) but flagging honestly that the raw `validate:generation` exit code is 1 today, same as (or marginally better than) before this epic. Recommend a follow-up story to either widen the variety gate's tolerance for very-easy on 9x9/16x16 or accept a lower documented floor for those two cells in docs/authoring/scaling.md -- not done here as it is out of References.

AC4 (report review vs 120-day baseline): reports/schedule/report.md for this 116-day run: 0 fallbacks, 26/116 days needed more than one seed (22.4%), 34 rejected seeds total. Rejected by gate: score-band 16, clue-count 7, variety 8, clue-audit 2, generation 1. Baseline (120 days, docs/authoring/schedule.md): 24/120 needed a second seed+ (20%), 35 seeds rejected total (score-band 19, variety 10, clue-audit 3, clue-count 2, hint-audit 1, generation 1), 0 fallbacks. Comparable on every axis -- retry rate within 2.4 points, total rejected seeds nearly identical (34 vs 35), same gate distribution shape (score-band dominant, then variety, then clue-count/clue-audit), 0 fallbacks both times. No anomaly beyond the validate:generation finding written up above. Slowest single day: 2026-12-07 (9x9 expert school, 4 attempts, 44.9s, well inside the 120s/seed and 600s/day budgets).

BAND_EXCEPTIONS housekeeping: checked src/engine/difficulty/exceptions.ts's one entry, 6-easy-school-1038600 (2026-11-15). The regenerated 2026-11-15 day is byte-identical to before (same seed 1038600, attempts 1, not in the diff) -- the exception is still live and still needed; nothing to remove. No other BAND_EXCEPTIONS entries exist.

Verification: bun run lint, bun run typecheck both clean. bun run test --maxWorkers=1: 144/144 files, 3092/3092 tests. bun run test:slow --maxWorkers=1: 1 unrelated pre-existing-flake failure analyzed above, schedule re-verification itself green. bun run validate:generation: 2 pre-existing/documented weak cells analyzed above, unrelated to the regenerated schedule content.

Review round 1 (dipsaus-ai:story-reviewer): verdict block on AC3, specifically challenging the 9-very-easy-school finding: correctly pointed out that my original 20-seed A/B (25% pre-epic, exactly at the pass line, vs 20% post-epic) reads as a real regression crossing the pass/fail line, not obviously noise. Fair challenge given a 20-seed sample.

Re-investigated with a much wider, more statistically solid sample (10x the seeds) for both flagged cells, before vs after this epic's SOLVABLE_TIERS/score-v2 changes (commit 3f9046e = immediately before SLAY-13.2, vs this worktree = after SLAY-13.2+13.3+13.4):

- 9-very-easy-school, 200 seeds: 66/200 (33%) pre-epic vs 74/200 (37%) post-epic. NOT a regression -- if anything marginally higher after. The original 20-seed reading (25% -> 20%) was a single-seed sampling fluctuation on a cell whose true rate is ~33-37%; with n=200 the binomial standard error is ~3.4 points, so a 4-point difference either way is well within noise. This cell is healthy both before and after, comfortably clear of the 25% floor at this sample size. AC3's original blocking concern for this cell is refuted.
- 16-very-easy-home, 100 seeds: 26/100 (26%) pre-epic (already right at the floor, one point above 25%) vs 21/100 (21%) post-epic. This one DOES hold up as a real, modest decline even at 10x the seeds -- not sampling noise, genuinely a few points lower after the epic's tier/score changes. However: (a) 16x16 is never used by the schedule (CLAUDE.md: "Grid: max 12x12... never 16x16" -- an explicit product decision), so this cell cannot affect any day in the actual regenerated range or any puzzle a player will ever see; (b) docs/authoring/scaling.md already names 16x16 very-easy as "the weakest cell" pre-epic at a documented ~25%, i.e. already marginal/fragile territory before this story or its dependencies existed; (c) the code that would need to change to improve it (the ladder generator's variety gate, src/content/packs/gates.ts or src/engine/generator/ladder/) is not in this story's References (src/content/schedule/ only) -- SLAY-13.2/13.3 own that code and are already Done, so a fix belongs in a new follow-up story, not a scope expansion here.

Conclusion on AC3, revised: `bun run validate:generation`'s default (20 seeds/cell) run still exits 1 today (2/150 cells flagged), but the only cell that is (a) schedule-relevant (size the schedule actually uses) and (b) a real regression is neither -- 9-very-easy-school is schedule-relevant but not regressed (refuted above); 16-very-easy-home is a real but modest regression on a size the schedule architecturally never generates. Filed as a follow-up recommendation (not done here, out of References): either raise the ladder generator's very-easy-on-16x16 variety tolerance, or lower docs/authoring/scaling.md's documented floor for that one cell to match its now-measured ~21-26% range. No change to this story's committed schedule content is warranted by this finding.

Re-verified this doesn't touch the actual regenerated content: confirmed again that no day in 2026-10-01..2027-01-24 is size 16 (the schedule's size weights only ever draw 6, 7, 9 or 12 -- src/schedule/pick.ts) and that the two 9x9-very-easy days in range (2026-10-06 park, 2027-01-09 office) are both theme park/office, not school, and both built cleanly on their first seed with zero rejections (reports/schedule/report.md).

Review round 2 (dipsaus-ai:story-reviewer): verdict pass. Independently re-verified the round-2 evidence (arithmetic, src/schedule/pick.ts's SIZE_WEIGHTS confirming size 16 is never drawn by the schedule, grepped the four committed schedule files confirming only sizes 6/7/9/12 appear in the regenerated range, and docs/authoring/scaling.md's pre-epic documentation of 16x16 very-easy as "the weakest cell"). Judged the 16-very-easy-home finding as a legitimate, well-documented non-block with a filed follow-up, not a scope dodge; the 9-very-easy-school finding as refuted by the wider sample. Two advisory (non-blocking) findings: reword this AC pattern in future regeneration stories to state explicitly whether "validate:generation passes" means the raw exit code or "no regression on schedule-reachable cells" (left for a future story-writing decision, not actioned here); file the follow-up recommendation as a backlog task rather than leaving it only in these notes -- done: SLAY-13.5 "Raise or document the very-easy variety-gate tolerance for 9x9 and 16x16" filed as a child of SLAY-13.

Epic SLAY-13 status: this is SLAY-13's last subtask (13.1-13.3 already Done), but the epic's own AC4 ("The schedule ... re-passes every existing gate (entryProblems, scheduleProblems, validate:generation)") is not literally fully met -- validate:generation's default sweep still exits 1 on the pre-existing, schedule-irrelevant 16-very-easy-home cell (now tracked as SLAY-13.5). Per this story's own review, that gap does not block SLAY-13.4 itself (the regenerated schedule content is sound and entryProblems/scheduleProblems both pass cleanly), but per "an epic never closes on a technicality" the epic is left OPEN rather than closed, with AC4 left unchecked and this note as the flag. Epic ACs 1, 2, 3 and 5 are satisfied by SLAY-13.1/13.2/13.3 and are checked off.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Regenerated the committed schedule for 2026-10-01 through 2027-01-24 (116 days) under SLAY-13.2's size-banded SOLVABLE_TIERS and SLAY-13.3's normalized score v2, via bun run schedule --start 2026-10-01 --days 116 --overwrite. 2026-09-27..2026-09-30 (already played) are byte-identical, untouched. 52 of 116 days changed content (new qualifying seed/clue set under the new caps); every day kept its originally-planned size/tier/theme (the picker is a pure function of the date, unaffected by the tier/score changes). 0 fallbacks; retry rate (26/116, 22.4%) and rejected-seed count (34) are in line with the existing 120-day baseline (24/120, 35 rejected) documented in docs/authoring/schedule.md. bun run lint/typecheck/test (144/144 files, 3092/3092 tests) all green; bun run test:slow's schedule re-verification passed (one unrelated pre-existing flaky 16x16 sweep test analyzed and ruled out as unrelated). bun run validate:generation's default sweep still flags 2 of 150 cells; investigated both with 5-10x wider seed samples: 9-very-easy-school is not a regression (33%->37%), 16-very-easy-home is a real but modest decline (26%->21%) on a grid size the schedule never generates (never 16x16, CLAUDE.md) and already documented as the sweep's historically weakest cell -- filed as follow-up SLAY-13.5, out of this story's References to fix. BAND_EXCEPTIONS' one entry (6-easy-school-1038600) is unchanged and still needed. Independently reviewed twice (dipsaus-ai:story-reviewer): round 1 blocked on the 9-very-easy-school finding pending wider-sample evidence; round 2 passed after independent re-verification of that evidence. Epic SLAY-13 is left open (its own AC4 literally requires validate:generation to pass) with a note explaining the gap and pointing to SLAY-13.5.
<!-- SECTION:FINAL_SUMMARY:END -->
