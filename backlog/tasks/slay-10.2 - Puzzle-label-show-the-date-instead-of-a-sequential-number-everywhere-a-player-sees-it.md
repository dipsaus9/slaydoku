---
id: SLAY-10.2
title: >-
  Puzzle label: show the date instead of a sequential number, everywhere a
  player sees it
status: To Do
assignee: []
created_date: '2026-09-29 09:59'
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
- [ ] #1 Header (daily-play__title), start screen, browser tab title, and the share card's number line all show a date-based label instead of Puzzle #N, in both English and Dutch
- [ ] #2 Local storage keys (slaydoku:game:daily-<n>), stats/results dedup (src/game/stats/), and any other internal use of the numeric puzzle index are unchanged — verified by not touching src/game/stats/ or the storage-key format
- [ ] #3 CLAUDE.md's decision line ('The app shows puzzle number, UTC date...') and docs/daily-flow.md's card/label description are updated to match, and note that the number is now internal-only
- [ ] #4 Existing tests referencing 'Puzzle #' display text are updated deliberately, not left failing or silently changed
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Change strings.ts's puzzleNumber() formatter (or add a new dateLabel() formatter) to take/format the day's date instead of n; thread the date through DailyFlow.tsx/StartScreen.tsx/title/model.ts/card.ts; leave every non-display reference to .n untouched.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dependency on SLAY-9.1 is sequencing only (both touch DailyFlow.tsx's header markup) — no functional relationship.
<!-- SECTION:NOTES:END -->
