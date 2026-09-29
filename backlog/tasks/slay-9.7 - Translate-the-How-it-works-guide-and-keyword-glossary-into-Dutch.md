---
id: SLAY-9.7
title: Translate the How it works guide and keyword glossary into Dutch
status: Done
assignee: []
created_date: '2026-09-29 09:58'
updated_date: '2026-09-29 12:51'
labels:
  - story
dependencies: []
references:
  - src/content/help/help.ts
  - src/ui/help/HowItWorks.tsx
  - src/ui/help/Glossary.tsx
  - src/ui/play/HelpPanel.tsx
  - src/ui/play/glossary.ts
  - src/content/help/help.test.ts
  - src/validation/dutch.test.ts
parent_task_id: SLAY-9
type: feature
ordinal: 54000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the Help modal's guide (goal, steps, the collapsed more list) and keyword glossary (GLOSSARY, EXTRA_TERMS) have real Dutch content, selected by the player's locale, at the same quality bar as the Dutch clue and hint wording already shipped in SLAY-3.2/3.3.
Type: deliverable
Branch: SLAY-9.7/help-glossary-dutch

Root cause: unlike every strings.ts file in the app (which already has en/nl objects picked via useLocale()), src/content/help/help.ts is a single English-only object imported directly by HowItWorks.tsx/HelpPanel.tsx, and src/ui/play/glossary.ts's GLOSSARY/EXTRA_TERMS are English-only prose imported directly by Glossary.tsx. Neither has ever had a Dutch variant — this is real translation-writing, not a wiring gap (unlike the related Legend-nouns bug, SLAY-9.6, where the Dutch data already existed and just wasn't read).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 help.ts has a complete Dutch content object (goal, steps, more, keywords, legend button/copy, close, link) alongside the English one, selected by locale
- [x] #2 glossary.ts's GLOSSARY and EXTRA_TERMS have Dutch keyword/meaning/example text alongside English, selected by locale
- [x] #3 HowItWorks.tsx, Glossary.tsx and HelpPanel.tsx read content via useLocale() instead of importing the English help/GLOSSARY directly
- [x] #4 help.test.ts's existing invariants (version positivity, label-length caps, goal sentence-count/length caps, required rule-coverage regexes) run over both locales, not only English
- [x] #5 Dutch glossary terms stay consistent with the Dutch clue-sentence vocabulary already shipped in SLAY-3.2/3.3 — no new or conflicting Dutch term for a concept that already has one
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add an NL content object in help.ts (and Dutch entries in glossary.ts) mirroring the English shape exactly; select by useLocale() at the three consumer sites instead of the bare import. Cross-check terminology against src/engine/clues/nl.ts and the hint wording from SLAY-3.3 before finalizing wording.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: help.ts split into HELP_EN/HELP_NL (+ HELP_CONTENT record), glossary.ts split into GLOSSARY_EN/GLOSSARY_NL and EXTRA_TERMS_EN/EXTRA_TERMS_NL (+ *_CONTENT records). HowItWorks.tsx, Glossary.tsx and HelpPanel.tsx now read via useLocale()+*_CONTENT[locale] instead of importing the bare English object. Kept 'help'/'GLOSSARY'/'EXTRA_TERMS' as plain English aliases for out-of-scope consumers not yet migrated (LegendPanel.tsx, StartScreen.tsx, PlayScreen.tsx, Legend.tsx, firstVisit.ts) and for glossary.test.ts, which pins English wording. Dutch GLOSSARY_NL examples are never hand-written: they call renderClue(clue, SAMPLE, 'nl'), so they can never drift from the real Dutch card wording (src/engine/clues/nl.ts). Cross-checked keyword/meaning vocabulary against nl.ts and src/ui/play/strings.ts's PLAY_NL (plattegrond, verdachte, kaartje(s), slachtoffer, moordenaar, rij/kolom, naast, alleen(met), in een hoek, diagonaal). help.test.ts rewritten with describe.each(['en','nl']) covering the same invariants for both locales, with locale-specific rule-coverage regexes and exact Legend-label pins. Widened References to include src/validation/dutch.test.ts: the Dutch-word guard needed (a) a fix to blankConst so it brace/bracket-matches an array-typed export (GLOSSARY_NL/EXTRA_TERMS_NL are arrays, not objects, so the old version only blanked the first array entry) and (b) new NL_EXCEPTIONS entries for HELP_NL and GLOSSARY_NL/EXTRA_TERMS_NL, plus adding help.test.ts to SKIPPED (it pins a couple of HELP_NL.legend Dutch strings literally, same pattern as the existing nl.ts pinning tests). Verified: lint, typecheck, full test suite (140 files / 2911 tests) all green (one run hit a known load-flake vitest-worker RPC timeout unrelated to this change; a clean rerun confirmed it). Also manually rendered HelpPanel and Glossary with LocaleProvider browserLanguage=nl-NL via a throwaway test to eyeball the actual Dutch screen output before removing the scratch file.

Independent review (dipsaus-ai:story-reviewer): verdict pass, all 5 acceptance criteria met, no scope violations. One advisory finding applied as a follow-up commit: the squareWithObject glossary keyword's hand-written verb ('stond') didn't match the engine's actual rendered verb ('lag', e.g. 'Er lag een ingelijst schilderij op D's vakje.'); fixed to 'er lag een … op het vakje'. Reviewer independently ran lint/typecheck/full test suite (140 files / 2911 tests) and confirmed green, and cross-checked Dutch vocabulary against src/engine/clues/nl.ts and src/ui/play/strings.ts's PLAY_NL.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Split src/content/help/help.ts and src/ui/play/glossary.ts into English/Dutch content objects (HELP_EN/HELP_NL, GLOSSARY_EN/GLOSSARY_NL, EXTRA_TERMS_EN/EXTRA_TERMS_NL), each combined into a Record<Locale, T> and wired into HowItWorks.tsx, Glossary.tsx and HelpPanel.tsx via useLocale(). Dutch glossary examples are engine-rendered (renderClue(..., 'nl')) so they can never drift from the real Dutch clue-card wording; keyword/meaning prose and the help-card copy were cross-checked against src/engine/clues/nl.ts and src/ui/play/strings.ts's PLAY_NL for consistent vocabulary. help.test.ts now runs its invariants over both locales. Also fixed src/validation/dutch.test.ts's blankConst helper (it only brace-matched object exports, so it missed most of the new array-typed *_NL exports) and added the new NL_EXCEPTIONS/SKIPPED entries the Dutch-word guard needed, widening References to include that file. Independent review passed on the first round; one advisory finding (a keyword verb mismatch) was fixed in a follow-up commit.
<!-- SECTION:FINAL_SUMMARY:END -->
