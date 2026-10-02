---
id: SLAY-14.3
title: 'Share: square card only, copy image and text as one action'
status: To Do
assignee: []
created_date: '2026-10-02 09:54'
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
- [ ] #1 SharePanel has no format toggle; preview and generated PNG are 1200x1200 in en and nl
- [ ] #2 The share action sends the square PNG plus the emoji text; filename keeps the square variant
- [ ] #3 Copy writes image+text to the clipboard when ClipboardItem is supported, otherwise text only, with a status message either way
- [ ] #4 Unused wide-card code and strings are removed (no dead CardFormat 'wide' path) and card/share tests are updated
- [ ] #5 docs/verification/share.ts checks the rendered panel on phone size and passes; lint, typecheck, test --maxWorkers=1 green
<!-- AC:END -->
