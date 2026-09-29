---
id: SLAY-10
title: >-
  Epic: onboarding continued — no hard/expert through October, puzzle labeled by
  date
status: Done
assignee: []
created_date: '2026-09-29 09:59'
updated_date: '2026-09-29 13:31'
labels:
  - epic
dependencies: []
ordinal: 56000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: extend the ramp-up window so no hard or expert puzzle appears before November, and replace the 'Puzzle #N' label everywhere it is shown to players with a date-based label, since a fresh player arriving mid-week finds an arbitrary index meaningless. Internal puzzle-number identity (local storage keys, stats dedup) stays untouched — display and content-schedule change only, no data-model change, so existing players' saved local stats/streaks are not broken.

Alternative considered (discussed with the owner): keep the existing SLAY-6.3 'at most one expert kept' exception rather than suppressing every expert through October. Rejected — the owner was explicit: no hard or expert at all until players are past onboarding, even at the cost of extending the exception window further than SLAY-6.3's original 28 days.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No date from LAUNCH_DATE through 2026-10-31 draws 'hard' or 'expert'
- [x] #2 Puzzle #N is replaced everywhere a player sees it (header, start screen, tab title, share card) with a date-based label, in both locales
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Both stories delivered: SLAY-10.1 suppresses hard/expert through 2026-10-31; SLAY-10.2 replaces 'Puzzle #N' with a date-based label (header, start screen, tab title, share card) in English and Dutch, keeping the internal puzzle-number identity (storage keys, stats dedup) untouched.
<!-- SECTION:FINAL_SUMMARY:END -->
