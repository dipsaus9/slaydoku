---
id: SLAY-9.13
title: 'After solving: keep the board visible, share as a reopenable popover'
status: Done
assignee: []
created_date: '2026-09-29 15:34'
updated_date: '2026-09-29 16:26'
labels:
  - story
dependencies: []
references:
  - src/ui/daily/DailyFlow.tsx
  - src/ui/play/PlayScreen.tsx
  - src/ui/play/ResultOverlay.tsx
  - src/ui/daily/StartScreen.tsx
  - src/ui/share/SharePanel.tsx
  - src/ui/play/strings.ts
  - src/ui/daily/daily.css
  - src/ui/daily/daily.test.tsx
  - src/ui/play/PlayScreen.test.tsx
  - src/ui/share/share.test.tsx
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
- [x] #1 Solving a puzzle no longer force-navigates away from the play screen; the player sees the existing ResultOverlay (solved title, time, embedded share panel) as the finish popover
- [x] #2 Dismissing the popover ('View board') leaves the solved board visible on screen, not a blank/navigated-away state
- [x] #3 A persistent, visible Share button is reachable after dismissing (on the play screen) and reopens the same share popover on demand
- [x] #4 The start screen's solved-result card shows a compact Share button instead of the full inline SharePanel, opening the same popover when clicked
- [x] #5 Revisiting an already-solved day from elsewhere (e.g. an old date via URL, not the moment of solving) is not silently broken — decide deliberately whether it still redirects to the start screen or also shows the board+share button, and document the choice
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. In DailyFlow.tsx, distinguish 'just solved this session' from 'route points at an already-solved day' — only the latter should still force-navigate; a fresh solve should let PlayScreen's own ResultOverlay show. 2. Add a small persistent Share control to PlayScreen's dismissed/solved state, reusing resultShare to reopen ResultOverlay (or a lighter share-only modal). 3. In StartScreen.tsx's PuzzleCard, replace the inline SharePanel with a compact Share button opening the same popover component.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner (Dutch, paraphrased): can't see the finished board after solving; the share page you get should be a popover you get right when you finish instead, plus a visible Share button once finished.

Widened References to add src/ui/play/strings.ts (needed a new localized 'Share' label for the persistent post-dismiss Share button on PlayScreen; every player-facing string in this codebase goes through the locale strings files, so hardcoding it in PlayScreen.tsx was not an option). No CSS files needed: the new buttons reuse already-defined classes (.play-header__legend on the play screen, .daily-btn/.daily-btn--primary on the start screen) and the popover reuses the existing Modal component (src/ui/play/Modal.tsx, imported unchanged, not modified).

Widened References again to add src/ui/daily/daily.css. Live-browser verification (per CLAUDE.md's render-the-screen rule) at a narrow phone width caught a real regression from the new persistent Share button: .daily-play__nav (DailyFlow's overlaid back+title bar) reserves a hardcoded 'right: calc(... + 112px)' strip at phone widths (daily.css lines ~495 and ~543) sized for PlayScreen's OLD 3-icon action row (timer, legend, more); adding a 4th icon (Share) pushed the actions row wider than that reserved strip, so the puzzle-date title visibly overlapped the timer/Share buttons at narrow widths (measured via getBoundingClientRect: title right edge 276.5px vs timer start 254.5px at innerWidth 500). Fixed by widening both hardcoded reserves from 112px to 164px (+52px = one more 44px icon button + its 8px gap), matching the same budget the timer/legend/more icons already account for.

Refined the daily.css fix: instead of unconditionally widening .daily-play__nav's right-reserve (which would have over-truncated the puzzle-date title during ordinary, unsolved play too -- the common case, where the persistent Share button is not even rendered yet), the wider 245px reserve now only applies via a :has([data-action="share"]) guard, so it only kicks in once the Share button actually exists in the DOM (solved + dismissed). Verified with a headless-Chrome CDP harness (real device-metrics viewport, not window resize, which floors around 500px and cannot reach true phone widths) at 360/390/430px: no overlap in the solved state (-4px margin), and the unsolved state is byte-identical to the original 112px-reserve layout. Also added unconditional overflow:hidden/text-overflow:ellipsis/white-space:nowrap to .daily-play__title as defense in depth. IMPORTANT — found and did NOT fix, out of this story's scope: the SAME CDP measurement against an unmodified main-branch checkout (before any SLAY-9.13 change) shows .daily-play__nav's title box already overlapping the play-header's timer button by ~75px at real widths 360-390px, with the ORIGINAL, untouched 112px reserve and the OLD 3-icon set (timer/legend/more, no Share) -- a pre-existing bug, unrelated to this story, most likely never visible before because the old force-navigate-away made this exact post-solve header state unreachable long enough to see. Flagging for a follow-up story (recalibrate .daily-play__nav's phone/landscape right-reserve against the real play-header width, or make it fully dynamic).

Widened References a third time after the review gate's round-1 block: added the three test files touched to verify the behavior change (src/ui/daily/daily.test.tsx, src/ui/play/PlayScreen.test.tsx, src/ui/share/share.test.tsx) -- each is the existing test sibling of an already-declared production file (StartScreen.tsx, PlayScreen.tsx, SharePanel.tsx/DailyFlow.tsx's share wiring) and was updated only to match this story's intentional behavior change (the share panel is no longer rendered inline, so daily.test.tsx's and share.test.tsx's old assertions on that inline markup needed updating; PlayScreen.test.tsx gained two new tests for the persistent Share control). All 5 acceptance criteria were verdict-'met' in review round 1; the block was scope-only. Re-submitting for review round 2.

Independent review (dipsaus-ai:story-reviewer) round 2: verdict PASS. All 5 acceptance criteria met, no scope violations, no findings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Solving a puzzle no longer force-navigates the player off the play screen: DailyFlow.tsx's two go('/', true) calls (the solve() callback and the solvedNow effect) are gone, and 'playable' no longer excludes a solved day, so PlayScreen's own ResultOverlay becomes the finish popover, dismissing it ('View the board') leaves the solved board on screen, and a new persistent Share button in PlayScreen's header reopens the same overlay on demand. The start screen's solved-result card now shows a compact Share button (reusing the existing daily-btn chrome) that opens the same share panel in a Modal popover instead of the old full inline SharePanel. AC #5's deliberate choice: an already-solved day reached from elsewhere (reload, back button, a bare /play URL) now also lands on PlayScreen with the board and persistent Share button, the same as a fresh solve, rather than redirecting to the start screen — documented in a DailyFlow.tsx code comment; this changes no capability (replaying a solved day was already reachable via the result dialog's own 'Play again'), only whether the board is force-hidden first. References were widened twice during delivery (recorded in the notes, with rationale each time): src/ui/play/strings.ts for a new localized 'Share' label, and src/ui/daily/daily.css to fix a real header-overlap regression the new persistent Share button caused at real phone widths (measured via a headless-Chrome CDP harness at 360/390/430px, not window resizing, which cannot reach true phone widths) — the fix is gated behind :has([data-action="share"]) so ordinary, unsolved play keeps its original, unaffected layout. Also found and flagged (not fixed, out of scope): a pre-existing, unrelated header-overlap bug already present on unmodified main at these same real widths, most likely unreachable before this story because the old force-navigate made this exact post-solve header state unreachable long enough to see. Verified live in a real browser (not just component tests) per CLAUDE.md's render-the-screen rule: played a 6x6 puzzle to completion end to end, confirmed the popover appears without navigating away, the board stays visible and interactive after dismissing, the persistent Share button reopens the popover, the start screen's compact Share button opens the same panel in a popover, and a fresh /play load of an already-solved day reproduces the same experience. lint/typecheck/test all green (141 files, 3021 tests). Independent review (dipsaus-ai:story-reviewer): round 1 blocked on scope only (three touched test files not yet in References, all 5 ACs already 'met'); References widened with rationale; round 2 verdict PASS, all 5 acceptance criteria met, no scope violations, no findings.
<!-- SECTION:FINAL_SUMMARY:END -->
