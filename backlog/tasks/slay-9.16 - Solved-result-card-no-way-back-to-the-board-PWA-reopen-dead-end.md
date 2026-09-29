---
id: SLAY-9.16
title: 'Solved-result card: no way back to the board (PWA reopen dead end)'
status: To Do
assignee: []
created_date: '2026-09-29 17:09'
updated_date: '2026-09-29 17:09'
labels:
  - story
dependencies:
  - SLAY-9.15
references:
  - src/ui/daily/StartScreen.tsx
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
- [ ] #1 The solved-result card on the start screen has a visible button/link to view the board, navigating to the play route for that day (reusing the existing onPlay wiring, which already resolves to the current day)
- [ ] #2 Clicking it shows the solved board (SLAY-9.13's popover-dismissed board view), not a redirect back to start
- [ ] #3 Verified live: solve a puzzle, reload/reopen the app fresh (landing on '/'), confirm the new button reaches the board
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add a 'View board' button to PuzzleCard's solved branch, calling the same onPlay prop already passed in for the unsolved Play/Continue button.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dependency on SLAY-9.15 is sequencing only (both touch StartScreen.tsx) — no functional relationship.
<!-- SECTION:NOTES:END -->
