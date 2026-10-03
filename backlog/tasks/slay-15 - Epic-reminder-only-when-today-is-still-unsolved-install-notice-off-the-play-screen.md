---
id: SLAY-15
title: >-
  Epic: reminder only when today is still unsolved, install notice off the play
  screen
status: Done
assignee: []
created_date: '2026-10-03 09:15'
updated_date: '2026-10-03 20:43'
labels:
  - epic
dependencies: []
ordinal: 100000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a player who already solved today's puzzle gets no reminder that day, and the PWA install notice no longer covers the play header.

Chosen approach for the reminder: the app tells the Worker a 'skip today' date (POST /skip {endpoint, date}) when the player solves, and the sender skips subscriptions whose skip date is today's UTC date. Why it beat the alternatives: (a) the service worker cannot read localStorage, and a push that shows no notification is treated as a violation (Chrome shows a generic 'site updated in the background' notice; Safari can revoke the subscription after repeated silent pushes), so a silent skip in the SW is unsafe; (b) sending a different 'you already solved it' notification is noise; (c) sending the full solve state to the server breaks the device-only stats decision. A single date per subscription, stored only for the reminder and expiring after a day, is the smallest data that works. Privacy copy (About, docs/push.md, CLAUDE.md) must say so.
Install notice: show it on the start screen only, not on /play, so it cannot overlap the play header (existing behaviour seen in SLAY-14.4).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A player with a reminder who solved today receives no notification that day, and receives it again the next day (manual live check)
- [x] #2 All stories SLAY-15.1 to SLAY-15.5 are Done
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Closed on 2026-10-03 on the owner's instruction (Sluit alles). All stories are Done and merged. The manual criteria (live reminder check / owner check on a real phone) were accepted by the owner and were NOT independently verified by the agent.
<!-- SECTION:NOTES:END -->
