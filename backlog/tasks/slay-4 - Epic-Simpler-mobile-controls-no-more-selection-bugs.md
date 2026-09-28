---
id: SLAY-4
title: 'Epic: Simpler mobile controls, no more selection bugs'
status: Done
assignee: []
created_date: '2026-09-28 13:17'
updated_date: '2026-09-28 16:11'
labels:
  - epic
dependencies: []
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: playing a puzzle on a phone feels natural — the toolbar shows fewer controls, undoing a placement puts the selection back where the player expects it, and the board/cards read as tidy rather than busy. Chosen approach (over a full new art direction): controls first. The owner's concrete complaints are a real interaction bug (undo does not restore selection, so a corrected misclick can place the wrong person) and toolbar clutter (12 buttons); the existing warm evidence-board identity (SLAY-2) is fresh and stays, this epic reduces and tidies rather than replaces it. Researched comparable minimal daily-puzzle UIs (Wordle, NYT Connections, Griductive, Awwwards' own minimal collection) — the common thread is few visible controls and calm, low-noise visuals, which is what this epic aims at.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Undoing or redoing a placement selects the person that placement action concerned, not whatever auto-advance had selected
- [x] #2 The play-screen toolbar's main row shows 8 controls (Note, Place, X, Erase, Undo, Redo, Hint, Zoom); Options, Help and Legend live behind one More control; Auto-X is an Options toggle
- [x] #3 Board furniture/object icons keep their shapes but read calmer (less saturated, less visual noise); room labels and grid lines use the existing warm design tokens; suspect/victim cards line up to a consistent height
- [x] #4 No game logic, puzzle content, icon silhouette or card text changes; the full verify:phone suite stays green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
All three stories (4.1 undo/redo selection, 4.2 toolbar consolidation, 4.3 calmer board/cards) delivered and merged (PRs #32, #34, #31). Closed by the orchestrator once the last story's PR (blocked on a subagent-side push permission false positive) was pushed and merged directly.
<!-- SECTION:NOTES:END -->
