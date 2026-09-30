---
id: SLAY-12
title: 'Epic: go-live readiness'
status: Done
assignee: []
created_date: '2026-09-29 10:00'
updated_date: '2026-09-30 08:32'
labels:
  - epic
dependencies: []
ordinal: 61000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: everything AI-doable to prepare for the public flip is done and verified — indexing turned on, PostHog confirmed actually delivering events (not just wired in), and a final doc pass confirming README/About/CLAUDE.md match the shipped game. The repository visibility flip itself (gh repo edit --visibility public) stays a manual step run directly once SLAY-9/10/11 and SLAY-8.3 have merged and CI is green — not a backlog story, since it is an irreversible action on a shared external system that an unsupervised delivery agent should not perform.

Owner decision (2026-09-29): go public now, skip the trademark/name check that an earlier session had flagged as blocking.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Indexing is flipped on (site.json + vercel.json) and verified with bun tools/check-share.ts --indexable
- [x] #2 puzzle_start and puzzle_solve events are confirmed actually reaching PostHog end-to-end, with evidence, not assumed
- [x] #3 README, About and CLAUDE.md are re-read against the now-current feature set (post SLAY-9/SLAY-10) and updated where stale
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC2 confirmed 2026-09-30: owner directly confirmed seeing puzzle_start/puzzle_solve events in the PostHog Activity/Live Events dashboard. Combined with SLAY-12.2's earlier network-level verification (correct events, correct host, no extra identifying data), this closes the loop end-to-end.
<!-- SECTION:NOTES:END -->
