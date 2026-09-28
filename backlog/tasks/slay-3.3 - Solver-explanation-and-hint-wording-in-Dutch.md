---
id: SLAY-3.3
title: Solver-explanation and hint wording in Dutch
status: In Progress
assignee: []
created_date: '2026-09-28 10:20'
updated_date: '2026-09-28 13:41'
labels:
  - story
dependencies:
  - SLAY-3.1
  - SLAY-3.2
references:
  - src/engine/solver/
  - src/game/hintText.ts
  - src/game/hintText.nl.ts
  - src/game/hintText.test.ts
  - src/validation/dutch.test.ts
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
- [x] #1 src/engine/solver/ (human and advanced technique sentences) and src/game/hintText.ts gain Dutch wording, selected by the current locale, following the same cellName/manyWord/cellList conventions already used in English
- [x] #2 The existing solver-explanation and hint tests are parametrized over locale and pass for both
- [ ] #3 Playing with hints in Dutch on the real UI shows Dutch explanation text (checked in SLAY-3.6's driver)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend HumanContext/HumanOptions/AdvancedOptions with locale (default 'en'), threaded into solveHuman/solveAdvanced. 2. Add src/engine/solver/human/nl.ts (Dutch wording helpers, mirrors en.ts) plus per-technique full-sentence builders (kept out of the technique files themselves so the Dutch guard test's file-skip mechanism covers them, same as clues/nl.ts). 3. Add src/engine/solver/advanced/nl.ts and src/game/hintText.nl.ts for the advanced techniques' and hintText.ts's own Dutch sentences (room 'why' clauses use correct Dutch subordinate-clause word order after 'omdat'). 4. Branch every technique (6 basic + 5 advanced + rooms.ts bounds) and hintText.ts's focusHint/stepHint/cellsText on context.locale / a locale param, default 'en', calling the *.nl.ts builders for 'nl'. 5. Parametrize existing tests over locale (en.test.ts, techniques.test.ts, explanations.test.ts, advanced/techniques.test.ts) plus a new game/hintText.test.ts exercising focusHint/stepHint directly in Dutch. 6. Extend dutch.test.ts's SKIPPED list for the new *.nl.ts modules and the test files that now pin literal Dutch strings. 7. Widen References (src/game/hintText.nl.ts, src/game/hintText.test.ts, src/validation/dutch.test.ts) to match the real diff, same as the CAD-10.7 precedent.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Depends on SLAY-3.2 because this module imports roomName/VICTIM_TEXT/possessive/countWord/objectOn from the clues module, which SLAY-3.2 makes locale-aware; wait for that interface to land.

AC3 (real UI showing Dutch hints) is explicitly deferred to SLAY-3.6's driver per the story text; this delivery gives it a ready, locale-aware API: solveHuman/solveAdvanced take options.locale ('en' default), and hintText.ts's focusHint/stepHint/cellsText take a locale param ('en' default). No UI call site (src/game/hints.ts, knowledge.ts, ui/lab/insight.ts, generator/*) was touched, so every existing caller keeps rendering English unchanged, matching the SLAY-3.2 render.ts precedent. Dutch prose for the solver/hintText sentences lives in new nl-only files (human/nl.ts, advanced/nl.ts, game/hintText.nl.ts) rather than inline in the technique/hintText files themselves, so the Dutch-text guard test could skip those files wholesale (its blankConst mechanism only fits a single 'export const X_NL = {...}' block, which doesn't match this story's per-technique sentence builders). References widened (--ref) to cover hintText.nl.ts, hintText.test.ts and validation/dutch.test.ts, which the real diff needed but the original contract did not foresee (same pattern as CAD-10.7's reference-widening commit).
<!-- SECTION:NOTES:END -->
