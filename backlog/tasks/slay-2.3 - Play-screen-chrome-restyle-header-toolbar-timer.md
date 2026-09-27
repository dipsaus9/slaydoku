---
id: SLAY-2.3
title: 'Play-screen chrome restyle: header, toolbar, timer'
status: Done
assignee: []
created_date: '2026-09-27 12:20'
updated_date: '2026-09-27 13:14'
labels:
  - story
dependencies:
  - SLAY-2.1
references:
  - src/ui/play/play.css
  - src/ui/play/Toolbar.tsx
  - src/ui/play/toolIcons.tsx
parent_task_id: SLAY-2
type: feature
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the play screen's chrome (header/title, timer, back bar, toolbar buttons and their icons) consumes the SLAY-2.1 tokens: the flat gray toolbar becomes warm-toned with a subtle pressed/active state, the header/title uses the display font, and buttons get a short tap-feedback transition. The board itself (floor plan, room icons, suspect placements) is untouched.
Type: deliverable
Branch: SLAY-2.3/play-chrome-restyle
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 src/ui/play/play.css's local --ink/--accent/--line/--paper are replaced by the SLAY-2.1 tokens; toolbar buttons and the back bar use warm surface/border tones instead of flat gray
- [x] #2 The play-screen title and timer use --font-display; toolbar labels stay on --font-body
- [x] #3 Toolbar buttons (src/ui/play/Toolbar.tsx, toolIcons.tsx) get a short press/active transition (transform/opacity, --duration-micro) that collapses under prefers-reduced-motion
- [x] #4 Toolbar.test.tsx, PlayScreen.test.tsx and the verify:phone drive/zoom/legend suites pass unchanged (same DOM text and roles, only style changes)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Replace the local custom properties in play.css with the shared tokens. 2. Restyle .toolbar buttons (surface/border/shadow) and add the press transition. 3. Apply --font-display to the header/title and timer. 4. Run the toolbar/play unit tests and verify:phone drive/zoom/legend.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Board.tsx, BoardLayers.tsx and every icon under src/render/icons are out of scope (board illustrations stay exactly as they are). Only the chrome around the board (header row, toolbar, timer) is in scope.

Replaced play.css's local --ink/--accent/--line/--paper values with the SLAY-2.1 shared tokens (names kept so every existing var(--accent) etc. usage, including Toolbar.test.tsx's CSS regex assertions, stays valid). Gave the header row (.play-header, the back bar) a warm paper surface + line border; header title and timer now use --font-display. Toolbar button hover/active states recolored from the old blue tints to warm case-file-red tints (var(--color-accent-dark) for the pressed states); press transition now runs on var(--duration-micro) (transform/opacity/background/border), which collapses under prefers-reduced-motion via the token itself (no extra media query needed). Verify: bun run lint/typecheck/test all green (2553 tests); bun run verify:phone SUITES=drive,zoom,legend across all six viewports: 1602 checks, 0 failures.

Review gate: independent reviewer (dipsaus-ai:story-reviewer) verdict = pass. All 4 acceptance criteria met, no scope violations, no findings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Play screen chrome (header/back bar, title, timer, toolbar buttons) now consumes the SLAY-2.1 warm evidence-board tokens instead of the old flat gray/blue hardcoded values in play.css: --ink/--accent/--line/--paper are redefined from the shared color tokens, the header row and timer use --font-display, and toolbar button hover/press states use case-file-red tints with a --duration-micro press/active transition that collapses under prefers-reduced-motion. Board, room icons and suspect placements untouched. Verified: lint/typecheck/full unit suite (2553 tests) green, verify:phone drive/zoom/legend across all six viewports (1602 checks, 0 failures), independent review passed.
<!-- SECTION:FINAL_SUMMARY:END -->
