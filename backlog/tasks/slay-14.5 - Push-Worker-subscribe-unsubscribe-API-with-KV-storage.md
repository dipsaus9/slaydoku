---
id: SLAY-14.5
title: 'Push Worker: subscribe/unsubscribe API with KV storage'
status: Done
assignee: []
created_date: '2026-10-02 09:55'
updated_date: '2026-10-02 10:57'
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
- [x] #1 POST /subscribe validates the body (https endpoint on a known push-service host, p256dh/auth keys present, hour an integer 6..23) and rejects anything else with 400
- [x] #2 A valid subscribe is stored in KV under a hash of the endpoint, indexed by hour so the sender can list one hour's subscribers; re-subscribing with a new hour moves it
- [x] #3 DELETE /subscribe removes the subscription from KV and its hour index
- [x] #4 CORS allows only the Slaydoku origins (slaydoku.nl, www.slaydoku.nl, slaydoku.vercel.app, localhost in dev); other origins get no CORS headers
- [x] #5 Unit tests with a fake KV cover validation, store, move-hour and delete; the Worker source uses no node: imports
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Pure handlers in workers/push/src (validate, store over KV interface, cors), thin fetch entry, fake-KV tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review: pass. Advisory: listHour ignores KV list cursor (paginate in sender story 14.6); non-atomic multi-op writes tolerated.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added workers/push/src: pure handlers over a KvLike interface (validation, hashed-endpoint storage with per-hour index, move-hour, delete, strict CORS), fetch entry, fake KV and 20 unit tests.
<!-- SECTION:FINAL_SUMMARY:END -->
