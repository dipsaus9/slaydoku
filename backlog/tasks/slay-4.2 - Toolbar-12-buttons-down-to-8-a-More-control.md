---
id: SLAY-4.2
title: 'Toolbar: 12 buttons down to 8, a More control'
status: To Do
assignee: []
created_date: '2026-09-28 13:17'
labels:
  - story
dependencies: []
references:
  - src/ui/play/Toolbar.tsx
  - src/ui/play/OptionsPanel.tsx
  - src/ui/play/play.css
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
- [ ] #1 Toolbar.tsx's main row renders exactly 8 controls: Note, Place, X, Erase, Undo, Redo, Hint, Zoom
- [ ] #2 A new More control opens Options, Help and Legend, each still reachable in at most one extra tap; every touch target stays at least 44px
- [ ] #3 Auto-X is a toggle inside OptionsPanel.tsx, not a toolbar button; its stored behaviour (src/game options) is unchanged, only its control moved
- [ ] #4 docs/verification's drive/zoom/legend suites are updated for the new control locations (selectors/titles) and pass on all six viewports
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a MoreMenu (or inline collapsible panel) inside Toolbar.tsx holding Zoom's neighbours (Options/Help/Legend) behind one button, wired to the existing onOpenOptions/onOpenHelp/onOpenLegend callbacks PlayScreen.tsx already passes down — no PlayScreen.tsx change should be needed since those callbacks already exist. 2. Remove the Auto-X ToolButton from the main row; add its toggle to OptionsPanel.tsx, reading/writing the same option it already does. 3. Adjust play.css for the new row (8 items) and the More panel. 4. Update docs/verification/drive.ts, zoom.ts, legend.ts wherever they select the moved buttons by title/label. 5. Run verify:phone on all six viewports.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Zoom stays in the main row on purpose (a single-tap toggle used often during play), unlike Options/Help/Legend which are once-per-session actions — this was flagged and confirmed with the owner during planning.
<!-- SECTION:NOTES:END -->
