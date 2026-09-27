---
id: SLAY-1.5
title: 'Daily play flow: today''s puzzle, until when, midnight rollover'
status: Done
assignee: []
created_date: '2026-09-26 19:32'
updated_date: '2026-09-27 00:01'
labels:
  - story
dependencies:
  - SLAY-1.2
  - SLAY-1.4
references:
  - src/ui/levels/
  - src/ui/router/
  - src/ui/play/
  - src/App.tsx
  - src/main.tsx
  - src/game/
  - src/schedule/
  - src/content/levels.ts
  - src/content/levels.test.ts
  - src/ui/daily/
  - src/ui/title/
  - src/ui/lab/
  - src/ui/help/
  - src/content/demo/
  - src/content/help/help.ts
  - src/content/objectClues.test.ts
  - src/engine/clues/objectNames.test.ts
  - src/engine/solver/human/explanations.test.ts
  - src/render/cards/
  - src/validation/
  - src/pwa/
  - vite.config.ts
  - tools/check-share.ts
  - tools/check-share.test.ts
  - docs/verification/
  - docs/daily-flow.md
  - docs/launch.md
  - docs/authoring/README.md
  - docs/authoring/generate-verify-register.md
  - docs/authoring/rules.md
  - README.md
  - CLAUDE.md
  - MIGRATION.md
parent_task_id: SLAY-1
type: feature
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the start screen is today's puzzle (UTC): "Puzzle #43", the UTC date, difficulty and grid size, a Play button (or Continue / Solved with the result), and until when the puzzle runs: a live countdown to 00:00 UTC plus the local equivalent ("Ends at 00:00 UTC, 02:00 your time"). Progress per day is saved locally (board, notes, time, hints); a solved day shows the result and the share button. When the page is open across 00:00 UTC it offers the new puzzle without a reload. A dev-only date override for testing. No clock check, no archive. Replaces the level list and unlock order.
Type: deliverable
Branch: SLAY-1.5/daily-flow
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 src/schedule/today.ts returns the entry for a UTC date (or a clear "no puzzle scheduled" state) and the ms until the next UTC midnight; unit tests cover the day boundary, a leap day, and a date outside the schedule
- [x] #2 The start screen shows number, date, difficulty, size and the countdown with local equivalent; saved state resumes the board; solved state shows result; clean URLs /, /play, and the play screen route keep working; old level routes are removed
- [x] #3 Midnight rollover while the page is open shows a "New puzzle available" notice and the new puzzle loads without losing the previous day's saved result; a headless Chrome test with a faked clock proves it; the dev date override works only in dev
- [x] #4 bun run lint/typecheck/test (--maxWorkers=1), verify (docs/verification drive) and audit:personal pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Owner decisions: daily flow replaces the level list. (1) src/schedule/today.ts + display.ts: pure UTC date, ms to midnight, month-file lookup with neighbour fallback, countdown and local-time text. (2) src/game/daily: results API (recordResult/readResult/readAllResults, versioned key, first result wins), dev-only date override (dev or localhost only), lazy month loader (import.meta.glob chunks), dayStatus, solve observer. (3) src/ui/daily: start screen (states: new, continue, solved, before launch, after last day, loading, error), /play route on the existing PlayScreen, midnight notice that never switches a player mid-puzzle. (4) Remove level registry, list, solved screen, level routes; demo puzzle kept as a sample (content/demo/puzzle.ts); lab keeps its own sample list. (5) Drivers (drive, zoom, legend, screens, offline, phone) on the date override at 390x844 and 1024x768; precache budget 3 -> 6 MiB for month chunks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Delivered on 4 commits. Verify: lint, typecheck, test --maxWorkers=1 (131 files, 2491 tests), build, audit:personal (0 hits), verify:phone at 390x844 and 1024x768: 792 checks, 0 failures (drive 107, zoom 43, legend 113, screens 99, offline 34 per viewport). Finding: screens.ts on scheduled days showed that the daily flow did not pass themeIconsFor and the baked portraits to PlayScreen (board drew engine icons while the Legend listed theme art); fixed. Precache budget raised 3 -> 6 MiB (about 1.2 MiB used at 120 days; month chunks 45 KB per week). Date override: ?date=YYYY-MM-DD (noon UTC) or with a time; only dev or host localhost. Stories 1.6 and 1.7 References still name src/ui/levels/ (gone): stats and share slots are data-slot=stats / data-slot=share on the start screen (StartScreen props stats and share).

Review gate: round 1 block only on References (src/content/levels.test.ts, removed with levels.ts); widened References, round 2 pass, no scope violations. Advisory: the date override also works on a production build served from localhost by owner decision (drivers need it); refused on every other host, tested in clock.test.ts and drive.ts.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The start screen at / is now today's puzzle by UTC date: Puzzle #N, the date, difficulty, grid size, Play / Continue / the solved result, and a live countdown to 00:00 UTC with the local time; before the launch and after the last scheduled day it shows the matching notice. /play plays the day on the existing play screen, saves per day (fingerprint-guarded) and records the result per day through src/game/daily/results.ts; a solved day cannot be replayed. Only the month file of the day is loaded (lazy chunks, neighbour fallback), all months are precached (budget 3 -> 6 MiB). Across 00:00 UTC a New puzzle available notice offers the new day without switching a player mid-puzzle; the earlier day's save and result stay. The dev-only date override works in dev and on localhost only. The level registry, list, solved screen and level routes are removed; drivers (drive, zoom, legend, screens, offline, phone) run on the daily flow: 792 checks, 0 failures at 390x844 and 1024x768. screens.ts found and drove the fix of a real bug: the board lacked the theme art and baked faces of scheduled days.
<!-- SECTION:FINAL_SUMMARY:END -->
