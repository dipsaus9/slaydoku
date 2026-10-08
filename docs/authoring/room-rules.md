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

## Adding a kind or a room

1. Give the room `roomTypes` and the kind `allowedRoomTypes`.
2. Every kind needs at least one room that allows it, and every `favours` entry must be allowed in its own room.
3. `src/content/themes/rooms.test.ts` checks both for every theme, and sweeps Home scenes over many seeds for placements outside the allow-list.
4. A room name used by two themes needs the same Dutch noun (Library is shared with school).
