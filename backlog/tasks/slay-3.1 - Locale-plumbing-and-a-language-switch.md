---
id: SLAY-3.1
title: Locale plumbing and a language switch
status: Done
assignee: []
created_date: '2026-09-28 10:20'
updated_date: '2026-09-28 11:57'
labels:
  - story
dependencies: []
references:
  - src/locale/
  - src/App.tsx
  - src/ui/daily/
parent_task_id: SLAY-3
type: feature
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a Locale type ('en' | 'nl'), a useLocale() hook/context (default from the browser's language, persisted to localStorage), and a visible toggle wired into the app so a player can switch language. No game content is translated yet — every string still comes from the existing English constants regardless of locale; this story is pure infrastructure the following stories build on.
Type: deliverable
Branch: SLAY-3.1/locale-plumbing
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 src/locale/ defines Locale ('en' | 'nl'), a LocaleProvider and a useLocale() hook; the default locale is 'nl' when navigator.language starts with 'nl', else 'en'
- [x] #2 The choice is persisted under localStorage key slaydoku:locale and read back on load, the same pattern already used by slaydoku:help-seen and slaydoku:daily-results
- [x] #3 App.tsx wraps the game in LocaleProvider; a visible, reachable toggle (44px touch target) on the start screen lets a player switch locale immediately, and the choice persists across reload
- [x] #4 No player-facing text changes yet; bun run lint, typecheck, test --maxWorkers=1 and build stay green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add src/locale/ with the Locale type, a React context, LocaleProvider and useLocale(). 2. Read/write localStorage the same way src/pwa or src/game/daily already do (check their pattern first). 3. Wrap App.tsx's Game/DevApp in LocaleProvider. 4. Add a small toggle control to the start screen (near How it works/About), wired to useLocale(). 5. Confirm no existing string import changes — everything still renders in English regardless of the toggle's state, since no consuming component reads the locale yet.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The toggle can and should be visibly present and functional (it does switch a stored value and could show e.g. EN/NL as pressed state) even though nothing downstream reacts to it yet — later stories make components consume useLocale().

Implemented: src/locale/ (types.ts, storage.ts, context.ts, LocaleProvider.tsx, useLocale.ts, index.ts barrel) following the game/persistence.ts + ui/help/firstVisit.ts guarded-storage pattern (StorageLike, try/catch, null-safe). LocaleToggle.tsx added to src/ui/daily/ and wired into StartScreen's header; App.tsx wraps Game/DevApp in LocaleProvider. bun run lint, typecheck, test -- --maxWorkers=1 (2565 tests) and build all green.

Review round 1: verdict block. Blocking: src/ui/share/share.test.tsx was touched to wrap StartScreen in LocaleProvider, outside declared References (src/locale/, src/App.tsx, src/ui/daily/). Advisory: src/locale/storage.ts's StorageLike/defaultStorage duplicates src/game/persistence.ts's (kept separate on purpose: locale is not a game-domain concern). Fix: useLocale() now falls back to a sensible default (stored or browser-language locale) instead of throwing outside a LocaleProvider, so share.test.tsx needed no change at all - reverted to its original content. Re-verified: lint, typecheck, test --maxWorkers=1 (2565 tests), build all green.

Review round 2: verdict pass. All 4 acceptance criteria met, no scope violations. One non-blocking advisory: context.ts's fallback value is computed once at module load rather than freshly per no-provider render (fine — App.tsx always wraps the app in LocaleProvider in production; only affects components deliberately rendered standalone).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added src/locale/ (Locale type, LocaleProvider, useLocale()) with guarded localStorage persistence under slaydoku:locale, defaulting to 'nl' for a Dutch browser language and 'en' otherwise, following the same try/catch StorageLike pattern as slaydoku:help-seen and slaydoku:daily-results. App.tsx now wraps the game in LocaleProvider, and a new LocaleToggle (EN/NL, 44px touch targets) in the start screen's header lets a player switch locale immediately, with the choice surviving reload. No player-facing text changed yet - this is pure infrastructure for SLAY-3.2 through SLAY-3.6 to build on. lint, typecheck, test --maxWorkers=1 (2565 tests) and build all green; passed independent review (round 2, after a round-1 scope-violation finding was resolved by making useLocale() fall back gracefully instead of throwing outside a provider).
<!-- SECTION:FINAL_SUMMARY:END -->
