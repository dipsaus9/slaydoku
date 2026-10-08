---
id: SLAY-17.9
title: 'Fix CI: move the slow expert-walk test out of bun run test'
status: Done
assignee: []
created_date: '2026-10-08 11:11'
updated_date: '2026-10-08 11:17'
labels:
  - story
dependencies: []
references:
  - src/game/hints.test.ts
  - src/game/hints.slow.test.ts
  - src/game/hints.fixture.ts
  - vitest.config.ts
parent_task_id: SLAY-17
type: chore
ordinal: 137000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: CI job verify no longer fails with 'Timeout calling onTaskUpdate' since PR #144; the 9x9 expert hint walk (fixture build ~22s locally, far more on CI, blocking the vitest worker) runs in bun run test:slow, while a fast hard-6x6 walk of the same check stays in the normal suite.

Type: deliverable
Branch: SLAY-17.9/ci-test-timeout
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The suite in CI (bun run test --maxWorkers=1) no longer hits the onTaskUpdate timeout
- [x] #2 The expert-walk test lives in a *.slow.test.ts file and passes under bun run test:slow; a fast hard-puzzle walk of the same check stays in src/game/hints.test.ts
- [x] #3 bun run test --maxWorkers=1 total duration is back under ~8 minutes
- [x] #4 lint and typecheck pass
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review: pass (story-reviewer), no blocking findings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Moved the 9x9 expert hint walk (22s local fixture build) to src/game/hints.slow.test.ts; shared walk helpers in hints.fixture.ts; kept a hard-6x6 walk in the normal suite. Local bun run test: 209s.
<!-- SECTION:FINAL_SUMMARY:END -->
