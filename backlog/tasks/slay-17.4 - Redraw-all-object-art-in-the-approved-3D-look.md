---
id: SLAY-17.4
title: Redraw all object art in the approved 3D look
status: To Do
assignee: []
created_date: '2026-10-08 08:58'
updated_date: '2026-10-08 12:29'
labels:
  - needs-owner-review
dependencies:
  - SLAY-17.2
  - SLAY-17.3
  - SLAY-18.4
  - SLAY-17.8
references:
  - src/render/icons/
  - src/ui/help/legend.ts
  - tools/icon-sheet.ts
  - docs/design/
parent_task_id: SLAY-17
type: feature
ordinal: 121000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: every object icon on the board and in the legend is redrawn in the look the owner chose in SLAY-17.3, and an audit of all kinds on a contact sheet at board size shows no confusable pair. Named cases: rugs read as flat textiles, tables as legged tops, bookshelves as shelves with books.
Type: deliverable
Branch: SLAY-17.4/object-art-3d
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All object icons use the approved look in all 8 orientations, board and legend
- [ ] #2 Contact sheet (tools/icon-sheet.ts) at board size lists every kind; confusable pairs found are listed in docs/design/looks.md and fixed
- [ ] #3 Rug, table and bookshelf are clearly different from each other and recognisable at phone size
- [ ] #4 Legend swatches are not clipped
- [ ] #5 bun run lint, typecheck and test --maxWorkers=1 pass; verify:phone legend and screens suites pass
- [ ] #6 The bathtub (introduced in the SLAY-17.3 prototype) is drawn with water that clearly reads as water (visible water surface, colour and highlight distinct from the tub), checked at phone size
- [ ] #7 Scope is every object kind of every theme registered when this story merges: the five regular themes, Simpshouse (SLAY-18.4) and any seasonal theme already on main; none is left in the old look
- [ ] #8 A look-completeness test lists every ThemeObject kind of every registered theme and fails when one has no art in the approved look, so a future theme cannot skip it
- [ ] #9 docs/design/looks.md gets a section 'How to draw a new object' (block model, heights, board margin, legend padding, orientations) that the seasonal theme stories SLAY-18.6 to 18.9 follow
- [ ] #10 Owner has seen screenshots in the PR and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it.

Owner decision 2026-10-08: this story takes everything, including the extra themes. If a theme story merges BEFORE this one (Simpshouse, SLAY-18.4, does), this story redraws its art. Theme stories that come AFTER this one (SLAY-18.6 to 18.9) must follow the approved look and the completeness test themselves.
<!-- SECTION:NOTES:END -->
