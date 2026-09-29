---
id: SLAY-9.5
title: >-
  Victim: auto-place on the last remaining square, remove from hints and manual
  placement
status: Done
assignee: []
created_date: '2026-09-29 09:57'
updated_date: '2026-09-29 12:17'
labels:
  - story
dependencies: []
references:
  - src/ui/play/SuspectPanel.tsx
  - src/render/cards/CardGrid.tsx
  - src/render/cards/VictimCard.tsx
  - src/game/hints.ts
  - src/game/board.ts
  - src/game/check.ts
  - src/ui/play/people.ts
  - src/game/reducer.ts
  - src/game/persistence.ts
parent_task_id: SLAY-9
type: feature
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the victim is never a card the player manually places and never the subject of a hint; once every suspect is placed, the victim's placement auto-fills the one remaining square.
Type: deliverable
Branch: SLAY-9.5/victim-auto-placement

Today the victim is just a Person with kind:'victim' in the same puzzle.people array as suspects (src/engine/model/types.ts). SuspectPanel.tsx wires a click on the victim card to the same onSelect used for suspects (comment: 'the victim has to be placed too'). hints.ts's nextStep/noteStep/deduction all iterate puzzle.people unfiltered, so the victim can be the subject of a hint like any suspect. check.ts's allPlaced() comment already says 'whether everybody, the victim included, stands on the grid' — confirming completion logic also expects the victim to be manually placed today.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Tapping/selecting the victim's card no longer arms placement (SuspectPanel's victim-click delegation to onSelect is removed or repurposed)
- [x] #2 The moment every suspect has a placement, the remaining empty cell auto-fills with the victim's placement without further player action
- [x] #3 hints.ts's nextStep/noteStep/deduction never select the victim as a hint subject (people iteration filtered to kind==='suspect')
- [x] #4 Completion/correctness checks (check.ts: allPlaced(), validAnswer()) still pass with a synthetic (auto-written) victim placement, not just a player-entered one
- [x] #5 Existing tests for victim card rendering/cosmetics (gift tag, pink note color in src/ui/play/people.ts) still pass or are deliberately updated
- [x] #6 Verification stays at the unit-test level (check.test.ts, hints.test.ts plus 1-2 representative fixtures) — no full schedule sweep or validate:generation run is needed for this story
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Remove victim-card onSelect wiring in SuspectPanel.tsx; decide whether VictimCard still renders informationally or is dropped from the tappable grid. 2. Filter puzzle.people to suspects only at the top of hints.ts's three entry points. 3. In the placement-commit path (locate the actual reducer/hook first — likely src/game/board.ts or a useGame.ts hook), after each suspect placement check whether exactly one empty cell remains and, if so, auto-write the victim's placement there. 4. Re-verify check.ts's allPlaced()/validAnswer() against a synthetic victim placement.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
src/engine/solver/human/techniques/victim-room.ts is a separate solver-internal technique (used by hints.ts's deduction() to reason about the victim's room) — distinct from this story's player-facing placement/hint-eligibility change; leave the solver technique itself alone.

Implementation: added board.ts:withAutoVictim(puzzle, board), a pure no-op-safe helper that reuses the existing (previously unused in production) engine/model/rules.ts:deriveVictimCell to compute the victim's square from the suspects' rows/columns, rather than re-deriving it from occupiable-cell counting. reducer.ts's edit() now composes editBoard(...) through withAutoVictim(...) so every action (place/remove/eraseCell/etc.) keeps the invariant: victim placed iff every suspect is placed. hints.ts's nextStep/noteStep/deduction now key off suspects-only and skip a victim subject explicitly (knowledge()/solveHuman() internals untouched, since victim-room.ts needs the full person list). Manual 'place' of the victim by id is still permitted at the reducer level (untouched) -- only the SuspectPanel card-tap wiring was removed -- so existing telemetry/persistence/store tests that place V directly kept working unchanged. Updated tests that encoded the old victim-gets-a-hint/victim-is-manually-placed behavior in hints.test.ts, persistence.test.ts and reducer.test.ts (new 'the victim fills in on its own' describe block); check.test.ts, people.test.tsx, PlayScreen.test.tsx, store.test.ts and telemetry.test.ts needed no changes. Widened References to include src/game/reducer.ts (the actual placement-commit call site board.ts's plan step 3 anticipated). Full suite (bun run test --maxWorkers=1, 140 files / 2909 tests) plus lint and typecheck are green.

Independent review (dipsaus-ai:story-reviewer): round 1 blocked only on a scope gap (src/game/persistence.test.ts touched without its production counterpart src/game/persistence.ts in References). Widened References to add src/game/persistence.ts and re-reviewed. Round 2 verdict: pass -- all 6 acceptance criteria met, no scope violations, no findings. Full suite (140 files / 2909 tests) plus lint and typecheck green in the worktree.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The victim is no longer a card the player places or a hint subject: SuspectPanel's victim-click delegation to onSelect is removed (the victim card is informational only now), and hints.ts's nextStep/noteStep/deduction filter to suspects and explicitly skip the victim as a placement or elimination subject, while leaving solveHuman's full person list and the victim-room technique untouched. board.ts adds withAutoVictim(puzzle, board), a pure, no-op-safe helper that reuses the engine's existing deriveVictimCell to write the victim onto the one square the suspects' rows/columns leave free; reducer.ts wires it into edit() so the invariant holds after every action (place, remove, eraseCell, undo/redo). check.ts needed no change: it only reads board.placements, so a synthetic victim placement completes the level exactly like a manual one did. Covered by new/updated unit tests in reducer.test.ts, hints.test.ts and persistence.test.ts; check.test.ts, people.test.tsx (cosmetics) and the rest of the suite pass unmodified. Full suite (140 files / 2909 tests), lint and typecheck are green. Independently reviewed (dipsaus-ai:story-reviewer): round 1 blocked only on a References scope gap (persistence.test.ts without persistence.ts declared); References widened; round 2 verdict pass with no scope violations and no findings.
<!-- SECTION:FINAL_SUMMARY:END -->
