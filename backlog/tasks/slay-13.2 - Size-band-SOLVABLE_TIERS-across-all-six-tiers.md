---
id: SLAY-13.2
title: Size-band SOLVABLE_TIERS across all six tiers
status: Done
assignee: []
created_date: '2026-09-30 11:36'
updated_date: '2026-09-30 12:57'
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
  - src/engine/solvable/report.ts
  - src/content/packs/gates.ts
  - src/content/demo/puzzle.test.ts
  - tools/schedule.test.ts
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
- [x] #1 SOLVABLE_TIERS (or a size-aware wrapper around it) exposes distinct requirements for {6,7} and {9,12} per tier, using SLAY-13.1's proposed numbers exactly, or states why a number was adjusted
- [x] #2 ladderCheck/ladderMeetsTier/ladderOptions (src/engine/solvable/ladder.ts) take the puzzle's actual grid size into account when picking which caps to enforce for the four ladder tiers -- no more one-size-fits-all constants
- [x] #3 assessTier's advanced-solver branch (hard/expert) applies the new size-banded threshold from SLAY-13.1, not just the existing flat technique-level cutoff
- [x] #4 generateLadder (src/engine/generator/ladder/generate.ts) and any other call site reading the old flat caps are updated to resolve size correctly
- [x] #5 tierFor/assessTier still return the same six tier ids in the same order -- only the requirements behind each tier change, never the tier vocabulary
- [x] #6 Existing coverage (caps.test.ts, ladder.test.ts, tiers.test.ts, generate.test.ts, matrix.demo.test.ts, matrix.generated.test.ts) is updated for the new size-banded numbers; new tests cover that a small-grid puzzle must clear a relatively stricter bar than a large-grid puzzle to land on the same tier, for both ladder and advanced tiers
- [x] #7 docs/solvability/README.md's tier table is updated to show both size bands' numbers for all six tiers
- [x] #8 bun run test --maxWorkers=1, lint and typecheck stay green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. tiers.ts: add SizeBandId ('small'={6,7}, 'large'={9,12}) + sizeBandOf(size); replace SolvableTier's flat maxSquaresFromCards/lastSquaresFromCards/maxChain with bySize: Record<SizeBandId, LadderCaps> (SLAY-13.1's numbers); add scoreBandBySize: Record<SizeBandId,{min,max}> per tier (identical both bands per SLAY-13.1: unbanded for ladder tiers, {9,12} measured / {6,7} placeholder mirror for hard/expert); keep flat scoreBand unchanged (used unmodified by out-of-scope difficulty/puzzle.ts). ladderOptions(tier, size) resolves bySize via sizeBandOf. assessTier(puzzle, scoreV2?) computes size from puzzle.scene, threads it into ladderOptions, and for the advanced branch keeps level<5 as the coarse guard with an optional scoreV2 (threaded in, never computed internally -- computeMetrics/ladderMetrics call assessTier, so calling scoreV2 from inside assessTier would recurse) refining hard/expert via scoreBandBySize[sizeBandOf(size)]. tierFor threads scoreV2 through.
2. generate.ts: resolve maxSquares/lastSquares/maxChain via the tier's bySize at scene.width for guidedSolution options and PlanRules, and pass scene.width into every ladderOptions() call.
3. report.ts + packs/gates.ts: mechanical fix for the two out-of-References-originally call sites that read the removed flat fields directly (report.ts's SolvabilityReport.tiers shape, gates.ts's ladder-cap error message) -- resolve via the entry/puzzle's own size, widened into References since AC4 covers "any other call site reading the old flat caps".
4. Tests: update caps.test.ts/tiers.test.ts/ladder.test.ts's few call sites to the new ladderOptions(tier,size) signature and bySize numbers; add tests proving small < large caps per ladder tier and that ladderOptions resolves per size; add an assessTier-level test for the size-banded advanced mechanism (documented as equal-valued placeholder bands per SLAY-13.1, since no real {6,7} hard/expert population exists). Run the generator matrix/sweep tests to confirm the tightened {6,7} caps do not starve generation; nudge numbers only if evidence demands it, documented as a deviation.
5. docs/solvability/README.md: two-column (small/large) tier table.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Wired SLAY-13.1's proposed numbers into SOLVABLE_TIERS exactly (bySize per ladder tier, scoreBandBySize for hard/expert), with three implementation decisions/deviations, documented here as the story invites:

1. Structure: SolvableTier's flat maxSquaresFromCards/lastSquaresFromCards/maxChain fields were REPLACED (not kept as a stale duplicate) by bySize: Record<'small'|'large', LadderCaps>, resolved via the new sizeBandOf(size) ({6,7}='small', {9,12}='large'). The flat scoreBand field was KEPT unchanged (equal to scoreBandBySize.large for every tier, since bands agree today) because it is still read by src/engine/difficulty/puzzle.ts and generator/tiers/tiers.ts's comments, which are outside this story's References and whose behaviour does not need to change (no tier's score band differs by size today).

2. hard/expert mechanism: assessTier(puzzle, scoreV2?) takes an OPTIONAL, threaded-in score v2 rather than computing it internally. computeMetrics/ladderMetrics (src/engine/difficulty/metrics.ts) already call assessTier to get ladderSolved/ladder steps, so calling scoreV2 (which needs computeMetrics) from inside assessTier would recurse without end. When no score is given, assessTier's hard/expert split is byte-for-byte the old level<5 rule (fully backward compatible); when a caller supplies scoreV2, it's checked against the size-banded scoreBandBySize with level<5 kept as a coarse guard/fallback -- matching SLAY-13.1's own suggested trade-off ("keep level as pre-filter, scoreV2 as tie-breaker"). No existing call site was changed to pass a score (all stayed out of References: packs/gates.ts's entryProblems, difficulty/puzzle.ts), so production classification behaviour for hard/expert is UNCHANGED by this story; the mechanism is wired, tested (tiers.test.ts) and documented (docs/solvability/README.md), ready for a follow-up story to thread a real score in at those call sites.

3. Widened References (via backlog task edit --ref, all mechanical, all needed to keep the build green per AC4's "any other call site reading the old flat caps"): src/engine/solvable/report.ts and src/content/packs/gates.ts (both destructured/read the removed flat cap fields directly), src/content/demo/puzzle.test.ts (same), and tools/schedule.test.ts (see below).

Schedule fallout (found by re-running the full committed schedule, 120 days, through dayProblems/entryProblems after the change -- not just the 10-day sample bun run test already covers):
- 2026-09-29 (n=3, 9x9 easy, ALREADY PLAYED: today is 2026-09-30): same seed/attempts/solution, but the loosened {9,12} easy cap (6->8 squares, 3->4 last, 2->3 chain) lets planLadder's greedy search accept a different, still-valid 11-clue set instead of the committed 12-clue one. Added to tools/schedule.test.ts's existing KNOWN_DIVERGED_DAYS (same established pattern as the two prior SLAY-8.1/SLAY-10.1 exclusions there), since regenerating/overwriting already-played committed content is a product decision, not something to do unilaterally in this story.
- 2026-10-22 (n=26, 12x12 easy-medium, NOT yet played): tierFor now gives 'easy' instead of the committed 'easy-medium', because loosening the {9,12} caps for BOTH tiers moved easy's ceiling close enough to swallow this specific puzzle (score v2 15, just under easy-medium's band floor of 16). Not in the 10-day sample src/schedule/schedule.test.ts's fast suite checks (so bun run test / CI's required 'verify' check stay green), but bun run test:slow's full re-verification would flag it. Not patched here (would mean regenerating/overwriting live schedule content, an out-of-band product decision) -- flagging for the owner to decide: leave as a known one-off drift (same pattern as the tools/schedule.test.ts exclusions), or regenerate that single day now while it is still unplayed.

All ACs verified: bun run test --maxWorkers=1 (144 files / 3091 tests), lint and typecheck all green on the final tree.

Review round 1 (dipsaus-ai:story-reviewer): verdict block on AC3 -- entryProblems (src/content/packs/gates.ts), the one production call site to assessTier, never supplied a score v2, so the new size-banded hard/expert threshold was reachable but never actually exercised in a live code path. Fixed: gates.ts now computes puzzleScoreV2(puzzle) once and threads it into assessTier(puzzle, score), right next to the existing scoreBandProblem check that already needed the same score -- so the pack gate's tier classification and its score-band check agree on one number. Re-verified the full 120-day committed schedule against the gates after the fix: no new divergence (the one known 2026-10-22 ladder-tier drift, already flagged above, is unrelated and unaffected). bun run test --maxWorkers=1 (144/144 files, 3091/3091 tests), lint and typecheck all green on the updated tree. Two advisory findings from the same review (AC6's advanced-tier wording assumed a numeric small/large distinction SLAY-13.1 didn't find; the 2026-10-22 schedule drift needs an owner decision) were left as-is per the reviewer's own advisory (non-blocking) classification -- both already covered in this story's earlier notes.

Review round 2 (dipsaus-ai:story-reviewer): verdict pass. Confirmed the AC3 fix is exercised in production (entryProblems is called from src/content/packs/build.ts, src/schedule/gates.ts, tools/pack.ts, src/ui/lab/generate.ts) and that no committed hard/expert puzzle can be reclassified (scoreBandBySize.small === scoreBandBySize.large for every tier today, and scoreBandProblem already validated every entry's score against the same numbers at generation time). Re-confirmed typecheck/lint/full test suite green (144/144, 3091/3091) independently. Two advisory (non-blocking) findings remain, both already flagged in this story's notes and left for the owner/a follow-up: AC6's advanced-tier wording assumes a numeric small/large split hard/expert doesn't have today (by design, per SLAY-13.1), and the unplayed 2026-10-22 schedule day drifts to 'easy' under the new ladder caps. Proceeding to close-out.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
SOLVABLE_TIERS (src/engine/solvable/tiers.ts) now gives the four ladder tiers distinct CAD-8.7 caps (maxSquaresFromCards/lastSquaresFromCards/maxChain) per size band -- {6,7} tighter, {9,12} looser -- using SLAY-13.1's measured numbers exactly, via a new bySize table resolved by sizeBandOf(size); maxCards/references/maxTopShare/minPlaceableAlone stay flat per SLAY-13.1's own findings. ladderOptions/ladderCapsFor resolve a tier's caps from a grid's own size, and every call site (assessTier, generateLadder, the pack gate, the solvability report, the demo puzzle test) now threads the puzzle/scene size through instead of reading one flat number.

Hard and expert gained a new scoreV2-based size-banded threshold: assessTier(puzzle, scoreV2?) keeps the hint solver's technique level as a coarse guard and, when a caller supplies the puzzle's score v2, refines hard vs. expert via SOLVABLE_TIERS[].scoreBandBySize -- threaded in rather than computed internally, since computeMetrics/ladderMetrics already call assessTier (calling scoreV2 from inside it would recurse). The pack gate (src/content/packs/gates.ts's entryProblems, the one production caller) now supplies that score, so the mechanism is genuinely live, not just reachable. Today both size bands carry identical hard/expert numbers (51-87/88-100), documented as an unvalidated placeholder per SLAY-13.1 (no {6,7} hard/expert puzzle is ever generated today).

Re-verified the full 120-day committed schedule against the new gates twice (before and after the review fix): one already-played day (2026-09-29) and one not-yet-played day (2026-10-22, 12x12 easy-medium reclassifying to easy) diverge under the new caps -- the former documented in tools/schedule.test.ts's existing KNOWN_DIVERGED_DAYS pattern, the latter flagged for the owner (SLAY-13.4, the epic's schedule-regeneration story, is the natural place to resolve it).

docs/solvability/README.md's tier table now shows both bands for all six tiers plus a new section on the hard/expert mechanism. bun run test --maxWorkers=1 (144 files, 3091 tests), lint and typecheck all green. Independently reviewed twice (dipsaus-ai:story-reviewer): round 1 blocked on AC3 not being exercised by any production call site, fixed by wiring the score into gates.ts; round 2 passed clean, with two advisory (non-blocking) findings already documented above.

Epic SLAY-13 stays open: SLAY-13.3 (score v2 squares normalization) is in flight in parallel and SLAY-13.4 (schedule regeneration) is still To Do.
<!-- SECTION:FINAL_SUMMARY:END -->
