---
id: SLAY-9.19
title: >-
  Fix docs/verification/drive.ts, stats.ts and locale.ts for post-SLAY-9.13/9.15
  behavior
status: Done
assignee: []
created_date: '2026-09-29 19:48'
updated_date: '2026-09-29 20:46'
labels:
  - story
dependencies: []
references:
  - docs/verification/drive.ts
  - docs/verification/stats.ts
  - docs/verification/locale.ts
parent_task_id: SLAY-9
type: chore
ordinal: 76000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the manual browser-verification drivers (bun run verify:phone) pass cleanly again, reflecting current app behavior instead of stale assumptions from before SLAY-9.13 and SLAY-9.15.
Type: deliverable
Branch: SLAY-9.19/fix-stale-verification-drivers

Found while delivering SLAY-9.18 (confirmed pre-existing on a clean main build, not caused by that story): drive.ts, stats.ts and locale.ts fail 16, 4 and 2 checks respectively. Two known causes:
- SLAY-9.13 removed the force-navigate-to-'/' on solve, so any driver scenario still asserting a redirect back to start after solving is now wrong.
- SLAY-9.15 removed the redundant long-date byline segment, so any driver scenario still asserting that text is now wrong.
There also may be additional drift beyond these two known causes — the acceptance criteria ask for a full audit, not just patching the two known symptoms.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 bun run verify:phone passes cleanly (0 failures) across drive.ts, stats.ts and locale.ts, on all viewports and both locales
- [x] #2 Each fix reflects the actual current, intended behavior (per SLAY-9.13/9.15/9.16/9.18's own delivered outcomes) rather than being patched to just stop failing
- [x] #3 Audit for drift beyond the two known causes named above — don't assume those are the only stale assertions
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Same class of issue as SLAY-9.10/9.11 (verification drivers going stale after an intentional behavior change) — follow the same approach: reproduce live first, fix the driver's assumption, don't weaken the check to hide the drift.

Reproduced live first (bun run build + vite preview + each driver directly, then the full bun run verify:phone), per docs/handoff.md's SLAY-9.10/9.11 approach.

Fixed drive.ts (216->226 checks, 16->0 failures) and stats.ts (crashed after 4 checks with an uncaught 'missing [data-stats-open]' -> 0 failures) and locale.ts (29->30 checks, 2->0 failures).

Beyond the two known causes (SLAY-9.13's removed solve->/ redirect, SLAY-9.15's removed long-date byline segment), found real additional drift and fixed the drivers against current behavior, not by loosening assertions:
- SLAY-9.13 AC#4: the daily card's share slot no longer renders the SharePanel inline -- it's a 'Share'/'Delen' button that reopens it in a popover (same Modal as Help/Options/Stats). drive.ts and locale.ts now click the button and assert on the reopened popover.
- SLAY-9.13 AC#5 (deliberate): a solved day now stays playable via /play -- reopening it replays the board with ResultOverlay back on top, instead of the old redirect-to-result behaviour. drive.ts's and stats.ts's solve flow rewritten: check the finish overlay right on /play (share card embedded there via resultShare), dismiss with 'View the board', navigate back via the nav back button to reach the start screen's own card.
- SLAY-9.16: the daily card's solved state now shows a 'View board' button (data-action=view-board), not zero actions -- drive.ts's 'no Play button' check updated to assert View board instead.
- locale.ts's firstObjectDay() could land on a schedule day whose only object-bearing clue names a type intentionally left out of EXPECT_NL (bed/plant/tv -- identical Dutch/English spelling, can't check 'no leftover English' for those). Now skips to the first checkable (translatable) type per theme; this was independently failing for the 'school' theme (a 'tv' clue).

NOT fixed (out of this story's References/scope): bun run verify:phone's full run (2694 checks) shows the exact same SLAY-9.13 root cause (stale solveDay() assuming path()==='/) also crashes docs/verification/share.ts on all 6 viewports (6 driver crashes). share.ts is not in this story's References and its own AC wasn't asked to cover it -- flagging for a follow-up story rather than silently expanding scope.

Full verify commands run: bun run lint (pass), bun run typecheck (pass), bun run test --maxWorkers=1 (142 files / 3052 tests, all pass), bun run build, then bun run verify:phone (SKIP_BUILD=1): 2694 checks, 6 failures, all 6 in share.ts (pre-existing, not caused by this story's changes -- confirmed by grep: share.ts's solveDay() has the identical stale (await path()) === '/' assertion stats.ts had before this fix, and this story never touched share.ts). drive.ts and stats.ts: 0 failures across all 6 viewports. docs/verification/locale.ts run standalone (not part of phone.ts's suite list): 30 checks, 0 failures.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Reproduced the two known causes (SLAY-9.13's removed solve->/ redirect, SLAY-9.15's removed long-date byline segment) live, then audited beyond them per AC#3 and found real additional drift: the share slot became a reopenable popover (SLAY-9.13 AC#4), a solved day now reopens via /play with the finish overlay back on top instead of redirecting (SLAY-9.13 AC#5), the daily card shows a View board button instead of no action (SLAY-9.16), and locale.ts's object-noun sweep could land on an untranslatable type (tv) for the school theme. Rewrote drive.ts's, stats.ts's and locale.ts's assertions against current behavior (never loosened). bun run verify:phone (full six-viewport run): drive.ts and stats.ts both 0 failures; docs/verification/locale.ts run standalone: 0 failures. bun run lint, typecheck and test --maxWorkers=1 (142 files / 3052 tests) all green. Found but left untouched (out of this story's References): share.ts crashes on all 6 viewports from the identical SLAY-9.13 root cause -- flagged in the task notes as a follow-up, not silently expanded into this story's scope.
<!-- SECTION:FINAL_SUMMARY:END -->
