---
id: SLAY-17.4
title: Redraw all object art in the approved 3D look
status: In Progress
assignee: []
created_date: '2026-10-08 08:58'
updated_date: '2026-10-08 17:09'
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
  - src/render/looks/
  - src/render/scene/
  - src/ui/play/
  - src/ui/help/
  - src/locale/
  - docs/verification/
  - docs/handoff.md
  - tools/seasonal-previews.tsx
  - src/content/themes/
  - src/engine/clues/
  - src/content/packs/gates.ts
  - src/content/packs/gates.test.ts
  - docs/authoring/theme-and-icons.md
  - docs/themes/seasonal/common.ts
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
- [x] #1 All object icons use the approved look in all 8 orientations, board and legend
- [x] #2 Contact sheet (tools/icon-sheet.ts) at board size lists every kind; confusable pairs found are listed in docs/design/looks.md and fixed
- [x] #3 Rug, table and bookshelf are clearly different from each other and recognisable at phone size
- [x] #4 Legend swatches are not clipped
- [x] #5 bun run lint, typecheck and test --maxWorkers=1 pass; verify:phone legend and screens suites pass
- [x] #6 The bathtub (introduced in the SLAY-17.3 prototype) is drawn with water that clearly reads as water (visible water surface, colour and highlight distinct from the tub), checked at phone size
- [x] #7 Scope is every object kind of every theme registered when this story merges: the five regular themes, Simpshouse (SLAY-18.4) and any seasonal theme already on main; none is left in the old look
- [x] #8 A look-completeness test lists every ThemeObject kind of every registered theme and fails when one has no art in the approved look, so a future theme cannot skip it
- [x] #9 docs/design/looks.md gets a section 'How to draw a new object' (block model, heights, board margin, legend padding, orientations) that the seasonal theme stories SLAY-18.6 to 18.9 follow
- [x] #10 Owner decision 2026-10-08: the look is A2 (oblique blocks on the unchanged square grid). A2 becomes the only production look; the Look switch and the A3 (isometric) code from SLAY-17.8 are removed again (they stay in git history and docs/design/looks.md)
- [x] #11 An object never paints outside its own room: blocks must not cross a wall into the neighbouring room or cover the cell behind a wall (clip to the room, or draw the walls above the objects and cap the height at the room edge); checked on a rendered board against docs/design/looks-feedback/2026-10-08-a2-poc-overflow-and-flat-items.png
- [x] #12 Every kind is in the A2 style, with no flat leftovers: named in the owner's feedback are toilet, washbasin (sink), washing machine, dryer, kitchen counter and stairs; a rendered contact sheet of all kinds proves it
- [x] #13 A chair faces the nearest object people sit at (table, dining table, desk, kitchen counter, garden table) when it touches one (4 neighbours, stable order), else away from the nearest wall into the room, else the default; a render-only pure function with unit tests, working with the block orientation matrix; a board with tables and chairs in the PR screenshots
- [ ] #14 Owner has seen screenshots in the PR and approved (only the owner ticks this)
- [ ] #15 Every object kind of every registered theme has a required Dutch noun (ThemeObject.nameNl) naming exactly what is drawn (a lava lamp is 'lavalamp', not 'plant'; a filing cabinet 'archiefkast', not 'kast'); Dutch clue cards, the Dutch Legend (with its 'ook' siblings) and the clue-noun audit use it the way English uses name/clueNoun, the audit runs in both languages in the pack gate, a test fails when a kind lacks a Dutch noun, and the authoring docs say the field is required
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it.

Owner decision 2026-10-08: this story takes everything, including the extra themes. If a theme story merges BEFORE this one (Simpshouse, SLAY-18.4, does), this story redraws its art. Theme stories that come AFTER this one (SLAY-18.6 to 18.9) must follow the approved look and the completeness test themselves.

Owner feedback on the A2 PoC (2026-10-08): 'elementen lijken over andere vakjes heen te lopen en sommige items zijn nog niet in dezelfde stijl zoals het toilet en de wasbak'. Screenshot: docs/design/looks-feedback/2026-10-08-a2-poc-overflow-and-flat-items.png. The PoC only drew chair, sofa, bed, bookshelf, table, rug and plant, so the flat items are expected; the overflow across walls is a real A2 issue to solve here (headroom of the blocks versus walls).

Review gate (dipsaus-ai:story-reviewer): pass, no scope violations, no findings. Verification: bun docs/verification/looks.ts 88/88 checks on 360/390/768/1024; verify:phone legend+screens 1278 checks, 0 failures; full suite 3597 tests green.
<!-- SECTION:NOTES:END -->
