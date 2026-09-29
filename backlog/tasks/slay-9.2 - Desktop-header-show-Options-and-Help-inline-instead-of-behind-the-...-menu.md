---
id: SLAY-9.2
title: 'Desktop header: show Options and Help inline instead of behind the ... menu'
status: To Do
assignee: []
created_date: '2026-09-29 09:55'
labels:
  - story
dependencies: []
references:
  - src/ui/play/PlayScreen.tsx
  - src/ui/play/play.css
parent_task_id: SLAY-9
type: feature
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: on wide/desktop viewports, Options and Help render as direct header actions; the ... (More) collapse is reserved for viewports too narrow to fit them.
Type: deliverable
Branch: SLAY-9.2/desktop-header-options-inline

The More menu today (PlayScreen.tsx, play-header__more) opens a Modal containing only Options and Help MenuButtons — the toolbar itself already shows all 7 controls inline on every viewport (no toolbar buttons are behind this menu).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 At desktop widths, Options and Help appear as their own buttons in .play-header__actions, not inside the More modal
- [ ] #2 Below that breakpoint, behavior is unchanged: Options/Help stay behind the ... (More) button
- [ ] #3 Legend icon's existing direct-icon behavior (already not behind More) is unaffected
- [ ] #4 Any existing test asserting the More modal always contains exactly Options+Help is updated deliberately, not left failing or silently changed
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add a desktop-width media query in play.css that shows the two MenuButtons (currently only rendered inside the More Modal, PlayScreen.tsx around lines 251-269) as inline header buttons, and hides/removes the ... trigger at that width; keep the Modal + trigger for narrower widths.
<!-- SECTION:PLAN:END -->
