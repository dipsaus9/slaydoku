---
id: SLAY-12.2
title: 'Verify PostHog events actually arrive end-to-end, not just wired in'
status: To Do
assignee: []
created_date: '2026-09-29 10:00'
labels:
  - story
dependencies: []
references:
  - src/analytics/posthog.ts
  - src/game/playCounters.ts
parent_task_id: SLAY-12
type: spike
ordinal: 63000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: confirmed, with evidence (not assumed), that a real play session sends puzzle_start and puzzle_solve events and they show up in the PostHog project dashboard, per the privacy config (person_profiles: never, memory-only persistence).
Type: spike
Branch: SLAY-12.2/posthog-verification

Spike justification: requires a real browser session hitting the live/preview site and checking network activity plus the PostHog live-events dashboard — not answerable by reading the code alone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Playing a puzzle to completion sends a puzzle_start request and a puzzle_solve request to eu.i.posthog.com with the expected event names and no extra identifying data (confirmed via network inspection)
- [ ] #2 Both events are confirmed to appear in the PostHog project's Activity/Live Events view within a few minutes
- [ ] #3 If no events arrive or the payload differs from what src/analytics/posthog.ts / src/game/playCounters.ts intends, the root cause is fixed as part of this story, not just reported
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PostHog project dashboard access (eu.i.posthog.com) is the owner's account. If delivery cannot reach the dashboard itself, verify via the network request only and ask the owner to confirm the dashboard side.
<!-- SECTION:NOTES:END -->
