---
id: SLAY-14.9
title: 'Client reminder store: permission, subscribe and chosen hour'
status: To Do
assignee: []
created_date: '2026-10-02 09:55'
labels:
  - story
dependencies:
  - SLAY-14.5
  - SLAY-14.8
references:
  - src/pwa/reminder.ts
  - src/pwa/reminder.test.ts
  - src/pwa/index.ts
parent_task_id: SLAY-14
type: feature
ordinal: 97000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: src/pwa/reminder.ts offers enable(hour), changeHour(hour) and disable(), handling Notification permission, pushManager.subscribe with the VAPID public key, the Worker API calls, and persistence of the chosen hour in localStorage. It reports 'unavailable' unless the app runs standalone and supports push.
Type: deliverable
Branch: SLAY-14.9/reminder-client-store
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Status is 'unavailable' when not standalone (isStandaloneDisplay) or when PushManager/Notification is missing; a non-installed browser never sees a permission prompt from this code
- [ ] #2 enable(hour) requests permission, subscribes, POSTs to the Worker and stores the hour; permission denied ends in a 'blocked' status with no request sent
- [ ] #3 changeHour re-POSTs with the new hour; disable() unsubscribes locally and DELETEs on the Worker; network failures leave a retryable error status without corrupting stored state
- [ ] #4 Worker URL and VAPID public key come from one config constant; unit tests use fakes for Notification, PushManager and fetch
- [ ] #5 Reads and writes are wrapped so localStorage failure does not throw; no node: imports
<!-- AC:END -->
