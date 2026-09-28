---
id: SLAY-3.3
title: Solver-explanation and hint wording in Dutch
status: To Do
assignee: []
created_date: '2026-09-28 10:20'
labels:
  - story
dependencies:
  - SLAY-3.1
  - SLAY-3.2
references:
  - src/engine/solver/
  - src/game/hintText.ts
parent_task_id: SLAY-3
type: feature
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: every 'why' a hint or a solved step gives (the human-solver explanations, the hint bar text) reads in fluent Dutch when the locale is 'nl'.
Type: deliverable
Branch: SLAY-3.3/solver-hint-text-dutch
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/engine/solver/ (human and advanced technique sentences) and src/game/hintText.ts gain Dutch wording, selected by the current locale, following the same cellName/manyWord/cellList conventions already used in English
- [ ] #2 The existing solver-explanation and hint tests are parametrized over locale and pass for both
- [ ] #3 Playing with hints in Dutch on the real UI shows Dutch explanation text (checked in SLAY-3.6's driver)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read src/engine/solver/human/en.ts and every technique's own sentence templates, plus hintText.ts. 2. Write Dutch equivalents using the same cellName/manyWord/cellList-style helpers (translate the helpers too, e.g. 'row 3, column 4' -> 'rij 3, kolom 4'). 3. Thread locale through the render call sites. 4. Parametrize the existing tests over both locales.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Depends on SLAY-3.2 because this module imports roomName/VICTIM_TEXT/possessive/countWord/objectOn from the clues module, which SLAY-3.2 makes locale-aware; wait for that interface to land.
<!-- SECTION:NOTES:END -->
