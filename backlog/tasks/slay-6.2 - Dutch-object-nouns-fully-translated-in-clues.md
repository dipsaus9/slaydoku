---
id: SLAY-6.2
title: 'Dutch: object nouns fully translated in clues'
status: To Do
assignee: []
created_date: '2026-09-28 18:57'
labels:
  - story
dependencies: []
references:
  - src/engine/clues/nl.ts
  - docs/verification/
parent_task_id: SLAY-6
type: feature
ordinal: 36000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: every object noun a Dutch clue sentence uses (chair, rug, bookshelf, and every other OBJECT_WORDS entry) is Dutch, not the English noun the game draws on the board. Prepositions, verbs, gender/article agreement follow normal Dutch grammar for the translated noun.
Type: deliverable
Branch: SLAY-6.2/dutch-object-nouns
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/engine/clues/nl.ts's OBJECT_WORDS_NL carries a real Dutch noun for every ObjectType (currently the noun is deliberately the unchanged English word, per its own comment); the article ('de'/'het') and preposition/verb agree with the Dutch noun's gender, not assumed from English
- [ ] #2 Every existing clue test that asserts Dutch object-noun wording is updated to the real translation (not the placeholder English-noun behaviour)
- [ ] #3 The rendered-screen check and the Dutch locale driver confirm real Dutch object nouns on a sample of scheduled days across every theme (home/office/park/school/shop), not just one
- [ ] #4 No English text, object type id, or clue logic changes; en.ts is untouched
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Translate every OBJECT_WORDS entry's noun to Dutch (chair->stoel, rug->kleed, bed->bed, sofa->bank, car->auto, bookshelf->boekenkast, table->tafel, TV->tv, plant->plant, etc. — cover the full list in en.ts, including compound nouns like 'washing machine'->wasmachine, 'dining table'->eettafel, 'kitchen counter'->aanrecht). 2. Set each noun's grammatical gender (de/het) correctly and update withArticleNl accordingly if it currently assumes one pattern. 3. Update the existing Dutch clue tests to the real translations. 4. Run the rendered-screen check and locale driver across all five themes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Root cause: OBJECT_WORDS_NL currently maps 1:1 onto the English OBJECT_WORDS noun by explicit design choice at SLAY-3.2 time (see its own doc comment) — this story reverses that choice at the owner's request. Cast names and room/theme names (already fixed in SLAY-5.2) are out of scope; this is object nouns only.
<!-- SECTION:NOTES:END -->
