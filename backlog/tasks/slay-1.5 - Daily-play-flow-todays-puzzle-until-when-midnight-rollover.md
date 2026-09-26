---
id: SLAY-1.5
title: 'Daily play flow: today''s puzzle, until when, midnight rollover'
status: To Do
assignee: []
created_date: '2026-09-26 19:32'
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
- [ ] #1 src/schedule/today.ts returns the entry for a UTC date (or a clear "no puzzle scheduled" state) and the ms until the next UTC midnight; unit tests cover the day boundary, a leap day, and a date outside the schedule
- [ ] #2 The start screen shows number, date, difficulty, size and the countdown with local equivalent; saved state resumes the board; solved state shows result; clean URLs /, /play, and the play screen route keep working; old level routes are removed
- [ ] #3 Midnight rollover while the page is open shows a "New puzzle available" notice and the new puzzle loads without losing the previous day's saved result; a headless Chrome test with a faked clock proves it; the dev date override works only in dev
- [ ] #4 bun run lint/typecheck/test (--maxWorkers=1), verify (docs/verification drive) and audit:personal pass
<!-- AC:END -->
