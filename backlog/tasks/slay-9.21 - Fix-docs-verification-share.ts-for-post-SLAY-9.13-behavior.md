---
id: SLAY-9.21
title: Fix docs/verification/share.ts for post-SLAY-9.13 behavior
status: Done
assignee: []
created_date: '2026-09-29 21:02'
updated_date: '2026-09-30 06:03'
labels:
  - story
dependencies: []
references:
  - docs/verification/share.ts
parent_task_id: SLAY-9
type: chore
ordinal: 78000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: docs/verification/share.ts's solveDay() scenario passes cleanly again, reflecting SLAY-9.13's actual current post-solve behavior.
Type: deliverable
Branch: SLAY-9.21/fix-share-verification-driver

Found while delivering SLAY-9.19 (confirmed pre-existing on a clean main build, not caused by that story, and deliberately left out of its References): docs/verification/share.ts crashes on all 6 viewports in bun run verify:phone. Same root cause SLAY-9.19 already fixed in drive.ts and stats.ts: solveDay() still asserts path() === '/' after solving, but SLAY-9.13 removed that redirect — a solved day now stays on /play showing ResultOverlay instead.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 bun run verify:phone's share.ts suite passes cleanly (0 failures) across all viewports
- [x] #2 The fix follows the same approach SLAY-9.19 already used for drive.ts/stats.ts (check the finish overlay on /play, dismiss via 'View the board', reach the start screen via the nav back button) rather than reinventing it
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Same class of issue as SLAY-9.10/9.11/9.19. Read SLAY-9.19's diff to drive.ts/stats.ts first — the fix shape is already established there.

bun run verify:phone SUITES=share: 162 checks, 0 failures across all 6 viewports (360x640, 390x844, 430x932, 844x390, 1024x768, 768x1024). Root cause and solveDay() fix matched SLAY-9.19's established shape (solve on /play, check the finish overlay embedded there via resultShare, dismiss with 'View the board', nav back button to start). Additionally: SLAY-9.13 also turned the start screen's share card into a reopenable popover (a Share button next to View board), not shown inline -- share.ts's own deep panel checks (preview, text, formats, Share/Copy/Download, keyboard, offline) needed the same popover-open step before each interaction, plus a .play-modal-scoped selector for the panel's own Share button (it shares data-action=share with the popover's opener button). lint, typecheck and test --maxWorkers=1 (142 files / 3052 tests) all green.

Independent review (dipsaus-ai:story-reviewer): verdict pass. AC1 and AC2 both met=true, no scope violations, no findings. Reviewer re-ran the driver independently (bun run build + vite preview + bun docs/verification/share.ts): 54 checks, 0 failures at default viewports.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed docs/verification/share.ts's solveDay() using SLAY-9.19's established fix shape (check the finish overlay on /play, dismiss with 'View the board', reach the start screen via the nav back button), and updated the rest of share.ts's own scenario to open the start screen's Share popover (SLAY-9.13's reopenable-card change) before every panel check/interaction, scoping the panel's own Share button with .play-modal since it shares data-action=share with the popover's opener. bun run verify:phone SUITES=share: 162 checks, 0 failures across all 6 viewports; lint, typecheck and test --maxWorkers=1 (142/3052) all green.
<!-- SECTION:FINAL_SUMMARY:END -->
