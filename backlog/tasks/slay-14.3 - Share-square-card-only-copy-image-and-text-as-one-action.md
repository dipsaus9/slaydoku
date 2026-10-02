---
id: SLAY-14.3
title: 'Share: square card only, copy image and text as one action'
status: Done
assignee: []
created_date: '2026-10-02 09:54'
updated_date: '2026-10-02 11:00'
labels:
  - story
dependencies: []
references:
  - src/ui/share/
  - src/share/
  - docs/verification/share.ts
parent_task_id: SLAY-14
type: feature
ordinal: 91000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the share panel no longer offers a Wide/Square choice. The preview and PNG are always the 1200x1200 square. Share sends the square PNG plus the emoji text; Copy puts image and text together on the clipboard where the browser supports it (text-only fallback), so a player never copies two separate things.
Type: deliverable
Branch: SLAY-14.3/square-only-share
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SharePanel has no format toggle; preview and generated PNG are 1200x1200 in en and nl
- [x] #2 The share action sends the square PNG plus the emoji text; filename keeps the square variant
- [x] #3 Copy writes image+text to the clipboard when ClipboardItem is supported, otherwise text only, with a status message either way
- [x] #4 Unused wide-card code and strings are removed (no dead CardFormat 'wide' path) and card/share tests are updated
- [x] #5 docs/verification/share.ts checks the rendered panel on phone size and passes; lint, typecheck, test --maxWorkers=1 green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review: pass (advisory: driver also gained victim placement catch-up for SLAY-9.24; preview capped at 360px, phone driver passes).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Share panel is square-only: no format toggle, 1200x1200 preview and PNG (slaydoku-<n>-square.png), wide card code/strings removed. Copy writes image+text as one ClipboardItem where supported, else text only, with a status message either way. Verification driver updated (also catches up with SLAY-9.24 victim placement) and passes at phone and iPad size.
<!-- SECTION:FINAL_SUMMARY:END -->
