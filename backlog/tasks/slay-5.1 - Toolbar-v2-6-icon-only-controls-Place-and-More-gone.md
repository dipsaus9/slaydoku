---
id: SLAY-5.1
title: 'Toolbar v2: 6 icon-only controls, Place and More gone'
status: To Do
assignee: []
created_date: '2026-09-28 17:16'
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
- [ ] #1 Toolbar.tsx's main row renders exactly 6 controls: Note, X, Erase, Undo, Hint, Zoom, none with a visible text label (icon plus aria-label/title only); every touch target stays at least 44px
- [ ] #2 The 'place' tool is removed from src/ui/play/intent.ts's Tool union and every call site; long-press still places in every remaining mode exactly as it already did outside place-mode
- [ ] #3 A long-press on the Undo button triggers Redo (disabled/no-op when there is nothing to redo, matching the existing disabled-button behaviour); a tap on Undo still undoes
- [ ] #4 Options, Help and Legend open from one small icon in the play-screen header (next to the timer), not from the toolbar, on every viewport; each is still reachable in one tap
- [ ] #5 docs/verification's drive/zoom/legend/screens suites are updated for the new control set and locations (selectors/titles/counts) and pass on all six viewports, English and the Dutch locale driver alike
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Remove 'place' from the Tool union in intent.ts and its handling in resolveTap/paintModeFor/paintAction; confirm long-press-places-everywhere still holds for the remaining modes (note/x/erase). 2. Rebuild Toolbar.tsx: drop the Place button, drop Options/Help/Legend/More, give Undo the same useGesture tap/long-press wiring EraserButton already uses (tap=undo, long-press=redo), strip every ToolButton's visible label (icon + title/aria-label only). 3. Move Options/Help/Legend triggers into PlayScreen.tsx's header row as one small icon+small menu/sheet. 4. Adjust play.css for the smaller icon-only row (remove the two-row main/tools split if a single row now fits; keep 44px targets). 5. Update every docs/verification driver that selects a toolbar button by its old label/position, and the header for the new settings icon. 6. Run verify:phone (English default and the SLAY-3.6 Dutch locale driver) on all six viewports.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
This supersedes SLAY-4.2's More-menu approach, which the owner tested and found did not read as simpler. Keep the same control SET on phone/iPad/desktop — only sizing/spacing should differ per viewport (play.css already has per-viewport rules), never the button count.
<!-- SECTION:NOTES:END -->
