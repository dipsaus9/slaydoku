---
id: SLAY-9.17
title: >-
  Stats popover: unreadable Sluiten/Close button, remove device-only privacy
  line
status: To Do
assignee: []
created_date: '2026-09-29 17:09'
labels:
  - story
dependencies: []
references:
  - src/ui/stats/StatsPanel.tsx
  - src/ui/stats/strings.ts
  - src/ui/play/play.css
parent_task_id: SLAY-9
type: feature
ordinal: 73000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the stats popover's Close button is readable, and the 'stays only on this device' line is removed.
Type: deliverable
Branch: SLAY-9.17/stats-popover-contrast-and-copy

Bug 1, confirmed live (screenshot): the Close/'Sluiten' button in the stats popover (src/ui/stats/StatsPanel.tsx) renders dark navy text on a red background — nearly unreadable. Root cause: play.css's white-text rule for .play-btn--primary is scoped '.play .play-btn--primary { color: #fff }' (play.css ~line 482), so it only applies when the button is nested inside the .play screen container. The stats popover is reachable from the start screen, outside .play, so this button falls back to the default dark text color instead of white — while the same class used inside the play screen (e.g. the ResultOverlay's buttons) renders correctly.

Bug 2: owner wants the line 'Blijft alleen op dit apparaat. Er wordt niets verstuurd.' (src/ui/stats/strings.ts, device: '...', en: 'Kept on this device only. Nothing is sent anywhere.') removed from the stats popover.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The stats popover's primary/Close button has readable contrast (white or otherwise sufficiently contrasting text) regardless of where the popover is opened from, not just when nested inside .play
- [ ] #2 Check whether any other .play-btn--primary or .play-btn--danger usage outside the .play screen has the same contrast bug (e.g. other modals opened from the start screen) and fix the same way — don't special-case only the stats popover
- [ ] #3 The device-only privacy line is removed from the stats popover
- [ ] #4 Verified against the actual rendered screen, not just the CSS diff
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Fix the color rule at the root: either give .play-btn--primary/.play-btn--danger their white-text color unconditionally (dropping the '.play ' ancestor scope) if nothing relies on the unscoped default elsewhere, or add the same color rule scoped to wherever Modal/StatsPanel actually renders (e.g. under a shared modal root class) instead of only .play. Prefer the unconditional fix unless it breaks something else.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner (Dutch): 'Zwarte tekst op rode button is niet leesbaar' + 'Blijft alleen op dit apparaat, staat er dubbel in' (the phrasing suggests it also reads as redundant with disclosure elsewhere, e.g. the About page's privacy section).
<!-- SECTION:NOTES:END -->
