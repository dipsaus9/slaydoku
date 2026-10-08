---
id: SLAY-17.1
title: 'Hard room rules in the generator, Home theme and new home rooms'
status: To Do
assignee: []
created_date: '2026-10-08 08:57'
labels:
  - story
dependencies: []
references:
  - src/content/themes/types.ts
  - src/content/themes/define.ts
  - src/content/themes/home.ts
  - src/engine/scenegen/
  - src/content/themes/rooms.test.ts
  - docs/authoring/
parent_task_id: SLAY-17
type: feature
ordinal: 118000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: every ThemeObject/ThemeRoom carries room types and the scene generator never places a kind outside its allowed room types (replaces excludeRoomTypes with an allow-list; keep vehicles-not-in-sleeping behaviour). The Home theme is fully assigned (beds only in sleeping rooms, toilet/shower/washbasin only in wet rooms, car only in garage, kitchen counter in kitchen, etc.) and gains Library, Home Office and Gym rooms, each with a signature object and allow-list.
Type: deliverable
Branch: SLAY-17.1/room-rules-home
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ThemeObject has an allow-list of room types and ThemeRoom has room types; the generator never places a kind outside its allow-list (hard rule, not a weight)
- [ ] #2 Home: bed kinds only in sleeping rooms, toilet/shower/washbasin only in wet rooms, washing machine/dryer only in utility rooms, car only in the garage
- [ ] #3 Home gains Library, Home Office and Gym rooms (EN and NL names), each with a signature object and an allow-list
- [ ] #4 Every kind has at least one allowed room and every favours entry is allowed in its own room (test)
- [ ] #5 A sweep test over many seeds finds zero out-of-allow-list placements in the Home theme
- [ ] #6 bun run lint, typecheck and test --maxWorkers=1 pass
- [ ] #7 The room rules are documented in docs/authoring
<!-- AC:END -->
