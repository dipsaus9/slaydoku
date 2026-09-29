---
id: SLAY-9.19
title: >-
  Fix docs/verification/drive.ts, stats.ts and locale.ts for post-SLAY-9.13/9.15
  behavior
status: To Do
assignee: []
created_date: '2026-09-29 19:48'
labels:
  - story
dependencies: []
references:
  - docs/verification/drive.ts
  - docs/verification/stats.ts
  - docs/verification/locale.ts
parent_task_id: SLAY-9
type: chore
ordinal: 76000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the manual browser-verification drivers (bun run verify:phone) pass cleanly again, reflecting current app behavior instead of stale assumptions from before SLAY-9.13 and SLAY-9.15.
Type: deliverable
Branch: SLAY-9.19/fix-stale-verification-drivers

Found while delivering SLAY-9.18 (confirmed pre-existing on a clean main build, not caused by that story): drive.ts, stats.ts and locale.ts fail 16, 4 and 2 checks respectively. Two known causes:
- SLAY-9.13 removed the force-navigate-to-'/' on solve, so any driver scenario still asserting a redirect back to start after solving is now wrong.
- SLAY-9.15 removed the redundant long-date byline segment, so any driver scenario still asserting that text is now wrong.
There also may be additional drift beyond these two known causes — the acceptance criteria ask for a full audit, not just patching the two known symptoms.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 bun run verify:phone passes cleanly (0 failures) across drive.ts, stats.ts and locale.ts, on all viewports and both locales
- [ ] #2 Each fix reflects the actual current, intended behavior (per SLAY-9.13/9.15/9.16/9.18's own delivered outcomes) rather than being patched to just stop failing
- [ ] #3 Audit for drift beyond the two known causes named above — don't assume those are the only stale assertions
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Same class of issue as SLAY-9.10/9.11 (verification drivers going stale after an intentional behavior change) — follow the same approach: reproduce live first, fix the driver's assumption, don't weaken the check to hide the drift.
<!-- SECTION:NOTES:END -->
