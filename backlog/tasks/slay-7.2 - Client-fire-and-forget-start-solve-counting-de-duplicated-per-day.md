---
id: SLAY-7.2
title: 'Client: fire-and-forget start/solve counting, de-duplicated per day'
status: To Do
assignee: []
created_date: '2026-09-28 19:02'
updated_date: '2026-09-28 19:02'
labels:
  - story
dependencies:
  - SLAY-7.1
  - SLAY-6.1
references:
  - src/game/
  - src/ui/daily/
  - src/ui/play/
parent_task_id: SLAY-7
type: feature
ordinal: 40000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the app calls SLAY-7.1's endpoint once when a player opens today's puzzle for the first time that day, and once the first time they solve it, using a small localStorage marker to de-duplicate (a reload or revisit never double-counts). The call never blocks or affects gameplay: it fires and forgets, and a failure (offline, endpoint down) is silently ignored.
Type: deliverable
Branch: SLAY-7.2/stats-client-events
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Opening today's puzzle sends one 'start' event the first time per device per day; solving it sends one 'solve' event (with elapsedMs) the first time per device per day; a reload, revisit, or re-render never sends a duplicate for the same day
- [ ] #2 The de-duplication uses a localStorage marker following the existing key-naming convention (slaydoku:...), separate from and not reusing src/game/telemetry/ (the local-only lab-calibration recorder) or src/game/stats/ (the player-visible streak UI) — this is a new, clearly separate concern
- [ ] #3 A failed request (offline, non-200, timeout) never throws, never blocks rendering, and never retries aggressively; play is unaffected whether the call succeeds or not
- [ ] #4 No personally identifying data is included in the request body
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a small new module (not inside telemetry/ or stats/) that POSTs to the SLAY-7.1 endpoint and reads/writes its own localStorage dedup marker, following the guarded try/catch StorageLike pattern already used for slaydoku:help-seen etc. 2. Call it once from wherever the start screen/play flow already knows 'today's puzzle just opened for the first time' and once from wherever it already knows 'just solved'. 3. Wrap the fetch in a fire-and-forget helper that swallows every failure.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Depends on SLAY-7.1 for the real endpoint contract (request shape, URL). If SLAY-7.1 is not yet merged when this story starts, coordinate on the documented contract from its task description rather than guessing.
<!-- SECTION:NOTES:END -->
