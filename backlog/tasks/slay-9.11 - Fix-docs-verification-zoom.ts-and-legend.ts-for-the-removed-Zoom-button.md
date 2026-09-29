---
id: SLAY-9.11
title: Fix docs/verification/zoom.ts and legend.ts for the removed Zoom button
status: To Do
assignee: []
created_date: '2026-09-29 14:03'
labels:
  - story
dependencies: []
references:
  - docs/verification/zoom.ts
  - docs/verification/legend.ts
parent_task_id: SLAY-9
type: chore
ordinal: 67000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: docs/verification/zoom.ts and docs/verification/legend.ts no longer drive or assert against the removed toolbar Zoom button (SLAY-9.8).
Type: deliverable
Branch: SLAY-9.11/fix-zoom-legend-verification-for-removed-button

Flagged while delivering SLAY-9.8 (already merged): zoom.ts calls tool('Zoom') and checks a .play-tool--zoom selector; legend.ts asserts 'seven toolbar buttons ... Zoom'. Neither file is run by bun run test/lint/typecheck (Chrome-driven manual scripts only, bun run verify:phone), so nothing caught this automatically — but the next manual verify:phone run will fail on both.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/verification/zoom.ts no longer references a Zoom toolbar button (no tool('Zoom') call, no .play-tool--zoom selector); zoom is verified via pinch/ctrl+wheel gestures only, per SLAY-9.8
- [ ] #2 docs/verification/legend.ts's toolbar-button-count assertion is updated to six buttons, not seven, and no longer names Zoom
- [ ] #3 bun run verify:phone passes cleanly across all suites and viewports with no other regression introduced
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Update zoom.ts's scripted scenario to drive zoom via the same pinch/wheel simulation useBoardZoom.ts implements (or whatever gesture-level hook the driver already has for touch/wheel events) instead of clicking a button that no longer exists. Update legend.ts's button-count/name assertions to match the current six-button toolbar.
<!-- SECTION:PLAN:END -->
