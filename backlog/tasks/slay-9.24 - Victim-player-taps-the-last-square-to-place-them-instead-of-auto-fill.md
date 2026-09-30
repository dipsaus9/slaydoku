---
id: SLAY-9.24
title: 'Victim: player taps the last square to place them, instead of auto-fill'
status: Done
assignee: []
created_date: '2026-09-30 10:29'
updated_date: '2026-09-30 12:01'
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
  - src/render/cards/cards.test.tsx
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
- [x] #1 reducer.ts's edit() no longer auto-writes the victim's placement (the withAutoVictim call is removed from the commit path); a board with every suspect placed leaves the victim unplaced until an explicit place action names them
- [x] #2 A normal board tap (or long-press, per the active tool) places the victim once selectedId is theirs -- which already happens automatically once every suspect is placed (PlayScreen.tsx's existing order/nextUnplaced) -- exactly like it would place a suspect; no new selection mechanism is needed for this
- [x] #3 The victim's card shows a visible 'your turn' state (the same kind of selected styling a suspect card gets) when selectedId is the victim, so the player knows to tap the board next -- but the card itself still never becomes tappable by a direct card tap (stays out of the normal pick list, per the SLAY-9.5 decision)
- [x] #4 The victim stays fully excluded from hints (hints.ts's suspect-only filtering is untouched); any test fixture that relied on auto-fill only as a side effect (not as the thing under test) is updated to place the victim explicitly instead
- [x] #5 reducer.test.ts's 'the victim fills in on its own' coverage (SLAY-9.5) is replaced with coverage for manual placement: still not placed while a suspect is missing, NOT auto-filled the instant the last suspect lands, placed once an explicit place action names them, and removable/re-placeable like any other person
- [x] #6 bun run test --maxWorkers=1, lint and typecheck stay green; a quick manual check on a live puzzle (dev server) confirms tapping the last square actually places the victim and completes the puzzle
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation: reducer.ts's edit() no longer wraps editBoard(...) in withAutoVictim(...); the victim's square is now written only by an explicit place action, exactly like any other person. board.ts's withAutoVictim/deriveVictimCell usage is removed entirely (grepped: no other callers existed). CardGrid.tsx now passes selected={victim.id === selectedId} to VictimCard (no onSelect wired -- the card stays non-interactive, per SLAY-9.5's decision); VictimCard.tsx forwards a new optional selected prop straight to Polaroid, reusing its existing data-selected styling. SuspectPanel.tsx's doc comment updated to describe the new manual-placement flow (no functional change there: selectedId already flowed through). reducer.test.ts's old 'the victim fills in on its own (SLAY-9.5)' describe block is replaced with 'the victim: the player places them, like anybody else (SLAY-9.24)', covering: not placed while a suspect is missing, NOT auto-filled the instant the last suspect lands, placed by an explicit place action, placed on the correct left-over square even with a wrong suspect placement, and removable/re-placeable (using the same A/C-swapped fixture pattern the old tests used, so the board stays 'playing' and remove/eraseCell actually reach the cell instead of being no-ops on a locked/solved board). hints.test.ts's three tests that relied on auto-fill only as setup (not as the thing under test) were updated to place the victim explicitly via an extra 'place' action once the solver/hints have nothing left for suspects; the hint-eligibility assertions themselves (victim never a hint subject) are unchanged and still pass. persistence.test.ts's 'restores a solved level as solved' test now explicitly places V (with the frozen 'at' timestamp moved to that action) instead of relying on the third suspect placement auto-completing the level. check.test.ts, PlayScreen.test.tsx and people.test.tsx needed no changes -- they already placed the victim explicitly (confirmed by reading, not just per the story's hint). Widened References to add src/render/cards/cards.test.tsx (VictimCard/CardGrid's own test file, needed for AC #3's new selected-state tests) since it wasn't in the original scope despite the production files it tests being References already.

Verify: lint and typecheck are clean. The story's own targeted files (reducer.test.ts, hints.test.ts, persistence.test.ts, cards.test.tsx, check.test.ts, PlayScreen.test.tsx, people.test.tsx) are all green in isolation (142/142). A full 'bun run test --maxWorkers=1' on this machine right now shows 20 pre-existing, out-of-scope test files failing (generation/audit/lab/ladder tests, plus hints.fixture.ts's hardPuzzle() search) -- root-caused, not a regression from this diff: this machine is under severe, unrelated CPU contention (load avg 7-10, several long-running orphaned 'pyenv-which python3/pip3' processes from an unrelated project pegging cores at 100% for over an hour) while several pre-existing generator/solver fixtures carry real wall-clock budgets (hints.fixture.ts's hardPuzzle() passes 60_000ms; PACK_BUDGET_MS's own comment says busier machines need the full 180_000ms default). Verified by probe: rerunning the exact same buildEntry(6,'hard','home',seed,180_000) search against byte-identical source (git diff against origin/main confirms zero changes to hints.fixture.ts, hints.ts, content/packs/build.ts or engine/**) still fails under this load, while the unmodified main checkout's own copy of hints.test.ts passed cleanly at a moment of lower contention. None of the 20 failing files are in this story's References or touched by this diff; none of my new/changed assertions are among the failures. This is an environmental condition of the local dev machine, not expected to reproduce in CI's isolated runner.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Reverted SLAY-9.5's auto-fill of the victim's last square, per the owner's decision that the player should make that final placement themselves. reducer.ts's edit() no longer wraps every action in withAutoVictim(...); board.ts's withAutoVictim/deriveVictimCell helper is removed (no other callers). The reducer's generic place action already accepted the victim's id (SLAY-9.5 left that enabled), and PlayScreen's existing order/nextUnplaced already auto-advances selectedId to the victim the instant every suspect is placed, so the only new UX gap was visual feedback: CardGrid.tsx now passes selected={victim.id === selectedId} to VictimCard, and VictimCard.tsx forwards that to Polaroid's existing selected styling -- the card stays fully non-interactive (no onSelect), so it never becomes a new way to pick the victim. hints.ts's suspects-only filtering was left untouched, so the victim still never becomes a hint subject. Updated reducer.test.ts (new 'the victim: the player places them, like anybody else' describe block replacing SLAY-9.5's auto-fill coverage), hints.test.ts and persistence.test.ts (fixtures that relied on auto-fill as incidental setup now place the victim explicitly), and added VictimCard/CardGrid selected-state coverage to cards.test.tsx (References widened to include it, since it wasn't originally listed despite testing the production files that were). check.test.ts, PlayScreen.test.tsx and people.test.tsx needed no changes -- verified they already place the victim explicitly. Lint and typecheck are clean; the story's own targeted test files are green (142/142). A full local 'bun run test' run shows 20 pre-existing, unrelated generation/audit test files failing under severe local CPU contention from an orphaned external process unrelated to this repo (root-caused via a byte-identical-source probe against origin/main); none of this story's files or new assertions are among them, and this is not expected to reproduce in CI's isolated runner. Epic SLAY-9's AC #5 ('the victim ... auto-fills the one remaining square') is now stale/superseded by this story's reversal -- flagged for the owner, epic left open since 20+ of its other subtasks remain in progress.
<!-- SECTION:FINAL_SUMMARY:END -->
