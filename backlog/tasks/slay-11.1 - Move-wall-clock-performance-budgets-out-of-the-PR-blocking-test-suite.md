---
id: SLAY-11.1
title: Move wall-clock performance budgets out of the PR-blocking test suite
status: To Do
assignee: []
created_date: '2026-09-29 10:00'
labels:
  - story
dependencies:
  - SLAY-10.2
references:
  - src/engine/solver/perf.test.ts
  - src/engine/solver/advanced/benchmark.test.ts
  - src/engine/generator/generate.test.ts
  - src/engine/generator/scale/generate.test.ts
  - src/engine/generator/tiers/generate.test.ts
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
- [ ] #1 Every toBeLessThan(<ms budget>) assertion against performance.now()/elapsed time in these 5 files is removed from what bun run test (CI's blocking suite) runs
- [ ] #2 Each file's non-timing correctness assertions (unique solution, technique-level caps, timedOut reporting on an intentionally-tiny budget) remain in the blocking suite, unchanged
- [ ] #3 The moved timing checks still run somewhere (test:slow, or a new informational CI job) so an actual solver/generator slowdown is still caught, just not by failing a correct PR
- [ ] #4 bun run test --maxWorkers=1 run 3 times locally back-to-back shows no flake from these files (a cheap local proxy for CI variance)
- [ ] #5 CLAUDE.md's 'Known load flakes: solver perf 16x16 and sweep wall-clock tests: rerun alone first' line is removed or updated since the note itself should no longer apply
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
For each flagged file, split the it(...) blocks so the ms-budget expectation lives in a separately-tagged test (extend vitest.config.ts's SLOW glob, or a CI-only skip) while the correctness-only assertions stay put; wire vitest.config.ts's SLOW pattern or a new CI job accordingly.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dependency on SLAY-10.2 is sequencing only (both touch CLAUDE.md, different lines) — no functional relationship.
<!-- SECTION:NOTES:END -->
