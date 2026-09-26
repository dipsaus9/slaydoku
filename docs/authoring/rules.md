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
the victim, called "the victim" in the text; the rule card reads "The victim was alone with the murderer."

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
| 10 | The victim card always reads "The victim was alone with the murderer." and belongs on the victim only. | [check.test.ts](../../src/engine/clues/check.test.ts) "the murderer card belongs on the victim"; [en.test.ts](../../src/engine/clues/en.test.ts) "clue text" (sample for `aloneWithMurderer`) |

A scene that cannot host a valid placement (a row with no free cell, a victim room whose free cells share a line) is
rejected before generation: [admissible.test.ts](../../src/engine/scenegen/admissible.test.ts) "rejects a row without any occupiable cell",
"rejects rooms whose free cells share a line as victim rooms". Check your own scene with `checkAdmissible`
(see [new-scene.md](new-scene.md)).

## Uniqueness and solvability

| # | Rule | Proved by |
|---|---|---|
| U1 | **Exactly one solution.** The solver counts solutions (capped at 2). 0 means contradictory clues, 2 or more means a clue is missing. | [solve.test.ts](../../src/engine/solver/solve.test.ts) "finds the unique solution and the murderer", "reports 0 solutions for a contradictory clue", "reports several solutions when a clue is missing, capped at 2"; [verify.test.ts](../../src/engine/solver/verify.test.ts) "accepts a unique puzzle and names the murderer", "flags a contradictory clue as 0 solutions", "flags a missing clue as several solutions" |
| U2 | The solver agrees with brute force. | [solve.test.ts](../../src/engine/solver/solve.test.ts) "solve agrees with brute force" |
| U3 | **Solvable by pure logic**: a human-style solver (no guessing) must reach the stored solution using only the techniques of the puzzle's tier. | [puzzle.test.ts](../../src/content/demo/puzzle.test.ts) "is also solved by the full hint solver"; for generated puzzles [generate.test.ts](../../src/engine/generator/generate.test.ts) "makes a valid, unique, human-deducible and minimal puzzle for 50 seeds on a 9x9 scene" |
| U4 | The demo puzzle passes `bun run verify`; every scheduled day is re-verified by [schedule.slow.test.ts](../../src/schedule/schedule.slow.test.ts) and a sample of ten by the normal tests. | [puzzle.test.ts](../../src/content/demo/puzzle.test.ts) "passes verify: rules hold, exactly one solution, matches the stored one" |
| U5 | The victim lies on a legal victim cell and the murderer rule holds in the stored solution. | [puzzle.test.ts](../../src/content/demo/puzzle.test.ts) "pins the victim on a legal victim cell and keeps the murderer rule" |

In the game, the last correct placement solves the level: [check.test.ts](../../src/game/check.test.ts) "reports solved with the murderer (alone with the victim) and the time".

## Clue vocabulary (English)

A clue is `{ personId, type, args }`. `args` holds only person ids, room ids, object types and indexes, never free text.
The sentence comes from `renderClue` in `src/engine/clues/en.ts`, the only file that words clue cards
([dutch.test.ts](../../src/validation/dutch.test.ts) scans the game code for leftover Dutch words). Wording is neutral: no "he/she", "woman" and "man" are nouns, and the victim is "the victim" ([en.test.ts](../../src/engine/clues/en.test.ts) "no gendered pronoun in any rendered sentence",
"the victim noun is the label the puzzles carry"). Row and column indexes in `args` are 0-based; the sentence shows them 1-based.

Every kind has a sample sentence in a test, and `check` rejects malformed parameters
([check.test.ts](../../src/engine/clues/check.test.ts) "rejects unknown types and holders", "rejects params that name nothing").
The truth of each kind is defined by `evaluate.ts` and tested per kind in
[evaluate.test.ts](../../src/engine/clues/evaluate.test.ts) (structural) and
[relational/evaluate.test.ts](../../src/engine/clues/relational/evaluate.test.ts) (relational).

Structural kinds (about where one person stands; sentences from [en.test.ts](../../src/engine/clues/en.test.ts) "clue text"):

| `type` | `args` | Sentence (holder A) |
|---|---|---|
| `onObject` | `objectType` | A sat in a car. / A sat on a chair. / A lay on a bed. |
| `squareWithObject` | `objectType` | There was a framed painting on A's square. |
| `besideObject` | `objectType`, `exactlyOne?` | A stood next to a bookshelf. / A stood next to exactly one bookshelf. |
| `onlyOnObject` | `objectType` | A was the only person on a chair. |
| `inRoom` | `roomId` | A was in the Kitchen. |
| `inRoomOr` | `roomIds` (two) | A was in the Kitchen or the Study. |
| `inCorner` | `roomId?` | A stood in a corner. / A stood in a corner of the Living Room. |
| `besideFeature` | `feature` (window or door) | A stood next to a window. / A stood next to a door. |
| `inFrontOfDoor` | none | A stood in front of a door. |
| `alone` | `roomId?` | A was alleen. / A was alleen in de Slaapkamer. |
| `withPerson` | `otherId`, `roomId?` | A was samen met B. |
| `aloneWith` | `otherId`, `roomId?` | A was alleen met B. |
| `emptyRoom` | `roomId` | There was nobody in the Living Room. |
| `roomHasGender` | `gender` (`woman` or `man`) | There was at least one woman in A's room. (at least one OTHER person of that gender in the holder's room) |
| `aloneWithGender` | `gender` | A was alleen met een man. (exactly one other person in the room, of that gender) |
| `inRow` / `inColumn` | `index` | A stood in row 3. / A stood in column 2. |
| `onLine` | `axis`, `position` (first, last, middle) | A stood in the top row. / ... in the leftmost column. / ... in the middle column. (`middle` needs an odd grid.) |
| `inRoomEdge` | `edge` (north, south, west, east), `roomId?` | A stood in the top row of the Kitchen. / ... in the rightmost column of the room. (no `roomId`: the holder's own room; north is the smallest row that holds a square of the room, so it works for an L-shaped room; a structural single card, allowed from very-easy) |
| `aloneWithMurderer` | none | The victim was alone with the murderer. (victim card) |
| `both` | `a`, `b` (two parts: `{type, args}` of any kind above about the holder, no holder of their own) | A stood next to a table and there was at least one woman in the same room. (combined card, see below) |

The gender kinds need `Person.gender` (optional, `woman` or `man`; the pool gives every name its gender, see [cast.md](cast.md); the victim has none). `evaluate` takes the people as its fourth argument, and `checkClue` rejects a gender card when nobody else in the puzzle has that gender, so a puzzle without genders never carries one. The wording says "woman" and "man" as nouns, never he/she. They count as person-referencing cards on the solvability scale (medium and up: usable once everybody of that gender is placed).

A combined card (`both {a, b}`, CAD-9.3) puts exactly two facts about the SAME holder on one card: true when both parts are (the conjunction), so it leaves the squares BOTH parts leave (the intersection). `a` and `b` are parts, that is `{type, args}` of a structural kind about the holder, the gender kinds included; not `emptyRoom`, `aloneWithMurderer`, a relational kind or another `both` (no nesting). `checkClue` rejects two identical parts, a part that is malformed for its kind (each part is checked as a card of the holder, and the message names part a or b) and two parts that both leave the holder out of the sentence (`roomHasGender` with `squareWithObject`: say `onObject`). The text names the holder once and puts "and" between the parts: the part that reads "<holder> stood ..." comes first, the part that needs no name ("there was at least one woman in the same room", "there was a table on the same square") second; never he/she. In the solvability scale it is ONE card: precision is the intersection, and it is person-referencing (medium and up) when either part is. The solvers work with its two parts as two cards of the holder; the hints explain it with "This card has two parts: ...". `auditClues` flags a combined card whose text names the holder more than once, has other than exactly one "and", uses a pronoun, is more than one sentence or longer than 200 characters. Tests: [both.test.ts](../../src/engine/clues/both.test.ts) (evaluate, check, at least 6 text pairs, property test).

Relational kinds (compare the holder with another person or an object; sentences from [relational/en.test.ts](../../src/engine/clues/relational/en.test.ts) and `renderClue`):

| `type` | `args` | Sentence (holder A) |
|---|---|---|
| `directionOf` | `side`, `otherId` | A stood further west than B. (further north, further east, further south) |
| `directionOfObject` | `side`, `objectType` | A stood further east than a cabinet. |
| `exactDistance` | `side`, `count`, `otherId` | A stood exactly three columns left of B. / ... exactly one row below B. |
| `directlyNextToObject` | `side`, `objectType` | A stood on the square directly above a cabinet. |
| `diagonal` | `otherId`, `direction?`, `steps?` | A stood on the same diagonal as B. / ... on the diagonal to the northeast of B. / ... exactly two squares diagonally from B. |
| `quadrant` | `direction`, `otherId` | A stood somewhere to the northwest of the victim. |
| `sameRoom` | `otherId` | A was in the same room as B. |
| `differentRoom` | `otherId` | A was in a different room from B. |
| `notWith` | `otherId` | A was not with B. |
| `notBesideObject` | `objectType` | A did not stand next to a plant. |

The direction, distance, diagonal and quadrant kinds also accept the qualifiers `roomId` and `alone` ("A was alone in
the Kitchen, exactly one row above B."). Compass words compare the row or column index strictly, in any room; nobody shares
a row or column, so an equal index is never "north of".

Object kinds and multi-cell objects (a 2x2 bed, a 3x2 block, a 2-cell sofa or table; the `stairs` type still exists in the engine, but since CAD-8.6 no scene or theme uses it). One object can cover several squares, and a reader takes the object as a whole. The evaluator is the single source of truth (`src/engine/clues/relational/evaluate.ts`, `src/engine/model/scene.ts`), and the solver, human/advanced explanations, the generator pool and the solvability ladder all call it:

- `directionOfObject` (further north/south/east/west than an X): strictly beyond the WHOLE extent of at least one object of that type: north = row above the object's topmost row, south = row below its bottom row, east/west likewise with columns. A person in the same row as the top of a 2x2 bed is not north of it. One object of several is enough.
- `besideObject` / `notBesideObject` (next to an X): orthogonally next to any square of one object (same room), while not standing on that object. `exactlyOne` counts distinct objects. Standing on one half of a bed is on the bed, not beside it.
- `directlyNextToObject` (on the square directly above/below/left of/right of an X): the square one step to that side of any square of an object (same room), not on the object itself; a 3-wide object offers three such squares above it.
- `onObject` / `squareWithObject` / `onlyOnObject`: on any one square of the object; unchanged.

Object nouns in sentences (`OBJECT_WORDS`, one entry per object type): chair, rug, bed, sofa, car, oil slick,
framed painting, table, TV, plant, bookshelf, chest, tree, flower bed, easel, statue, washing machine, dryer, cabinet,
staircase, toilet, sink, shower, desk, wardrobe, dining table, kitchen counter, bicycle, garden table, bench (see `en.ts` for the
exact words and the verb, "sat", "stood" or "lay", per object). A clue names the noun of what the board draws: "a garden chair or a poof", never a group noun that hides a differently drawn kind.

Room names are stored bare ("Kitchen", "Meeting Room") and read with "the" ("in the Kitchen"); a name that already starts with "the" is not doubled
([en.test.ts](../../src/engine/clues/en.test.ts) "room names").

## Difficulty tiers

Six tiers, easiest first: `very-easy`, `easy`, `easy-medium`, `medium`, `hard`, `expert`.

Very easy to medium are defined by what a person can do (CAD-8.2, [docs/solvability/README.md](../solvability/README.md)): a person places one
suspect at a time and each placement uses at most 1 (very-easy), 1 or 2 (easy), 2 (easy-medium) or 3 (medium) cards plus the rows
and columns of the people already placed. The ladder generator (`src/engine/generator/ladder`) builds them; the table is `SOLVABLE_TIERS` in
`src/engine/solvable/tiers.ts` and `tierFor` gives the tier of a puzzle. Hard and expert are what the ladder does not place: they need the hint solver's
advanced techniques, come from the advanced generator and keep a score band (0-100). The older `TIERS` table in
`src/engine/generator/tiers/tiers.ts` (allowed clue kinds, technique level, score band, tested in `tiers.test.ts`) still drives the tier generator and
hard and expert. The demo level uses `easy`.
