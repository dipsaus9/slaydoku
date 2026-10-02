---
id: SLAY-14.8
title: 'Service worker: push and notificationclick handlers'
status: To Do
assignee: []
created_date: '2026-10-02 09:55'
labels:
  - story
dependencies: []
references:
  - src/pwa/sw.ts
  - src/pwa/notify.ts
  - src/pwa/notify.test.ts
parent_task_id: SLAY-14
type: feature
ordinal: 96000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: when a payload-less push arrives the service worker shows a localized (nl/en from the browser language) 'new puzzle' notification with no spoilers, and tapping it opens or focuses /play. Pure text/route decisions live in src/pwa/notify.ts with unit tests.
Type: deliverable
Branch: SLAY-14.8/sw-push-handlers
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A push event always shows exactly one notification (title Slaydoku, body in nl when navigator.language starts with nl, else en), with icon and badge from the existing icons
- [ ] #2 notificationclick focuses an open client and navigates it to /play, else opens /play, and closes the notification
- [ ] #3 Update flow from the offline docs is untouched: no skipWaiting added; existing cache/updater tests pass
- [ ] #4 notify.ts has unit tests for text selection and click routing; lint, typecheck, test --maxWorkers=1 green and the build still emits dist/sw.js
<!-- AC:END -->
