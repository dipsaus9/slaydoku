# Puzzle pack pipeline

The code in this folder builds, checks, formats and reads puzzle packs: files of pre-generated puzzles for random themed boards
(sizes 6, 7, 9, 12, 16 x tiers very-easy .. expert x themes home, office, park, school, shop). **No pack data is committed in this
repository**; the pipeline stays so later work (a daily schedule, an archive) can reuse it. Nothing is generated in the browser.

## The tier scale

The tiers very-easy, easy, easy-medium and medium are defined by what a person can do, on the human-solvability scale of
`src/engine/solvable`. A person places one suspect at a time, and each placement may use only the cards named plus the rows and columns of
the people already placed. The tier is the number of cards per placement:

| Tier | Cards per placement | Person references | Built by |
|---|---|---|---|
| very-easy | 1 | no | ladder generator |
| easy | 1 or 2 | no | ladder generator |
| easy-medium | at most 2 | no | ladder generator |
| medium | at most 3 (chains) | yes, once the referent is placed | ladder generator |
| hard | needs advanced techniques (level 4) | | advanced generator |
| expert | needs level-5 techniques, or the hint solver cannot finish | | advanced generator |

A puzzle carries the easiest tier it meets (`tierFor` gives exactly the entry's tier). Very-easy to medium are built with the ladder generator
(`src/engine/generator/ladder`, CLI `tools/ladder.ts`); hard and expert with the advanced generator (`src/engine/generator/scale`), held to a
score v2 band (`src/engine/difficulty`).

## Files

| Path | What |
|---|---|
| `types.ts` | `PackEntry`, `PackFile`, `PackIndex`, `IndexEntry` and `PACK_FORMAT`. |
| `build.ts` | Builds one entry (`buildEntry`): random scene, tier generator, dressing (cast names, "the victim", title), all gates. |
| `gates.ts` | The quality gates (`entryProblems`) and the duplicate keys (`boardKey`, `puzzleKey`). |
| `format.ts`, `read.ts`, `ids.ts` | Serialisation (one puzzle per line, fixed key order), parsing and cross-file checks, stable ids and file names. |
| `sweep.ts` | The generation sweep behind `bun run validate:generation`: success rate, gate rejections and time per size x tier x theme cell. |
| `sample.testing.ts` | Test support: builds a small pack on the spot. |

Driven by `tools/pack.ts` (`bun run pack`) and `tools/validate.ts` (`bun run validate:generation`).

## Layout

A pack file is `{"format":1,"size":9,"tier":"easy","puzzles":[ ...one entry per line... ]}`; `index.json` lists what a browser needs without loading
the puzzles (id, size, tier, theme, title, clue count, rating, file, `fp`). An entry:

```
id          "9-easy-home-201"  (size-tier-theme-seed, stable)
size, tier, theme, seed
title       English: theme + template on the room where the victim lies ("Family home: Foul play in the Kitchen")
clueCount   cards including the victim card
rating      {score 0-100, level = hardest technique 1-5, steps of the human walk}
cast        suspect names in seat order (the labels of the suspects); the people also carry their genders
puzzle      a plain Puzzle: scene, people, solution, clues (`bun run verify` reads it; parsePuzzle accepts it)
```

Suspects carry the names and genders of `castFor` (`src/content/cast/`, seeded by the puzzle id; see `docs/authoring/cast.md`): distinct first letters, genders balanced (women and men differ by at most one),
names from the pool. The victim is `the victim` and has no gender; room names stay bare (`Kitchen`, `Toilet`; clue text adds "the"). The gates (`castProblems`) reject a duplicate initial, unbalanced genders or a name outside the pool.

## Commands

```sh
bun run pack --sizes 6 --tiers very-easy,easy --count 1 --out /some/dir   # a small pack somewhere else
bun run pack --count 2 --jobs 12               # 2 per (size, tier, theme) into src/content/packs
bun run pack --index                           # only rewrite index.json from the files on disk
bun tools/pack.ts --verify                     # re-verify every pack file and the index (needs pack files on disk)
bun run validate:generation --sizes 6,7 --seeds 10   # measure the generators on fresh seeds
bun run test:slow                              # smoke sweep and the generator sweeps (several minutes)
```

`--jobs J` runs one child process per (size, tier) file. Same arguments give the same bytes: fixed key order, one puzzle per line, no timestamps,
and a counted (not wall-clock) leash on the searches, so a busy machine does not change the result.

## Seeds and stable ids

A (size, tier, theme) walks the seeds `seedBase(tier) + 0, 1, 2, ...` (tier windows of 100: very-easy 100, easy 200, easy-medium 300, medium 400,
hard 500, expert 600) and keeps every candidate that passes the gates. The seed drives both the random scene (`generateScene`) and the puzzle
search. Rejected seeds are skipped, so an id can have a gap below it. The id is the address of a puzzle and never changes for the same generator.
`SWEEP_SEED_START` (10000) lies above every pack seed, so a sweep only sees fresh puzzles.

## Fingerprint per puzzle

Every index entry has `fp`: `puzzleFingerprint` (`src/game/fingerprint.ts`, FNV-1a 32 bit over the canonical JSON of scene, people, clues and
solution). Saved boards (`slaydoku:game:<id>`) and solved records carry the fingerprint and are ignored when it differs, because a regenerated pack
reuses ids.

## Quality gates (`gates.ts`, every entry)

- Unique: `verifyPuzzle`: schema, rules, clue parameters, exactly one solution, equal to the stored one.
- Deducible: the advanced human solver places everybody as stored, without guessing.
- Ladder tier (very-easy to medium): `ladderCheck` with the tier's numbers passes and `tierFor` gives exactly the entry's tier.
- Hard and expert: hardest technique level inside the tier; `tierFor` agrees.
- Score v2 inside the tier's band (`SOLVABLE_TIERS[].scoreBand`), unless the puzzle is one of the documented `BAND_EXCEPTIONS`.
- Clue nouns: `auditObjectNames` finds no clue whose object noun fits zero or several drawn kinds of the board.
- Sane clue count: between one card per person and two per person.
- Variety of clue kinds: at least 3 distinct kinds (4 from 9x9); no kind on more than 40% of the cards; at most 30% plain row/column/line numbers.
- No duplicates: no two puzzles share a board or a whole puzzle; ids unique.
- Hints and cards: `auditHints` and `auditClues` (`src/validation`).
- Genders: a gender card needs a gender on every suspect.
- Shape: size, people count, cast labels, `the victim`, bare room names, title, index equals the files.
