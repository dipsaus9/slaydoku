---
id: SLAY-2.2
title: 'Start screen restyle: warm palette, display type, entrance motion'
status: Done
assignee: []
created_date: '2026-09-27 12:20'
updated_date: '2026-09-27 13:17'
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
- [x] #1 src/ui/daily/daily.css has no hardcoded hex colors left outside the SLAY-2.1 tokens (--ink/--accent/--line/--paper/--good locals are replaced by var(...) references to the shared tokens)
- [x] #2 The site title, puzzle number and countdown time use --font-display; body text stays on --font-body
- [x] #3 The daily card and result have a restrained entrance transition (opacity/translateY, --duration-small, --ease-out) that collapses under prefers-reduced-motion
- [x] #4 src/ui/daily's existing tests (route/daily/help tests) and the verify:phone drive + screens suites pass unchanged (same text, same roles, same legend)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Replace daily.css's local --ink/--accent/--accent-dark/--line/--paper/--good custom properties (previously hardcoded hex) with var(...) refs onto the SLAY-2.1 shared tokens in src/brand/tokens.css; --good has no warm-palette equivalent so it points at --color-accent-dark. Convert every other hardcoded hex in the file (button text, result panel, notice banner, play-back bar) onto the same local aliases so none remain. Add font-family: var(--font-display) to .daily__title, .daily-card__number, .daily-countdown__time and .daily-play__title (puzzle-number display in the play-screen back bar); body text keeps inheriting --font-body from src/index.css, untouched. Add a @keyframes daily-entrance (opacity 0 + translateY(8px) -> default) applied to .daily-card and .daily-result via animation: daily-entrance var(--duration-small) var(--ease-out) both — the duration token itself collapses to 0.01ms under prefers-reduced-motion (already in tokens.css), so no extra media query is needed here. No class renamed, no string/route changed. Verify: bun run lint/typecheck/test, then SUITES=drive,screens bun run verify:phone for the daily flow + rendered-screen checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Do not rename any class or change any string/route: this story is presentation-only. The countdown/result logic in src/game and src/schedule is out of scope.

verify:phone SUITES=drive,screens: 1260 checks, 0 failures across all six viewports (drive: 111 checks/viewport, screens: 99 checks/viewport). bun run lint/typecheck/test: 2553 tests pass.

Review gate: pass (round 1). Reviewer ran vitest for router/daily/help (134/134 pass) and verify:phone drive+screens at 390x844 (210/210, 0 failures) independently, plus grepped daily.css for hex (none). Advisory (non-blocking): .daily-play__title also switched to --font-display (a 4th element beyond the 3 AC2 names, judged harmless/consistent); --good aliases --color-accent-dark since no dedicated warm success token exists yet.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The start screen (title, puzzle card, countdown, result, About link) and the play-screen back bar now consume the SLAY-2.1 tokens instead of the daily flow's own hardcoded hex: the .daily/.daily-play local --ink/--accent/--accent-dark/--line/--paper aliases point at src/brand/tokens.css's shared color tokens (--good, with no warm-palette equivalent, points at --color-accent-dark so the solved state reads in the case-file accent rather than a foreign green), and every other hardcoded hex in the file (button text, result panel, notice banner, play-back bar) was folded onto the same aliases. The title, puzzle number, countdown time and the play-screen's puzzle-number readout use --font-display; body text is untouched and keeps inheriting --font-body. The daily card and the solved-result panel get a restrained fade/slide-in (@keyframes daily-entrance, --duration-small, --ease-out) that collapses under prefers-reduced-motion for free, since that duration token itself collapses to 0.01ms. No class renamed, no string or route changed. Verify: lint/typecheck/2553 tests green; verify:phone drive+screens, 1260 checks across all six viewports, 0 failures. Independent review: pass, 2 advisory (non-blocking) notes only.
<!-- SECTION:FINAL_SUMMARY:END -->
