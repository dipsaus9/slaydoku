---
id: SLAY-11
title: 'Epic: CI reliability — stop wall-clock budgets from reddening correct PRs'
status: To Do
assignee: []
created_date: '2026-09-29 09:59'
labels:
  - epic
dependencies: []
ordinal: 59000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: bun run test (what .github/workflows/ci.yml gates every PR on) no longer fails intermittently from CPU variance on a shared runner. Every timing/perf assertion either moves out of the PR-blocking suite or is decoupled from a hard wall-clock number, while the actual regression it guards against (solver/generator getting slower) is still caught somewhere.

Alternative considered: just raise all the budget numbers generously. Rejected — a bigger budget only delays the next flake; separating correctness assertions (still blocking) from performance assertions (moved out of the blocking path) is the durable fix.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 bun run test --maxWorkers=1, run repeatedly, no longer fails from a wall-clock budget assertion under normal load variance
- [ ] #2 Every solver/generator correctness assertion (unique solution, technique-level caps, timedOut reporting) stays in the PR-blocking suite, unchanged
- [ ] #3 Every moved timing assertion still runs somewhere (test:slow or an informational job), so an actual perf regression is still caught, just not by failing a correct PR
<!-- AC:END -->
