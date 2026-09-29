---
id: SLAY-9.14
title: >-
  Toolbar buttons: cleaner, consistent desktop style (not just content-hugging
  width)
status: Done
assignee: []
created_date: '2026-09-29 15:34'
updated_date: '2026-09-29 16:20'
labels:
  - story
dependencies:
  - SLAY-9.12
references:
  - src/ui/play/play.css
  - src/ui/play/Toolbar.tsx
parent_task_id: SLAY-9
type: feature
ordinal: 70000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: on desktop, the toolbar's six buttons read as one deliberately-designed row, not a ragged strip of differently-sized buttons each hugging its own label's width.
Type: deliverable
Branch: SLAY-9.14/toolbar-desktop-button-style

Owner feedback on SLAY-9.3's result (already merged): 'you made the buttons as wide as the text. But this is ugly for desktop. Try to make a better design approach with a cleaner button style. It is oke to have different buttons for mobile and desktop.'

Root cause of the current look: SLAY-9.3 changed .play-tool from a fixed width to min-width:44px so no label wraps/clips — correct for the wrapping bug, but on desktop (where every button's icon+label is visible at once in a row) it now produces visibly uneven button widths (e.g. 'X' vs 'Ongedaan').
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 On desktop/wide viewports, toolbar buttons share a consistent, deliberate width (or another cleaner treatment, e.g. icon-beside-label pills) — not simply each button's own content width
- [x] #2 The fix all labels never wrap/clip (SLAY-9.3's original bug) still holds, in both English and Dutch, at the widest label
- [x] #3 Mobile/icon-only breakpoints are free to keep their own distinct compact style — explicitly not required to match the desktop treatment
- [x] #4 Verified against the rendered screen (not just CSS), at both a wide desktop width and the existing mobile/tablet breakpoints, per CLAUDE.md's verification rule
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Design direction is the implementer's call within these constraints — two reasonable options: (a) give desktop toolbar buttons a shared fixed comfortable width sized to fit the longest label in either locale, or (b) switch desktop buttons to a horizontal icon-beside-label pill instead of the current stacked icon-over-label layout. Keep mobile/icon-only breakpoints untouched or given their own simpler treatment.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dependency on SLAY-9.12 is sequencing only (both touch play.css) — no functional relationship.

Chose direction (a): shared fixed width (74px) for .play-tool inside the wide-landscape/desktop row toolbar (@media min-aspect-ratio:1/1), replacing min-width:44px. Sized to fit 'Ongedaan' (NL, longest label, 60px content width) with room to spare inside the 70px available content width (74px - 2*2px padding). Verified with a CDP-driven headless Chrome script (same viewport set as docs/verification/screens.ts: 390x844, 844x390, 768x1024, 1024x768, plus 1440x900 desktop), both locales: all six buttons render at a consistent width on desktop/tablet-landscape with no label clipping (scrollWidth<=clientWidth for every label), portrait tablet keeps its pre-existing equal-width column rail (flex stretch, untouched), and both icon-only mobile breakpoints are unaffected.

Review gate (dipsaus-ai:story-reviewer): verdict=pass, all 4 acceptance criteria met, no scope violations. One advisory finding (reviewer had no browser access to confirm the 74px width against 'Ongedaan' by static CSS reasoning alone) -- already covered by the CDP-driven rendered-screen verification recorded above.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Desktop/wide-landscape toolbar buttons (the row layout under @media (min-aspect-ratio: 1/1)) now share a fixed 74px width instead of each button hugging its own label's content width (SLAY-9.3's min-width:44px). Sized to comfortably fit the longest label in either locale ('Ongedaan', NL). Mobile/icon-only breakpoints and the portrait side-rail column (already equal-width via flex stretch) are untouched. Verified with a CDP-driven headless-Chrome script against the same viewport set as docs/verification/screens.ts (390x844, 844x390, 768x1024, 1024x768) plus a 1440x900 desktop width, in both English and Dutch: all six buttons render at a consistent width with no label clipping. Independent review (dipsaus-ai:story-reviewer): pass, all 4 acceptance criteria met, no scope violations.
<!-- SECTION:FINAL_SUMMARY:END -->
