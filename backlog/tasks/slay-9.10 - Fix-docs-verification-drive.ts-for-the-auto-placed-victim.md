---
id: SLAY-9.10
title: Fix docs/verification/drive.ts for the auto-placed victim
status: To Do
assignee: []
created_date: '2026-09-29 12:59'
labels:
  - story
dependencies: []
references:
  - docs/verification/drive.ts
parent_task_id: SLAY-9
type: chore
ordinal: 66000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: docs/verification/drive.ts's placeAll() (and any other scripted scenario that expects to select/click-place the victim) is updated for SLAY-9.5's auto-placement behavior — the victim is never selectable and fills itself once every suspect is placed.
Type: deliverable
Branch: SLAY-9.10/fix-drive-verification-for-auto-victim

Root cause (found while delivering SLAY-9.2, confirmed on a clean origin/main baseline after SLAY-9.5 merged): placeAll() iterates puzzle.people.length (suspects + victim) and waits for selectedName() to eventually report 'The victim' selected so it can long-press it onto its solution cell. Since SLAY-9.5 removed victim selectability, selectedName() never reports the victim, pid resolves to undefined on that final iteration, and placeAll() returns false early — crashing/failing the short-landscape (844x390) scenario in bun run verify:phone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 placeAll() (and any other scenario in this file with the same assumption) only long-presses suspects; it does not wait for or attempt to select/click-place the victim
- [ ] #2 The victim's auto-fill is asserted directly instead (e.g. check that the last remaining cell holds the victim once every suspect is placed, without any click on it)
- [ ] #3 bun run verify:phone passes cleanly at the previously-crashing viewport (844x390) and every other viewport, with no other regression introduced
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Change placeAll()'s loop to iterate only suspects (puzzle.people.filter(p => p.kind === 'suspect')); after suspects are all placed, assert the victim's cell is auto-filled correctly instead of driving a click for it.
<!-- SECTION:PLAN:END -->
