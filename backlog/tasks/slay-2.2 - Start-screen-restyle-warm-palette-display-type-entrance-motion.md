---
id: SLAY-2.2
title: 'Start screen restyle: warm palette, display type, entrance motion'
status: To Do
assignee: []
created_date: '2026-09-27 12:20'
labels:
  - story
dependencies:
  - SLAY-2.1
references:
  - src/ui/daily/
parent_task_id: SLAY-2
type: feature
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the start screen (today's puzzle card, countdown, streak, About link) consumes the SLAY-2.1 tokens: display font on the title/puzzle number/countdown digits, the case-file red as the primary button and active-day border, warmer card/line tones, and a restrained fade/slide-in on load.
Type: deliverable
Branch: SLAY-2.2/start-screen-restyle
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/ui/daily/daily.css has no hardcoded hex colors left outside the SLAY-2.1 tokens (--ink/--accent/--line/--paper/--good locals are replaced by var(...) references to the shared tokens)
- [ ] #2 The site title, puzzle number and countdown time use --font-display; body text stays on --font-body
- [ ] #3 The daily card and result have a restrained entrance transition (opacity/translateY, --duration-small, --ease-out) that collapses under prefers-reduced-motion
- [ ] #4 src/ui/daily's existing tests (route/daily/help tests) and the verify:phone drive + screens suites pass unchanged (same text, same roles, same legend)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Replace the .daily/.daily-play local custom properties with references to the SLAY-2.1 tokens. 2. Apply --font-display to the three headline elements. 3. Add the entrance transition behind a class toggled on mount/media query guard for prefers-reduced-motion. 4. Run verify:phone drive+screens for the daily suite and the existing vitest files.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Do not rename any class or change any string/route: this story is presentation-only. The countdown/result logic in src/game and src/schedule is out of scope.
<!-- SECTION:NOTES:END -->
