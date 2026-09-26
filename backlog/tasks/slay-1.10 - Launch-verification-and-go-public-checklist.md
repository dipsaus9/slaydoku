---
id: SLAY-1.10
title: Launch verification and go-public checklist
status: To Do
assignee: []
created_date: '2026-09-26 19:32'
updated_date: '2026-09-26 23:05'
labels:
  - story
dependencies:
  - SLAY-1.5
  - SLAY-1.6
  - SLAY-1.7
  - SLAY-1.8
  - SLAY-1.9
references:
  - docs/verification/
  - docs/launch.md
  - tools/audit-personal.ts
  - tools/audit-personal.test.ts
parent_task_id: SLAY-1
type: feature
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: evidence that the product is ready. bun run verify:phone (adapted to the daily flow) on four phone and two iPad sizes: today's puzzle, play, solve, share, stats, offline reload, the update notice, midnight rollover with a faked clock, the About page; the rendered-screen check on a sample of scheduled puzzles (every card of every person visible, every drawn object in the legend); the personal-data audit extended to scan the git history (commit author metadata of the owner is the single allowed exception); production check-share; a written go-public checklist for the owner (README, license, domain and name availability, privacy note, secrets scan, branch protection, making the repo public).
Type: deliverable
Branch: SLAY-1.10/launch-verification
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/verification/report.md is rewritten for the daily flow with counts per viewport and 0 failures, screenshots stored outside the repo; the owner checklist ends the report
- [ ] #2 tools/audit-personal.ts also scans git history: any file content or commit message hit fails, and only the owner's configured author identity is allowed as commit metadata (one explicit allowance); tests prove both
- [ ] #3 A go-public checklist in docs/launch.md covers naming and domain checks, README and license review, a secrets scan (git history and tree), Vercel and GitHub settings, and the exact steps to flip the repo to public; bun run audit:personal is green
- [ ] #4 bun run lint/typecheck/test (--maxWorkers=1) pass
- [ ] #5 The go-public checklist includes the Vercel GitHub connection step (app access to the repo, connect Git, production branch main) and confirms a push to main deploys
<!-- AC:END -->
