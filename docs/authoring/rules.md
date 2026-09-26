# Rule reference

The rules of the game as the engine enforces them, each with the test that proves it. Paths are relative to this file.
If a rule changes, its test changes with it; if a test named here is renamed, fix the link.

The code behind the rules is `src/engine/model/rules.ts` (placement, victim, murderer), `src/engine/model/scene.ts`
(occupiable, beside, doors and windows) and `src/engine/solver/solve.ts` (the exhaustive search that counts solutions).

## The board

A puzzle is a square grid (the engine also handles non-square grids, see rule 3) cut into named rooms by thick walls.
Rooms may be irregular (an L) but must be connected. Objects stand inside one room. Doors and windows sit on a grid line.

| # | Rule | Proved by |
|---|---|---|
| B1 | Every room has at least one cell and its cells touch orthogonally (one connected group). Room ids are unique. | [schema.test.ts](../../src/engine/model/schema.test.ts) "rejects duplicate room ids, empty rooms and disconnected rooms" |
| B2 | An object covers one or more orthogonally connected cells, all inside one room, never overlapping another object. | [schema.test.ts](../../src/engine/model/schema.test.ts) "rejects unknown object types, out-of-grid cells and overlaps", "rejects a multi-cell object that is split or crosses a wall" |
| B3 | A door or window is on one edge of one cell; on an inner line either neighbour may name it, both spellings mean the same line. A window on a wall between two rooms touches both sides. | [schema.test.ts](../../src/engine/model/schema.test.ts) "rejects bad edge features"; [scene.test.ts](../../src/engine/model/scene.test.ts) "window and door adjacency" |
| B4 | "Beside" means orthogonal neighbour in the same room. Diagonals and neighbours across a wall are not beside. | [scene.test.ts](../../src/engine/model/scene.test.ts) "beside" |

## People and placement

The number of people equals the grid size: on a 9x9 board that is 8 suspects plus the victim. In Slaydoku the victim is
the gift ("het cadeau"), not a crime victim.

| # | Rule | Proved by |
|---|---|---|
| 1 | **One person per row.** | [rules.test.ts](../../src/engine/model/rules.test.ts) "rejects two people in one row"; [solve.test.ts](../../src/engine/solver/solve.test.ts) "never lets two people share a row or column and always leaves a murderer" |
| 2 | **One person per column**, across rooms: columns are grid-wide, not per room. | [rules.test.ts](../../src/engine/model/rules.test.ts) "rejects two people in one column, also across rooms"; same solve test as rule 1 |
| 3 | On a **square** grid every row and every column holds someone (so with one per line, exactly one). On a non-square grid people equal the shorter side and rows/columns may only not be shared. | [rules.test.ts](../../src/engine/model/rules.test.ts) "rejects an empty row/column on a square grid", "on a non-square grid only sharing a row or column is forbidden"; [solve.test.ts](../../src/engine/solver/solve.test.ts) "non-square grids only forbid sharing a row or column"; [admissible.test.ts](../../src/engine/scenegen/admissible.test.ts) "handles non-square grids: people = the shorter side, no row or column may be shared" |
| 4 | **Occupiable cells only.** Plain floor and occupiable objects (chair, rug, bed, sofa, car, oil slick, framed painting) can hold a person. Blocking objects (table, tv, plant, cabinet, stairs, ...) never can. | [rules.test.ts](../../src/engine/model/rules.test.ts) "rejects a person on a blocking %s"; [scene.test.ts](../../src/engine/model/scene.test.ts) "plain floor is occupiable", "blocking objects are not occupiable"; [solve.test.ts](../../src/engine/solver/solve.test.ts) "keeps people off blocked cells"; the full flag list: [catalog.test.ts](../../src/engine/model/catalog.test.ts) "keeps the original 16 types and their flags, without footprint metadata" |
| 5 | A multi-cell occupiable object (2-cell bed, L-shaped sofa) holds a person on any one of its cells. | [rules.test.ts](../../src/engine/model/rules.test.ts) "allows any one cell of a multi-cell bed"; [scene.test.ts](../../src/engine/model/scene.test.ts) "every cell of a multi-cell occupiable object can hold a person" |
| 6 | Everyone is placed exactly once, inside the grid. Unknown, duplicate and out-of-grid placements are rejected. (The player's work in progress is checked with `partial`: incomplete is fine, conflicts still count.) | [rules.test.ts](../../src/engine/model/rules.test.ts) "rejects unknown, duplicate and out-of-grid placements", "reports a person who is not placed", "partial placements may be incomplete but still report conflicts" |

## Victim and murderer

| # | Rule | Proved by |
|---|---|---|
| 7 | **The victim stands on the last free cell**: with every suspect in their own row and column, exactly one row and one column stay free and their crossing is the victim's cell. It must be occupiable too. | [rules.test.ts](../../src/engine/model/rules.test.ts) "leaves the victim the single leftover cell r1c1", "returns the crossing of the one free row and column", "rejects a victim on a blocked leftover cell" |
| 8 | **The murderer is the only suspect in the victim's room.** A solution where the victim's room holds zero or several suspects is invalid. | [rules.test.ts](../../src/engine/model/rules.test.ts) "is the only suspect in the victim room", "is null when the victim room holds several suspects", "fails when the victim room does not hold exactly one suspect" |
| 9 | A puzzle has exactly one victim and unique people; its stored solution places all of them. | [schema.test.ts](../../src/engine/model/schema.test.ts) "rejects a puzzle without exactly one victim", "rejects solutions that miss, repeat, invent or misplace people" |
| 10 | The victim card always reads "Het cadeau was alleen met de dader." and belongs on the victim only. | [check.test.ts](../../src/engine/clues/check.test.ts) "the murderer card belongs on the victim"; [nl.test.ts](../../src/engine/clues/nl.test.ts) "Dutch clue text" (sample for `aloneWithMurderer`) |

A scene that cannot host a valid placement (a row with no free cell, a victim room whose free cells share a line) is
rejected before generation: [admissible.test.ts](../../src/engine/scenegen/admissible.test.ts) "rejects a row without any occupiable cell",
"rejects rooms whose free cells share a line as victim rooms". Check your own scene with `checkAdmissible`
(see [new-scene.md](new-scene.md)).

## Uniqueness and solvability

| # | Rule | Proved by |
|---|---|---|
| U1 | **Exactly one solution.** The solver counts solutions (capped at 2). 0 means contradictory clues, 2 or more means a clue is missing. | [solve.test.ts](../../src/engine/solver/solve.test.ts) "finds the unique solution and the murderer", "reports 0 solutions for a contradictory clue", "reports several solutions when a clue is missing, capped at 2"; [verify.test.ts](../../src/engine/solver/verify.test.ts) "accepts a unique puzzle and names the murderer", "flags a contradictory clue as 0 solutions", "flags a missing clue as several solutions" |
| U2 | The solver agrees with brute force. | [solve.test.ts](../../src/engine/solver/solve.test.ts) "solve agrees with brute force" |
| U3 | **Solvable by pure logic**: a human-style solver (no guessing) must reach the stored solution using only the techniques of the puzzle's tier. | [levels.test.ts](../../src/content/levels.test.ts) "is also solved by the full hint solver"; for generated puzzles [generate.test.ts](../../src/engine/generator/generate.test.ts) "makes a valid, unique, human-deducible and minimal puzzle for 50 seeds on a 9x9 scene" |
| U4 | The registered levels pass `bun run verify`. | [levels.test.ts](../../src/content/levels.test.ts) "passes verify: rules hold, exactly one solution, matches the stored one" |
| U5 | The gift lies on a legal gift cell and the murderer rule holds in the stored solution. | [levels.test.ts](../../src/content/levels.test.ts) "pins the gift on a legal gift cell and keeps the murderer rule" |

In the game, the last correct placement solves the level: [check.test.ts](../../src/game/check.test.ts) "reports solved with the murderer (alone with the gift) and the time".

## Clue vocabulary (Dutch)

A clue is `{ personId, type, args }`. `args` holds only person ids, room ids, object types and indexes, never free text.
The Dutch sentence comes from `renderClue` in `src/engine/clues/nl.ts`, the only file allowed to contain Dutch words
([nl.test.ts](../../src/engine/clues/nl.test.ts) "Dutch text lives in nl.ts only"). Wording is neutral: no "hij/zij", and
the victim is "het cadeau" ([nl.test.ts](../../src/engine/clues/nl.test.ts) "no gendered pronoun in any rendered sentence",
"the victim is the gift: no murder wording in nl.ts"). Row and column indexes in `args` are 0-based; the sentence shows them 1-based.

Every kind has a sample sentence in a test, and `check` rejects malformed parameters
([check.test.ts](../../src/engine/clues/check.test.ts) "rejects unknown types and holders", "rejects params that name nothing").
The truth of each kind is defined by `evaluate.ts` and tested per kind in
[evaluate.test.ts](../../src/engine/clues/evaluate.test.ts) (structural) and
[relational/evaluate.test.ts](../../src/engine/clues/relational/evaluate.test.ts) (relational).

Structural kinds (about where one person stands; sentences from [nl.test.ts](../../src/engine/clues/nl.test.ts) "Dutch clue text"):

| `type` | `args` | Dutch sentence (holder A) |
|---|---|---|
| `onObject` | `objectType` | A zat in een auto. / A zat op een stoel. / A lag op een bed. |
| `squareWithObject` | `objectType` | Er stond een ingelijst schilderij op het vakje van A. |
| `besideObject` | `objectType`, `exactlyOne?` | A stond naast een boekenkast. / A stond naast precies één boekenkast. |
| `onlyOnObject` | `objectType` | A was de enige persoon op een stoel. |
| `inRoom` | `roomId` | A was in de Keuken. |
| `inRoomOr` | `roomIds` (two) | A was in de Keuken of in het Kantoor. |
| `inCorner` | `roomId?` | A stond in de hoek. / A stond in de hoek van de Woonkamer. |
| `besideFeature` | `feature` (window or door) | A stond bij een raam. / A stond bij een deur. |
| `inFrontOfDoor` | none | A stond voor een deur. |
| `alone` | `roomId?` | A was alleen. / A was alleen in de Slaapkamer. |
| `withPerson` | `otherId`, `roomId?` | A was samen met B. |
| `aloneWith` | `otherId`, `roomId?` | A was alleen met B. |
| `emptyRoom` | `roomId` | Er was niemand in de Woonkamer. |
| `roomHasGender` | `gender` (`vrouw` or `man`) | Er was minstens één vrouw in de ruimte van A. (at least one OTHER person of that gender in the holder's room) |
| `aloneWithGender` | `gender` | A was alleen met een man. (exactly one other person in the room, of that gender) |
| `inRow` / `inColumn` | `index` | A stond in de 3e rij. / A stond in de 2e kolom. |
| `onLine` | `axis`, `position` (first, last, middle) | A stond in de bovenste rij. / ... in de meest linkse kolom. / ... in de middelste kolom. (`middle` needs an odd grid.) |
| `inRoomEdge` | `edge` (north, south, west, east), `roomId?` | A stond in de bovenste rij van de Keuken. / ... in de meest rechtse kolom van de ruimte. (no `roomId`: the holder's own room; north is the smallest row that holds a square of the room, so it works for an L-shaped room; a structural single card, allowed from very-easy) |
| `aloneWithMurderer` | none | Het cadeau was alleen met de dader. (victim card) |
| `both` | `a`, `b` (two parts: `{type, args}` of any kind above about the holder, no holder of their own) | A stond naast een tafel en er was minstens één vrouw in dezelfde ruimte. (combined card, see below) |

The gender kinds need `Person.gender` (optional, `vrouw` or `man`; the placeholder cast: Ben, Dan, Frank and Henry are men, Alice, Chloe, Emma and Grace women; the gift has none). `evaluate` takes the people as its fourth argument, and `checkClue` rejects a gender card when nobody else in the puzzle has that gender, so a puzzle without genders never carries one. The wording says "vrouw" and "man" as nouns, never hij/zij. They count as person-referencing cards on the solvability scale (medium and up: usable once everybody of that gender is placed).

A combined card (`both {a, b}`, CAD-9.3) puts exactly two facts about the SAME holder on one card: true when both parts are (the conjunction), so it leaves the squares BOTH parts leave (the intersection). `a` and `b` are parts, that is `{type, args}` of a structural kind about the holder, the gender kinds included; not `emptyRoom`, `aloneWithMurderer`, a relational kind or another `both` (no nesting). `checkClue` rejects two identical parts, a part that is malformed for its kind (each part is checked as a card of the holder, and the message names part a or b) and two parts that both leave the holder out of the sentence (`roomHasGender` with `squareWithObject`: say `onObject`). The Dutch text names the holder once and puts "en" between the parts: the part that reads "<holder> stond ..." comes first, the part that needs no name ("er was minstens één vrouw in dezelfde ruimte", "er stond een tafel op hetzelfde vakje") second; never hij/zij. In the solvability scale it is ONE card: precision is the intersection, and it is person-referencing (medium and up) when either part is. The solvers work with its two parts as two cards of the holder; the hints explain it with "Deze kaart heeft twee delen: ...". `auditClues` flags a combined card whose text names the holder more than once, has other than exactly one "en", uses a pronoun, is more than one sentence or longer than 200 characters. Tests: [both.test.ts](../../src/engine/clues/both.test.ts) (evaluate, check, at least 6 text pairs, property test).

Relational kinds (compare the holder with another person or an object; sentences from [relational/nl.test.ts](../../src/engine/clues/relational/nl.test.ts) and `renderClue`):

| `type` | `args` | Dutch sentence (holder A) |
|---|---|---|
| `directionOf` | `side`, `otherId` | A stond westelijker dan B. (noordelijker, oostelijker, zuidelijker) |
| `directionOfObject` | `side`, `objectType` | A stond oostelijker dan een kast. |
| `exactDistance` | `side`, `count`, `otherId` | A stond precies drie kolommen links van B. / ... één rij onder B. |
| `directlyNextToObject` | `side`, `objectType` | A stond op het vakje direct boven een kast. |
| `diagonal` | `otherId`, `direction?`, `steps?` | A stond op dezelfde diagonaal als B. / ... op de diagonaal ten noordoosten van B. / ... precies twee vakjes diagonaal van B. |
| `quadrant` | `direction`, `otherId` | A stond ergens ten noordwesten van het cadeau. |
| `sameRoom` | `otherId` | A was in dezelfde kamer als B. |
| `differentRoom` | `otherId` | A was in een andere kamer dan B. |
| `notWith` | `otherId` | A was niet samen met B. |
| `notBesideObject` | `objectType` | A stond niet naast een plant. |

The direction, distance, diagonal and quadrant kinds also accept the qualifiers `roomId` and `alone` ("A was alleen in
de Keuken, precies één rij boven B."). Compass words compare the row or column index strictly, in any room; nobody shares
a row or column, so an equal index is never "north of".

Object kinds and multi-cell objects (a 2x2 bed, a 3x2 block, a 2-cell sofa or table; the `stairs` type still exists in the engine, but since CAD-8.6 no scene or theme uses it). One object can cover several squares, and a reader takes the object as a whole. The evaluator is the single source of truth (`src/engine/clues/relational/evaluate.ts`, `src/engine/model/scene.ts`), and the solver, human/advanced explanations, the generator pool and the solvability ladder all call it:

- `directionOfObject` (noordelijker/zuidelijker/oostelijker/westelijker dan een X): strictly beyond the WHOLE extent of at least one object of that type: north = row above the object's topmost row, south = row below its bottom row, east/west likewise with columns. A person in the same row as the top of a 2x2 bed is not north of it. One object of several is enough.
- `besideObject` / `notBesideObject` (naast een X): orthogonally next to any square of one object (same room), while not standing on that object. `exactlyOne` counts distinct objects. Standing on one half of a bed is on the bed, not beside it.
- `directlyNextToObject` (op het vakje direct boven/onder/links van/rechts van een X): the square one step to that side of any square of an object (same room), not on the object itself; a 3-wide object offers three such squares above it.
- `onObject` / `squareWithObject` / `onlyOnObject`: on any one square of the object; unchanged.

Object nouns in sentences (`OBJECTS_NL`, one entry per object type): stoel, tapijt, bed, bank, auto, olievlek,
ingelijst schilderij, tafel, tv, plant, boekenkast, kist, boom, bloemperk, ezel, standbeeld, wasmachine, droger, kast,
trap, toilet, wastafel, douche, bureau, kledingkast, eettafel, aanrecht, fiets, tuintafel, bankje (see `nl.ts` for the
exact words and the verb, "zat", "stond" or "lag", per object).

Room names are stored with their article ("de Keuken", "het Toilet") and read as they are stored; a bare name falls back to "de"
([nl.test.ts](../../src/engine/clues/nl.test.ts) "room articles").

## Difficulty tiers

Six tiers, easiest first: `very-easy`, `easy`, `easy-medium`, `medium`, `hard`, `expert`.

Very easy to medium are defined by what a person can do (CAD-8.2, [docs/solvability/README.md](../solvability/README.md)): a person places one
suspect at a time and each placement uses at most 1 (very-easy), 1 or 2 (easy), 2 (easy-medium) or 3 (medium) cards plus the rows
and columns of the people already placed. The ladder generator (`src/engine/generator/ladder`) builds them; the table is `SOLVABLE_TIERS` in
`src/engine/solvable/tiers.ts` and `tierFor` gives the tier of a puzzle. Hard and expert are what the ladder does not place: they need the hint solver's
advanced techniques, come from the advanced generator and keep a score band (0-100). The older `TIERS` table in
`src/engine/generator/tiers/tiers.ts` (allowed clue kinds, technique level, score band, tested in `tiers.test.ts`) still drives the tier generator and
hard and expert. The demo level uses `easy`.
