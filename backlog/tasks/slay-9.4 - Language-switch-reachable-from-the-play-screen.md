---
id: SLAY-9.4
title: 'Language switch: reachable from the play screen'
status: To Do
assignee: []
created_date: '2026-09-29 09:55'
labels:
  - story
dependencies:
  - SLAY-9.2
references:
  - src/ui/play/PlayScreen.tsx
  - src/ui/daily/LocaleToggle.tsx
parent_task_id: SLAY-9
type: feature
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a player can change language (EN/NL) while mid-puzzle; grid state, notes, timer and undo history are unaffected by the switch.
Type: deliverable
Branch: SLAY-9.4/play-screen-locale-toggle

LocaleToggle currently only renders on StartScreen.tsx. Locale plumbing (useLocale/LocaleProvider) already exists app-wide and is already consumed reactively by some play-screen components (e.g. SuspectPanel.tsx); LocaleToggle.tsx's own comment already anticipates this as SLAY-3.1 follow-up work.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 LocaleToggle (or an equivalent control) is reachable from the play screen (e.g. inside the Options modal/header), on both desktop and mobile layouts
- [ ] #2 Switching language mid-puzzle re-renders all play-screen text (clues, toolbar, hints, header) in the new locale without resetting board placements, notes, timer or undo/redo history
- [ ] #3 Every play-screen-reachable component reads locale reactively via useLocale() rather than only once at mount; any component found doing the latter is fixed as part of this story
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Render LocaleToggle inside the play screen (the Options modal is the natural home, next to the desktop-inline Options button from SLAY-9.2). Audit play-screen-reachable components for useLocale() usage to confirm reactivity.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dependency on SLAY-9.2 is sequencing only (both touch PlayScreen.tsx) — no functional relationship.
<!-- SECTION:NOTES:END -->
