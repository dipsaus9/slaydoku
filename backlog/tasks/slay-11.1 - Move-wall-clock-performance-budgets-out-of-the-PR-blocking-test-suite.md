---
id: SLAY-11.1
title: Move wall-clock performance budgets out of the PR-blocking test suite
status: Done
assignee: []
created_date: '2026-09-29 10:00'
updated_date: '2026-09-29 14:16'
labels:
  - story
dependencies:
  - SLAY-10.2
references:
  - src/engine/solver/perf.test.ts
  - src/engine/solver/perf.fixture.ts
  - src/engine/solver/perf.slow.test.ts
  - src/engine/solver/advanced/benchmark.test.ts
  - src/engine/solver/advanced/benchmark.fixture.ts
  - src/engine/solver/advanced/benchmark.slow.test.ts
  - src/engine/generator/generate.test.ts
  - src/engine/generator/generate.fixture.ts
  - src/engine/generator/generate.slow.test.ts
  - src/engine/generator/scale/generate.test.ts
  - src/engine/generator/scale/generate.slow.test.ts
  - src/engine/generator/tiers/generate.test.ts
  - src/engine/generator/tiers/generate.fixture.ts
  - src/engine/generator/tiers/generate.slow.test.ts
  - vitest.config.ts
  - .github/workflows/ci.yml
  - CLAUDE.md
parent_task_id: SLAY-11
type: chore
ordinal: 60000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: 5 test files in today's default (bun run test) suite assert a hard-coded ms budget via performance.now() — CLAUDE.md already documents these as 'Known load flakes... rerun alone first'. Split each file's correctness assertions (does it solve uniquely, is technique-level within tier caps, does an intentionally-tiny budget correctly report timedOut) — which stay in the blocking suite — from its wall-clock/ms assertions, which move to a non-blocking path (vitest's existing SLOW glob, or a new informational CI job).
Type: deliverable
Branch: SLAY-11.1/move-perf-budgets-out-of-ci

Files with a hard toBeLessThan(<ms>) against performance.now()/elapsed time, all currently included in CI's blocking bun run test: src/engine/solver/perf.test.ts (9x9/16x16 solve budgets), src/engine/solver/advanced/benchmark.test.ts, src/engine/generator/generate.test.ts, src/engine/generator/scale/generate.test.ts, src/engine/generator/tiers/generate.test.ts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every toBeLessThan(<ms budget>) assertion against performance.now()/elapsed time in these 5 files is removed from what bun run test (CI's blocking suite) runs
- [x] #2 Each file's non-timing correctness assertions (unique solution, technique-level caps, timedOut reporting on an intentionally-tiny budget) remain in the blocking suite, unchanged
- [x] #3 The moved timing checks still run somewhere (test:slow, or a new informational CI job) so an actual solver/generator slowdown is still caught, just not by failing a correct PR
- [x] #4 bun run test --maxWorkers=1 run 3 times locally back-to-back shows no flake from these files (a cheap local proxy for CI variance)
- [x] #5 CLAUDE.md's 'Known load flakes: solver perf 16x16 and sweep wall-clock tests: rerun alone first' line is removed or updated since the note itself should no longer apply
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
For each flagged file, split the it(...) blocks so the ms-budget expectation lives in a separately-tagged test (extend vitest.config.ts's SLOW glob, or a CI-only skip) while the correctness-only assertions stay put; wire vitest.config.ts's SLOW pattern or a new CI job accordingly.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dependency on SLAY-10.2 is sequencing only (both touch CLAUDE.md, different lines) — no functional relationship.

Implemented: split each of the 5 files' toBeLessThan(<ms>)/performance.now() assertions into a sibling *.slow.test.ts (already excluded from bun run test by vitest.config.ts's SLOW glob, runs via bun run test:slow). Correctness-only assertions stay unchanged in the blocking file. Shared fixtures moved to new *.fixture.ts modules per the existing testing.fixture.ts/sweep.fixture.ts convention. Verified: bun run lint, bun run typecheck, and bun run test --maxWorkers=1 all green, run 3x back-to-back (140/140 files, 3011/3011 tests each run) with no flake. The 5 new *.slow.test.ts files verified separately via vitest --mode slow (13/13 tests green). CLAUDE.md's stale 'Known load flakes' line replaced with the new split's actual behavior.

Review round 1 verdict: block, only on scopeViolations (all 5 ACs met). Reviewer flagged the new *.fixture.ts/*.slow.test.ts sibling files as out of declared scope since References listed exact leaf paths only. Widened References (re-passing all existing refs) to include the 9 new sibling files these correctness/timing splits required, per CLAUDE.md's 'widen References with backlog task edit --ref, re-review' rule. Re-review requested.

Review round 2 verdict: pass. All 5 acceptance criteria met, no scope violations, no findings. Proceeding to close-out.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Split the 5 wall-clock-budget test files (perf.test.ts, benchmark.test.ts, and the 3 generator generate.test.ts files) so every toBeLessThan(<ms>)/performance.now() assertion moved into a new sibling *.slow.test.ts file (run via bun run test:slow, already excluded from bun run test by vitest.config.ts's SLOW glob), while every non-timing correctness assertion (unique solution, technique-level caps, timedOut reporting) stayed in the blocking file unchanged. Shared fixtures/helpers used by both the fast and slow file moved into new *.fixture.ts modules, following the repo's existing testing.fixture.ts/sweep.fixture.ts convention. Verified bun run lint, bun run typecheck and bun run test --maxWorkers=1 green 3x back-to-back (140/140 files, 3011/3011 tests, no flake), and the 5 new slow files green under vitest --mode slow (13/13 tests). CLAUDE.md's stale 'Known load flakes' line replaced. Independent review passed on round 2 (round 1 blocked only on a scope gap, fixed by widening References to the new sibling files).
<!-- SECTION:FINAL_SUMMARY:END -->
