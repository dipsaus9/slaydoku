---
id: SLAY-15.1
title: >-
  Push Worker: POST /skip stores a skip date, sender skips subscriptions solved
  today
status: Done
assignee: []
created_date: '2026-10-03 09:16'
updated_date: '2026-10-03 10:22'
labels:
  - story
dependencies: []
references:
  - workers/push/
  - docs/push.md
parent_task_id: SLAY-15
type: feature
ordinal: 101000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the Worker accepts POST /skip {endpoint, date} (a UTC YYYY-MM-DD) for an existing subscription, stores it with a TTL of about 36 hours, and the sender leaves out a subscription whose skip date equals today's UTC date. Nothing else about the player is stored.
Type: deliverable
Branch: SLAY-15.1/push-worker-skip-today
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 POST /skip validates the body (known subscription endpoint, date is today or yesterday in UTC) and answers 204; unknown endpoint or bad date gets 400/404 without leaking which
- [x] #2 The skip entry expires by itself (KV TTL) and is removed with the subscription on DELETE /subscribe and on 404/410 pruning
- [x] #3 The sender does not push a subscription whose skip date is today's UTC date; a subscription with an older or missing skip date still gets its push; tests cover both, across the chunked cursor path
- [x] #4 CORS for /skip matches /subscribe (Slaydoku origins only); strict workers typecheck, lint and tests green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review: pass (advisory: /skip invalid-json body differs, not a leak). CHUNK_SIZE 11 -> 7 for the extra skip read.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
POST /skip stores skip:<hash> = UTC date (TTL 36h) for known subscriptions, identical 400 otherwise; sender skips subscriptions whose skip date is today's UTC date; skip removed on DELETE /subscribe and pruning; CHUNK_SIZE lowered to 7 to stay in the subrequest cap.
<!-- SECTION:FINAL_SUMMARY:END -->
