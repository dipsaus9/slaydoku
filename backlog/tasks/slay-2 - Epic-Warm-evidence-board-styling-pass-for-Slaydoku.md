---
id: SLAY-2
title: 'Epic: Warm evidence-board styling pass for Slaydoku'
status: To Do
assignee: []
created_date: '2026-09-27 12:19'
updated_date: '2026-09-27 13:30'
labels:
  - epic
dependencies: []
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the site keeps its board's existing charm (illustrated floor plan, portrait avatars, cursive suspect names, per-suspect pastel cards) but the chrome around it (start screen, play-screen toolbar/header, about, stats, share card, victim card) stops looking like an unstyled prototype. Chosen approach (over a full restyle from scratch, and over doing nothing): an incremental design-system pass — one shared token source (color/typography/spacing/motion) consumed by the existing components, no change to game logic, DOM text, board illustrations, room icons or portrait avatars. A full restyle was rejected: too much risk to the 2618 existing tests and the rendered-screen/legend checks this close to the 2026-10-12 launch. Doing nothing was rejected: the site currently reads as a prototype, which undersells a finished, correct game before it is shared with friends. Art direction: warm evidence-board (kraft/manila tones, case-file red accent, one self-hosted display serif for headings, existing system-ui body and cursive card names kept as-is, motion is CSS-only and respects prefers-reduced-motion).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The warm evidence-board palette (manila background, case-file red accent, warm tan lines) and one shared display font are defined once and consumed by every screen: start, play chrome, cards, about, stats, share
- [x] #2 The victim card no longer shows a wrapped gift and the internal gift naming is renamed to victim wording
- [ ] #3 Board illustrations, room icons, portrait avatars, game logic and every existing test/verify-driver keep passing unchanged
- [ ] #4 bun run verify:phone (all six viewports) and the all-days rendered-screen sweep show 0 regressions
<!-- AC:END -->
