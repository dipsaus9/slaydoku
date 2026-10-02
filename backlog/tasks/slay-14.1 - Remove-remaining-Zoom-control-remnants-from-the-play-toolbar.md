---
id: SLAY-14.1
title: Remove remaining Zoom control remnants from the play toolbar
status: To Do
assignee: []
created_date: '2026-10-02 09:54'
labels:
  - story
dependencies: []
references:
  - src/ui/play/Toolbar.tsx
  - src/ui/play/Toolbar.test.tsx
  - src/ui/play/toolIcons.tsx
  - src/ui/play/strings.ts
parent_task_id: SLAY-14
type: chore
ordinal: 89000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: no Zoom control is reachable on the play screen; any dead remnants of the removed Zoom button (SLAY-9.8) are deleted. Pinch and ctrl+wheel zoom (useBoardZoom.ts, zoom.ts) stay.
Type: deliverable
Branch: SLAY-14.1/remove-zoom-remnants
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 No element on the rendered play screen is labelled Zoom/Inzoomen (or has a zoom icon) at 360px and 1280px, in en and nl
- [ ] #2 Unused zoom button strings/icons in src/ui/play/strings.ts and toolIcons.tsx are removed; pinch and ctrl+wheel zoom still work (existing zoom tests pass)
- [ ] #3 bun run lint, bun run typecheck, bun run test --maxWorkers=1 stay green
<!-- AC:END -->
