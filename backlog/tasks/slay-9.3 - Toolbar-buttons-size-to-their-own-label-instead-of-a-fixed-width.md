---
id: SLAY-9.3
title: Toolbar buttons size to their own label instead of a fixed width
status: To Do
assignee: []
created_date: '2026-09-29 09:55'
updated_date: '2026-09-29 09:58'
labels:
  - story
dependencies:
  - SLAY-9.2
  - SLAY-9.8
references:
  - src/ui/play/play.css
  - src/ui/play/Toolbar.tsx
parent_task_id: SLAY-9
type: feature
ordinal: 50000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: no toolbar button label wraps or gets cut off at any viewport where labels are shown, because a button's width follows its own icon+label content rather than a shared fixed width.
Type: deliverable
Branch: SLAY-9.3/toolbar-button-width

Root cause: .play-tool has a fixed width (64px default, 58px in the wide/landscape rule), flex-direction:column (label below icon), and .play-tool__label has no white-space:nowrap or overflow rule — so a longer label like Dutch 'Ongedaan' simply wraps to a second line inside a button that can then grow taller than its siblings.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ongedaan (and every other toolbar label, NL and EN) renders fully on one line without wrapping or clipping, at every viewport where labels are shown
- [ ] #2 Toolbar buttons no longer share a fixed width; each sizes to its own content within existing padding/min-tap-target rules (minimum 44px touch target preserved)
- [ ] #3 No visual regression to the icon-only phone/short-landscape breakpoints (.play-tool__label { display:none } paths untouched)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Replace .play-tool's fixed width with min-width/content-driven sizing in the breakpoints where labels are visible; add white-space:nowrap to .play-tool__label (matching the nowrap+ellipsis pattern already used elsewhere in play.css) so a label that still can't fit truncates predictably instead of wrapping.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dependencies on SLAY-9.2 and SLAY-9.8 are sequencing only (all three touch play.css); SLAY-9.8 also removes a button first so this story sizes the final 6-button set once, not the 7-button set then again after removal.
<!-- SECTION:NOTES:END -->
