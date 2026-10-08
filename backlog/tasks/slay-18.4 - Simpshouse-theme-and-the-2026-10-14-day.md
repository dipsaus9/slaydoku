---
id: SLAY-18.4
title: Simpshouse theme and the 2026-10-14 day
status: Done
assignee: []
created_date: '2026-10-08 09:21'
updated_date: '2026-10-08 13:39'
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
  - src/schedule/gates.ts
  - src/schedule/gates.pair.test.ts
  - src/schedule/cast.simpshouse.test.ts
  - src/schedule/cast.test.ts
  - src/schedule/schedule.test.ts
  - src/schedule/calendar.test.ts
  - src/schedule/pick.test.ts
  - src/render/scene/roomStyles.ts
  - src/content/themes/types.ts
  - src/content/themes/index.ts
  - src/content/themes/themes.test.ts
  - src/content/packs/packs.test.ts
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
- [x] #1 The theme matches the owner-approved preview of SLAY-18.3 (rooms, objects, allowed rooms)
- [x] #2 2026-10-14 is a Simpshouse puzzle with the Simpshouse cast; every other scheduled day is byte-identical to main; bun run schedule:check passes
- [x] #3 Rendered screens (start screen, play screen, legend) of 2026-10-14 checked at 390 and 1024 wide on the date override
- [x] #4 bun run lint, typecheck and test --maxWorkers=1 pass
- [x] #5 Pikachu plush is the only third-party name; no Pokemon wording, Pokeball or logos; every object has an allow-list and every kind an allowed room; a sweep over many seeds finds no out-of-room placement
- [x] #6 Owner has seen the 2026-10-14 day and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. Deadline: merged and deployed before 2026-10-14 (UTC). If SLAY-17.2 runs late, drop that dependency (merge conflict risk is small).

From SLAY-18.3 (preview): the Salmari drink (a dark liquorice liqueur bottle with shot glasses on a tray, kind salmariBar, drawn on a bar/tray) needs a clue-text engine type decision. The draft uses engine type 'table'; decide in the clue-wording pass whether a drink on a bar/tray reads as a table, a counter or gets its own noun. Same pass: re-check the other borrowed engine types (rabbit hutch as chest, photo wall as easel).

AC 2 says no Pokemon names or logos anywhere; the owner decided on 2026-10-08 that Simpshouse gets a Pikachu plush (the only named third-party character, hand-drawn, no other wording). Reword that AC when this story is picked up; the go-public checklist line is in docs/launch.md.

Ships before the approved 3D look (deadline 2026-10-14) in the current look; SLAY-17.4 redraws its art afterwards, so keep each new object a separate, self-contained drawing.

Deviation: vanity footprints 2x1/3x1 (desk needs 2-3 cells). Gate: THEMED_DAY_SHARED_NAMES=1. Screenshots in docs/verification/simpshouse-day/. Owner approval (AC 6) left open.

Review gate: pass. Advisory: THEMED_DAY_SHARED_NAMES applies to any themed cast pool, not only Simpshouse; owner to confirm.

Owner approved the 2026-10-14 Simpshouse day in chat on 2026-10-08 ("Akkoord"). The glam vanity footprint grew to 2x1 and 3x1 (engine type desk needs 2-3 cells); the one-shared-name allowance applies to any themed cast pool. Closed by the orchestrator.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Simpshouse theme registered as seasonal, 2026-10-14 regenerated as a 12x12 Simpshouse day with the Simpshouse cast, Iris exception for themed-cast days; owner approved.
<!-- SECTION:FINAL_SUMMARY:END -->
