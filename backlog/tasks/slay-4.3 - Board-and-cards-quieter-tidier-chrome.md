---
id: SLAY-4.3
title: 'Board and cards: quieter, tidier chrome'
status: To Do
assignee: []
created_date: '2026-09-28 13:18'
labels:
  - story
dependencies: []
references:
  - src/render/icons/art/tokens.ts
  - src/render/scene/
  - src/render/cards/cards.css
  - docs/verification/
parent_task_id: SLAY-4
type: feature
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the board's drawn furniture/objects keep their shapes but read calmer (less saturated, less visual noise) instead of busy; room labels and grid lines use the app's existing warm design tokens instead of plain white/black; suspect and victim cards share a consistent height so a row reads as a tidy grid instead of jagged. No icon silhouette, room layout, or card text changes.
Type: deliverable
Branch: SLAY-4.3/board-cards-tidy
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/render/icons/art/tokens.ts's shared colour palette (C) is desaturated/calmed; every icon (house, living, outdoor, edges, shapes) inherits the change automatically — no per-icon file's shape or color literal is edited
- [ ] #2 Room-label pills and board grid lines in src/render/scene/ use the shared design tokens (src/brand/tokens.css) instead of literal white/black values
- [ ] #3 Suspect and victim cards in src/render/cards/cards.css share a consistent minimum height so a row lines up neatly regardless of clue-text length; long clue text still fits and stays fully readable, nothing is truncated or hidden
- [ ] #4 No object/room shape, icon silhouette, room layout, or clue/card text changes; the rendered-screen check (every card's text visible, every drawn object still has a legend row) stays green
- [ ] #5 docs/verification's drive/legend/screens suites pass unchanged in behaviour (same DOM structure and text), only visuals differ
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Rework the C palette in src/render/icons/art/tokens.ts toward lower saturation/warmer neutrals, keeping every existing key name (only the values change) so no icon file needs editing. Consider a modest SW/DETAIL reduction too if it reads calmer, but keep shapes recognisable — object nouns in clues must still map clearly to what's drawn. 2. Apply src/brand/tokens.css's line/ink/paper tokens to room-label and grid-line styles in src/render/scene/. 3. Add a shared min-height to .polaroid (or equivalent) in cards.css, verified against the longest real clue text in the committed schedule. 4. Run the rendered-screen check and full verify:phone.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
This is a palette and layout pass only. Do not change any icon's path/shape data, room geometry, or clue/card copy — the noun/legend system depends on the drawn object still matching what a clue names.
<!-- SECTION:NOTES:END -->
