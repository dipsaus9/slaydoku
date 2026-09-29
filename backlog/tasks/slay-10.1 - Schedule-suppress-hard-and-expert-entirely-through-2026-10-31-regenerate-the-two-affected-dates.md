---
id: SLAY-10.1
title: >-
  Schedule: suppress hard and expert entirely through 2026-10-31, regenerate the
  two affected dates
status: Done
assignee: []
created_date: '2026-09-29 09:59'
updated_date: '2026-09-29 13:09'
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
  - tools/schedule.test.ts
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
- [x] #1 No date from LAUNCH_DATE through 2026-10-31 draws 'hard' or 'expert' — the ramp-up redraw now redirects both tiers to the hard-free mix, with no chronologically-first-expert-kept exception inside this window
- [x] #2 pick.test.ts covers: zero hard, zero expert throughout the window; a control date after 2026-10-31 is unaffected and can still draw expert/hard normally
- [x] #3 The committed schedule is regenerated for exactly the dates this rule change touches (2026-09-29 and 2026-10-27 confirmed among them); every other date, including day 1 and index.json, stays byte-identical
- [x] #4 src/schedule/check.ts's week-expert invariant is updated so a fully-suppressed week's zero-experts is legitimate through the window, same pattern as the existing ramp-up exception
- [x] #5 docs/authoring/schedule.md's tier-mix description is updated to describe the extended, fully-suppressed window through 2026-10-31, superseding the 'first 4 weeks, one expert kept' description
- [x] #6 Verification is scoped to the diffed target dates only — no bun run validate:generation sweep or bun run test:slow is needed for this story, same as SLAY-6.3's precedent
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Widen the ramp-up window in pick.ts to run through 2026-10-31 (RAMP_UP_END_DATE, replacing RAMP_UP_DAYS=28) and drop the kept-expert exception entirely (isSuppressedExpertDay replaces isDemotedExpertDay/rampUpKeptExpertDate): every would-be expert day inside the window now redirects to RAMP_UP_TIER_MIX exactly like a would-be hard day. Diff old vs new sizeAndTierOf() over the window to find exactly which committed dates change (2026-09-29, 2026-10-27), then surgically regenerate just those two, grounding each one's cast on the REAL committed previous day (2026-09-28, 2026-10-26) via castFor directly, never via nominalCast's from-scratch chain (SLAY-6.3 precedent). Verify each regenerated day against dayProblems/pairProblems (previous AND next real committed day) and scheduleProblems over the whole committed schedule. Update check.ts's week-expert invariant and docs/authoring/schedule.md to match. Update pick.test.ts for the new window and helper names.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Follow SLAY-6.3's exact regeneration methodology (ground each changed day's cast on the real committed previous day, not a full-chain recompute) — a naive whole-window regeneration was already tried and rejected once for rippling into unrelated dates. Re-check src/game/daily/status.test.ts for a hardcoded cell tied to a regenerated date, same gotcha SLAY-6.3 hit. Dependency on SLAY-9.5 is not a file collision (different layers: schedule content vs. play runtime) — it is verification-order: if 9.5 changes victim/completion logic after this story regenerates and verifies puzzle content, that verification would need redoing against the new logic. Doing 9.5 first means this story's regeneration check only has to happen once.

Diffed old vs new sizeAndTierOf() over 60 days from LAUNCH_DATE: exactly 2026-09-29 (12x12 expert -> 9x9 easy) and 2026-10-27 (12x12 expert -> 12x12 easy-medium) change; every other date confirmed unaffected. Regenerated both surgically via a one-off script (not committed) grounding each cast on the REAL committed previous day via castFor directly, mirroring SLAY-6.3's methodology exactly. dayProblems/pairProblems clean for both dates against their real neighbors; scheduleProblems clean over the whole committed schedule; index.json and every other schedule file byte-identical (git diff --stat confirms exactly 2 changed lines total, one per month file). Widened References to add tools/schedule.test.ts: its 'writes byte-identical... equal to the committed days' test does a from-scratch full-chain rebuild of days 1-4 and compares to committed; 2026-09-30 (unmodified, but immediately follows our regenerated 2026-09-29) now diverges from that from-scratch rebuild because its real committed cast is grounded on the OLD 2026-09-29, not the new one -- harmless (no shared names, scheduleProblems clean) but expected, same class of issue as the existing 2026-09-28/SLAY-8.1 exclusion. Added 2026-09-30 to KNOWN_DIVERGED_DAYS with a comment explaining why. Full bun run test --maxWorkers=1 (140 files, 3004 tests), lint, typecheck and build all green; validate:generation and test:slow intentionally not run per AC #6.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Extended src/schedule/pick.ts's ramp-up rule (SLAY-6.3) from a 28-day hard-free/one-expert-kept window to a window running from LAUNCH_DATE through 2026-10-31 (RAMP_UP_END_DATE) that is hard-free AND expert-free, no kept-expert exception at all: every would-be expert day inside the window now redirects to RAMP_UP_TIER_MIX exactly like a would-be hard day (isSuppressedExpertDay replaces isDemotedExpertDay/rampUpKeptExpertDate). Diffing old vs new sizeAndTierOf() found exactly two committed dates the rule change touches: 2026-09-29 (today's live puzzle, 12x12 expert -> 9x9 easy) and 2026-10-27 (12x12 expert -> 12x12 easy-medium); both were surgically regenerated grounded on their real committed previous day's cast (SLAY-6.3's methodology), verified clean by dayProblems/pairProblems/scheduleProblems; every other date and index.json stayed byte-identical (git diff of src/content/schedule/ touches exactly 2 lines). check.ts's week-expert invariant and docs/authoring/schedule.md were updated to match. pick.test.ts covers zero hard/zero expert through the window and an unaffected control date after it. References were widened to include tools/schedule.test.ts, whose from-scratch full-chain-rebuild test needed 2026-09-30 added to its known-diverged-days list (same class of documented, harmless divergence as the existing 2026-09-28/SLAY-8.1 entry, caused by 2026-09-30 following our surgically-regenerated 2026-09-29 without itself being regenerated). Full bun run test (140 files, 3004 tests), lint, typecheck and build all green; validate:generation and test:slow intentionally skipped per the story's own AC #6.
<!-- SECTION:FINAL_SUMMARY:END -->
