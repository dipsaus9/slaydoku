# Human solvability

The hint solver (`src/engine/solver/human`, advanced) has unlimited working memory: it reads every card, keeps every ruled-out square, and calls a
puzzle easy when it needs only "clue reading" steps. A person cannot do that. `src/engine/solvable/` defines what a person can do instead, and
measures every puzzle against it.

## The ladder

`ladderCheck(puzzle, { maxCards, references, maxSquaresFromCards, lastSquaresFromCards, maxChain })` asks: is there an order of the people such
that each placement uses **at most `maxCards` cards** plus the **rows, columns and squares of the people already placed**?

- Free: cross off the row, column and square of everybody placed so far. The last person needs no card.
- A card of the person being placed counts as one card. A card that names another person (with, direction, exact distance, diagonal, quadrant,
  same/different room) only counts once that person is placed. With `references: false` such cards never count.
- A card of a placed person that names the person being placed counts too, and so does a placed person's "alone" / "alone with" / "only one on"
  card and any "empty room" card. Each such card is one of the cards of the placement.
- The victim card ("alone with the murderer") only rules out a room that already holds two suspects.
- No scan, no victim-room reasoning, no overload, no chains, no guessing.

Placing somebody never makes anybody else harder to place, so whether the ladder works does not depend on the order. The order chosen is greedy:
the cheapest placement (fewest cards) first, ties by people order.

It returns `ok`, the ordered `steps` and, when it gets stuck, who is left and how many squares stay possible. Per step: the cards used,
`squaresFromCards` (squares the used cards leave, before crossing off any line), `squaresFromLines`, `squaresAfterBoth` (always 1) and `chain`.

## The tiers (`SOLVABLE_TIERS` in `src/engine/solvable/tiers.ts`)

| Tier | Cards per placement | Person references | Squares left by a placement's own cards | Chain |
|---|---|---|---|---|
| very-easy | 1 | no | at most 4 (3 in the last placements); at least 2 people placeable from their own card alone | at most 2 |
| easy | 1 or 2 (at most a third use 2) | no | at most 6 (3) | at most 2 |
| easy-medium | at most 2 | no | at most 9 (3) | at most 3 |
| medium | at most 3 | yes, once the referent is placed | at most 14 (3) | at most 3 |
| hard, expert | needs the hint solver's advanced techniques | | | |

`tierFor(puzzle)` gives the easiest tier whose rules the puzzle meets; `assessTier` gives the verdict per ladder tier.

## Every card informative on its own

A puzzle can be solvable one placement at a time yet hard in practice: a person pinned down only through the leftover rows and columns of other
people. Three numbers close the gap: **squares from cards** (the squares a placement's own cards leave before any line is crossed off), the same
cap for the **last three placements**, and the **chain** (how many placements depend on the placements just before them). The caps are in the tier
table above and are enforced by the ladder generator and the tests (`src/engine/solvable/caps.test.ts`).

## Card kinds and the ladder

- **Structural single cards** say something about the holder and the scene only: `onObject`, `besideObject`, `inRoom`, `inCorner`,
  `besideFeature`, `inRow`, `inColumn`, `onLine` and `inRoomEdge`. They count as soon as the holder is up.
- **Combined cards** (`both {a, b}`): two facts about the same holder on one card. On the scale it is ONE card. It is person-referencing when
  either part is. The generator draws them from easy-medium up.
- **Person-referencing cards** depend on where other people stand, so they only count once those people are placed (`references: true`, medium
  and up): a card that names a person (`withPerson`, `aloneWith`, `sameRoom`, `differentRoom`, `notWith`, `directionOf`, `diagonal`, `quadrant`),
  `exactDistance` and the gender cards (`roomHasGender`, `aloneWithGender`).

## Precision

`precision(puzzle)` answers, per card: how many squares it leaves its holder alone (nobody else placed), and whether all people holding the very
same card can still stand in distinct rows and columns. It also lists the people placeable from their own card alone (a card without person
reference that leaves exactly one square), the cards that leave no square and the identical cards whose holders cannot all fit.

## Hint explanations vs. this ladder (SLAY-8.3)

The in-game hint (`src/game/hints.ts`, `deduction()`) and this ladder are two different things that are easy to conflate: the ladder decides
whether a puzzle is generated at all at a tier (this file, `src/engine/solvable/`), while the hint decides what to tell the player about a puzzle
that already exists. `deduction()` has always reached for the full advanced technique catalog (`advancedRegistry`, scan through chains) the
moment the cards and the basic techniques (`knowledge()`'s `defaultRegistry`) run out, on every tier -- a very-easy puzzle that happens to stump
the basic techniques on some board state still gets a hint from the same catalog a hard puzzle does. SLAY-8.3 did not change this: which
technique fires, in what order, and at what point deduction() reaches for it are exactly as before.

What SLAY-8.3 changed is what the hint *says* once a technique fires beyond a single-candidate placement: every such hint's explanation is now
grounded in the earlier steps it actually leans on (the same derivation-chain mechanism `chainTo` already used for a single-candidate placement,
generalised to elimination hints too -- `src/game/knowledge.ts`, `src/game/hintText.ts`), and it never names the victim or a suspect the player
has already correctly placed as its own subject (it may still cite an already-placed suspect's card or room as background reasoning, same as a
placement's own reasoning already did). Both are presentation fixes: they change what an elimination hint's text says, never which step it is
or when it is offered.

Net effect on the tier table above: **none**. A tier's guarantee is about what the *ladder* can do without the advanced solver at all (see "The
tiers" above); it says nothing about what `deduction()`'s hint reaches for once a puzzle already needs a technique beyond the ladder, and that
was true before this story and remains true after it. The "second, milder gap" noted when this story was written -- that `knowledge()`'s own
`defaultRegistry` (scan, victim-room, overload, intersect) already reasons beyond what the ladder alone guarantees for very-easy through medium
-- is real, but it is a pre-existing, separate question about the ladder's own basic-technique boundary, not something this story's grounding
fix touches; it is not addressed here.
