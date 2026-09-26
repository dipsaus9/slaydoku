---
id: SLAY-1.9
title: Top up the schedule automatically
status: Done
assignee: []
created_date: '2026-09-26 19:32'
updated_date: '2026-09-26 23:22'
labels:
  - story
dependencies:
  - SLAY-1.4
references:
  - .github/workflows/
  - tools/schedule.ts
  - docs/authoring/schedule.md
  - package.json
  - src/schedule/status.ts
  - src/schedule/status.test.ts
  - tools/schedule-next.ts
  - tools/schedule-workflow.test.ts
  - tools/schedule.test.ts
parent_task_id: SLAY-1
type: feature
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the schedule never runs dry. A scheduled GitHub workflow (monthly, plus manual dispatch) runs bun run schedule for the next 90 days from the last scheduled day, opens a PR with the new month files, and fails loudly (issue or red run) when fewer than 30 days are left. A local check bun run schedule:check prints days left.
Type: deliverable
Branch: SLAY-1.9/schedule-top-up
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 .github/workflows/schedule-top-up.yml (cron monthly and workflow_dispatch) generates the next 90 days deterministically and opens a PR via gh; a dry-run mode is documented
- [x] #2 bun run schedule:check exits non-zero when fewer than 30 days remain; a unit test covers the calculation; docs/authoring/schedule.md explains the routine
- [ ] #3 The workflow can be exercised with workflow_dispatch on a branch (the owner runs it once; the token needs the workflow scope) and the result is recorded in the story notes
- [x] #4 bun run lint/typecheck/test (--maxWorkers=1) and audit:personal pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1) topUpPlan (pure, src/schedule/status.ts) + tools/schedule-next.ts (bun run schedule:next, --github for GITHUB_OUTPUT). 2) .github/workflows/schedule-top-up.yml: monthly cron + dispatch (days, dry_run), plan, skip when a top-up PR is open, generate with schedule --jobs 2, PR via gh from schedule/<first-date>, final schedule:check as the loud failure. 3) Docs section. 4) Prove: unit tests, workflow parse + bash -n test, local dry-run simulation on a temp copy, determinism check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Proof (local, nothing generated is committed): 3 days after the last day (2027-02-09..11) generated into a temp copy with --jobs 2 and --jobs 1: byte-identical, existing days unchanged, schedule:check and schedule:next agree afterwards. The workflow's PR step was run against a throwaway clone with a bare origin and a gh stub: branch schedule/2027-02-09 pushed, gh pr create called with base main; the open-PR, stale-branch and stray-file guards were exercised too. YAML parsed with Bun.YAML and every run script passes bash -n (tools/schedule-workflow.test.ts).
OWNER STEPS (AC 3, cannot be done by the worker): (1) Settings > Actions > General > Workflow permissions: enable 'Allow GitHub Actions to create and approve pull requests'. (2) After merge run the workflow once: gh workflow run schedule-top-up.yml --ref main -f dry_run=true (dry run), then, once it is due (fewer than 60 days left after today, UTC; today the schedule has 120 days so it stops with a green 'not due'), for real. Record the run URL and result here. Known limits: CI does not start on a PR opened with GITHUB_TOKEN (close and reopen it); scheduled workflows pause after 60 days of repo inactivity.

Owner rehearsal: since the schedule has 120 days, a normal run stops 'not due'. Use the force input: gh workflow run schedule-top-up.yml --ref main -f dry_run=true -f force=true -f days=3 (nothing committed), then -f force=true -f days=3 without dry_run to see the PR (close it afterwards and delete branch schedule/2027-02-09).

Review gate: dipsaus-ai:story-reviewer round 1 blocked only on References (new helper, tests and tool outside the declared paths); References widened via backlog task edit --ref (all existing refs re-passed plus src/schedule/status.ts, src/schedule/status.test.ts, tools/schedule-next.ts, tools/schedule-workflow.test.ts, tools/schedule.test.ts); round 2: pass, no scope violations. Advisory (porcelain guard) fixed. AC 3 stays unchecked: it is the owner's step after merge (GitHub run cannot be done by the worker).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added .github/workflows/schedule-top-up.yml (monthly cron plus workflow_dispatch with days, force and dry_run inputs; timeout 60 min): it plans with the new bun run schedule:next (topUpPlan in src/schedule/status.ts, unit-tested across month/year boundaries, an empty schedule and exactly 30/29 days), skips when a top-up PR is open, generates the next days deterministically with bun run schedule --jobs 2, opens a PR from schedule/<first-date> with gh, and ends red with an error when fewer than 30 days are left. docs/authoring/schedule.md has a 'Keeping the schedule filled' section (routine, workflow, manual and dry runs, owner settings, failure handling). Proven locally (temp copy dry-run, determinism across --jobs, PR step against a throwaway clone with a gh stub, YAML parse and bash -n test). Owner step outstanding: enable 'Allow GitHub Actions to create and approve pull requests' and run the workflow once after merge (AC 3).
<!-- SECTION:FINAL_SUMMARY:END -->
