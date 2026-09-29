---
id: SLAY-10.2
title: >-
  Puzzle label: show the date instead of a sequential number, everywhere a
  player sees it
status: Done
assignee: []
created_date: '2026-09-29 09:59'
updated_date: '2026-09-29 13:30'
labels:
  - story
dependencies:
  - SLAY-9.1
references:
  - src/ui/daily/strings.ts
  - src/ui/daily/StartScreen.tsx
  - src/ui/daily/DailyFlow.tsx
  - src/ui/title/model.ts
  - src/share/card.ts
  - CLAUDE.md
  - docs/daily-flow.md
  - src/ui/title/install.ts
  - src/ui/title/title.test.ts
  - src/ui/daily/daily.test.tsx
  - src/share/share.test.ts
  - src/ui/share/share.test.tsx
  - docs/verification/drive.ts
  - docs/verification/locale.ts
  - docs/verification/offline.ts
parent_task_id: SLAY-10
type: feature
ordinal: 58000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: 'Puzzle #3' becomes a date-based label (e.g. 'Puzzle of Sep 29') in the play header, start screen, browser tab title and the share card; the underlying puzzle-number identity used for local storage keys and stats dedup is untouched — display-only change, no data migration needed for existing players.
Type: deliverable
Branch: SLAY-10.2/puzzle-of-the-day-label

n stays load-bearing internally: local storage key slaydoku:game:daily-<n> (docs/daily-flow.md), stats dedup by r.n (src/game/stats/compute.ts, storage.ts). Only the rendered text changes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Header (daily-play__title), start screen, browser tab title, and the share card's number line all show a date-based label instead of Puzzle #N, in both English and Dutch
- [x] #2 Local storage keys (slaydoku:game:daily-<n>), stats/results dedup (src/game/stats/), and any other internal use of the numeric puzzle index are unchanged — verified by not touching src/game/stats/ or the storage-key format
- [x] #3 CLAUDE.md's decision line ('The app shows puzzle number, UTC date...') and docs/daily-flow.md's card/label description are updated to match, and note that the number is now internal-only
- [x] #4 Existing tests referencing 'Puzzle #' display text are updated deliberately, not left failing or silently changed
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1) strings.ts: replace puzzleNumber(n) with puzzleLabel(date) in DailyStrings (EN: 'Puzzle of <D Month>' via schedule's formatDayMonth; NL: 'Puzzel van <d maand>' via a small local Dutch month table, same pattern format.ts already uses for dutchLongDate). 2) StartScreen.tsx + DailyFlow.tsx: call t.puzzleLabel(day.date) instead of t.puzzleNumber(day.n); leave data-puzzle-number={day.n} and every non-display .n use untouched. 3) title/model.ts: TitleContext.puzzleNumber:number|null -> puzzleDate:string|null; TITLE_EN.puzzle(n) -> puzzle(date) using formatDayMonth; screenTitle drops the route.n numeric override (no archive, route.n was always redundant with today's context in practice) and reads context.puzzleDate directly. 4) install.ts: compute puzzleDate (today's date when scheduled, else null) instead of puzzleNumberOf. 5) card.ts: the 'number' line becomes the same date-based label per locale (short local Dutch month table mirrored from format.ts's pattern), 'date' line (full dateLabel) stays as is - the AC asks for the short label specifically on the number line even though it now sits above the existing full date line. 6) Update vitest tests that assert the old 'Puzzle #N' text: title.test.ts, daily.test.tsx, share/share.test.ts, ui/share/share.test.tsx. 7) Update docs/verification/drive.ts, locale.ts, offline.ts driver assertions on [data-puzzle-number]/tab title text. 8) CLAUDE.md decision line + docs/daily-flow.md: reword to date-based label and note the number is internal-only (storage key / stats dedup).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dependency on SLAY-9.1 is sequencing only (both touch DailyFlow.tsx's header markup) — no functional relationship.

Widened References before implementing (not after a review block): title/model.ts's date-based tab title requires install.ts (its only caller) to thread a date instead of a puzzle number, and vitest tests (title.test.ts, daily.test.tsx, share.test.ts, share/share.test.tsx) plus the docs/verification browser drivers (drive.ts, locale.ts, offline.ts) hardcode the old 'Puzzle #N' text and must change with it per AC #4 / CLAUDE.md's render-the-screen rule.

Verify green: bun run lint (clean), bun run typecheck (clean), bun run test --maxWorkers=1 (140 files / 3006 tests passed). AC1: header (DailyFlow.tsx), start screen (StartScreen.tsx), tab title (title/model.ts+install.ts) and the share card's number line (share/card.ts) all show t.puzzleLabel(date) / TITLE_EN.puzzle(date) in EN+NL ('Puzzle of 29 September' / 'Puzzel van 29 september'). AC2: day.n / result.n / DailyResult storage and src/game/stats/ untouched; kept data-puzzle-number={day.n} DOM attribute (test selector only, not display text) and the storage-key format as-is. AC3: CLAUDE.md's decision line and docs/daily-flow.md's start-screen row, storage-key row and card description reworded to the date-based label with a note that the number is internal only. AC4: updated every vitest assertion on the old 'Puzzle #N' text (title.test.ts, daily.test.tsx, share/share.test.ts, ui/share/share.test.tsx) plus the docs/verification browser drivers (drive.ts, locale.ts, offline.ts) that assert on [data-puzzle-number]/tab-title text, reusing DAILY_STRINGS.<locale>.puzzleLabel so they track the real implementation. Deliberately left unchanged (out of the outcome's 4 named surfaces): the rollover 'New puzzle available' banner's 'Show puzzle #N' button text (strings.ts's rollover.show, DailyFlow/StartScreen banners, docs/daily-flow.md line 18, drive.ts's rollover checks) and the emoji share text (src/share/emoji.ts, CLAUDE.md's Sharing line) — neither is one of the outcome's 4 listed surfaces.

Independent review (dipsaus-ai:story-reviewer): verdict pass. All 4 acceptance criteria met (header/start-screen/tab-title/share-card number line show the date-based label in EN+NL; storage keys and src/game/stats/ untouched; CLAUDE.md + docs/daily-flow.md updated with the internal-only note; every stale 'Puzzle #' test/driver assertion updated). No scope violations. One advisory (non-blocking): docs/verification/report.md line 190 still reads the old 'Puzzle #N' text — it's a dated historical run log (SLAY-1.10, 2026-09-27), not in References, left as-is.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced 'Puzzle #N' with a date-based label ('Puzzle of 29 September' / 'Puzzel van 29 september') in the play header (DailyFlow.tsx), the start screen (StartScreen.tsx), the browser tab title (title/model.ts, with install.ts threading the date through as its only caller) and the share card's number line (share/card.ts), in both English and Dutch. The sequential puzzle number stays internal only: local storage keys, src/game/stats/ dedup and the day.n DOM data-attribute are untouched. CLAUDE.md's decision line and docs/daily-flow.md's start-screen/storage-key/card rows now describe the date-based label and note the number is internal-only. Updated every vitest assertion and docs/verification browser-driver check that hardcoded the old 'Puzzle #N' text (title.test.ts, daily.test.tsx, share/share.test.ts, ui/share/share.test.tsx, drive.ts, locale.ts, offline.ts), reusing DAILY_STRINGS.<locale>.puzzleLabel so the drivers track the real implementation. Deliberately left unchanged, as they are outside the outcome's four named surfaces: the rollover banner's 'Show puzzle #N' button and the emoji share text. Verify green (lint, typecheck, 140 files / 3006 tests) and an independent review both passed with no scope violations; SLAY-10 stays open since its sibling story SLAY-10.1 is still To Do.
<!-- SECTION:FINAL_SUMMARY:END -->
