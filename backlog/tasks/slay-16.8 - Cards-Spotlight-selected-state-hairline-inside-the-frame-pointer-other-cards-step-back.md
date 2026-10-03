---
id: SLAY-16.8
title: >-
  Cards: 'Spotlight' selected state, hairline inside the frame, pointer, other
  cards step back
status: To Do
assignee: []
created_date: '2026-10-03 09:59'
labels:
  - story
dependencies: []
references:
  - src/render/cards/cards.css
  - src/render/cards/CardGrid.tsx
  - src/render/cards/Polaroid.tsx
  - src/render/cards/VictimCard.tsx
  - src/render/cards/cards.test.tsx
  - src/ui/play/play.css
parent_task_id: SLAY-16
type: feature
ordinal: 114000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the selected suspect card shows one clean state: a fine accent hairline inside the paper frame and a small accent pointer above the card; the other cards step back. The old double ring, red glow and enlargement are removed. Visual change only.
Type: deliverable
Branch: SLAY-16.8/card-spotlight
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A selected card has no outer ring, no red glow and no scale; it has a 1.5px accent hairline 3px inside the paper frame and a 12px accent pointer above it, plus a slight lift of 3px
- [ ] #2 While one card is selected, the other unplaced cards drop to opacity 0.62, with pure CSS (no new state); cards that are already placed keep their existing faded look
- [ ] #3 Selection is not conveyed by dimming or colour alone: the pointer shape and the existing selected attribute stay; the victim card's turn state uses the same style
- [ ] #4 Verified on the rendered screen at 360px and 1280px in en and nl, with reduced motion on and off; card tests updated
- [ ] #5 lint, typecheck and test --maxWorkers=1 are green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The old selected styles live in cards.css under .polaroid[data-selected]. Prototype of the new state: docs/design/depth-prototype.html is objects only; the card variant C is described here. A first draft of the CSS: .spotC .pol:not([data-selected]):not([data-placed]) opacity .62; selected: translateY(-3px), photo box-shadow 0 1px 0 rgba(42,42,54,.1), 0 10px 18px rgba(42,42,54,.22); ::before inset 3px border 1.5px accent radius 2px on the photo; ::after top -13px 12px accent triangle (clip-path).
<!-- SECTION:NOTES:END -->
