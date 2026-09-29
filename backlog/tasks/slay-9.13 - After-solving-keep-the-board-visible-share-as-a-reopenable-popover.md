---
id: SLAY-9.13
title: 'After solving: keep the board visible, share as a reopenable popover'
status: To Do
assignee: []
created_date: '2026-09-29 15:34'
labels:
  - story
dependencies: []
references:
  - src/ui/daily/DailyFlow.tsx
  - src/ui/play/PlayScreen.tsx
  - src/ui/play/ResultOverlay.tsx
  - src/ui/daily/StartScreen.tsx
  - src/ui/share/SharePanel.tsx
parent_task_id: SLAY-9
type: feature
ordinal: 69000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: solving no longer force-navigates the player away from the board. The existing solved ResultOverlay (with its embedded share panel) becomes reachable as the finish moment's popover; dismissing it ('View board') leaves the solved board visible and interactive to look at; a persistent Share button reopens the same popover on demand, both on the play screen and on the start screen's solved-result card.
Type: deliverable
Branch: SLAY-9.13/persistent-board-and-share-popover

Root cause: the scaffolding already exists and is unused. PlayScreen.tsx already renders <ResultOverlay .../> with share={resultShare?.(state.check)} when solved, and DailyFlow.tsx's PlayRoute already wires resultShare to <SharePanel/>; ResultOverlay already has a dismiss ('View board') vs restart choice. But DailyFlow.tsx has TWO force-navigates that fire the instant a day becomes solved: the solve() callback calls go('/', true) right after recording the result, and a separate solvedNow effect (route.kind==='play' && status?.kind==='solved') also calls go('/', true) — both race the ResultOverlay out of existence before the player can see it. The start screen currently shows the full SharePanel inline in the solved PuzzleCard (StartScreen.tsx's shareCard), with no popover and no compact button.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Solving a puzzle no longer force-navigates away from the play screen; the player sees the existing ResultOverlay (solved title, time, embedded share panel) as the finish popover
- [ ] #2 Dismissing the popover ('View board') leaves the solved board visible on screen, not a blank/navigated-away state
- [ ] #3 A persistent, visible Share button is reachable after dismissing (on the play screen) and reopens the same share popover on demand
- [ ] #4 The start screen's solved-result card shows a compact Share button instead of the full inline SharePanel, opening the same popover when clicked
- [ ] #5 Revisiting an already-solved day from elsewhere (e.g. an old date via URL, not the moment of solving) is not silently broken — decide deliberately whether it still redirects to the start screen or also shows the board+share button, and document the choice
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. In DailyFlow.tsx, distinguish 'just solved this session' from 'route points at an already-solved day' — only the latter should still force-navigate; a fresh solve should let PlayScreen's own ResultOverlay show. 2. Add a small persistent Share control to PlayScreen's dismissed/solved state, reusing resultShare to reopen ResultOverlay (or a lighter share-only modal). 3. In StartScreen.tsx's PuzzleCard, replace the inline SharePanel with a compact Share button opening the same popover component.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner (Dutch, paraphrased): can't see the finished board after solving; the share page you get should be a popover you get right when you finish instead, plus a visible Share button once finished.
<!-- SECTION:NOTES:END -->
