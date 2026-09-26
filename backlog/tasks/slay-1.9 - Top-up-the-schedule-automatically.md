---
id: SLAY-1.9
title: Top up the schedule automatically
status: To Do
assignee: []
created_date: '2026-09-26 19:32'
labels:
  - story
dependencies:
  - SLAY-1.4
references:
  - .github/workflows/
  - tools/schedule.ts
  - docs/authoring/schedule.md
  - package.json
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
- [ ] #1 .github/workflows/schedule-top-up.yml (cron monthly and workflow_dispatch) generates the next 90 days deterministically and opens a PR via gh; a dry-run mode is documented
- [ ] #2 bun run schedule:check exits non-zero when fewer than 30 days remain; a unit test covers the calculation; docs/authoring/schedule.md explains the routine
- [ ] #3 The workflow can be exercised with workflow_dispatch on a branch (the owner runs it once; the token needs the workflow scope) and the result is recorded in the story notes
- [ ] #4 bun run lint/typecheck/test (--maxWorkers=1) and audit:personal pass
<!-- AC:END -->
