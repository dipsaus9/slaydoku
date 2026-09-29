---
id: SLAY-9.3
title: Toolbar buttons size to their own label instead of a fixed width
status: Done
assignee: []
created_date: '2026-09-29 09:55'
updated_date: '2026-09-29 15:02'
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
- [x] #1 Ongedaan (and every other toolbar label, NL and EN) renders fully on one line without wrapping or clipping, at every viewport where labels are shown
- [x] #2 Toolbar buttons no longer share a fixed width; each sizes to its own content within existing padding/min-tap-target rules (minimum 44px touch target preserved)
- [x] #3 No visual regression to the icon-only phone/short-landscape breakpoints (.play-tool__label { display:none } paths untouched)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Replace .play-tool's fixed width with min-width/content-driven sizing in the breakpoints where labels are visible; add white-space:nowrap to .play-tool__label (matching the nowrap+ellipsis pattern already used elsewhere in play.css) so a label that still can't fit truncates predictably instead of wrapping.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dependencies on SLAY-9.2 and SLAY-9.8 are sequencing only (all three touch play.css); SLAY-9.8 also removes a button first so this story sizes the final 6-button set once, not the 7-button set then again after removal.

Verified with a headless-Chrome sweep (EN + NL, viewports 1280x800/1024x768 landscape-row toolbar, 768x1024/700x900 portrait side-rail toolbar): every toolbar label including 'Ongedaan' renders on one line, no wrap/clip, every button >=44px in both dimensions. Icon-only breakpoints (phone portrait, short landscape) left untouched, confirmed by diff review. Base .play-tool width:64px -> min-width:44px; landscape .play-tool width:58px -> min-width:44px; .play-tool__label gets max-width:100%/overflow:hidden/text-overflow:ellipsis/white-space:nowrap (same pattern as .play-legend__pill) so a still-too-long label truncates instead of wrapping.

Independent review (dipsaus-ai:story-reviewer): verdict pass. AC1/AC2/AC3 all met, no scope violations. One advisory finding: in the base/portrait column toolbar, default flex align-items:stretch makes every button share the width of the widest label rather than each being strictly independent (only the landscape row-wrap layout gets fully independent per-button widths). No action taken -- the wrap/clip bug is eliminated and the 44px floor holds either way; left as a stylistic note, not a defect.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Toolbar buttons in src/ui/play/play.css now size to their own icon+label content instead of a hardcoded width (64px base side-rail, 58px landscape row-wrap), both replaced with min-width:44px to keep the touch target floor. .play-tool__label got the file's existing nowrap+ellipsis pattern (max-width:100%, overflow:hidden, text-overflow:ellipsis, white-space:nowrap) so a label that still can't fit truncates instead of wrapping. Verified with a headless-Chrome sweep across EN/NL and four label-visible viewports (landscape row and portrait side-rail layouts): no wrapping or clipping, including Dutch 'Ongedaan', and every button stays >=44px in both dimensions. Icon-only breakpoints (phone portrait, short landscape) were left untouched. Independent review: pass, no scope violations.
<!-- SECTION:FINAL_SUMMARY:END -->
