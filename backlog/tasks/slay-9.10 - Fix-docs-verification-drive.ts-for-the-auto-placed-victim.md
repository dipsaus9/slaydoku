---
id: SLAY-9.10
title: Fix docs/verification/drive.ts for the auto-placed victim
status: Done
assignee: []
created_date: '2026-09-29 12:59'
updated_date: '2026-09-29 14:28'
labels:
  - story
dependencies: []
references:
  - docs/verification/drive.ts
  - docs/verification/stats.ts
  - docs/verification/share.ts
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
- [x] #1 placeAll() (and any other scenario in this file with the same assumption) only long-presses suspects; it does not wait for or attempt to select/click-place the victim
- [x] #2 The victim's auto-fill is asserted directly instead (e.g. check that the last remaining cell holds the victim once every suspect is placed, without any click on it)
- [x] #3 bun run verify:phone passes cleanly at the previously-crashing viewport (844x390) and every other viewport, with no other regression introduced
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1) docs/verification/drive.ts: placeAll() loops only over suspects (idByName/loop bound from puzzle.people.filter(kind==='suspect')), drops the victim branch from pid resolution; after the suspect loop, assert the victim auto-filled via the existing .play-cards[data-victim-placed] marker (SuspectPanel.tsx) and, for the correct-solve path (swap=false), that the [data-person] element for the victim id sits on the correct [data-cell-key] (BoardLayers.tsx PeopleLayer). 2) Same file: the card-panel scroll scenario that taps the gift/victim polaroid and asserts data-victim-selected (dead CSS since SLAY-9.5, victim card has no onClick per SuspectPanel.tsx) is changed to only assert the gift card scrolls into view; drop the now-meaningless tap+selected assertion. 3) docs/verification/stats.ts and docs/verification/share.ts: same placeAll() fix (suspects-only loop + data-victim-placed assertion) since bun run verify:phone (AC #3) runs every suite and both have the identical bug (confirmed by a pre-fix baseline run at 844x390). 4) Verify: bun run lint/typecheck/test, then bun run verify:phone at 844x390 for drive/stats/share (fast pre-check), then the full bun run verify:phone across all viewports/suites before closing out.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Widened References to include stats.ts and share.ts: baselined bun run verify:phone (SUITES=drive,stats,share VIEWPORTS=844x390) against a clean build BEFORE any change and confirmed both stats.ts and share.ts have the identical placeAll()/selectedName() victim-selection assumption as drive.ts (data-victim-selected is dead CSS since SLAY-9.5) and fail the same way (2 and 1 failures respectively). AC #3 requires 'bun run verify:phone passes cleanly', which runs all suites, so fixing drive.ts alone cannot satisfy it; widening scope to fix all three placeAll() implementations consistently.

Two real bugs found beyond the described root cause, both fixed: (1) drive.ts's wrong-board scenario (placeAll(puzzle, true)) swapped puzzle.solution[0]/[1], but solution[0] is the victim's own entry -- swapping it with a suspect broke withAutoVictim's leftover-cell derivation. Fixed to swap two SUSPECT solution entries only. (2) The advance order (order.ts / nextUnplaced in PlayScreen.tsx) still walks through the victim's own slot and can select it before every suspect is placed (observed after the file's existing clear-all/undo dance leaves one suspect, Anna, unplaced while the wrap reaches the victim's turn first); since the victim is never rendered as selected post-SLAY-9.5, selectedName() then reports NONE. placeAll() now recovers by tapping the still-unplaced suspect's own card (scrollIntoView + tap) instead of trusting the advance order blindly. (3) A correctly-solved board navigates back to '/' on its own (DailyFlow.tsx's solvedNow effect, no button click) as soon as it is solved -- checking the board's data-victim-placed/data-person after that races the navigation and always loses. Removed the internal board assertion for the correct-solve path in all three files; the callers' existing 'solved, path is /, data-result=solved' checks already prove the victim square filled in correctly (a wrong board could never reach that state). Kept a direct .play-cards[data-victim-placed] assertion only for drive.ts's wrong-board path, where the board stays on screen. Verified with: bun run lint/typecheck/test (140 files, 3013 tests green), then bun run verify:phone (SKIP_BUILD after bun run build) across all 6 viewports and all 7 suites: 2814 checks, 0 failures.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed docs/verification/drive.ts, stats.ts and share.ts's placeAll() for SLAY-9.5's auto-placed victim: they now only long-press suspects (never wait for or click-place the victim). Along the way, fixed two related bugs the SLAY-9.5 change exposed: the wrong-board test in drive.ts was accidentally swapping the victim's own solution entry with a suspect's (solution[0] is the victim), and the app's selection-advance order can point at the victim's own (now invisible) slot before every suspect is placed, which placeAll() now recovers from by tapping the still-unplaced suspect's own card. A correctly solved board navigates back to '/' on its own as soon as it is solved, so the direct victim-auto-fill assertion is only made for the wrong-board path (board stays on screen); for a correct solve, the existing downstream 'solved, path is /, data-result=solved' check already proves it. Verified with bun run lint/typecheck/test (3013 tests green) and a full bun run verify:phone across all 6 viewports and 7 suites: 2814 checks, 0 failures, including the previously-crashing 844x390 viewport.
<!-- SECTION:FINAL_SUMMARY:END -->
