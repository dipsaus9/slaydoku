---
id: SLAY-9.6
title: 'Legend panel: use Dutch object nouns when the locale is Dutch'
status: Done
assignee: []
created_date: '2026-09-29 09:57'
updated_date: '2026-09-29 12:16'
labels:
  - story
dependencies: []
references:
  - src/ui/help/legend.ts
  - src/ui/help/Legend.tsx
  - src/engine/clues/en.ts
  - src/engine/clues/nl.ts
  - src/ui/help/Legend.test.tsx
parent_task_id: SLAY-9
type: feature
ordinal: 53000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the Legend card's object rows show real Dutch nouns when the player's locale is Dutch, instead of always the English word list.
Type: deliverable
Branch: SLAY-9.6/legend-dutch-nouns

Root cause: src/ui/help/legend.ts's legendOf() hardcodes 'import { OBJECT_WORDS } from ../../engine/clues/en.ts' with no locale parameter at all. The Dutch counterpart, OBJECT_WORDS_NL, already exists and is real Dutch (delivered in SLAY-6.2 for clue sentences) — it is simply never read by the Legend panel.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Legend object rows show nouns from OBJECT_WORDS_NL when the player's locale is nl, and from OBJECT_WORDS (unchanged) when it is en
- [x] #2 legendOf() takes the active locale (or the already-resolved word table) as a parameter rather than importing en.ts directly, so it cannot silently drift back to English-only
- [ ] #3 The Legend re-renders with the correct nouns immediately after a mid-puzzle language switch, once SLAY-9.4 makes that reachable
- [x] #4 Existing Legend tests (Legend.test.tsx) still pass or are deliberately extended to cover the nl case
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Thread the active locale from useLocale() through Legend.tsx into legendOf(scene, locale) (required param, no default), selecting OBJECT_WORDS vs OBJECT_WORDS_NL inside instead of the current hardcoded en.ts import. For locale nl always use the type's generic OBJECT_WORDS_NL noun (never the theme-specific noun) and empty alsoNouns, matching nl.ts's SLAY-6.2 precedent that no theme kind has a Dutch name yet. Update Legend.test.tsx call sites to pass locale explicitly and add nl-locale coverage (legendOf assertions + <Legend/> render via LocaleProvider).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: legendOf(scene, locale) now takes a required Locale param (no default) instead of importing en.ts's OBJECT_WORDS directly -- every call site must pass locale, so it cannot silently drift back to English-only. For locale nl the generic OBJECT_WORDS_NL[type].noun is always used (matches nl.ts's documented SLAY-6.2 precedent: no theme kind has a Dutch name yet, so Dutch never distinguishes garden chair vs poof vs plain chair; alsoNouns is always empty for nl). Legend.tsx reads locale via useLocale() (same pattern as SuspectPanel.tsx) and passes it into legendOf inside the existing useMemo, with locale added to the deps array so a locale change recomputes the rows. Legend.test.tsx: updated every legendOf(scene) call site to pass en explicitly (kept existing assertions unchanged), added an nl describe block asserting every generated/demo scene's rows use OBJECT_WORDS_NL nouns with empty alsoNouns, and added Legend render coverage for both locales via LocaleProvider (same BROWSER_LANGUAGE mapping pattern as HintBar.test.tsx/Toolbar.test.tsx) proving the rendered noun differs per locale for the same puzzle.

AC 3 (re-render after mid-puzzle switch): this repo has no interactive re-render test harness (no testing-library, only renderToStaticMarkup) and SLAY-9.4 (play-screen locale toggle) is still To Do, so the actual reachable-switch scenario cannot be exercised yet. What this story proves instead: Legend reads locale reactively through useLocale's context (not a one-time import) and legendOf's useMemo dependency array includes locale, the same reactive-read mechanism SuspectPanel.tsx/CardGrid already use and that React re-renders on a context change. Full end-to-end verification of AC 3 is deferred to whichever story (SLAY-9.4 or a follow-up) adds the play-screen reachable switch and an interactive test for it. Verify: bun run lint, bun run typecheck, bun run test --maxWorkers=1 all green (2999/2999 tests, 140/140 files); src/ui/help/Legend.test.tsx alone: 195/195 passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
legendOf() now takes the active locale as a required parameter and picks OBJECT_WORDS_NL's generic Dutch noun for every row when locale is nl (no theme-specific Dutch names exist yet, so alsoNouns is empty for nl, matching the nl.ts SLAY-6.2 precedent), keeping the unchanged English behaviour for locale en. Legend.tsx reads the active locale via useLocale() and threads it into the memoized legendOf() call so a locale change recomputes the rows. Legend.test.tsx was extended with nl-locale coverage for legendOf() and for the rendered <Legend/> component (via LocaleProvider), alongside the existing English assertions, all passing (195/195 in the file; 2999/2999 across the full suite). AC #3's full mid-puzzle-switch scenario is gated on SLAY-9.4 (still To Do) and this repo's lack of an interactive rerender test harness; this story delivers and proves the reactive-locale wiring that AC #3 needs once that's reachable.
<!-- SECTION:FINAL_SUMMARY:END -->
