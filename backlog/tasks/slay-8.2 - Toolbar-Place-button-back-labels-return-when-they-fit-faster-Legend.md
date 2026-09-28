---
id: SLAY-8.2
title: 'Toolbar: Place button back, labels return when they fit, faster Legend'
status: Done
assignee: []
created_date: '2026-09-28 22:12'
updated_date: '2026-09-28 23:11'
labels: []
dependencies: []
references:
  - src/ui/play/intent.ts
  - src/ui/play/Toolbar.tsx
  - src/ui/play/toolIcons.tsx
  - src/ui/play/strings.ts
  - src/ui/play/play.css
  - src/ui/play/PlayScreen.tsx
  - docs/verification/
modified_files:
  - docs/verification/drive.ts
  - docs/verification/legend.ts
  - docs/verification/locale.ts
  - docs/verification/screens.ts
  - docs/verification/zoom.ts
  - src/ui/play/PlayScreen.tsx
  - src/ui/play/Toolbar.tsx
  - src/ui/play/intent.ts
  - src/ui/play/play.css
  - src/ui/play/toolIcons.tsx
parent_task_id: SLAY-8
type: feature
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: placing a suspect is discoverable again (a Place tool button, not just an undocumented long-press), toolbar button labels come back next to their icons on larger-than-mobile viewports when there is room, and the Legend is one tap away instead of two.
Type: deliverable
Branch: SLAY-8.2/toolbar-place-labels-legend
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A Place tool exists in the toolbar; selecting it and tapping a cell places the selected suspect there (long press still places in every mode, unchanged)
- [ ] #2 On viewports wider than a phone (where the toolbar has room), each tool button shows its text label next to its icon; on phone widths it stays icon-only
- [ ] #3 Legend opens directly from a header icon, not from inside the Options/Help/Legend sheet
- [ ] #4 No regression in the existing undo/redo-restores-selection behaviour (SLAY-4.1) or the eraser's tap/long-press-clear-all gesture
<!-- AC:END -->
