---
id: SLAY-2.3
title: 'Play-screen chrome restyle: header, toolbar, timer'
status: To Do
assignee: []
created_date: '2026-09-27 12:20'
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
- [ ] #1 src/ui/play/play.css's local --ink/--accent/--line/--paper are replaced by the SLAY-2.1 tokens; toolbar buttons and the back bar use warm surface/border tones instead of flat gray
- [ ] #2 The play-screen title and timer use --font-display; toolbar labels stay on --font-body
- [ ] #3 Toolbar buttons (src/ui/play/Toolbar.tsx, toolIcons.tsx) get a short press/active transition (transform/opacity, --duration-micro) that collapses under prefers-reduced-motion
- [ ] #4 Toolbar.test.tsx, PlayScreen.test.tsx and the verify:phone drive/zoom/legend suites pass unchanged (same DOM text and roles, only style changes)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Replace the local custom properties in play.css with the shared tokens. 2. Restyle .toolbar buttons (surface/border/shadow) and add the press transition. 3. Apply --font-display to the header/title and timer. 4. Run the toolbar/play unit tests and verify:phone drive/zoom/legend.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Board.tsx, BoardLayers.tsx and every icon under src/render/icons are out of scope (board illustrations stay exactly as they are). Only the chrome around the board (header row, toolbar, timer) is in scope.
<!-- SECTION:NOTES:END -->
