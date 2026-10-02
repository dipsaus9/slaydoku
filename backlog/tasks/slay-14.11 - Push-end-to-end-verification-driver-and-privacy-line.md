---
id: SLAY-14.11
title: Push end-to-end verification driver and privacy line
status: To Do
assignee: []
created_date: '2026-10-02 09:55'
labels:
  - story
dependencies:
  - SLAY-14.10
  - SLAY-14.7
references:
  - docs/verification/push.ts
  - src/ui/about/
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
- [ ] #1 docs/verification/push.ts runs against a built app: enabling the reminder in standalone emulation POSTs the expected body to a fake Worker, a delivered push shows a notification, and clicking it lands on /play
- [ ] #2 The About page (en and nl) states what is stored server-side (push subscription and chosen hour, nothing else) and how to turn it off
- [ ] #3 A manual live-check checklist for the deployed Worker is in docs/push.md or the story notes: subscribe on a real device, receive at the chosen Amsterdam hour, unsubscribe stops it
- [ ] #4 lint, typecheck, test --maxWorkers=1 green
<!-- AC:END -->
