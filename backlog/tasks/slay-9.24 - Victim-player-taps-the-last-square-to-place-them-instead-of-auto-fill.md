---
id: SLAY-9.24
title: 'Victim: player taps the last square to place them, instead of auto-fill'
status: To Do
assignee: []
created_date: '2026-09-30 10:29'
labels:
  - story
dependencies: []
references:
  - src/game/reducer.ts
  - src/game/board.ts
  - src/render/cards/CardGrid.tsx
  - src/render/cards/VictimCard.tsx
  - src/ui/play/SuspectPanel.tsx
  - src/game/reducer.test.ts
  - src/game/hints.test.ts
  - src/game/persistence.test.ts
  - src/ui/play/PlayScreen.test.tsx
  - src/ui/play/people.test.tsx
  - src/game/check.test.ts
parent_task_id: SLAY-9
type: feature
ordinal: 81000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: once every suspect is placed, the remaining board cell is placed by the player's own tap, not auto-written; the victim stays out of hints and out of the normal suspect pick list.
Type: deliverable
Branch: SLAY-9.24/victim-manual-final-placement

Context: SLAY-9.5 made the victim auto-fill the one remaining square the instant every suspect is placed, and removed the victim card's tap-to-select wiring (SuspectPanel.tsx / CardGrid.tsx / VictimCard.tsx), since at the time the victim was wrongly manually placeable and hintable. The owner now wants the auto-fill part reverted: the player should make that last placement themselves, as the satisfying final move of the puzzle. The victim must stay excluded from hints (hints.ts's suspects-only filtering, untouched) and stay out of the normal pick list (the victim card itself must not become a new way to select/place them at any earlier point) -- only the natural last board tap places them.

Mechanism already mostly in place: PlayScreen.tsx's order array lists suspects then the victim, and afterPlace's nextUnplaced already auto-advances selectedId to the victim's id the moment the last suspect lands, well before this story. The reducer's generic place() action already accepts any person id, victim included (SLAY-9.5's own notes confirm manual placement was left enabled at the reducer level). So the actual change is narrower than it looks: stop the reducer from writing the victim's placement automatically, and give the player a visible cue that it is now their move.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 reducer.ts's edit() no longer auto-writes the victim's placement (the withAutoVictim call is removed from the commit path); a board with every suspect placed leaves the victim unplaced until an explicit place action names them
- [ ] #2 A normal board tap (or long-press, per the active tool) places the victim once selectedId is theirs -- which already happens automatically once every suspect is placed (PlayScreen.tsx's existing order/nextUnplaced) -- exactly like it would place a suspect; no new selection mechanism is needed for this
- [ ] #3 The victim's card shows a visible 'your turn' state (the same kind of selected styling a suspect card gets) when selectedId is the victim, so the player knows to tap the board next -- but the card itself still never becomes tappable by a direct card tap (stays out of the normal pick list, per the SLAY-9.5 decision)
- [ ] #4 The victim stays fully excluded from hints (hints.ts's suspect-only filtering is untouched); any test fixture that relied on auto-fill only as a side effect (not as the thing under test) is updated to place the victim explicitly instead
- [ ] #5 reducer.test.ts's 'the victim fills in on its own' coverage (SLAY-9.5) is replaced with coverage for manual placement: still not placed while a suspect is missing, NOT auto-filled the instant the last suspect lands, placed once an explicit place action names them, and removable/re-placeable like any other person
- [ ] #6 bun run test --maxWorkers=1, lint and typecheck stay green; a quick manual check on a live puzzle (dev server) confirms tapping the last square actually places the victim and completes the puzzle
<!-- AC:END -->
