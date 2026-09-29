---
id: SLAY-9.16
title: 'Solved-result card: no way back to the board (PWA reopen dead end)'
status: Done
assignee: []
created_date: '2026-09-29 17:09'
updated_date: '2026-09-29 18:51'
labels:
  - story
dependencies:
  - SLAY-9.15
references:
  - src/ui/daily/StartScreen.tsx
  - src/ui/daily/strings.ts
  - src/ui/daily/daily.test.tsx
parent_task_id: SLAY-9
type: feature
ordinal: 72000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a player who reopens the app (PWA or a fresh tab) after already solving today's puzzle can still reach the solved board, not just the result summary on the start screen.
Type: deliverable
Branch: SLAY-9.16/solved-card-view-board-button

Owner report (Dutch, paraphrased): on the PWA, once you've solved a puzzle and reopen the app, you can never get back to the board — there needs to be a button to still go to /play.

Root cause, confirmed by reading the code: StartScreen.tsx's PuzzleCard has a solved branch (~line 60-68, <div className="daily-result">) that renders only the result title/alone-text/facts — no button. The onPlay handler that navigates to /play is wired only to the unsolved Play/Continue button (~line 72), never called from the solved branch. SLAY-9.13 already made /play itself correctly show the board + persistent Share button for an already-solved day instead of redirecting away — but nothing on the start screen links there once solved, so a player who lands on '/' after solving (any fresh app/tab open, not just PWA) has no way to reach it except typing the URL by hand.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The solved-result card on the start screen has a visible button/link to view the board, navigating to the play route for that day (reusing the existing onPlay wiring, which already resolves to the current day)
- [x] #2 Clicking it shows the solved board (SLAY-9.13's popover-dismissed board view), not a redirect back to start
- [x] #3 Verified live: solve a puzzle, reload/reopen the app fresh (landing on '/'), confirm the new button reaches the board
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add a 'View board' button to PuzzleCard's solved branch, calling the same onPlay prop already passed in for the unsolved Play/Continue button.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dependency on SLAY-9.15 is sequencing only (both touch StartScreen.tsx) — no functional relationship.

Verified live (dev server, ?date=2026-10-15 override): seeded a solved result for puzzle #19 (fp 8afe94f9, medium, 9x9) directly into slaydoku:daily-results, then did a fresh navigation to '/' (simulating a fresh app/tab reopen). The solved-result card showed a 'Bekijk bord' (View board) button; clicking it navigated to /play and rendered the actual solved board (SLAY-9.13's board view), not a redirect back to start. Confirms AC 1-3.

Review round 1: blocked only on scope -- References listed just StartScreen.tsx but the fix necessarily also touched strings.ts (new solved.viewBoard EN/NL string) and daily.test.tsx (coverage for the new button). Widened References to include both (all three existing refs re-passed) per the skill's scope-widening rule, and re-requested review.

Review round 2 (post-widening): PASS. All 3 acceptance criteria met, no scope violations, no findings. Reviewer independently ran typecheck and the daily.test.tsx suite (28 pass) and confirmed changed paths match the widened References exactly.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a 'View board'/'Bekijk bord' button to the solved-result card on the start screen (PuzzleCard's solved branch in StartScreen.tsx), reusing the existing onPlay wiring that already resolves to the current day's /play route. A player who reopens the app (PWA or a fresh tab) after already solving today's puzzle can now reach the solved board directly, instead of being stuck on the result summary with no way back (the PWA reopen dead end). New EN/NL string (solved.viewBoard) added in strings.ts, and test coverage added in daily.test.tsx. Verified live against the running dev server: seeded a solved result, did a fresh navigation to '/', and confirmed the button opens the actual solved board (SLAY-9.13's board view) rather than redirecting to start.
<!-- SECTION:FINAL_SUMMARY:END -->
