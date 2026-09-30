---
id: SLAY-9.20
title: >-
  Play-screen header: title still overlaps the timer on real narrow phones
  (360-390px)
status: To Do
assignee: []
created_date: '2026-09-29 21:01'
labels:
  - story
dependencies: []
references:
  - src/ui/daily/daily.css
parent_task_id: SLAY-9
type: feature
ordinal: 77000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the play-screen header's puzzle title never visually overlaps the timer on real phone widths.
Type: deliverable
Branch: SLAY-9.20/fix-header-title-timer-overlap

Flagged (not fixed) while delivering SLAY-9.13: a CDP measurement against a clean main build showed .daily-play__nav's title overlapping .play-header's timer at real 360-390px widths, with the then-current 112px icon-row reserve and the original 3-icon set — a pre-existing bug, unrelated to SLAY-9.13's own change, never turned into a story until now (owner reported the same symptom directly, 2026-09-29).

Confirmed still present in the current code: daily.css's ≤640px breakpoint (~line 665, ~line 738) still reserves a flat 112px (or 245px once the share button exists, SLAY-9.16/9.13) for the icon row, and .daily-play__title (~line 694) only got an ellipsis-truncation fallback ('belt-and-suspenders') added on top — not a fix for the underlying space shortage that causes the overlap at real narrow widths in the first place.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The puzzle title and the timer never visually overlap at real phone widths (measure the actual DOM boxes in a real or headless browser at 360px and 390px, not just a resized desktop window)
- [ ] #2 Fix holds with and without the Share button present (3-icon and 4-icon states, SLAY-9.13/9.16)
- [ ] #3 The existing ellipsis truncation on the title can stay as a fallback for very long titles, but is not relied on to hide this specific overlap
- [ ] #4 Verified against the actual rendered screen at true narrow phone widths, per CLAUDE.md's rule
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Reproduce first at real 360/390px widths (not a resized desktop viewport) with a real puzzle. Root cause is likely the flat 112px/245px icon-row reserve not leaving enough room for the title at these widths — consider deriving the reserve from the actual icon-row width instead of a hardcoded number, similar to how SLAY-9.12 fixed the analogous landscape board-height calc.
<!-- SECTION:PLAN:END -->
