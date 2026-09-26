---
id: SLAY-1.1
title: 'English clue, hint and explanation text'
status: Done
assignee: []
created_date: '2026-09-26 19:32'
updated_date: '2026-09-26 21:58'
labels:
  - story
dependencies: []
references:
  - src/engine/clues/
  - src/engine/solver/
  - src/engine/generator/
  - src/game/
  - src/validation/
  - src/content/themes/
  - src/content/help/
  - src/content/
  - src/engine/model/
  - src/engine/difficulty/
  - src/engine/scenegen/
  - src/engine/solvable/
  - src/render/
  - src/ui/
  - tools/
  - docs/
  - README.md
  - MIGRATION.md
parent_task_id: SLAY-1
type: feature
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: every sentence the engine writes is English: clue cards for all kinds (structural, relational, gender, room-edge, exact distance, combined), the human and advanced solver explanations, the hints (three levels, ending in an explicit instruction), object and room nouns with articles ("the"), capitalisation, and the victim wording (the victim, the murderer: "was alone with the victim"). The Dutch text layer is replaced, not kept beside it. Neutral wording (no he/she; "woman"/"man" as nouns).
Type: deliverable
Branch: SLAY-1.1/english-text
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 src/engine/clues/nl.ts is replaced by an English text layer (rename to en.ts) for every clue kind, with unit tests of at least 3 sentences per kind, including combined cards and gender cards
- [x] #2 Solver explanations, src/game/hintText.ts and the hint audit (src/validation) work in English: hint 1 quotes the card, hint 2 names squares, hint 3 ends with an explicit instruction ("Place Alice on row 3, column 4."); length limits and jargon checks updated
- [x] #3 Theme room and object names, drawn-kind nouns and the noun audit are English (a poof/bench/chair group is named by what is drawn); no Dutch string is left in src/engine, src/game, src/validation or src/content/themes (a test scans for a small Dutch word list)
- [x] #4 bun run lint/typecheck/test (--maxWorkers=1) and audit:personal pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Rename clues/nl.ts and solver/human/nl.ts to en.ts (API renamed: OBJECT_WORDS, VICTIM_TEXT, countWord, joinList, victimName) and write every clue kind, relational kind, gender and combined card in neutral English (room names stored bare, 'the' added; a/an per noun; 'the victim' / 'the murderer').
2. Translate solver explanations (human + advanced), technique titles and band labels, game hints (three levels, explicit 'Place X on row R, column C.' / 'Note squares for X on ...' / 'Put a cross ...'), result message, pack titles.
3. English theme content: room names, object kinds and names (camelCase kinds), pack dressing without article table, demo scene and puzzle, Gender value woman.
4. Hint audit and clue audit retuned to English: shared Dutch word list (validation/dutch.ts), pronoun list, and/en count, whole-word case-sensitive holder count.
5. dutch.test.ts scans string literals and JSON string values under src/engine, src/game, src/validation, src/content (help skipped until SLAY-1.2).
6. Rewrite every test and fixture pinning Dutch sentences; update docs/authoring and READMEs. Verify lint, typecheck, test, audit:personal, build and a validate:generation smoke.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Delivered: English text layer (en.ts), hints, solver explanations, themes, packs titles, demo; Dutch scan test src/validation/dutch.test.ts (skips src/content/help until SLAY-1.2). Smoke validate:generation (sizes 6,9, 2 seeds, easy+medium, all themes): 31/40 pass, rejections only score-band/variety, none from hint, clue or noun audits. Hint limits unchanged: measured max length on 77 puzzles was L1 201/220, L2 138/200, L3 363/420 (hard 417/600); level 1 has the least headroom.

Review round 1: block on scope only (all four criteria met). References widened to the renamed API's callers and Dutch-pinning tests/docs: src/content/, src/engine/model|difficulty|scenegen|solvable, src/render/, src/ui/ (only renamed identifiers and tests pinning engine text; interface strings stay for SLAY-1.2), tools/, docs/, README.md, MIGRATION.md. Advisory: the Dutch word list is heuristic, extend as leftovers turn up.

Review round 2: pass, no blocking findings. Advisory: roomStyles/labels keyword change follows English room names; card sources guard is narrower than before.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The engine text layer is English: clues/nl.ts and solver/human/nl.ts became en.ts with every clue kind (structural, relational, gender, room-edge, exact distance, combined) in neutral English, the victim is 'the victim' with the rule card 'The victim was alone with the murderer.', hints keep three levels and end in 'Place X on row R, column C.' / 'Note squares for X on ...' / 'Put a cross ...', solver explanations and technique titles are English, theme rooms and objects are English (rooms stored bare, 'the' added at read time, objects named by what is drawn, kinds renamed to camelCase), pack titles and the demo puzzle are English, Gender is woman/man, the hint and clue audits use English rules with a shared Dutch word list, and src/validation/dutch.test.ts scans string literals and JSON string values under src/engine, src/game, src/validation and src/content (src/content/help skipped until SLAY-1.2). Docs and READMEs updated. Verified: lint, typecheck, 2308 tests, audit:personal 0 hits, build, validate:generation smoke (31/40, rejections only score-band/variety).
<!-- SECTION:FINAL_SUMMARY:END -->
