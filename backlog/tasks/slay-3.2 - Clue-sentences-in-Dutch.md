---
id: SLAY-3.2
title: Clue sentences in Dutch
status: Done
assignee: []
created_date: '2026-09-28 10:20'
updated_date: '2026-09-28 12:50'
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
- [x] #1 src/engine/clues/ gains a Dutch counterpart of every English template (OBJECT_WORDS, gender words, relational/room-edge/combined clue wording); the clue-rendering functions take the current locale (from SLAY-3.1's Locale type) and select the matching wording
- [x] #2 Every clue kind covered by the existing English test suite has an equivalent Dutch case (parametrized over locale, not a duplicated file) and passes
- [x] #3 The rendered-screen verification (docs/verification) finds every clue card's text on screen in Dutch too, for a sample of scheduled days
- [x] #4 The header comment in src/engine/clues/en.ts referencing a no-longer-existing src/language.test.ts guard is corrected to describe the real locale split
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read the full English template set (OBJECT_WORDS, gender words, relational/room-edge/combined clue functions) and the noun-audit rules that constrain wording. 2. Write the Dutch equivalents alongside them, one module per kind mirroring the English file layout. 3. Thread a locale parameter through the render functions the app actually calls (check every call site so nothing keeps calling the English module directly). 4. Parametrize the existing test suite over both locales. 5. Run the rendered-screen check in Dutch on a sample of days.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
This is the largest story of the epic (roughly 400 lines of English template logic to mirror). Keep it as one story for phrasing consistency rather than splitting by clue kind. Cast names and room/object English nouns used as labels stay as they are — only the surrounding sentence grammar changes.

Implemented Dutch clue-text engine (src/engine/clues/nl.ts) mirroring en.ts function-for-function; render.ts dispatches by locale (default 'en', fully backward compatible). Object/room nouns stay English per the implementation notes; only grammar (articles, prepositions, verbs, connectors, compass/count words, gender noun) is Dutch. Parametrized en.test.ts, relational/en.test.ts and both.test.ts over locale with matching Dutch samples for every clue kind (AC2). Threaded locale through CardGrid/VictimCard/SuspectPanel/missingCardText so a player who switches to Dutch actually sees Dutch cards; verified via SSR-based rendered-card checks (cardText.test.ts) over every generated puzzle in Dutch too. Fixed en.ts's header comment (AC4). Updated the no-Dutch guard (dutch.test.ts) to allow nl.ts and its three pinning test files. Still working AC3's docs/verification/screens.ts (headless-browser rendered-screen check) for the Dutch sample.

AC3: extended docs/verification/screens.ts with a Dutch pass (SAMPLE_NL scheduled days, default 5) that seeds the locale toggle to 'nl' and checks every suspect/gift card's Dutch text on the real play screen; pinned the existing English pass to locale 'en' explicitly (it previously fell back to the browser's own language, which would now show Dutch clue text on a Dutch-language machine). Ran it for real against the production build in headless Chrome: 130 checks over 6 scheduled days x 2 viewports (English cards+legend, Dutch cards), 0 failures.

Review gate (dipsaus-ai:story-reviewer): verdict pass. All 4 acceptance criteria met, no scope violations (out-of-References files judged legitimate, narrow consequences of the plan's call-site threading and the pre-existing no-Dutch guard needing an exception). Two advisory, non-blocking findings: (1) squareWithObject's Dutch existential always uses 'er lag' regardless of object type, vs. English's own object-agnostic 'there was' pattern -- a deliberate simplification mirroring the same English design choice, left as-is; (2) 'meest linkse/rechtse kolom' reads slightly stilted vs. 'linkerkolom'/'rechterkolom' -- a defensible literal-directional translation matching the onLine house style, left as-is. Neither blocks delivery.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added src/engine/clues/nl.ts, the Dutch counterpart of en.ts (function for function): every structural and relational clue kind, combined-card wording and the victim card render in fluent Dutch, same house style (no gendered pronoun, gender is a noun 'man'/'vrouw'), room and object nouns kept as the English words en.ts already uses per the story's implementation notes. src/engine/clues/render.ts is the new locale-aware entry point (renderClue, bothFragments, bothPartsText, roomName) dispatching on SLAY-3.1's Locale type, default 'en' so every existing caller (solver, generator, puzzle audits) is unaffected; index.ts now exports these in place of en.ts's English-only functions. Parametrized en.test.ts, relational/en.test.ts and both.test.ts over locale with a matching Dutch sample for every clue kind. Threaded locale through CardGrid, VictimCard, SuspectPanel and missingCardText so a player who switches to Dutch (SLAY-3.1's toggle) actually sees Dutch cards; extended docs/verification/screens.ts with a real headless-Chrome Dutch pass over a sample of scheduled days (and fixed a latent bug where the existing English pass silently inherited the browser's own language). Fixed en.ts's header comment. Updated the no-Dutch guard (dutch.test.ts) to allow nl.ts and its three pinning test files. Independent review: pass, no scope violations, two non-blocking advisory wording notes.
<!-- SECTION:FINAL_SUMMARY:END -->
