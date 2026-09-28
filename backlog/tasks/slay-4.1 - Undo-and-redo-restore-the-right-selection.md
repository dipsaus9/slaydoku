---
id: SLAY-4.1
title: Undo and redo restore the right selection
status: Done
assignee: []
created_date: '2026-09-28 13:17'
updated_date: '2026-09-28 13:29'
labels:
  - story
dependencies: []
references:
  - src/ui/play/PlayScreen.tsx
  - src/ui/play/PlayScreen.test.tsx
  - src/ui/play/undoRedoSelection.ts
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
- [x] #1 Undo re-selects the person whose placement it removed, found by diffing the board immediately before and after the undo dispatch (no reducer/history change needed); if the undone edit was not a placement (a note or a mark), selection is unchanged
- [x] #2 Redo mirrors this: it re-selects the person whose placement it restored
- [x] #3 A fresh placement (not an undo/redo) still auto-advances the selection to the next unplaced person exactly as before
- [x] #4 A new regression test reproduces the owner's exact scenario: place a person on square A, place wrongly is corrected — undo, then place on square B — and confirms the right person landed on B
- [x] #5 Existing PlayScreen tests and the docs/verification drive suite's place/undo/redo checks stay green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. In PlayScreen.tsx, wrap the Undo and Redo handlers: read store.getState().board before dispatching, dispatch, read it again after, diff placements to find which person's placement appeared/disappeared, and setSelectedId accordingly when one is found. 2. Leave afterPlace()'s existing auto-advance behavior untouched for ordinary placements. 3. Add the regression test.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The game store's history holds board snapshots only (src/game/reducer.ts), not the action that produced them — the fix must diff two board states in the UI layer, not add new reducer/history metadata.

Diff logic extracted to src/ui/play/undoRedoSelection.ts (selectionAfterUndoRedo) so it is unit-testable and to avoid the oxlint only-export-components warning on PlayScreen.tsx; PlayScreen's afterUndoRedo handler wraps store.dispatch({type:'undo'|'redo'}) with a before/after board read and calls it. afterPlace/nextUnplaced left untouched (AC3). Regression tests added to PlayScreen.test.tsx covering the owner's exact scenario plus the note/mark no-op case. Full suite green: 137 files / 2821 tests.

Review round 1: block — scopeViolations on src/ui/play/undoRedoSelection.ts and src/ui/play/PlayScreen.test.tsx (References named only PlayScreen.tsx). Fix: widened References to the three files actually touched (PlayScreen.tsx, PlayScreen.test.tsx, undoRedoSelection.ts) — no functional scope change, PlayScreen.tsx remains the single behavioral surface; the other two are its test and its extracted pure helper.

Review round 2: pass. All 5 acceptance criteria met, no scope violations, no findings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Undo and Redo in PlayScreen.tsx now reselect the person whose placement the dispatch touched, instead of leaving whatever auto-advance last selected. The fix diffs board.placements immediately before and after the undo/redo dispatch (pure helper selectionAfterUndoRedo in the new src/ui/play/undoRedoSelection.ts) to find the person added or removed; a note/mark-only edit leaves the selection untouched. Fresh placements still auto-advance exactly as before (afterPlace/nextUnplaced untouched). Regression tests added to PlayScreen.test.tsx, including the owner's exact reported scenario (place wrongly, undo, place the intended square, same person lands there). Full verify green (lint, typecheck, 137 test files / 2821 tests). Independent review passed on round 2 (round 1 blocked only on References scope, widened to include the test file and the extracted helper; no functional change). Parent epic SLAY-4 stays open: SLAY-4.2 and SLAY-4.3 are still To Do.
<!-- SECTION:FINAL_SUMMARY:END -->
