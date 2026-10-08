---
id: SLAY-18.1
title: Seasonal calendar rules and rotation guard
status: To Do
assignee: []
created_date: '2026-10-08 09:21'
labels:
  - story
dependencies:
  - SLAY-17.1
references:
  - src/schedule/calendar.ts
  - src/schedule/calendar.test.ts
  - src/schedule/pick.ts
  - src/schedule/pick.test.ts
  - src/content/themes/types.ts
  - src/content/themes/index.ts
parent_task_id: SLAY-18
type: feature
ordinal: 125000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: themeOf(date) first applies yearly seasonal rules, then falls back to the normal rotation. Rules (priority high to low): Simpshouse (a configurable date list, [2026-10-14] for now), Carnaval (11 November), Christmas (1-31 December), Halloween (17-31 October), Fall (1-16 October and 1-30 November except the 11th). Themes get a seasonal flag and stay out of the 5-theme rotation, so the cycle length and the theme of every other day do not change. The five new ThemeIds are registered; a rule only applies when its theme exists in the registry.
Type: deliverable
Branch: SLAY-18.1/seasonal-calendar
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/schedule/calendar.ts holds the rules as data (yearly month/day windows, Simpshouse date list, priority order); adding a Simpshouse date is a one-line change
- [ ] #2 Themes flagged seasonal are excluded from the rotation cycle; for every date in the committed schedule outside a seasonal window the theme equals the one in the schedule JSON (test)
- [ ] #3 A rule applies only when its theme is registered; with none registered themeOf equals today's output for all days
- [ ] #4 Overlaps resolve by the priority order, tested for 2026-10-14, 2026-11-11, 2026-10-17, 2026-12-01 and a plain day
- [ ] #5 Windows repeat yearly (tested for 2027) and the leap day does not break them
- [ ] #6 bun run lint, typecheck and test --maxWorkers=1 pass
<!-- AC:END -->
