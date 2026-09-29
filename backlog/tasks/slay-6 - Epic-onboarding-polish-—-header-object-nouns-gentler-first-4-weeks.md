---
id: SLAY-6
title: 'Epic: onboarding polish — header, object nouns, gentler first 4 weeks'
status: Done
assignee: []
created_date: '2026-09-28 18:56'
updated_date: '2026-09-29 09:15'
labels:
  - epic
dependencies: []
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: three independent player-facing fixes found by owner testing. (1) The play-screen header ('< Terug' / puzzle title / timer / settings) reads as mismatched pieces rather than one designed bar, and sits too close to the top edge on an installed mobile PWA (no browser chrome to buffer the notch/status bar). (2) Dutch clues still say object nouns in English ('een shelf') — SLAY-3.2/SLAY-5.2 deliberately kept object nouns English at the time; the owner now wants them fully Dutch. (3) The schedule's first 4 weeks (28 days from launch) can currently draw 'hard' (already happened: today, day 2, is hard) and up to ~4 'expert' days (the normal one-per-week cadence); the owner wants a gentler on-ramp: no hard in the first 4 weeks (medium picks up that share, 20%->30%) and only the first would-be-expert day in that window kept as expert, not every week's. Chosen approach for the schedule change (over reshuffling the whole 28-day block): touch only the dates that would otherwise have been hard or a surplus expert day; every other already-fine date (including day 1, already easy-medium) stays byte-identical — day 2 is the owner's one explicitly confirmed exception to 'a published day never changes', since it is live and hard today.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The play-screen header reads as one designed bar (consistent treatment of the back control, title, timer and settings icon) and keeps comfortable clear space above it on an installed PWA regardless of whether the device reports a safe-area inset
- [ ] #2 Every object noun in a Dutch clue sentence is Dutch, not English, matching the same house style already used for room/theme names
- [ ] #3 No 'hard' tier appears in the first 28 days from LAUNCH_DATE; medium's share rises from 20% to 30% for those days; only the first date that would otherwise have been an expert day in that window stays expert, every later one in the window falls back to the (hard-free) mix instead; every date in the window that the unmodified algorithm would already have picked identically (including day 1) is untouched
- [ ] #4 verify:phone (English and the Dutch locale driver) stays green; tools/schedule.test.ts's byte-identical guarantee holds for every date the new rule does not change
<!-- AC:END -->
