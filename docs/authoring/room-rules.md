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

## Object density and board mix (SLAY-22)

Owner (2026-10-08 and 2026-10-09): the puzzle must not get cluttered, and every puzzle must look like a real place. A 6x6 is easier to take in than a 12x12, but a 12x12 with few objects reads fine too, so density is balanced against board size; and variety is about how many different kinds of things a board shows: a board of only chairs and lamps is odd. Rules, all hard (a board that breaks one is drawn again by `generateScene`):

**Per room** (`src/engine/scenegen/objects.ts`): at most `maxObjectsInRoom(squares) = 1 + floor(squares / 5)` objects (`SQUARES_PER_OBJECT = 5`), every object counted: 1 for up to 4 squares, 2 for 5 to 9, 3 for 10 to 14, 4 for 15 to 19 and so on. The room still gets its signature object first; that pick ignores the kind weights and counts the room's first favoured kind double (a garage with room for one object would otherwise almost never get its car). A repeated kind is less likely (`REPEAT_FACTOR` 0.35 → 0.2), a kind of a family the board does not have yet more likely (`NEW_FAMILY_BOOST` 2), and a bigger board is furnished a little more sparsely per square (`boardCoverageFactor`: 1 on 6x6, 0.925 on 9x9, 0.85 on 12x12). A room the loop leaves empty tries every allowed kind once more; a scene with a bare room of 3+ squares (`MIN_FURNISHED_SQUARES`) is drawn again. Closets of 1 or 2 squares stay bare in about a quarter of the scenes, as before.

**Per board** (`src/engine/scenegen/mix.ts`, families by engine type in `families.ts`: seating, tables, storage, beds, lighting, greenery, rugs, fixtures, vehicles, decor, activity):

| Rule | 6x6 | 7x7 | 8x8 | 9x9 | 12x12 |
|---|---|---|---|---|---|
| Most objects per square (`densityCap` = 0.34 - 0.01 x side) | 0.28 (10) | 0.27 (13) | 0.26 (16) | 0.25 (20) | 0.22 (31) |
| Fewest distinct kinds (`minBoardKinds` = side - 1) | 5 | 6 | 7 | 8 | 11 |
| Fewest families (`minBoardFamilies`) | 4 | 5 | 5 | 5 | 5 |

No kind on more than a quarter of the objects (`maxKindCount`, 3 always allowed). Per theme a target share per family (`THEME_MIX`, measured and rounded to 0.05); a family may exceed its target by at most `MIX_TOLERANCE` (0.2) plus one object (an upper bound only: a family below its target passes, the minimum kinds and families keep the board varied):

| Theme | Target mix |
|---|---|
| home | seating 0.15, tables 0.10, storage 0.15, beds 0.05, lighting 0.10, greenery 0.05, rugs 0.10, fixtures 0.15, decor 0.15 |
| office | seating 0.15, tables 0.15, storage 0.20, lighting 0.05, greenery 0.15, rugs 0.10, fixtures 0.10, decor 0.10 |
| school | seating 0.15, tables 0.15, storage 0.20, greenery 0.10, rugs 0.10, fixtures 0.15, decor 0.15 |
| park | seating 0.20, tables 0.10, lighting 0.05, greenery 0.35, rugs 0.05, vehicles 0.05, decor 0.10, activity 0.10 |
| shop | seating 0.20, tables 0.10, storage 0.30, greenery 0.05, rugs 0.10, fixtures 0.10, vehicles 0.05, decor 0.10 |

A theme without a target mix (Simpshouse, the seasonal drafts) only gets a 0.5 ceiling per family. Allow-lists, chair caps, `MAX_KIND_PER_ROOM` and `maxPerRoom` are unchanged.

### Measurements

Boards inside the board rules (200 per theme and size 6, 7, 8, 9, 12, fresh seeds): main's generator 68.3% (park 27% on 12x12, mostly too dense); the baked schedule 78 of 120 days (too dense 23, too few families 12, too few kinds 4); this generator before the re-draw 96.6% (lowest park and shop 7x7, 88-90%), after it 100%.

Objects per square and distinct kinds per board, generated, main → now (range over the five themes):

| Size | Objects per square | Distinct kinds per board |
|---|---|---|
| 6x6 | 0.237-0.264 → 0.219-0.232 | 7.0-7.6 → 6.9-7.4 |
| 7x7 | 0.233-0.258 → 0.211-0.222 | 8.5-9.8 → 8.5-9.3 |
| 8x8 | 0.222-0.244 → 0.197-0.208 | 9.8-11.7 → 9.8-11.1 |
| 9x9 | 0.221-0.242 → 0.194-0.204 | 11.4-14.1 → 11.1-13.2 |
| 12x12 | 0.213-0.235 → 0.176-0.186 | 14.5-20.4 → 14.1-18.5 |

Baked schedule (before the cap): objects per square 6x6 0.245, 7x7 0.253, 9x9 0.224, 12x12 0.221; distinct kinds per board 6.5, 8.0, 10.3, 13.4. Family shares now (mean over 1000 boards): home seating 0.15, tables 0.11, storage 0.15, fixtures 0.17, decor 0.13, lighting 0.09; park greenery 0.33, seating 0.19; shop storage 0.26, seating 0.18; no family above its target + tolerance on any generated board.

Objects per room by room size (generated, sizes 6 to 9), before → after, mean / p90 / max: 3-4 squares 1.10/2/2 → 1.00/1/1; 5-6 1.53/2/3 → 1.47/2/2; 7-9 2.05/3/4 → 1.73/2/2; 10-12 2.59/4/5 → 2.34/3/3; 13-16 3.29/5/7 → 2.86/4/4; 17-20 4.02/6/8 → 3.53/4/5; 21+ 5.57/8/14 → 4.92/7/10. Baked: 3-4 1.09/1/2, 7-9 1.99/3/4, 13-16 3.30/5/6, 21+ 5.96/9/13.

Room-level variety (200-scene sweep, sizes 6, 7, 8, 9, 12): chairs 7.1 / 12.1 / 11.5 / 7.1 / 13.7%, most frequent kind at most 13.7%, no rule breaches, every signature kind placed, distinct kinds per room 2.45-2.52 (was 2.70-2.98 without the cap: fewer objects per room, so this is no longer the variety goal; the board count above is). Tests: `src/engine/scenegen/density.test.ts` (fast: room cap, board rules on every theme and size 6 to 12, a chairs-and-lamps board is refused), `mix.slow.test.ts` and `variety.slow.test.ts` (sweeps), `src/content/themes/decor.test.ts` (distinct kinds per board above 9.5 on the fast sample).

### Variety of puzzles (SLAY-22)

The owner asked: does the cleaner board still leave enough different puzzles? These are measured against main's generator on the same seeds.

**Clue variety.** 100 ladder puzzles (very-easy to medium) per theme and size, 500 per size, main → branch:

| Size | Clue kinds per puzzle | Clues naming an object | Clue kinds never seen (of 30) |
|---|---|---|---|
| 6x6 | 5.04 → 4.99 | 49.7% → 48.8% | 2 → 2 |
| 7x7 | 5.34 → 5.46 | 49.6% → 48.9% | 2 → 2 |
| 8x8 | 5.74 → 5.69 | 53.4% → 52.0% | 2 → 0 |
| 9x9 | 6.31 → 6.21 | 52.8% → 51.7% | 1 → 0 |
| 12x12 | 6.85 → 6.92 | 53.6% → 50.8% | 1 → 1 |

The kinds never seen are rare people kinds (aloneWith, aloneWithGender, sameRoom, withPerson), not object kinds.

**Variety between puzzles.**
- 500 consecutive seeds per theme and size (sizes 6 to 12): 100% distinct boards and solutions, on main and on the branch.
- The 87 planned current-rule days (2026-10-09 to 2027-01-04), main → branch: 9.9 → 9.6 object kinds per board, and 0.79 → 0.77 kinds shared with the day before. The baked schedule has 9.3 and 0.65.

**Yield per seed.**
- Hard and expert pass 70-92% per seed on every size, so about 1.1 to 1.4 seeds per day.
- Very-easy on big boards is the weak spot, as it already was on main.
  - 9x9 very-easy park/school/shop, 30 seeds: 33/57/60% on main → 20/37/33% here.
  - 12x12 very-easy, 30 seeds: 31% on main → 28% here; office lowest at 17%.
  - That is up to about 6 seeds per day out of the 50 allowed. A day runs dry with p ≈ 1e-4.

**Verdict.**
- Fewer objects do not visibly lower clue variety: kinds per puzzle are unchanged, and the share of clues naming an object fell 1-3 points.
- Every seed gives a different puzzle, and consecutive days share less than one object kind. Nothing risks running out of distinct puzzles over the 100 levels.
- No mitigation is needed. If the object-clue share should stay exactly as before, the generator's clue weights could favour object clues slightly; they are unchanged here.

## Adding a kind or a room

1. Give the room `roomTypes` and the kind `allowedRoomTypes`.
2. Every kind needs at least one room that allows it, and every `favours` entry must be allowed in its own room.
3. `src/content/themes/rooms.test.ts` checks both for every theme, and sweeps Home scenes over many seeds for placements outside the allow-list.
4. A room name used by two themes needs the same Dutch noun (Library is shared with school).
