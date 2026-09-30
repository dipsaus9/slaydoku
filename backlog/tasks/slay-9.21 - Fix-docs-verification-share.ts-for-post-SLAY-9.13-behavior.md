---
id: SLAY-9.21
title: Fix docs/verification/share.ts for post-SLAY-9.13 behavior
status: To Do
assignee: []
created_date: '2026-09-29 21:02'
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
- [ ] #1 bun run verify:phone's share.ts suite passes cleanly (0 failures) across all viewports
- [ ] #2 The fix follows the same approach SLAY-9.19 already used for drive.ts/stats.ts (check the finish overlay on /play, dismiss via 'View the board', reach the start screen via the nav back button) rather than reinventing it
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Same class of issue as SLAY-9.10/9.11/9.19. Read SLAY-9.19's diff to drive.ts/stats.ts first — the fix shape is already established there.
<!-- SECTION:NOTES:END -->
