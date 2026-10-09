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

`maxCards`, person references and `maxTopShare` are flat across every grid size: a calibration spike (SLAY-13.1) found no evidence a small
grid needs a different cards-per-placement cap. The squares-per-card and chain caps ARE size-banded: `sizeBandOf(size)` puts {6,7} in the
`'small'` band and {9,12} in the `'large'` band, and each ladder tier's `bySize` gives that band its own numbers -- tighter on `'small'`
(a flat cap is organically easier to clear on a 6x6 than a 12x12), looser on `'large'` (the same flat cap sat closer to binding there).
`ladderOptions(tier, size)` resolves the right band for a given grid before `ladderCheck` runs.

| Tier | Cards per placement | Person references | Squares left by a placement's own cards ({6,7} / {9,12}) | Chain ({6,7} / {9,12}) |
|---|---|---|---|---|
| very-easy | 1 | no | at most 4 (3 in the last placements) / at most 4 (3); at least 2 people placeable from their own card alone | at most 2 / at most 3 |
| easy | 1 or 2 (at most a third use 2) | no | at most 5 (3) / at most 8 (4) | at most 2 / at most 3 |
| easy-medium | at most 2 | no | at most 6 (3) / at most 10 (4) | at most 2 / at most 4 |
| medium | at most 3 | yes, once the referent is placed | at most 8 (3) / at most 16 (4) | at most 3 / at most 4 |
| hard, expert | needs the hint solver's advanced techniques (see below for the size-banded threshold) | | | |

`tierFor(puzzle)` gives the easiest tier whose rules the puzzle meets; `assessTier` gives the verdict per ladder tier, resolving every
ladder tier's caps from the puzzle's own grid size.

### hard and expert (SLAY-13.2)

Hard and expert have no ladder caps to band (`method: 'advanced'`, `bySize` is 0-filled): what decides them is the hint solver's hardest
technique level (`level < 5` is a hard candidate, else expert) and, secondarily, where the puzzle's score v2 (`src/engine/difficulty`) falls
in `SOLVABLE_TIERS[].scoreBandBySize`. `assessTier(puzzle, scoreV2?)` keeps the technique level as the coarse guard and, when a caller
supplies the puzzle's score v2, refines hard vs. expert by the size-banded band instead -- the same band `scoreBandProblem` (the generation
gate) already checks downstream, so classification and the gate agree. `scoreV2` is threaded in rather than computed inside `assessTier`
on purpose: computing it calls `computeMetrics`, which itself calls `assessTier` (`src/engine/difficulty/metrics.ts`'s `ladderMetrics`), so
computing it from inside `assessTier` would recurse without end.

Today both size bands carry the identical hard (51-87) and expert (88-100) score v2 bands: the `'large'` numbers are measured (the spike
found the {9,12} gap within sampling noise). Until SLAY-22 no `'small'` hard/expert puzzle was generated, so the `'small'` band mirrors
`'large'` as a placeholder. Since SLAY-22 (owner decision 2026-10-08) the first 100 levels plan hard on 6x6, 7x7, 8x8 and 9x9
(`SMALL_GRID_SIZE_WEIGHTS` in `src/schedule/pick.ts`; expert stays 9x9 there). The bands were left as they are: a generation sweep on fresh seeds
(sizes 6 to 9, every tier and theme, SLAY-22 PR) passes every gate, the hint audit included, on hard 6x6 and 7x7 with the mirrored band, and a
rendered hint walk solves a 6x6 hard puzzle step by step (`docs/design/looks-shots/slay-22/`). An 8x8 board falls in the `'large'` band
(`sizeBandOf`: `size <= 7` is small), so its ladder caps are the 9x9 ones on a smaller board, never looser than on 9x9.

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
