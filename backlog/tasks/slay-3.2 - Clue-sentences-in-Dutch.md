---
id: SLAY-3.2
title: Clue sentences in Dutch
status: To Do
assignee: []
created_date: '2026-09-28 10:20'
labels:
  - story
dependencies:
  - SLAY-3.1
references:
  - src/engine/clues/
parent_task_id: SLAY-3
type: feature
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: every clue-card sentence (placement clues, gender clues, room-edge, combined 'both' clues, every relational clue kind) renders in fluent Dutch when the locale is 'nl', meaning-equivalent to the English wording and following the same house style (short sentences, no gendered pronouns — gender is a noun, 'man'/'vrouw' — room/object nouns matching what the board draws).
Type: deliverable
Branch: SLAY-3.2/clue-text-dutch
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/engine/clues/ gains a Dutch counterpart of every English template (OBJECT_WORDS, gender words, relational/room-edge/combined clue wording); the clue-rendering functions take the current locale (from SLAY-3.1's Locale type) and select the matching wording
- [ ] #2 Every clue kind covered by the existing English test suite has an equivalent Dutch case (parametrized over locale, not a duplicated file) and passes
- [ ] #3 The rendered-screen verification (docs/verification) finds every clue card's text on screen in Dutch too, for a sample of scheduled days
- [ ] #4 The header comment in src/engine/clues/en.ts referencing a no-longer-existing src/language.test.ts guard is corrected to describe the real locale split
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read the full English template set (OBJECT_WORDS, gender words, relational/room-edge/combined clue functions) and the noun-audit rules that constrain wording. 2. Write the Dutch equivalents alongside them, one module per kind mirroring the English file layout. 3. Thread a locale parameter through the render functions the app actually calls (check every call site so nothing keeps calling the English module directly). 4. Parametrize the existing test suite over both locales. 5. Run the rendered-screen check in Dutch on a sample of days.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
This is the largest story of the epic (roughly 400 lines of English template logic to mirror). Keep it as one story for phrasing consistency rather than splitting by clue kind. Cast names and room/object English nouns used as labels stay as they are — only the surrounding sentence grammar changes.
<!-- SECTION:NOTES:END -->
