---
id: SLAY-15.3
title: Privacy copy and live-check for the skip-today date
status: Done
assignee: []
created_date: '2026-10-03 09:16'
updated_date: '2026-10-03 11:37'
labels:
  - story
dependencies:
  - SLAY-15.2
references:
  - src/ui/about/
  - docs/push.md
  - CLAUDE.md
parent_task_id: SLAY-15
type: docs
ordinal: 103000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the About page, docs/push.md and CLAUDE.md say that the Worker also holds, for a day, the date you last solved so the reminder can skip you, and docs/push.md has the live check for it.
Type: deliverable
Branch: SLAY-15.3/skip-privacy-copy
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 About (en and nl) lists the extra stored item: a skip date that expires after about a day, only when the reminder is on
- [x] #2 CLAUDE.md push sentence names the skip date next to endpoint, keys and chosen hour
- [x] #3 docs/push.md has a live check: solve today with the reminder at a later hour, confirm no notification that day and one the next day; plus how to read the skip key with wrangler
- [x] #4 Dutch-text guard, lint, typecheck and test --maxWorkers=1 green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review: pass (advisory: TTL 36h matches Worker). Rendered About checked en/nl at 1280 and 360 (headless Chrome min width clips 360 shot; text wraps).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
About (en, nl), CLAUDE.md push sentence and docs/push.md now name the skip date; docs/push.md gained the live check with wrangler key list/get.
<!-- SECTION:FINAL_SUMMARY:END -->
