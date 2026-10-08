# Room rules: which object may stand in which room

`favours` on a room is a preference: the scene generator weighs it. A **room rule** is a hard rule: the generator never
breaks it (SLAY-17.1).

## How it works

- A room has `roomTypes` (`ThemeRoom.roomTypes`), e.g. Bathroom is `['wet']`, Bedroom is `['sleeping']`.
- An object has `allowedRoomTypes` (`ThemeObject.allowedRoomTypes`): the room types it may stand in. A room qualifies when it has at least one of them.
- `excludeRoomTypes` (older, still supported) forbids types. Both apply together. The vehicle rule (a car is never in a sleeping room) uses it.
- An object **without** `allowedRoomTypes` may stand in any room. That is only for themes not yet assigned: office, park, school and shop (SLAY-17.2 assigns them). Home is fully assigned.
- The check lives in `placeObjects` (`src/engine/scenegen/objects.ts`), in the candidate filter. Room types are a closed list: `RoomType` in `src/content/themes/types.ts`.

## Home theme

| Room type | Rooms | Signature kinds |
|---|---|---|
| sleeping | Bedroom, Nursery, Guest Room | single bed, double bed, wardrobe |
| wet | Bathroom, Toilet | toilet, shower, washbasin |
| utility | Utility Room | washing machine, dryer |
| garage | Garage | car, bicycle |
| kitchen | Kitchen | kitchen counter |
| living | Living Room, Conservatory | sofa, corner sofa, coffee table, television |
| dining | Dining Room | dining table, sideboard |
| study | Study, Library, Home Office | desk, bookcase |
| fitness | Home Gym | gym mat, bicycle |
| storage | Attic, Storeroom | chest, wardrobe |
| circulation | Hall, Corridor | chest, houseplant |

Hard rules: beds only in sleeping rooms; toilet, shower and washbasin only in wet rooms; washing machine and dryer only in
a utility room; car only in the garage; kitchen counter only in the kitchen.

## Adding a kind or a room

1. Give the room `roomTypes` and the kind `allowedRoomTypes`.
2. Every kind needs at least one room that allows it, and every `favours` entry must be allowed in its own room.
3. `src/content/themes/rooms.test.ts` checks both for every theme, and sweeps Home scenes over many seeds for placements outside the allow-list.
4. A room name used by two themes needs the same Dutch noun (Library is shared with school).
