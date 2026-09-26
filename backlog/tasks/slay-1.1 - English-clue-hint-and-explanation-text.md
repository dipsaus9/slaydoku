---
id: SLAY-1.1
title: 'English clue, hint and explanation text'
status: To Do
assignee: []
created_date: '2026-09-26 19:32'
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
- [ ] #1 src/engine/clues/nl.ts is replaced by an English text layer (rename to en.ts) for every clue kind, with unit tests of at least 3 sentences per kind, including combined cards and gender cards
- [ ] #2 Solver explanations, src/game/hintText.ts and the hint audit (src/validation) work in English: hint 1 quotes the card, hint 2 names squares, hint 3 ends with an explicit instruction ("Place Alice on row 3, column 4."); length limits and jargon checks updated
- [ ] #3 Theme room and object names, drawn-kind nouns and the noun audit are English (a poof/bench/chair group is named by what is drawn); no Dutch string is left in src/engine, src/game, src/validation or src/content/themes (a test scans for a small Dutch word list)
- [ ] #4 bun run lint/typecheck/test (--maxWorkers=1) and audit:personal pass
<!-- AC:END -->
