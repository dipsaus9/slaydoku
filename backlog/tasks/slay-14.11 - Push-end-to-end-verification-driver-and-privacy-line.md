---
id: SLAY-14.11
title: Push end-to-end verification driver and privacy line
status: Done
assignee: []
created_date: '2026-10-02 09:55'
updated_date: '2026-10-03 07:26'
labels:
  - story
dependencies:
  - SLAY-14.10
  - SLAY-14.7
references:
  - docs/verification/push.ts
  - src/ui/about/
  - docs/push.md
parent_task_id: SLAY-14
type: chore
ordinal: 99000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a headless-Chrome driver proves the client flow with a fake Worker and CDP ServiceWorker.deliverPushMessage, and the About page tells players exactly what the reminder stores.
Type: deliverable
Branch: SLAY-14.11/push-verify-privacy
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 docs/verification/push.ts runs against a built app: enabling the reminder in standalone emulation POSTs the expected body to a fake Worker, a delivered push shows a notification, and clicking it lands on /play
- [x] #2 The About page (en and nl) states what is stored server-side (push subscription and chosen hour, nothing else) and how to turn it off
- [x] #3 A manual live-check checklist for the deployed Worker is in docs/push.md or the story notes: subscribe on a real device, receive at the chosen Amsterdam hour, unsubscribe stops it
- [x] #4 lint, typecheck, test --maxWorkers=1 green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review: pass (advisory dead DAY constant removed). Driver run green at 390x844, 360x740, 1280x800 (28 checks). About page checked at 360 and 1280 in en and nl. Gap: the real Worker, push service delivery and cron are covered only by the manual checklist in docs/push.md; the driver patches the placeholder config in a copy of the build, production guard untouched.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added docs/verification/push.ts (fake Worker, standalone emulation, CDP deliverPushMessage, click to /play, DELETE on switch-off, About check), an About section in en and nl stating what is stored server-side and how to turn it off, and a manual live-check checklist in docs/push.md.
<!-- SECTION:FINAL_SUMMARY:END -->
