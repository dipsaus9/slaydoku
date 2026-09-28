---
id: SLAY-3.4
title: 'Interface text in Dutch: start screen and play screen'
status: To Do
assignee: []
created_date: '2026-09-28 10:20'
labels:
  - story
dependencies:
  - SLAY-3.1
references:
  - src/ui/daily/
  - src/ui/play/
parent_task_id: SLAY-3
type: feature
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: every interface string of the start/daily screen and the play screen (buttons, labels, the how-it-works card, legend, options, result) has a Dutch translation and switches with the locale toggle.
Type: deliverable
Branch: SLAY-3.4/daily-play-text-dutch
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/ui/daily/strings.ts and src/ui/play/strings.ts each carry an 'en' and 'nl' entry; every component that read the flat _EN constant now reads through useLocale()
- [ ] #2 Switching the toggle re-renders the start and play screens in the chosen language immediately, no reload needed
- [ ] #3 Existing daily/play component tests are parametrized over locale and pass for both
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read src/ui/daily/strings.ts and src/ui/play/strings.ts fully. 2. Restructure each into { en: {...}, nl: {...} } (or an equivalent per-key map) and write the Dutch copy. 3. Update every consuming component to call useLocale() and pick the matching entry instead of importing the flat _EN constant. 4. Parametrize existing tests over both locales.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SLAY-3.1 already added the toggle to src/ui/daily/; this story's job is making the rest of that directory (and src/ui/play/) actually react to it.
<!-- SECTION:NOTES:END -->
