---
id: SLAY-9.8
title: 'Toolbar: remove the Zoom button, pinch and ctrl+wheel already cover it'
status: To Do
assignee: []
created_date: '2026-09-29 09:58'
updated_date: '2026-09-29 09:58'
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
- [ ] #1 The Zoom button no longer renders in Toolbar.tsx (toolbar goes from 7 controls to 6)
- [ ] #2 Pinch-to-zoom (touch/pen) and ctrl+wheel zoom (mouse/trackpad) still work exactly as before — useBoardZoom.ts/useGesture.ts are untouched
- [ ] #3 Dead code the button alone used (zoom.ts's isZoomed/zoomLabel helpers, the zoom toolTitle/label strings) is removed if nothing else references it, kept if useBoardZoom.ts's own badge/state UI still needs it
- [ ] #4 Toolbar layout (spacing, grid-template-columns on the phone breakpoint) is adjusted for 6 controls instead of 7, not just left with a gap
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Discoverability tradeoff, noted not re-litigated: the button was the only visible affordance for zoom; pinch/ctrl+wheel are gesture-only with no on-screen hint. Owner made the call explicitly, not something to second-guess in delivery.

Dependency on SLAY-9.2 is sequencing only (both touch play.css) — no functional relationship.
<!-- SECTION:NOTES:END -->
