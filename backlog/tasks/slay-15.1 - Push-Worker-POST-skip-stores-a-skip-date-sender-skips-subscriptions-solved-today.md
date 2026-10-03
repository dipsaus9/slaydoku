---
id: SLAY-15.1
title: >-
  Push Worker: POST /skip stores a skip date, sender skips subscriptions solved
  today
status: To Do
assignee: []
created_date: '2026-10-03 09:16'
labels:
  - story
dependencies: []
references:
  - workers/push/
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
- [ ] #1 POST /skip validates the body (known subscription endpoint, date is today or yesterday in UTC) and answers 204; unknown endpoint or bad date gets 400/404 without leaking which
- [ ] #2 The skip entry expires by itself (KV TTL) and is removed with the subscription on DELETE /subscribe and on 404/410 pruning
- [ ] #3 The sender does not push a subscription whose skip date is today's UTC date; a subscription with an older or missing skip date still gets its push; tests cover both, across the chunked cursor path
- [ ] #4 CORS for /skip matches /subscribe (Slaydoku origins only); strict workers typecheck, lint and tests green
<!-- AC:END -->
