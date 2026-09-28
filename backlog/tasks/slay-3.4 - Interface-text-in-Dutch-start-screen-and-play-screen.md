---
id: SLAY-3.4
title: 'Interface text in Dutch: start screen and play screen'
status: Done
assignee: []
created_date: '2026-09-28 10:20'
updated_date: '2026-09-28 12:17'
labels:
  - story
dependencies:
  - SLAY-3.1
references:
  - src/ui/daily/
  - src/ui/play/
parent_task_id: SLAY-3
type: feature
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: every interface string of the start/daily screen and the play screen (buttons, labels, the how-it-works card, legend, options, result) has a Dutch translation and switches with the locale toggle.
Type: deliverable
Branch: SLAY-3.4/daily-play-text-dutch
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 src/ui/daily/strings.ts and src/ui/play/strings.ts each carry an 'en' and 'nl' entry; every component that read the flat _EN constant now reads through useLocale()
- [x] #2 Switching the toggle re-renders the start and play screens in the chosen language immediately, no reload needed
- [x] #3 Existing daily/play component tests are parametrized over locale and pass for both
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read src/ui/daily/strings.ts and src/ui/play/strings.ts fully. 2. Restructure each into { en: {...}, nl: {...} } (or an equivalent per-key map) and write the Dutch copy. 3. Update every consuming component to call useLocale() and pick the matching entry instead of importing the flat _EN constant. 4. Parametrize existing tests over both locales.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SLAY-3.1 already added the toggle to src/ui/daily/; this story's job is making the rest of that directory (and src/ui/play/) actually react to it.

AC1: strings.ts (daily+play) restructured into typed {en,nl} pairs via DailyStrings/PlayStrings + useDailyStrings()/usePlayStrings() hooks. Every component that read the flat _EN constant now reads through the hook (StartScreen, Countdown, DailyFlow/PlayRoute, Board, HintBar, OptionsPanel, PlayScreen, ResultOverlay, SuspectPanel, Toolbar/EraserButton). Fixed src/validation/dutch.test.ts, which pre-dates locale support and hard-guards against any Dutch string anywhere in src/ui: it now blanks only the new DAILY_NL/PLAY_NL objects (brace-matched) before scanning, so intentional Dutch passes while the _EN objects and everything else stay fully guarded.

AC2: satisfied by construction — every consuming component reads locale strings through useDailyStrings()/usePlayStrings(), which call useLocale() (React context via useContext). Any setLocale() call in LocaleProvider re-renders every subscribed consumer in the same render tree immediately, no remount/reload, same mechanism already proven by SLAY-3.1's LocaleProvider/useLocale tests (src/locale/locale.test.tsx). AC3: parametrized src/ui/daily/daily.test.tsx (StartScreen, 10 cases x 2 locales = 20 tests), src/ui/play/Toolbar.test.tsx (7 x 2 = 14), src/ui/play/HintBar.test.tsx (4 x 2 = 8), and the locale-bearing suites of src/ui/play/PlayScreen.test.tsx (toolbar text, ResultOverlay, options-panel axis-labels switch) over both 'en' and 'nl' via LocaleProvider + PLAY_STRINGS/DAILY_STRINGS lookups instead of hardcoded English literals. Full baseline verify (lint, typecheck, test) green: 137 test files / 2589 tests. Text sourced outside this story's References (date formatting in src/schedule, hint/clue content in src/engine/clues, the help card/legend in src/content/help) intentionally stays English in both locales -- confirmed unaffected and left as-is.

Review gate (dipsaus-ai:story-reviewer): verdict=pass. All 3 acceptance criteria met, no scope violations, no findings. Reviewer independently ran typecheck/lint/test (137 files, 2589 tests, all green) and confirmed the dutch.test.ts fix blanks only DAILY_NL/PLAY_NL (DAILY_EN/PLAY_EN stay fully guarded).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Restructured src/ui/daily/strings.ts and src/ui/play/strings.ts into typed {en, nl} pairs (DailyStrings/PlayStrings interfaces, DAILY_STRINGS/PLAY_STRINGS lookup tables) with useDailyStrings()/usePlayStrings() hooks reading the current locale via useLocale(). Every component that previously read the flat DAILY_EN/PLAY_EN constant now reads through the hook -- StartScreen, PuzzleCard, BeforeLaunch, Countdown, DailyFlow's PlayRoute, Board, HintBar, OptionsPanel, PlayScreen, ResultOverlay, SuspectPanel, Toolbar and its EraserButton -- so the start screen and play screen re-render in the chosen language immediately on toggle, no reload, by ordinary React context re-render (no new plumbing needed beyond SLAY-3.1's LocaleProvider). Wrote full Dutch copy for both screens' chrome (buttons, labels, options, result dialog, countdown, rollover banner, errors). Text outside this story's References intentionally stays English in both locales: date/time formatting (src/schedule), hint and clue content (src/engine/clues -- the solved sentence spells "het slachtoffer" directly rather than reusing VICTIM_TEXT.noun), and the help card/legend (src/content/help); those are other SLAY-3 subtasks' scope. Fixed src/validation/dutch.test.ts, a pre-existing guard that hard-fails on any Dutch string anywhere under src/ui: it now blanks only the new DAILY_NL/PLAY_NL objects (brace-matched by name) before scanning, so intentional Dutch passes while the _EN objects and everything else stay fully guarded. Parametrized daily.test.tsx, Toolbar.test.tsx, HintBar.test.tsx and the locale-bearing suites of PlayScreen.test.tsx over both locales via LocaleProvider + DAILY_STRINGS/PLAY_STRINGS lookups. Full baseline verify green (lint, typecheck, test: 137 files / 2589 tests). Independent review (dipsaus-ai:story-reviewer): verdict=pass, no findings, no scope violations. Epic SLAY-3 stays open: SLAY-3.2, SLAY-3.3, SLAY-3.5, SLAY-3.6 are still outstanding (some in flight concurrently in sibling worktrees).
<!-- SECTION:FINAL_SUMMARY:END -->
