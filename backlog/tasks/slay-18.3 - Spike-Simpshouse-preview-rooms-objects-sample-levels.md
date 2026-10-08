---
id: SLAY-18.3
title: 'Spike: Simpshouse preview (rooms, objects, sample levels)'
status: To Do
assignee: []
created_date: '2026-10-08 09:21'
labels:
  - needs-owner-review
dependencies:
  - SLAY-17.1
references:
  - docs/themes/simpshouse/
parent_task_id: SLAY-18
type: spike
ordinal: 127000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: an HTML preview the owner can approve before the Simpshouse theme is built: the room list (EN and NL), every object with its art and allowed rooms, and at least 3 sample levels (a small and a large grid) rendered by the real generator on draft theme data. Theme: a friend-group house with a lot of glamour, trading cards (generic trading-card binders, never Pokemon names or logos) and other fun elements.
Type: spike
Spike justification: how a theme and its levels look has to be seen and judged by the owner; planning cannot settle it from the desk.
Branch: SLAY-18.3/simpshouse-preview
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/themes/simpshouse/preview.html shows rooms (EN and NL), objects with art and allowed rooms, and at least 3 rendered sample levels from the real generator
- [ ] #2 Draft theme data lives in docs/themes/simpshouse/ and is written so the theme story can promote it unchanged
- [ ] #3 The page opens without a build step; screenshots are in the PR
- [ ] #4 Owner has seen the preview and approved or listed changes (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. The next story (SLAY-18.4) builds to the approved preview. Time matters: Simpshouse must ship before 2026-10-14.
<!-- SECTION:NOTES:END -->
