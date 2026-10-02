---
id: SLAY-14.5
title: 'Push Worker: subscribe/unsubscribe API with KV storage'
status: To Do
assignee: []
created_date: '2026-10-02 09:55'
labels:
  - story
dependencies: []
references:
  - workers/push/
parent_task_id: SLAY-14
type: feature
ordinal: 93000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a Cloudflare Worker (workers/push/) exposes POST /subscribe {subscription, hour, locale?} and DELETE /subscribe {endpoint}, storing only the push subscription and the chosen Amsterdam hour in KV. Handler logic is pure functions over a KV interface so it is unit-testable with a fake KV. No accounts, no timezone, no other personal data.
Type: deliverable
Branch: SLAY-14.5/push-worker-api
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 POST /subscribe validates the body (https endpoint on a known push-service host, p256dh/auth keys present, hour an integer 6..23) and rejects anything else with 400
- [ ] #2 A valid subscribe is stored in KV under a hash of the endpoint, indexed by hour so the sender can list one hour's subscribers; re-subscribing with a new hour moves it
- [ ] #3 DELETE /subscribe removes the subscription from KV and its hour index
- [ ] #4 CORS allows only the Slaydoku origins (slaydoku.nl, www.slaydoku.nl, slaydoku.vercel.app, localhost in dev); other origins get no CORS headers
- [ ] #5 Unit tests with a fake KV cover validation, store, move-hour and delete; the Worker source uses no node: imports
<!-- AC:END -->
