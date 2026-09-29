---
id: SLAY-9.11
title: Fix docs/verification/zoom.ts and legend.ts for the removed Zoom button
status: Done
assignee: []
created_date: '2026-09-29 14:03'
updated_date: '2026-09-29 15:17'
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
- [x] #1 docs/verification/zoom.ts no longer references a Zoom toolbar button (no tool('Zoom') call, no .play-tool--zoom selector); zoom is verified via pinch/ctrl+wheel gestures only, per SLAY-9.8
- [x] #2 docs/verification/legend.ts's toolbar-button-count assertion is updated to six buttons, not seven, and no longer names Zoom
- [x] #3 bun run verify:phone passes cleanly across all suites and viewports with no other regression introduced
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Update zoom.ts's scripted scenario to drive zoom via the same pinch/wheel simulation useBoardZoom.ts implements (or whatever gesture-level hook the driver already has for touch/wheel events) instead of clicking a button that no longer exists. Update legend.ts's button-count/name assertions to match the current six-button toolbar.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
verify:phone (bun run verify:phone, OUT set to an isolated dir since another worker's concurrent run collided on the default shared /tmp OUT the first time) passed cleanly: 2808 checks, 0 failures across all 6 viewports and all 7 suites, including zoom (42 checks/viewport) and legend (113-117 checks/viewport).

Independent review (dipsaus-ai:story-reviewer): verdict pass. AC1 met (no tool('Zoom')/.play-tool--zoom left), AC2 met (six-button assertion, no Zoom), AC3 met (verify:phone 2808 checks/0 failures, no cross-driver regression risk from the diff). No scope violations, no findings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Rewrote docs/verification/zoom.ts and legend.ts so they no longer drive or assert the toolbar Zoom button that SLAY-9.8 removed. zoom.ts's zoom-in/zoom-reset steps now pinch the board from the frame's centre (new pinchZoomIn/pinchZoomReset helpers using the existing two-finger touch dispatch) instead of clicking a button that no longer exists; the button-state assertions (aria-pressed, 1x/2x label, hit target) are dropped along with zoomButton(). legend.ts's toolbar-button-count check now expects six buttons (Place, Note, X, Erase, Undo, Hint), and its zoomed-legend scenario pinches to 2x the same way. Verified with bun run lint, bun run typecheck, bun run test --maxWorkers=1 (3017 tests) and a full bun run verify:phone run (isolated OUT dir to avoid colliding with a concurrent worker's own run): 2808 checks, 0 failures across all 7 suites and all 6 viewports. Independent review verdict: pass, no scope violations, no findings.
<!-- SECTION:FINAL_SUMMARY:END -->
