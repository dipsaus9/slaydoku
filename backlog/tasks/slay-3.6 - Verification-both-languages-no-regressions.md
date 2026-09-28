---
id: SLAY-3.6
title: 'Verification: both languages, no regressions'
status: To Do
assignee: []
created_date: '2026-09-28 10:21'
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
- [ ] #1 bun run verify:phone (English, default locale) stays green on at least one viewport
- [ ] #2 A new Dutch smoke driver (docs/verification/) switches the toggle, plays a scheduled day, and checks: every clue card's text is in Dutch (no leftover English template output), a hint shows Dutch text, the About/Stats/Share text is Dutch, and the toggle control itself is reachable and correctly labeled in both languages
- [ ] #3 bun run lint, typecheck, test --maxWorkers=1 (both locales) and build are green
- [ ] #4 A dated note is added to docs/verification/report.md
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Run the existing English verify:phone to confirm no regression from the whole epic. 2. Write a new driver (e.g. docs/verification/locale.ts) that toggles to Dutch, loads the start screen, opens a puzzle, requests a hint, and checks the rendered text against a Dutch-specific pattern (not the English strings) across the same kind of scenarios drive.ts already covers, at one representative viewport rather than all six. 3. Fix any regression found, in the owning story's files if outside this story's own References. 4. Append the report note.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
This does not have to duplicate the full 2700+-check English suite in Dutch — a bounded smoke pass (start screen, play, a hint, About, Share) at one viewport is enough to catch a missed locale branch or leftover English text.
<!-- SECTION:NOTES:END -->
