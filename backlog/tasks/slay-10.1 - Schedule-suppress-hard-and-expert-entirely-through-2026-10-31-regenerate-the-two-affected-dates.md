---
id: SLAY-10.1
title: >-
  Schedule: suppress hard and expert entirely through 2026-10-31, regenerate the
  two affected dates
status: To Do
assignee: []
created_date: '2026-09-29 09:59'
labels:
  - story
dependencies:
  - SLAY-9.5
references:
  - src/schedule/pick.ts
  - src/schedule/pick.test.ts
  - src/content/schedule/
  - src/schedule/check.ts
  - docs/authoring/schedule.md
parent_task_id: SLAY-10
type: feature
ordinal: 57000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: extends src/schedule/pick.ts's ramp-up rule (SLAY-6.3) from a 28-day hard-free/one-expert-kept window to a window running through 2026-10-31 that is both hard-free AND expert-free (no kept-expert exception at all inside it). The two dates the unmodified algorithm draws expert in that extended window (2026-09-29, today, currently live; 2026-10-27, not yet played) are surgically regenerated using SLAY-6.3's grounding-on-real-committed-previous-day technique so no unrelated date's cast ripples.
Type: deliverable
Branch: SLAY-10.1/no-hard-expert-through-october

Owner confirmed regenerating today's live puzzle (2026-09-29, currently expert, 12x12) is acceptable, same precedent as SLAY-6.3's day-2 exception.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 No date from LAUNCH_DATE through 2026-10-31 draws 'hard' or 'expert' — the ramp-up redraw now redirects both tiers to the hard-free mix, with no chronologically-first-expert-kept exception inside this window
- [ ] #2 pick.test.ts covers: zero hard, zero expert throughout the window; a control date after 2026-10-31 is unaffected and can still draw expert/hard normally
- [ ] #3 The committed schedule is regenerated for exactly the dates this rule change touches (2026-09-29 and 2026-10-27 confirmed among them); every other date, including day 1 and index.json, stays byte-identical
- [ ] #4 src/schedule/check.ts's week-expert invariant is updated so a fully-suppressed week's zero-experts is legitimate through the window, same pattern as the existing ramp-up exception
- [ ] #5 docs/authoring/schedule.md's tier-mix description is updated to describe the extended, fully-suppressed window through 2026-10-31, superseding the 'first 4 weeks, one expert kept' description
- [ ] #6 Verification is scoped to the diffed target dates only — no bun run validate:generation sweep or bun run test:slow is needed for this story, same as SLAY-6.3's precedent
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Widen the ramp-up date range in pick.ts to 2026-10-31 and drop the rampUpKeptExpertDate exception entirely inside it (redirect an 'expert' draw to RAMP_UP_TIER_MIX exactly like a 'hard' draw). Identify exactly which dates change via diffing old vs new sizeAndTierOf() over the window before regenerating anything.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Follow SLAY-6.3's exact regeneration methodology (ground each changed day's cast on the real committed previous day, not a full-chain recompute) — a naive whole-window regeneration was already tried and rejected once for rippling into unrelated dates. Re-check src/game/daily/status.test.ts for a hardcoded cell tied to a regenerated date, same gotcha SLAY-6.3 hit. Dependency on SLAY-9.5 is not a file collision (different layers: schedule content vs. play runtime) — it is verification-order: if 9.5 changes victim/completion logic after this story regenerates and verifies puzzle content, that verification would need redoing against the new logic. Doing 9.5 first means this story's regeneration check only has to happen once.
<!-- SECTION:NOTES:END -->
