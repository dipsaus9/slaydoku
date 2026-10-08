# Room rules: which object may stand in which room

`favours` on a room is a preference: the scene generator weighs it. A **room rule** is a hard rule: the generator never
breaks it (SLAY-17.1).

## How it works

- A room has `roomTypes` (`ThemeRoom.roomTypes`), e.g. Bathroom is `['wet']`, Bedroom is `['sleeping']`.
- An object has `allowedRoomTypes` (`ThemeObject.allowedRoomTypes`): the room types it may stand in. A room qualifies when it has at least one of them.
- `excludeRoomTypes` (older, still supported) forbids types. Both apply together. The vehicle rule (a car is never in a sleeping room) uses it.
- `allowedRoomTypes` is required on every object (SLAY-17.2): all five themes are assigned, and every room has `roomTypes`.
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

## Other themes (SLAY-17.2)

The room types are one shared vocabulary: sleeping, wet, utility, garage, kitchen, living, dining, study, fitness, storage, circulation (Home), plus meeting (office), garden, play, water (park), retail, fitting, checkout (shop). Beds are only in `sleeping` rooms, cars and vans only in `garage` rooms (a car park, a parking lot, a loading bay), toilets and sinks only in `wet` rooms, in every theme.

| Theme | New rooms (EN / NL) | Signature kind |
|---|---|---|
| office | Car Park / Parkeerterrein, Training Room / Opleidingsruimte, Cloakroom / Garderobe | company car, flipchart, coat cabinet |
| school | Toilets / Toiletten, Changing Room / Kleedkamer, Parking Lot / Parkeerplaats | toilet, lockers, school bus |
| park | Duck Pond / Eendenvijver, Sandpit / Zandbak, Sunbathing Lawn / Ligweide | fountain, sandbox, sun lounger |
| shop | Loading Bay / Laadperron, Self Checkout / Zelfscankassa, Shoe Department / Schoenenafdeling | delivery van, checkout counter, fitting stool |

One chair look: officeChair, beanbag and poof are gone. Every chair kind (meeting chair, school chair, garden chair, fitting stool) draws the plain chair, so a clue or legend names them "chair" when they stand together. Committed schedule days that still carry an old `poof-1` or `officeChair-1` id draw the plain chair as well, because an unknown id falls back to the engine icon.

The committed schedule files are baked and unchanged; rebuilding a day from its seed now gives a different scene (new rooms and rules change every draw), so the tests no longer compare a rebuild byte for byte with the committed day.

## Variety (SLAY-17.6)

Besides the allow-list, `placeObjects` keeps a room varied: a kind appears at most 3 times in one room (`MAX_KIND_PER_ROOM`, no exception, plants included); a chair kind (engine type chair) at most 2 times unless the extra chair touches a table, desk or counter (`MAX_FREE_CHAIRS_PER_ROOM`, `SEAT_AT_TYPES`), and a chair next to such an object is likelier; a kind the room does not have yet is 3 times likelier and every copy already there multiplies the weight by 0.35. Chair weights are low in every theme and the decor kinds (plants, rugs, bookcases, chests, easels, statues) a bit higher. Measured on 200 scenes per theme (sizes 6, 7, 9, 12): chairs were 18% to 54% of the placed objects (37% overall), now 10% to 14% (12%); distinct kinds per room went from 2.0-2.3 to 2.5-2.9. Fast test: `src/engine/scenegen/variety.test.ts`; sweep: `variety.slow.test.ts`. Lamps and other new decor need new engine types and are a separate story.

## Decor kinds (SLAY-19.1)

Nineteen new engine types (lamp, mirror, coatRack, fridge, bathtub, fireplace, piano, aquarium, exerciseBike, bin, waterCooler, serverRack, globe, gymBox, playEquipment, barbecue, tent, shoppingCart, kiosk; all blocking) and 31 kinds across the five themes, each with an allow-list and most with a `maxPerRoom` of 1 or 2 (`src/content/themes/decor.test.ts` pins every kind's rooms by name):

| Theme | Kinds (allowed rooms) |
|---|---|
| home | floor lamp (living, sleeping, study, circulation), mirror (circulation, sleeping, wet), coat rack and shoe cabinet (circulation), fridge (kitchen only), bathtub (wet only), fireplace and piano (living), aquarium (living, study), bedside cabinet (sleeping), exercise bike (fitness only), bin (kitchen, wet, study) |
| office | water cooler (kitchen, circulation), server rack (`utility`: the Server Room is the office's only utility room), floor lamp (study), bin (study, meeting, kitchen, storage), coat rack (circulation) |
| school | globe (study), water cooler (circulation, fitness), vaulting box (fitness), slide (`play`: the Playground now has that type), trophy cabinet (circulation) |
| park | lantern (garden, garage), barbecue and potted plant (`living`: Terrace, Pavilion), bin (garden, play, garage), slide (play), party tent (garden, weight 1) |
| shop | shopping cart (circulation, checkout), fitting-room mirror (fitting), self-checkout kiosk (checkout) |

Variety on 200 scenes per theme (sizes 6, 7, 9, 12; `variety.testing.ts`), before → after: distinct kinds per room home 2.45 → 2.78, office 2.64 → 2.85, school 2.53 → 2.70, park 2.92 → 3.00, shop 2.67 → 2.72; chairs 11.5/13.4/13.3/9.6/13.6% → 7.2/11.3/9.0/7.4/13.3%; the most frequent kind at most 14.3% (was up to 20.6%); no rule breaches, every favoured kind placed. The chair caps of SLAY-17.6 are untouched. The committed schedule is not regenerated here (SLAY-18.10).

## Object density (SLAY-22)

Owner feedback (2026-10-08): too many objects in one room make a board hard to read. `placeObjects` now stops a room at `maxObjectsInRoom(squares) = 1 + floor(squares / 5)` objects (`SQUARES_PER_OBJECT = 5`), every object counted (structural kinds, plants and chairs too): 1 for a room of up to 4 squares, 2 for 5 to 9, 3 for 10 to 14, 4 for 15 to 19 and so on. The room still gets its signature object first; that pick is now even across the room's favoured kinds (a garage with room for one object would otherwise almost never get its car). Because a capped room has few objects, a repeated kind is less likely (`REPEAT_FACTOR` 0.35 → 0.2). A room the normal loop leaves empty tries every kind it allows once more; a scene where a room of 3 or more squares (`MIN_FURNISHED_SQUARES`) still has no object (every square next to a door) is retried, so no such room is bare. Closets of 1 or 2 squares stay bare in about a quarter of the scenes, as before. The allow-lists, the chair caps (`MAX_FREE_CHAIRS_PER_ROOM`), `MAX_KIND_PER_ROOM` and the per-kind `maxPerRoom` are unchanged.

Objects per room by room size, before → after. Baked: the 120 committed days (made before the cap). Generated: 200 scenes per theme and size (6, 7, 8, 9), five regular themes, seeds `i * 31 + size`:

| Room squares | Baked (n, mean, p90, max) | Generated before (mean, p90, max) | Generated after (mean, p90, max) |
|---|---|---|---|
| 1-2 | 12, 0.67, 1, 1 (33% bare) | 0.74, 1, 1 (26% bare) | 0.75, 1, 1 (25% bare) |
| 3-4 | 55, 1.09, 1, 2 | 1.10, 2, 2 | 1.00, 1, 1 |
| 5-6 | 84, 1.54, 2, 3 | 1.53, 2, 3 | 1.52, 2, 2 |
| 7-9 | 137, 1.99, 3, 4 | 2.05, 3, 4 | 1.79, 2, 2 |
| 10-12 | 108, 2.55, 4, 5 | 2.59, 4, 5 | 2.43, 3, 3 |
| 13-16 | 122, 3.30, 5, 6 | 3.29, 5, 7 | 2.96, 4, 4 |
| 17-20 | 81, 3.91, 5, 6 | 4.02, 6, 8 | 3.62, 4, 5 |
| 21+ | 89, 5.96, 9, 13 | 5.57, 8, 14 | 5.08, 7, 10 |

Objects per square, before → after (generated, all four sizes): home 0.225 → 0.208, office 0.239 → 0.220, school 0.229 → 0.217, park 0.253 → 0.219, shop 0.240 → 0.220 (all 0.237 → 0.217). Baked per size: 6x6 0.245, 7x7 0.253, 9x9 0.224, 12x12 0.221; per theme home 0.225, office 0.235, school 0.218, park 0.244, shop 0.216 (Simpshouse 0.264 on its one day). Generated after, per size (all themes): 6x6 0.22-0.24, 7x7 0.21-0.23, 8x8 0.20-0.22, 9x9 0.21. Script: the measurement loop in `density.test.ts` and `variety.testing.ts` (`crowded`, `bare`).

Variety on the 200-scene sweep (`variety.testing.ts`, now sizes 6, 7, 8, 9, 12, 40 each), uncapped → capped: distinct kinds per room home 2.77 → 2.56, office 2.82 → 2.68, school 2.69 → 2.60, park 2.98 → 2.69, shop 2.70 → 2.60; the share of a room's objects that is a kind new to the room rose in every theme (home 0.98 → 0.99, office 0.95 → 0.98, school 0.92 → 0.96, park 0.96 → 0.98, shop 0.89 → 0.94). Fewer objects per room means fewer distinct kinds per room, so `decor.test.ts` now compares that share (and keeps distinct kinds per room above 2.4). Chairs 7.4 / 13.3 / 11.9 / 7.8 / 14.4%, the most frequent kind at most 14.4%, no rule breaches, every signature kind placed. Tests: `src/engine/scenegen/density.test.ts` (fast, sizes 6 to 9, every theme) and `variety.slow.test.ts` (sweep).

## Adding a kind or a room

1. Give the room `roomTypes` and the kind `allowedRoomTypes`.
2. Every kind needs at least one room that allows it, and every `favours` entry must be allowed in its own room.
3. `src/content/themes/rooms.test.ts` checks both for every theme, and sweeps Home scenes over many seeds for placements outside the allow-list.
4. A room name used by two themes needs the same Dutch noun (Library is shared with school).
