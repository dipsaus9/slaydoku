---
id: SLAY-4.1
title: Undo and redo restore the right selection
status: To Do
assignee: []
created_date: '2026-09-28 13:17'
labels:
  - story
dependencies: []
references:
  - src/ui/play/PlayScreen.tsx
parent_task_id: SLAY-4
type: feature
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: after Undo, the person whose placement was just removed becomes selected again, matching the 'undo my last move, try again' expectation. Redo mirrors it forward. Fixes the reported scenario: place a person on the wrong square, Undo, tap the intended square — the same person (not whoever auto-advance had moved on to) gets placed there.
Type: deliverable
Branch: SLAY-4.1/undo-selection-fix
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Undo re-selects the person whose placement it removed, found by diffing the board immediately before and after the undo dispatch (no reducer/history change needed); if the undone edit was not a placement (a note or a mark), selection is unchanged
- [ ] #2 Redo mirrors this: it re-selects the person whose placement it restored
- [ ] #3 A fresh placement (not an undo/redo) still auto-advances the selection to the next unplaced person exactly as before
- [ ] #4 A new regression test reproduces the owner's exact scenario: place a person on square A, place wrongly is corrected — undo, then place on square B — and confirms the right person landed on B
- [ ] #5 Existing PlayScreen tests and the docs/verification drive suite's place/undo/redo checks stay green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. In PlayScreen.tsx, wrap the Undo and Redo handlers: read store.getState().board before dispatching, dispatch, read it again after, diff placements to find which person's placement appeared/disappeared, and setSelectedId accordingly when one is found. 2. Leave afterPlace()'s existing auto-advance behavior untouched for ordinary placements. 3. Add the regression test.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The game store's history holds board snapshots only (src/game/reducer.ts), not the action that produced them — the fix must diff two board states in the UI layer, not add new reducer/history metadata.
<!-- SECTION:NOTES:END -->
