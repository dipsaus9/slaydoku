---
id: SLAY-14.6
title: 'Push Worker: hourly cron sender with VAPID, batching and pruning'
status: Done
assignee: []
created_date: '2026-10-02 09:55'
updated_date: '2026-10-02 12:02'
labels:
  - story
dependencies:
  - SLAY-14.5
references:
  - workers/push/
  - package.json
parent_task_id: SLAY-14
type: feature
ordinal: 94000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the Worker's scheduled handler runs hourly, works out the current Amsterdam hour (Europe/Amsterdam, DST-safe, via Intl), and sends payload-less VAPID-signed Web Push messages to that hour's subscribers. It batches so the free plan's per-run outgoing-request cap never silently drops people, and prunes dead subscriptions.
Type: deliverable
Branch: SLAY-14.6/push-worker-sender
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The cron picks subscribers whose hour equals the current Europe/Amsterdam hour; tests cover both DST transitions (late March, late October)
- [x] #2 Pushes are VAPID-signed (ES256 JWT via Web Crypto, one JWT per push-service origin, reused) with TTL and Topic set so a missed send does not stack up
- [x] #3 Sending is chunked below the per-run subrequest cap and the remainder continues in a follow-up run or batch (cursor stored in KV); a test with more subscribers than one chunk shows all are sent exactly once
- [x] #4 A 404/410 response from a push service deletes that subscription; other failures are kept and logged without the endpoint
- [x] #5 Unit tests run with a fake KV and fake fetch; no node: imports
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Cron needs a frequent trigger (e.g. */5 * * * *) so chunks continue; wrangler.toml, VAPID secrets (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY base64url, VAPID_SUBJECT) belong to SLAY-14.7. Progress cursor key run:<date>:<hour> in KV.

Review: pass. Advisory: cron every few minutes needed (14.7); chunk re-send on mid-chunk crash is at-least-once, Topic collapses.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added scheduled sender (workers/push/src/sender.ts): Amsterdam hour via Intl, payload-less VAPID ES256 pushes with a JWT per origin, TTL and Topic, 11-subscriber chunks under the 50-subrequest cap with a KV cursor per date+hour, 404/410 pruning, paginated KV list helper, strict tsc over workers/ added to bun run typecheck.
<!-- SECTION:FINAL_SUMMARY:END -->
