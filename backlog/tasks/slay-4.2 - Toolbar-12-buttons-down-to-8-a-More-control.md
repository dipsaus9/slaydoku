---
id: SLAY-4.2
title: 'Toolbar: 12 buttons down to 8, a More control'
status: Done
assignee: []
created_date: '2026-09-28 13:17'
updated_date: '2026-09-28 16:01'
labels:
  - story
dependencies: []
references:
  - src/ui/play/Toolbar.tsx
  - src/ui/play/Toolbar.test.tsx
  - src/ui/play/OptionsPanel.tsx
  - src/ui/play/PlayScreen.tsx
  - src/ui/play/PlayScreen.test.tsx
  - src/ui/play/play.css
  - src/ui/play/strings.ts
  - src/ui/play/toolIcons.tsx
  - docs/verification/
parent_task_id: SLAY-4
type: feature
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the play-screen toolbar's main row shows 8 controls (Note, Place, X, Erase, Undo, Redo, Hint, Zoom) instead of 12. Options, Help and Legend move behind one new More control that opens a small panel/sheet; Auto-X becomes a toggle in the Options panel instead of its own toolbar button. Existing colours, spacing and motion tokens (SLAY-2) are reused as-is — this is control-count and layout, not a new art direction.
Type: deliverable
Branch: SLAY-4.2/toolbar-more-menu
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Toolbar.tsx's main row renders exactly 8 controls: Note, Place, X, Erase, Undo, Redo, Hint, Zoom
- [x] #2 A new More control opens Options, Help and Legend, each still reachable in at most one extra tap; every touch target stays at least 44px
- [x] #3 Auto-X is a toggle inside OptionsPanel.tsx, not a toolbar button; its stored behaviour (src/game options) is unchanged, only its control moved
- [x] #4 docs/verification's drive/zoom/legend suites are updated for the new control locations (selectors/titles) and pass on all six viewports
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a More control (local open/closed state) to Toolbar.tsx's third group, holding Options/Help/Legend in a Modal sheet, reusing the existing onOpenOptions/onOpenHelp/onOpenLegend callbacks (no PlayScreen.tsx wiring change needed for those). 2. Remove the Auto-X ToolButton from the main row and the now-dead onToggleAutoX prop/callback (OptionsPanel.tsx already has the Auto-X toggle from a prior story, so no OptionsPanel change is needed for AC3). 3. Add a 'more' icon (toolIcons.tsx) and tools.more string (strings.ts, en+nl). 4. Rework play.css's phone/short-landscape grids from a 6-column, order-hacked layout (12 buttons) to a plain 4-column grid (9 controls: 4+4 modes/actions, More alone on the third row) plus a compact .play-modal__panel--more/.play-more sheet style. 5. Update docs/verification/drive.ts, zoom.ts, legend.ts, screens.ts: open More before tapping Options/Help/Legend, and fix the 'twelve buttons' toolbar-count checks to the new 9-control main row. 6. Run verify:phone (drive, zoom, legend) on all six viewports for AC4 evidence.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Zoom stays in the main row on purpose (a single-tap toggle used often during play), unlike Options/Help/Legend which are once-per-session actions — this was flagged and confirmed with the owner during planning.

Toolbar main row now renders exactly 8 controls (Note/Place/X/Erase/Undo/Redo/Hint/Zoom) plus a new More control (9 total .play-tool elements when closed). More opens a small Modal sheet (.play-modal__panel--more/.play-more) listing Options, Help, Legend, reusing Toolbar's existing onOpenOptions/onOpenHelp/onOpenLegend callbacks -- no PlayScreen.tsx dialog-wiring change needed. Auto-X's toolbar button and the dead onToggleAutoX prop are removed; OptionsPanel.tsx already carried the Auto-X toggle (game('autoXOnPlace', ...)) from an earlier story, so AC3 needed no OptionsPanel change, only removing the now-redundant toolbar control. play.css's phone/short-landscape toolbar grids move from a 6-column, order-hacked 12-button layout to a plain 4-column grid (natural DOM order gives 4+4+More, no reordering hack needed).

AC4 close-out (this session): merged origin/main first (SLAY-4.1 undo/redo-reselect and SLAY-4.3 board/cards restyle had landed since branch cut; both touch disjoint files, clean auto-merge). Two pre-existing driver gaps then surfaced on first verify:phone run, both fixed in docs/verification/ (a declared Reference), same precedent as SLAY-2.7's report.md entry:
1. drive.ts/zoom.ts/legend.ts never pinned the locale to 'en' before loading the play screen (screens.ts already had this fix from SLAY-3.2); on a Dutch-language browser the app defaulted to Dutch and every English-text assertion broke. Pinned via seedStorage(..., 'en'), matching screens.ts.
2. Each driver's tool() helper only slept 250ms after a tap (legend.ts: 0ms) -- fine while every toolbar control was on the main row, but now that Options/Help/Legend sit behind More (a Modal), tapping one right after tool('More') lands inside the 350ms ghost-click guard window (modalGuard.ts) and is silently swallowed. Bumped to 400ms in all three files, matching the 400ms convention already used elsewhere (tapModalBtn, zoom.ts's own dialog waits).
Result after both fixes: bun run lint/typecheck/test --maxWorkers=1 (137 files, 2823 tests) all green; verify:phone SUITES=drive,zoom,legend,screens: 2286 checks, 0 failures across all six viewports (360x640, 390x844, 430x932, 844x390, 1024x768, 768x1024).

Review gate (dipsaus-ai:story-reviewer) first pass: blocked on scope only, all 4 acceptance criteria individually met. It flagged Toolbar.test.tsx, PlayScreen.tsx, PlayScreen.test.tsx, strings.ts and toolIcons.tsx as edited but not declared in References. All five are consequences of the Implementation Plan already written into this task before delivery started (item 2: removing the dead onToggleAutoX prop touches PlayScreen.tsx; item 3: the 'more' icon and tools.more string belong in toolIcons.tsx/strings.ts; Toolbar.tsx's prop-signature and control-count changes require their test files to track them) — the reviewer's own suggested fix was to widen References rather than split the work, so References above now include them.
<!-- SECTION:NOTES:END -->
