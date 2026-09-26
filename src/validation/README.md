# Hint and clue validation

`auditHints(puzzle)` and `auditClues(puzzle, tier)` each return a list of problems; an empty list means good.
Both work on any `Puzzle`: a level, a pack entry or a freshly generated one. The pack gate
(`src/content/packs/gates.ts`, `entryProblems`) runs both on every entry, at generation and again in
`bun tools/pack.ts --verify` / `bun run test:slow`; a failing candidate is dropped and the next seed is tried.

| File | What |
|---|---|
| `walk.ts` | `walkHints(puzzle)`: plays the level the way a player who follows every level-3 hint would (places, notes, crosses out), and keeps the three hint texts of every step. |
| `hints.ts` | `auditHints` (`auditWalk` for a walk made already), the length limits `HINT_LIMITS`. |
| `walk.test.ts` | The registered levels are solved from an empty board within 1.3 x the number of people in hint requests. |
| `clues.ts` | `auditClues`, the direct-clue kinds `DIRECT_CLUE_KINDS` and the minimum share per tier `MIN_DIRECT_CLUE_SHARE`. |

## Hints (`auditHints`)

What the hints say (`src/game/hints.ts`): all cards apply together and the people the player placed count as known.
A hint is a placement when somebody has exactly one possible square (also when basic reasoning about rows, columns and
rooms leaves them one; the reasoning is in level 3). Else it is the person with the fewest possible squares (at most six):
level 1 quotes their card and says how many squares are possible, level 2 lights those squares, level 3 asks for a note
on them. Only when even that is done does the hint come from a technique beyond the basic ones (rectangles, chains):
it crosses out at most 12 squares, and what it frees up is worked out in the placement it leads to.

- The walk finishes: every step has a hint at all three levels and everybody ends on their true square. On the
  registered levels it takes at most 1.3 x the number of people in hint requests (`walk.test.ts`).
- Every level is plain Dutch: not empty, no English, no stray whitespace, capital first, full stop last,
  no solver jargon (`kandidaat`, `techniek`, ...), no technique ids, no code (`r3k4`, `undefined`, braces),
  and no count of squares as a number above four (`de 61 gemarkeerde vakjes` reads badly: the squares are lit on the board).
- Level 1 names the person (all of them up to three) and only points at areas that exist.
- Level 2 names the squares (a crossing up to four, a person's possible squares up to six; more are `de gemarkeerde vakjes`)
  and the person, and never lights more than 12 squares (more than six possible squares are never a note).
- Level 3 is the explanation followed by one explicit instruction: `Zet <naam> op rij X, kolom Y.` for a placement,
  `Zet een notitie voor <naam> op ...` naming every possible square for a note, `Zet een kruisje ...` naming the
  squares for a crossing.
- Length limits (`HINT_LIMITS`): level 1 up to 220 characters, level 2 up to 200, level 3 up to 420; the harder the
  technique the longer its explanation may be: 600 for hard (level 4) and 800 for expert (level 5) techniques.

## Clues (`auditClues`)

- Every card renders as one Dutch sentence (capital, full stop, no code).
- Every card is unambiguous: what it names exists (holder, other person, area, object, row or column), no two people
  share a label, no two areas share a name, no two cards say the same.
- Every card kind is one the tier allows. Hard and expert allow the whole catalog. Very easy to medium (the ladder tiers of CAD-8.3)
  allow every catalog kind too, except: the negative kinds (`notBesideObject`, `notWith`, `differentRoom`) only from easy-medium up
  (`notWith` and `differentRoom` name a person, so from medium up), and the kinds that name another person (`withPerson`, `aloneWith`, `roomHasGender`, `aloneWithGender`,
  `sameRoom`, `differentRoom`, `notWith`, `directionOf`, `exactDistance`, `diagonal`, `quadrant`) only from medium up (`kindAllowedIn` in `clues.ts`). `inRoomEdge` (CAD-9.2) needs no other person and is allowed everywhere; it is direct when it names the room ("van de Keuken"), not when it leaves the room to the holder.
  A combined card (`both`, CAD-9.3) is allowed from easy-medium up (CAD-9.4) when each of its parts is (`clueAllowedIn`), and on hard and expert like any kind. It is direct when both parts are (`isDirectClue`).
  `DIRECT_CLUE_KINDS` and `isDirectClue` live in `src/engine/clues/direct.ts`, so the audit and `src/engine/difficulty` measure the same share.
- A combined card is one natural Dutch sentence: `auditClues` runs `checkClue` on it (two different well-formed parts, no nesting) and flags a text that names the holder more than once, has other than exactly one "en" between the parts, contains a pronoun, is more than one sentence or is longer than `MAX_COMBINED_TEXT` (200) characters. The hint audit accepts its hints ("De kaart van Henry heeft twee delen: ...", the card is not quoted a second time so the hint stays under the length limit).
- The share of direct clues reaches the minimum of the tier.

### Minimum share of direct clues per tier

A card is direct when it alone says where its holder stands, in words found on the board at once: a room, an object,
a wall feature, a corner, or one row or column (`DIRECT_CLUE_KINDS`). Cards that lean on another person, rule a
place out, or ask to compare or count are indirect. The victim's fixed card counts for neither side.
Share = direct cards / cards. The table lives in ONE place, `MIN_DIRECT_CLUE_SHARE` in `clues.ts`:

| Tier | Minimum share |
|---|---|
| very-easy | 20% |
| easy | 20% |
| easy-medium | 20% |
| medium | 15% |
| hard | 15% |
| expert | 15% |

The floor is set a little under what generated puzzles of the tier reach. With the ladder tiers the difficulty is decided by cards per
placement (`src/engine/solvable`), and a single card that leaves one square is mostly a comparison ("noordelijker dan een bed"), so the share of
plain cards is only floored, not aimed at. Measure it on a fresh sample with `bun run validate:generation`.

## When a puzzle fails

- Pack entry: the generator drops the candidate and tries the next seed, so a committed id can leave a gap
  (see `src/content/packs/README.md`). To replace committed puzzles after a rule change, run
  `bun run pack --sizes <n> --tiers <t> --count 2` for the affected files and list the replaced ids in the PR.
- A hint that fails on many puzzles points at the wording of the hints or of a solver explanation, not at the
  puzzle: fix the text (`src/game/hints.ts`, `src/engine/solver/human/nl.ts`), not the pack.
