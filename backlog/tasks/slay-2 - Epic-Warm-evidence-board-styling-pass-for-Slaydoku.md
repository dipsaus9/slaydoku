---
id: SLAY-2
title: 'Epic: Warm evidence-board styling pass for Slaydoku'
status: Done
assignee: []
created_date: '2026-09-27 12:19'
updated_date: '2026-09-27 14:17'
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
- [x] #1 The warm evidence-board palette (manila background, case-file red accent, warm tan lines) and one shared display font are defined once and consumed by every screen: start, play chrome, cards, about, stats, share
- [x] #2 The victim card no longer shows a wrapped gift and the internal gift naming is renamed to victim wording
- [x] #3 Board illustrations, room icons, portrait avatars, game logic and every existing test/verify-driver keep passing unchanged
- [x] #4 bun run verify:phone (all six viewports) and the all-days rendered-screen sweep show 0 regressions
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Epic delivered: a shared warm evidence-board design-token source (palette, display type, motion) is defined once (SLAY-2.1) and consumed by every screen — start (SLAY-2.2), play-screen chrome (SLAY-2.3), suspect/victim cards (SLAY-2.4), about/stats (SLAY-2.5), and the share card and OG image (SLAY-2.6). The victim card's gift wording was renamed throughout. SLAY-2.7 closes the epic: a full six-viewport browser verification (2736 checks) plus the all-days rendered-screen sweep (1174 checks) confirm 0 regressions in board illustrations, room icons, portrait avatars, game logic and every existing verify-driver; the one stale driver assertion found (a share-card colour check) was fixed within SLAY-2.7's own scope, not a product defect.
<!-- SECTION:FINAL_SUMMARY:END -->
