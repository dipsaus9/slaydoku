---
id: SLAY-9.5
title: >-
  Victim: auto-place on the last remaining square, remove from hints and manual
  placement
status: To Do
assignee: []
created_date: '2026-09-29 09:57'
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
- [ ] #1 Tapping/selecting the victim's card no longer arms placement (SuspectPanel's victim-click delegation to onSelect is removed or repurposed)
- [ ] #2 The moment every suspect has a placement, the remaining empty cell auto-fills with the victim's placement without further player action
- [ ] #3 hints.ts's nextStep/noteStep/deduction never select the victim as a hint subject (people iteration filtered to kind==='suspect')
- [ ] #4 Completion/correctness checks (check.ts: allPlaced(), validAnswer()) still pass with a synthetic (auto-written) victim placement, not just a player-entered one
- [ ] #5 Existing tests for victim card rendering/cosmetics (gift tag, pink note color in src/ui/play/people.ts) still pass or are deliberately updated
- [ ] #6 Verification stays at the unit-test level (check.test.ts, hints.test.ts plus 1-2 representative fixtures) — no full schedule sweep or validate:generation run is needed for this story
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Remove victim-card onSelect wiring in SuspectPanel.tsx; decide whether VictimCard still renders informationally or is dropped from the tappable grid. 2. Filter puzzle.people to suspects only at the top of hints.ts's three entry points. 3. In the placement-commit path (locate the actual reducer/hook first — likely src/game/board.ts or a useGame.ts hook), after each suspect placement check whether exactly one empty cell remains and, if so, auto-write the victim's placement there. 4. Re-verify check.ts's allPlaced()/validAnswer() against a synthetic victim placement.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
src/engine/solver/human/techniques/victim-room.ts is a separate solver-internal technique (used by hints.ts's deduction() to reason about the victim's room) — distinct from this story's player-facing placement/hint-eligibility change; leave the solver technique itself alone.
<!-- SECTION:NOTES:END -->
