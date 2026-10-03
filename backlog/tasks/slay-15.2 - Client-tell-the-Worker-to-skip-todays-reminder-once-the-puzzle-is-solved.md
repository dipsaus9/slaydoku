---
id: SLAY-15.2
title: 'Client: tell the Worker to skip today''s reminder once the puzzle is solved'
status: Done
assignee: []
created_date: '2026-10-03 09:16'
updated_date: '2026-10-03 10:43'
labels:
  - story
dependencies:
  - SLAY-15.1
references:
  - src/pwa/reminder.ts
  - src/pwa/reminder.test.ts
  - src/ui/daily/DailyFlow.tsx
  - src/ui/daily/daily.test.tsx
parent_task_id: SLAY-15
type: feature
ordinal: 102000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: when a player with the reminder on solves today's puzzle (or opens the app and today is already solved), the app sends POST /skip for the stored subscription endpoint and today's UTC date. Failures are silent and never block play; a player without the reminder sends nothing.
Type: deliverable
Branch: SLAY-15.2/client-skip-today
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 With the reminder 'on', solving today's puzzle sends exactly one POST /skip {endpoint, date: today UTC}; reopening an already solved day does not send it again for the same date
- [x] #2 With the reminder off, unavailable or blocked, nothing is sent
- [x] #3 A network failure or non-2xx answer is swallowed (no error UI, no thrown error) and retried at most on the next app open of that day
- [x] #4 reminder.ts exposes the skip call behind the existing fake-fetch seam; unit tests with fakes cover on/off/failure/dedup; no node: imports in src/
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review: pass. Advisory: DailyFlow effect untested; skip dropped if store busy at solve (retried next open).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
reminder.ts gains skipToday(date): POSTs /skip {endpoint, date} once per UTC date while the reminder is on (dedup key slaydoku:reminder-skip-date, written only on 2xx), all failures swallowed; pure shouldSendSkip decides. DailyFlow calls it when today's day is solved (fresh solve or reopen). Unit tests cover on/off/failure/dedup.
<!-- SECTION:FINAL_SUMMARY:END -->
