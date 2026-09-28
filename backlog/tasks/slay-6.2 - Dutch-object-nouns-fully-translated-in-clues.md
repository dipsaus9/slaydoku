---
id: SLAY-6.2
title: 'Dutch: object nouns fully translated in clues'
status: Done
assignee: []
created_date: '2026-09-28 18:57'
updated_date: '2026-09-28 19:38'
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
- [x] #1 src/engine/clues/nl.ts's OBJECT_WORDS_NL carries a real Dutch noun for every ObjectType (currently the noun is deliberately the unchanged English word, per its own comment); the article ('de'/'het') and preposition/verb agree with the Dutch noun's gender, not assumed from English
- [x] #2 Every existing clue test that asserts Dutch object-noun wording is updated to the real translation (not the placeholder English-noun behaviour)
- [x] #3 The rendered-screen check and the Dutch locale driver confirm real Dutch object nouns on a sample of scheduled days across every theme (home/office/park/school/shop), not just one
- [x] #4 No English text, object type id, or clue logic changes; en.ts is untouched
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Translate every OBJECT_WORDS_NL entry to a real Dutch noun (src/engine/clues/nl.ts), with grammatical gender (de/het) recorded per noun; keep withArticleNl's indefinite 'een' unchanged (Dutch's indefinite article does not vary by gender). 2. Simplify anObjectNl/bareObjectNl to always use the type's one Dutch generic noun (drop the drawn-kind English specificNoun path entirely for Dutch — no Dutch translation of theme kind names exists yet, so Dutch never names the specific drawn kind the way English does; that stays a follow-up story). 3. Update every existing Dutch clue-text test literal (en.test.ts, relational/en.test.ts, both.test.ts) plus two solver-explanation pinned tests outside this story's own References that broke as a direct, correct consequence (explanations.test.ts, techniques.test.ts) to the real translations. 4. Add a direct OBJECT_WORDS_NL completeness/regression test in en.test.ts's Dutch describe block. 5. Extend docs/verification/locale.ts: an offline sweep confirming real Dutch object nouns on one scheduled day per theme (home/office/park/school/shop) via renderClue(...,'nl'), plus a second live rendered-screen day (theme 'home', distinct from the main walkthrough's 'shop') confirming the same on the actual DOM.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Root cause: OBJECT_WORDS_NL currently maps 1:1 onto the English OBJECT_WORDS noun by explicit design choice at SLAY-3.2 time (see its own doc comment) — this story reverses that choice at the owner's request. Cast names and room/theme names (already fixed in SLAY-5.2) are out of scope; this is object nouns only.

Verified end to end: bun run build + vite preview + bun docs/verification/locale.ts (headless Chrome, foreground) — 29 checks, 0 failures. Confirms real Dutch object nouns render on screen for a second theme ('home', 2026-10-02, distinct from the main walkthrough's 'shop') and, via an offline sweep of renderClue(...,'nl') over one scheduled day per theme, for all five themes (home/office/park/school/shop) — no leftover English object noun in any. Full test suite: 138 files, 2879 tests, 0 failures (bun run lint/typecheck/test all green).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Translated every OBJECT_WORDS_NL entry in src/engine/clues/nl.ts to a real Dutch noun (with grammatical gender de/het recorded per noun), and simplified anObjectNl/bareObjectNl to always use that one generic Dutch noun rather than the drawn theme kind's English-only specific name — the previous SLAY-3.2 design that kept Dutch object nouns as the unchanged English word is reversed. Updated every existing Dutch clue-text test literal to the real translation, plus two pinned Dutch solver-explanation tests outside this story's own References that broke as a direct, correct consequence. Extended docs/verification/locale.ts with an offline sweep (one scheduled day per theme) and a second live rendered-screen day, both confirming real Dutch object nouns with no leftover English, across all five themes (home/office/park/school/shop) — verified live with headless Chrome (29 checks, 0 failures). Full suite: 138 files, 2879 tests green (lint/typecheck/test). en.ts, content/themes/ and every object type id are untouched; giving Dutch its own per-theme-kind nouns (so it can distinguish 'a garden chair' from 'a poof' the way English does) is left for a follow-up story.
<!-- SECTION:FINAL_SUMMARY:END -->
