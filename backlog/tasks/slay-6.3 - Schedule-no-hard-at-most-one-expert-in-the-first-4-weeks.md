---
id: SLAY-6.3
title: 'Schedule: no hard, at most one expert, in the first 4 weeks'
status: To Do
assignee: []
created_date: '2026-09-28 18:57'
labels:
  - story
dependencies: []
references:
  - src/schedule/pick.ts
  - src/schedule/pick.test.ts
  - src/content/schedule/
  - docs/authoring/schedule.md
parent_task_id: SLAY-6
type: feature
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: none of the first 28 days from LAUNCH_DATE draws the 'hard' tier (medium's share rises from 20% to 30% for those days, taking hard's share); of the days that would otherwise have been that week's expert day within the window, only the first one stays expert, every later one falls back to the (hard-free) mix. Every date in the window the unmodified algorithm would already have picked the same way — including day 1 (already easy-medium) — is untouched. The committed schedule is regenerated for the affected dates only, with day 2 (today, currently hard, already live) as the owner's one explicitly confirmed exception to 'a published day never changes'.
Type: deliverable
Branch: SLAY-6.3/gentle-first-four-weeks
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/schedule/pick.ts draws from a hard-free mix (very-easy 15, easy 30, easy-medium 25, medium 30) for any date within 28 days of LAUNCH_DATE that is not the window's one kept expert day; every other date's tier mix is unchanged
- [ ] #2 Within the 28-day window, only the chronologically first date that the unmodified isExpertDay would call an expert day stays expert; every later such date in the window falls back to the hard-free mix instead (a normal week outside the window is unaffected)
- [ ] #3 pick.test.ts covers the new rule directly: no hard tier in the window, exactly one expert date in the window, and a control date outside the window is unaffected by the change
- [ ] #4 The committed schedule (src/content/schedule/) is regenerated for exactly the dates the new rule changes (today's date, currently hard, is confirmed among them by the owner); every date the rule does not change is byte-identical to before, verified by tools/schedule.test.ts
- [ ] #5 docs/authoring/schedule.md's tier-mix description is updated to describe the first-4-weeks exception
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add an isRampUp(date) helper (within 28 days of LAUNCH_DATE) and a hard-free RAMP_UP_TIER_MIX in pick.ts. 2. In sizeAndTierOf, when isRampUp(date): if the date is the window's kept expert day, tier='expert' as before; else if the unmodified weighted(TIER_MIX,...) draw would be 'hard', use weighted(RAMP_UP_TIER_MIX,...) instead; else keep the unmodified draw exactly (so an already-fine date's plan does not shift just because the mix table changed shape). Determine the window's kept expert day as the first date (in day-number order) within the window where the existing isExpertDay(date) is true. 3. Add the pick.test.ts coverage. 4. Regenerate: run the schedule tool over the 28-day window with --overwrite and diff against the committed files — confirm only the intended dates changed, day 1 among the untouched. 5. Update docs/authoring/schedule.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner confirmed: today (day 2, 2026-09-28) is currently 'hard' and live/playable; the owner explicitly accepted overwriting it despite the 'published day never changes' rule, as the one exception. Do not overwrite any date the new rule does not actually change (day 1 must stay exactly as committed) — regenerating the whole window unconditionally would violate that and is not what was asked.
<!-- SECTION:NOTES:END -->
