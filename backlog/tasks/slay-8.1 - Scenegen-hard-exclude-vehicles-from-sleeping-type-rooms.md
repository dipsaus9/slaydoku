---
id: SLAY-8.1
title: 'Scenegen: hard-exclude vehicles from sleeping-type rooms'
status: Done
assignee: []
created_date: '2026-09-28 21:53'
updated_date: '2026-09-28 23:11'
labels: []
dependencies: []
references:
  - src/content/themes/
  - src/engine/scenegen/
  - tools/schedule.test.ts
parent_task_id: SLAY-8
type: feature
ordinal: 43000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a delivery van (or any vehicle-shaped object) is never generated into a bedroom, nursery, guest room, sick bay or any other room whose furniture marks it as a sleeping room — favours is preference-only and was letting this through.
Type: deliverable
Branch: SLAY-8.1/no-vehicles-in-sleeping-rooms
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every theme's rooms that favour a bed-like object are tagged roomTypes: ['sleeping']
- [ ] #2 Every vehicle object (engineType 'car') declares excludeRoomTypes: ['sleeping'] in every theme that has one
- [ ] #3 The scene generator's placement filter treats excludeRoomTypes as a hard rule, never just a weight, and a test proves it (favouring every kind in a sleeping room still never places an excluded one)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The delivery-van-fix agent claimed regenerating 2026-09-28 (puzzle #2, the live day with this exact bug) would be byte-identical apart from the one object. That claim was checked and is FALSE: --overwrite regeneration produced a completely different puzzle (different clue set, different person-cell assignments, fp 7461c497 -> 079dd881) because the exclusion rule changes candidate order earlier in the room's random draw, which cascades through the rest of generation. Reverted immediately, nothing committed. Whether to regenerate the live day (replacing today's puzzle content for anyone mid-play) is the owner's call, not a safe default — left untouched pending that decision. The code fix itself only changes what NEW days generate from here on.
<!-- SECTION:NOTES:END -->
