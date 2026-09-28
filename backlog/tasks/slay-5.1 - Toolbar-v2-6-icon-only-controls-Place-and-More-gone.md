---
id: SLAY-5.1
title: 'Toolbar v2: 6 icon-only controls, Place and More gone'
status: In Progress
assignee: []
created_date: '2026-09-28 17:16'
updated_date: '2026-09-28 17:53'
labels:
  - story
dependencies: []
references:
  - src/ui/play/Toolbar.tsx
  - src/ui/play/PlayScreen.tsx
  - src/ui/play/intent.ts
  - src/ui/play/play.css
  - src/ui/play/toolIcons.tsx
  - docs/verification/
parent_task_id: SLAY-5
type: feature
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the play-screen toolbar shows exactly 6 icon-only controls (Note, X, Erase, Undo, Hint, Zoom), the same set on every viewport. Place is removed entirely (long-press already places in every other mode, so the toggle added no capability). Redo is reached by a long-press on Undo, mirroring the Erase button's existing tap-selects/long-press-clears-all pattern already in this codebase. Options, Help and Legend move out of the toolbar into one small icon in the play-screen header, next to the timer. No control keeps a text label; icons alone, with an aria-label/title for accessibility.
Type: deliverable
Branch: SLAY-5.1/toolbar-v2-icon-only
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Toolbar.tsx's main row renders exactly 6 controls: Note, X, Erase, Undo, Hint, Zoom, none with a visible text label (icon plus aria-label/title only); every touch target stays at least 44px
- [x] #2 The 'place' tool is removed from src/ui/play/intent.ts's Tool union and every call site; long-press still places in every remaining mode exactly as it already did outside place-mode
- [x] #3 A long-press on the Undo button triggers Redo (disabled/no-op when there is nothing to redo, matching the existing disabled-button behaviour); a tap on Undo still undoes
- [x] #4 Options, Help and Legend open from one small icon in the play-screen header (next to the timer), not from the toolbar, on every viewport; each is still reachable in one tap
- [x] #5 docs/verification's drive/zoom/legend/screens suites are updated for the new control set and locations (selectors/titles/counts) and pass on all six viewports, English and the Dutch locale driver alike
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Remove 'place' from the Tool union in intent.ts and its handling in resolveTap/paintModeFor/paintAction; confirm long-press-places-everywhere still holds for the remaining modes (note/x/erase). 2. Rebuild Toolbar.tsx: drop the Place button, drop Options/Help/Legend/More, give Undo the same useGesture tap/long-press wiring EraserButton already uses (tap=undo, long-press=redo), strip every ToolButton's visible label (icon + title/aria-label only). 3. Move Options/Help/Legend triggers into PlayScreen.tsx's header row as one small icon+small menu/sheet. 4. Adjust play.css for the smaller icon-only row (remove the two-row main/tools split if a single row now fits; keep 44px targets). 5. Update every docs/verification driver that selects a toolbar button by its old label/position, and the header for the new settings icon. 6. Run verify:phone (English default and the SLAY-3.6 Dutch locale driver) on all six viewports.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
This supersedes SLAY-4.2's More-menu approach, which the owner tested and found did not read as simpler. Keep the same control SET on phone/iPad/desktop — only sizing/spacing should differ per viewport (play.css already has per-viewport rules), never the button count.

Slice 1 (source): Tool union in intent.ts drops 'place'; gestureIntent simplified so long-press always places outside erase (matches prior behaviour minus place-mode). Toolbar.tsx rebuilt to 6 icon-only controls (Note, X, Erase, Undo, Hint, Zoom): ToolButton drops its visible label span, uses aria-label + title instead; new UndoButton mirrors EraserButton's useGesture tap/long-press wiring (tap=undo, long-press=redo), disabled only when neither is possible so redo still works via long-press right after the last undo. Options/Help/Legend triggers moved from Toolbar's More sheet into PlayScreen.tsx's header (small icon next to the timer, same Modal-based sheet, now with a visible-label MenuButton since it's not touch-target-constrained). play.css: toolbar collapsed to one flat group (no more mode/actions/zoom sub-groups), portrait-phone and short-landscape grids changed from 4-col/9-item to 6-col/6-item, .play-tool--more and .play-toolbar__group rules removed. Updated intent.test.ts, Toolbar.test.tsx, PlayScreen.test.tsx for the new shape. Full suite green: lint, typecheck, 2867 tests. Still open: docs/verification driver updates (AC5) and a real verify:phone run.

Slice 2 (verification): updated the toolbar-control finder in drive.ts, zoom.ts, legend.ts, screens.ts and locale.ts to match an element's visible .play-tool__label text OR its aria-label (icon-only main-row controls now carry only the latter; the header sheet's Options/Help/Legend items keep the former). drive.ts: new toolHold() helper (long-press) replaces the two tool('Redo') calls (no Redo button anymore); Eraser/Undo split their shared play-tool--hold marker class into play-tool--erase/play-tool--undo to stay unambiguous. legend.ts: 'nine toolbar buttons, More last' check rewritten to 'six toolbar buttons, Note..Zoom, none with a visible label', scoped to .play-toolbar .play-tool. Ran bun run verify:phone (all 7 suites, all 6 viewports) foreground: 2826 checks, 0 failures. Ran docs/verification/locale.ts (SLAY-3.6 Dutch driver) on all 6 viewports (usually just one): 21 checks x 6 = 126, 0 failures — header settings sheet reads Opties/Help/Legenda in Dutch on every viewport. Added a dated entry to docs/verification/report.md per the file's established convention. lint/typecheck/test (138 files, 2867 tests) all green throughout.
<!-- SECTION:NOTES:END -->
