---
id: SLAY-18.4
title: Simpshouse theme and the 2026-10-14 day
status: To Do
assignee: []
created_date: '2026-10-08 09:21'
labels:
  - needs-owner-review
dependencies:
  - SLAY-18.1
  - SLAY-18.2
  - SLAY-18.3
  - SLAY-17.2
references:
  - src/content/themes/simpshouse.ts
  - src/content/themes/simpshouse.rooms.test.ts
  - src/render/icons/themes/
  - src/content/schedule/2026-10.json
  - src/content/schedule/index.json
parent_task_id: SLAY-18
type: feature
ordinal: 128000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the Simpshouse theme exists as built from the approved preview (rooms with EN and NL names, objects with allow-lists, own art for the fun objects, using the plain chair), is registered as seasonal, and 2026-10-14 is regenerated as a Simpshouse puzzle with the Simpshouse cast. Only that day is regenerated.
Type: deliverable
Branch: SLAY-18.4/simpshouse-theme
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The theme matches the owner-approved preview of SLAY-18.3 (rooms, objects, allowed rooms)
- [ ] #2 Every object has an allow-list and every kind an allowed room; a sweep over many seeds finds no out-of-room placement; no Pokemon names or logos anywhere
- [ ] #3 2026-10-14 is a Simpshouse puzzle with the Simpshouse cast; every other scheduled day is byte-identical to main; bun run schedule:check passes
- [ ] #4 Rendered screens (start screen, play screen, legend) of 2026-10-14 checked at 390 and 1024 wide on the date override
- [ ] #5 bun run lint, typecheck and test --maxWorkers=1 pass
- [ ] #6 Owner has seen the 2026-10-14 day and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. Deadline: merged and deployed before 2026-10-14 (UTC). If SLAY-17.2 runs late, drop that dependency (merge conflict risk is small).
<!-- SECTION:NOTES:END -->
