---
id: SLAY-9.12
title: 'Play screen: board bottom row clipped in fullscreen/wide landscape mode'
status: To Do
assignee: []
created_date: '2026-09-29 14:11'
updated_date: '2026-09-29 14:12'
labels:
  - story
dependencies:
  - SLAY-9.3
references:
  - src/ui/play/play.css
parent_task_id: SLAY-9
type: feature
ordinal: 68000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: in fullscreen/wide-landscape mode the whole board, including the last row, is visible without being cut off at the bottom.
Type: deliverable
Branch: SLAY-9.12/fix-fullscreen-board-clipping

Owner report (screenshot, fullscreen mode): the level's bottom row is cut off. Likely area: play.css's landscape rule (@media (min-aspect-ratio: 1/1)) sets --board: min(calc(100dvh - 76px), 64vw) — a fixed 76px offset for the header. If the actual rendered header height (the play-header row plus, on the daily play route, the overlaid daily-play__nav bar) exceeds 76px in this mode, the board is sized taller than the space actually left below the header, pushing the last row off-screen with no scroll available. Needs live reproduction in an actual fullscreen/wide-landscape context (not just a code read) to confirm the exact mismatch before fixing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The full board, including its last row, is visible without clipping or requiring scroll in fullscreen/wide-landscape mode, verified on a real puzzle (not just a small demo grid)
- [ ] #2 Fix holds across board sizes (6x6 through 12x12) and both the daily play route and the puzzle lab, if the lab shares this layout
- [ ] #3 No regression to the portrait/mobile layout or the existing --play-top-clearance reconciliation (SLAY-6.1)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Reproduce first (real browser, fullscreen/wide-landscape, a real scheduled puzzle) to confirm whether the fixed 76px header offset in the @media (min-aspect-ratio: 1/1) rule is the actual mismatch, or something else (safe-area insets, the daily-play__nav overlay height). Fix at the root — derive the offset from the actual header height rather than a hardcoded number, if that's the cause.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner note (Dutch): 'Full screen modus is het level net afgekapt onderin.' Screenshot attached in conversation, not in repo — confirm the exact viewport/board size from the screenshot's proportions if needed (looked like a 9x9 board, landscape desktop width).

Dependency on SLAY-9.3 is sequencing only (both touch play.css) — no functional relationship.
<!-- SECTION:NOTES:END -->
