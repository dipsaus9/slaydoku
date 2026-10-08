---
id: SLAY-18.5
title: 'Spike: previews of fall, carnaval, Christmas and Halloween'
status: To Do
assignee: []
created_date: '2026-10-08 09:21'
labels:
  - needs-owner-review
dependencies:
  - SLAY-17.1
references:
  - docs/themes/seasonal/
parent_task_id: SLAY-18
type: spike
ordinal: 129000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: four HTML previews (one per theme) the owner approves before any of the four themes is built. Each: room list (EN and NL), objects with art and allowed rooms, at least 3 sample levels from the real generator on draft data. Carnaval is Oeteldonk style (Den Bosch: red, white and yellow, the frog, kroeg, confetti, optocht); Christmas needs about 15 rooms because it runs all December; Fall 1-16 Oct and November; Halloween 17-31 Oct.
Type: spike
Spike justification: how a theme and its levels look has to be seen and judged by the owner; planning cannot settle it from the desk.
Branch: SLAY-18.5/seasonal-previews
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/themes/seasonal/{fall,carnaval,christmas,halloween}.html each show rooms (EN and NL), objects with allowed rooms and at least 3 rendered sample levels
- [ ] #2 Christmas lists at least 15 rooms
- [ ] #3 Draft theme data per theme lives in docs/themes/seasonal/ and can be promoted unchanged
- [ ] #4 Owner has seen all four previews and approved or listed changes per theme (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it.
<!-- SECTION:NOTES:END -->
