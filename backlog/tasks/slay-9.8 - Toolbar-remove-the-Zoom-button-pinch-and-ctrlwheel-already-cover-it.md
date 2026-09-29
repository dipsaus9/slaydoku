---
id: SLAY-9.8
title: 'Toolbar: remove the Zoom button, pinch and ctrl+wheel already cover it'
status: Done
assignee: []
created_date: '2026-09-29 09:58'
updated_date: '2026-09-29 14:02'
labels:
  - story
dependencies:
  - SLAY-9.2
references:
  - src/ui/play/Toolbar.tsx
  - src/ui/play/play.css
  - src/ui/play/strings.ts
  - src/ui/play/zoom.ts
parent_task_id: SLAY-9
type: chore
ordinal: 55000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the Zoom toolbar button is removed; two-finger pinch (touch/pen) and ctrl+wheel (mouse/trackpad) already zoom the board (src/ui/play/useBoardZoom.ts), so the button is a redundant seventh control.
Type: deliverable
Branch: SLAY-9.8/remove-zoom-button

Owner: 'the zoom button can be removed, it is not needed as you can just zoom in with your fingers.' Confirmed in code: useBoardZoom.ts already implements two-finger pinch/pan for touch and pen, and ctrl+wheel zoom-at-pointer for mouse — both are already live regardless of the button.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The Zoom button no longer renders in Toolbar.tsx (toolbar goes from 7 controls to 6)
- [x] #2 Pinch-to-zoom (touch/pen) and ctrl+wheel zoom (mouse/trackpad) still work exactly as before — useBoardZoom.ts/useGesture.ts are untouched
- [x] #3 Dead code the button alone used (zoom.ts's isZoomed/zoomLabel helpers, the zoom toolTitle/label strings) is removed if nothing else references it, kept if useBoardZoom.ts's own badge/state UI still needs it
- [x] #4 Toolbar layout (spacing, grid-template-columns on the phone breakpoint) is adjusted for 6 controls instead of 7, not just left with a gap
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Discoverability tradeoff, noted not re-litigated: the button was the only visible affordance for zoom; pinch/ctrl+wheel are gesture-only with no on-screen hint. Owner made the call explicitly, not something to second-guess in delivery.

Dependency on SLAY-9.2 is sequencing only (both touch play.css) — no functional relationship.

Implementation: removed the Zoom ToolButton from Toolbar.tsx (7->6 controls); removed zoom/onZoom props from ToolbarProps and their PlayScreen.tsx wiring (PlayScreen.tsx not in References but required so Toolbar's prop contract stays green). Dead code removed from zoom.ts: zoomLabel (only the button's badge used it) and toggleZoom/BUTTON_SCALE (per zoom.ts's own doc comment, toggleZoom is literally 'the toolbar button' -- its JSDoc even says so; kept isZoomed since Board.tsx and useBoardZoom.ts still need it for the zoomed-state attribute and the ctrl+wheel guard). Removed tools.zoom/toolTitle.zoom from strings.ts (both en+nl) and .play-tool__badge from play.css (only the zoom badge used it). play.css: grid-template-columns repeat(7,...) -> repeat(6,...) at both phone-width icon-only breakpoints, plus doc-comment updates. Updated the paired test files Toolbar.test.tsx, PlayScreen.test.tsx and zoom.test.ts (not in References, but they assert on the exact removed button/exports and would otherwise fail verify -- added a small zoomed2x() test helper in zoom.test.ts in place of the removed toggleZoom for the tests that used it purely as a 2x-view fixture, unrelated to the button itself). useBoardZoom.ts and useGesture.ts untouched, confirming AC2.

Follow-up flagged, not done here (out of References, not part of verify): docs/verification/zoom.ts and docs/verification/legend.ts both drive the play screen via the now-removed Zoom button (tool('Zoom'), zoomButton() selector .play-tool--zoom, 'seven toolbar buttons ... Zoom' checks) -- these Chrome-driven verification scripts are not run by bun run lint/typecheck/test and so stay green for this delivery, but they will fail on their next manual run (bun run verify:phone) until a follow-up story updates them to toggle zoom via pinch/ctrl+wheel simulation instead of the removed button, similar to SLAY-9.10's fix for drive.ts.

Independent review (dipsaus-ai:story-reviewer): verdict PASS. All 4 acceptance criteria met, no scope violations, no findings. Reviewer confirmed useBoardZoom.ts/useGesture.ts untouched, isZoomed correctly kept (still used by useBoardZoom.ts/viewTransform), zoomLabel/toggleZoom/BUTTON_SCALE correctly removed as dead, and the 7->6 column grid + .play-tool__badge removal in play.css. PlayScreen.tsx + the four test files were judged necessitated changes, not scope violations.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Removed the Zoom toolbar button from Toolbar.tsx (7 controls -> 6: Place, Note, X, Erase, Undo, Hint); pinch (touch/pen) and ctrl+wheel (mouse/trackpad) already zoom the board via useBoardZoom.ts, left untouched. Dropped the dead code the button alone used: zoom.ts's zoomLabel, toggleZoom and BUTTON_SCALE (isZoomed kept, still read by Board.tsx and useBoardZoom.ts), the tools.zoom/toolTitle.zoom strings (en+nl), and the .play-tool__badge CSS rule. Adjusted the phone-width icon-only toolbar grid from repeat(7,...) to repeat(6,...) at both breakpoints. Updated PlayScreen.tsx (dropped the now-invalid zoom/onZoom props passed to Toolbar) and the paired test suites (Toolbar.test.tsx, PlayScreen.test.tsx, zoom.test.ts) so verify stays green. Independent review: PASS, all 4 ACs met, no scope violations. Flagged as a follow-up (not done here, out of References and not run by verify): docs/verification/zoom.ts and docs/verification/legend.ts still drive the play screen through the removed Zoom button and will need updating on their next manual run.
<!-- SECTION:FINAL_SUMMARY:END -->
