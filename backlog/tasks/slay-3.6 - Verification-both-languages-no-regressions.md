---
id: SLAY-3.6
title: 'Verification: both languages, no regressions'
status: Done
assignee: []
created_date: '2026-09-28 10:21'
updated_date: '2026-09-28 16:57'
labels:
  - story
dependencies:
  - SLAY-3.2
  - SLAY-3.3
  - SLAY-3.4
  - SLAY-3.5
references:
  - docs/verification/
parent_task_id: SLAY-3
type: chore
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the existing English verification suite stays green, and a new lightweight Dutch pass confirms the language toggle works end to end (a puzzle plays, clues/hints/solver text/UI all render in Dutch with no missing or leftover-English text) without duplicating every English check.
Type: deliverable
Branch: SLAY-3.6/dutch-verification
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 bun run verify:phone (English, default locale) stays green on at least one viewport
- [x] #2 A new Dutch smoke driver (docs/verification/) switches the toggle, plays a scheduled day, and checks: every clue card's text is in Dutch (no leftover English template output), a hint shows Dutch text, the About/Stats/Share text is Dutch, and the toggle control itself is reachable and correctly labeled in both languages
- [x] #3 bun run lint, typecheck, test --maxWorkers=1 (both locales) and build are green
- [x] #4 A dated note is added to docs/verification/report.md
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Run the existing English verify:phone to confirm no regression from the whole epic. 2. Write a new driver (e.g. docs/verification/locale.ts) that toggles to Dutch, loads the start screen, opens a puzzle, requests a hint, and checks the rendered text against a Dutch-specific pattern (not the English strings) across the same kind of scenarios drive.ts already covers, at one representative viewport rather than all six. 3. Fix any regression found, in the owning story's files if outside this story's own References. 4. Append the report note.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
This does not have to duplicate the full 2700+-check English suite in Dutch — a bounded smoke pass (start screen, play, a hint, About, Share) at one viewport is enough to catch a missed locale branch or leftover English text.

Two regressions found by the new locale.ts driver and fixed (both authorized by the story's own plan step 3, "in the owning story's files if outside this story's own References"):
1. Hints never localised: game/hints.ts/store.ts/PlayScreen.tsx never threaded the player's chosen locale through to getHint (SLAY-3.3 built hintText.nl.ts but never wired it up). Fixed with an optional locale param the whole way down.
2. docs/verification/stats.ts, share.ts and offline.ts never pinned locale to 'en' (unlike drive/zoom/legend/screens, SLAY-3.2/SLAY-4.2). On this Dutch-locale machine, verify:phone had 27 failures across those three drivers before the fix; 0 after.
Final: verify:phone (390x844) 471 checks/0 failures; locale.ts 21 checks/0 failures; lint/typecheck/test(138 files, 2866 tests)/build all green.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added docs/verification/locale.ts, a bounded Dutch smoke driver (one representative viewport, 390x844) that switches the language toggle and checks the start screen, a played day's clue cards (diffed against the engine's own renderClue(..., 'nl')), a hint (diffed against getHint(..., 'nl')), the toolbar's More sheet, Stats, About and a solved day's Share panel all render correctly in Dutch with no leftover English (21 checks, 0 failures). That driver caught two real regressions, fixed here: hints never actually localised (game/hints.ts, store.ts and PlayScreen.tsx never threaded the player's chosen locale through to the Dutch hint machinery SLAY-3.3 built, so every hint always rendered in English; fixed by threading an optional locale parameter the whole way down, backward compatible); and three verification drivers (stats.ts, share.ts, offline.ts) never pinned locale to 'en' the way drive/zoom/legend/screens already do, so on a Dutch-locale machine bun run verify:phone showed 27 failures across those three drivers - fixed the same way, plus a Page.addScriptToEvaluateOnNewDocument pin for offline.ts's many reloads. Final: verify:phone (390x844) 471 checks/0 failures; lint, typecheck, test --maxWorkers=1 (138 files, 2866 tests) and build all green. A dated note is in docs/verification/report.md. Reviewed independently: pass, all four acceptance criteria met, no scope violations.
<!-- SECTION:FINAL_SUMMARY:END -->
