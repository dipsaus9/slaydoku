# Scaling the packs: how many more puzzles, and how to add them safely

The committed pack holds 2 puzzles per size x tier x theme (5 x 6 x 5 cells, 300 puzzles). This page says how many more the generator can
give, how to extend the pack without breaking the puzzles people already play, and what to run before a new pack ships.

## The sweep: `bun run validate:generation`

`tools/validate.ts` measures the generator on **fresh seeds**: seeds from 10000 up, per size x tier x theme cell. The committed pack only
searches seeds below 700 (`seedBase(tier)` plus `SEED_WINDOW`, `src/content/packs/build.ts`), so the sweep never sees a puzzle the pack holds and
tells you what the next pack would get. `--start` below 10000 is refused (exit 2); a test keeps the two windows apart.

```sh
bun run validate:generation                                        # 20 seeds x 150 cells; hours, see the table below
bun run validate:generation --seeds 10 --sizes 6,7,9 --tiers very-easy,easy,easy-medium,medium,hard   # about a minute on 14 cores
bun run validate:generation --sizes 16 --tiers expert --themes home --seeds 3 --budget 60000
```

| Flag | Meaning |
|---|---|
| `--seeds N` | Seeds per cell (default 20), `--start S` the first one (default and minimum 10000). |
| `--sizes`, `--tiers`, `--themes` | Subset of the cells (default all). |
| `--jobs J` | Parallel worker processes, one per cell (default cores minus 2). |
| `--budget ms` | Wall clock per puzzle (default 180000, the pack's budget). A seed that runs out of it counts as a `generation` rejection. |
| `--min-success P` | Minimum success rate per cell in percent (default 25). Cells below it are flagged; from 10 seeds per cell they fail the sweep. |
| `--strict` | Fail on every rejected seed, not only on defects. |
| `--verbose` | One line per seed. |
| `--out dir` | Where `report.json` and `report.md` go (default `reports/generation-sweep`, git-ignored). |

For every seed the sweep builds the puzzle exactly as `bun run pack` does (`buildEntry`: scene, generator, dressing, every gate of `entryProblems`
in `src/content/packs/gates.ts`), then, for each puzzle that passed:

- builds it a second time and compares the bytes (deterministic re-run);
- renders the card grid (`renderToStaticMarkup`) and checks that every card of every suspect is in the markup (`missingCardText`,
  `src/render/cards/cardText.ts`): the bug class "the card exists in the data but the person never sees it".

The gates behind a pass are: unique solution (`verifyPuzzle`), the advanced human solver places everybody without guessing, the ladder check
(very-easy to medium) or the technique level (hard, expert) at the puzzle's tier, `tierFor` equal to the tier, score v2 inside the tier band
(`SOLVABLE_TIERS[].scoreBand`; documented `BAND_EXCEPTIONS` pass, and are ids of the committed pack, so a fresh seed never is one), hint audit,
clue audit, clue-noun audit, clue count and variety.

**What fails the sweep (exit 1).**

- A *defect*: the generator handed over a puzzle that is not unique, not human-solvable, not of its tier, or malformed (`unique-solution`,
  `human-solve`, `tier`, `shape`). These are guarantees of the generator; a single one is a bug.
- A repeat run that differs, a card missing on the screen, an exception, a worker that died.
- A cell of 10 or more seeds under `--min-success`.
- With `--strict`: any rejection at all.

A *rejection* by a quality filter (`score-band`, `clue-count`, `variety`, `clue-audit`, `hint-audit`, `noun-audit`, or `generation` when the generator
finds nothing in the budget) is not a failure: it is what the pack builder does, it rejects the candidate and walks to the next seed. The report counts
them per gate, they are what makes the success rate go down, and a gate that rejects a lot is where to improve the generator.

**The report** (`report.md` and `report.json`) has one row per cell: seeds, passed, success rate (flagged `low`), seconds per seed, seconds per usable
puzzle, yield per hour, duplicate boards and puzzles (count and share of the passed puzzles of the cell), clashes with the committed pack, and the
rejections per gate. Seconds and yield count one core: *yield per hour* is usable puzzles per hour of one core, *usable* being a puzzle that passed and is not a
repeat of an earlier board of the cell. Divide by your `--jobs` to get the wall-clock rate.

## How many puzzles per cell is realistic

Measured with this sweep (sizes 6 to 9: 10 seeds per cell x 5 themes; sizes 12 and 16: 4 seeds x 2 themes; expert: 2 seeds; all with 12 parallel
workers on a 14-core laptop, so the big-board seconds are inflated by contention; repeat on your machine before planning).

| size | very-easy | easy | easy-medium | medium | hard | expert |
|---|---|---|---|---|---|---|
| 6 | 80% | 76% | 86% | 74% | 82% | 50% (2 seeds) |
| 7 | 70% | 86% | 92% | 92% | 82% | 100% (2 seeds) |
| 9 | 44% | 64% | 88% | 80% | 78% | 100% (2 seeds) |
| 12 | 50% | 100% | 88% | 88% | 100% | 100% (2 seeds) |
| 16 | 21%* | 88% | 75% | 75% | 88% | 100% (2 seeds) |

Success rate (share of seeds that give a puzzle passing every gate). Read it as a rough level, the 12, 16 and expert cells have very few seeds.

\* 16x16 very-easy: 21% at 100 fresh seeds (`--sizes 16 --tiers very-easy --themes home --seeds 100`, SLAY-13.5), replacing the 25% this table first
showed (4 seeds only). It is below this page's usual 25% success-rate floor (see `--min-success` above) and, unlike every other cell, a real
regression: it measured 26% at 100 seeds on the commit before SLAY-13.2/13.3 (size-banded `SOLVABLE_TIERS`, normalized score v2), so the
size-banding epic cost it a few points. See "Known findings" below for the cause and why it is left as is: 16x16 is not part of any committed
schedule or pack today (CLAUDE.md: "never 16x16"), so no player-facing puzzle is affected.

| size | seconds per seed, ladder tiers | seconds per seed, hard | seconds per seed, expert | usable puzzles per core-hour, ladder tiers | hard | expert |
|---|---|---|---|---|---|---|
| 6, 7 | 0.1 | 1.4 | 4 to 5 (up to 45 s on some seeds) | 25000 to 50000 | 2100 | 500 to 700 |
| 9 | 0.2 to 0.4 | 2.5 | 5 | 6500 to 17000 | 1100 | 750 |
| 12 | 0.6 to 1.5 | 7 | 10 | 1500 to 5500 | 490 | 370 |
| 16 | 3 to 20 | 14 | 13 | 150 to 900 | 220 | 270 |

What this means:

- **Seeds are not the limit.** The random scene generator gives a different board for nearly every seed: the sweep saw no duplicate board or puzzle
  inside any cell, and no clash with the committed pack. Time is the limit, and even the slowest cells (16x16) give more than 100 puzzles per core-hour.
- **The seed window is.** `buildCell` searches `SEED_WINDOW` = 100 seeds per (size, tier, theme) and throws when it runs out before `--count` puzzles.
  With success rates of 21% to 90% one window holds roughly 20 to 90 puzzles per cell; take **20 per cell** as the safe ceiling for `--count` today
  (very-easy 16x16, the weakest cell, is 21%; `--count 20` needs about 95 seeds there, close to the whole window). More than that needs a wider window
  (see below).
- **Variety is the real cap.** A cell with 20 puzzles is 20 boards of one theme and size; whether a player finds them different is a matter of taste that
  the numbers cannot answer. Regenerate a sample and look at it before raising the count a lot.
- **The weak cells** are very-easy at 16 (`variety` rejects a very-easy puzzle with too few kinds of card, or one kind used too often -- see "Known
  findings") and easy at 9 (`score-band`). Very-easy at 9 recovered with the size-banding epic (SLAY-13.2/13.3): it now measures 37% at 200 seeds
  (`school` theme), comfortably clear of the floor, so it is no longer counted among the weak cells. If a cell has to give many puzzles, that is where a
  generator change pays off most.
- The pack tool builds cells in parallel too: 300 puzzles took 6 to 8 minutes at `--jobs 12`, so `--count 10` (about 1500 puzzles) is a matter of an hour or two,
  dominated by the 16x16 hard and expert files.

## Extending the pack safely

Pack puzzle ids are `<size>-<tier>-<theme>-<seed>` and part of saves, progress and URLs; **never change the id of a shipped puzzle**, never reuse one for a
different puzzle. The safe way to add puzzles:

1. **Sweep first.** `bun run validate:generation --sizes ... --seeds 20` for the cells you want to grow. Fix every failure; look at the cells flagged low. Read
   `docs/authoring/regenerate-packs.md` for what a pack change is.
2. **Raise `--count`, keep the window.** `buildCell` walks the seed window in order and keeps the first `count` puzzles that pass the gates and are not
   duplicates, so raising `--count` from 2 to 6 keeps the 2 existing puzzles of every cell byte for byte and adds 4 later ones. Check that with the diff:
   `bun run pack --count 6 --jobs 12` followed by `git diff --stat src/content/packs`; a changed line that is not an added puzzle is a problem to explain.
   Keep the pack change in its own commit.
3. **Do not change `SEED_WINDOW`, `seedBase` or the order of `TIERS`.** They fix which seeds each tier searches, so changing them renames or reshuffles the committed
   puzzles. To go beyond what one window of 100 seeds holds, add a second window after the first (a new seed base per tier, below the sweep start of 10000) and let
   `buildCell` continue there when the first runs out; the first window stays as it is.
4. **Never put a sweep seed into the pack by accident.** The sweep uses 10000 and up so that measuring never changes the pack. If you promote sweep seeds to the pack
   (a new window), move the sweep start beyond them (`SWEEP_SEED_START` in `src/content/packs/sweep.ts`) so the next sweep is fresh again.
5. Add the puzzles, regenerate `index.json` (`bun run pack` does it, or `bun run pack --index`), and run the checks below.

## Before you ship a new pack

```sh
bun run lint && bun run typecheck && bun run test        # the fast suite, includes the sweep's unit tests and the pack tests
bun tools/pack.ts --verify                                      # every committed puzzle from scratch: about 50 s on a laptop
bun run test:slow --maxWorkers=1                         # the per-tier sweeps, the full pack re-verification and the smoke sweep (about 17 minutes with --maxWorkers=1)
bun run validate:generation --seeds 20                   # fresh seeds, all cells; report in reports/generation-sweep/
```

Read `reports/generation-sweep/report.md`: no failures, no flagged cell you did not expect, no duplicate board rate that stands out, and the seconds per
puzzle in line with the table above (a big jump means the generator got slower). Then rebuild, and play a few puzzles per size in the app, in particular the
new ones, on a phone.

A sweep can also run on GitHub: Actions, "Generation sweep", "Run workflow" (`.github/workflows/generation-sweep.yml`). It takes the same arguments, uploads the
report as an artifact and prints it in the job summary. GitHub runners have few cores: use a small subset there (the default is sizes 6, 7 and 9 without expert),
and run the full sweep on your own machine. The pull-request workflow (`.github/workflows/ci.yml`) runs lint, typecheck and the fast tests only.

## Known findings

- `16-hard-home-10003` (found while writing this page): the hint audit rejects the hints of a 16x16 hard puzzle because a hint spells a count of 13
  squares as a number instead of saying "the marked squares". The pack filter drops such a candidate; the wording in the hint generator is worth a
  look (`src/validation/hints.ts` says what it wants).
- **16x16 very-easy's 21% (SLAY-13.5).** A wide-sample A/B (100 seeds, `home` theme) across the size-banding epic found 26% on the commit before
  SLAY-13.2 and 21% after -- a real decline, not sampling noise at this sample size, and the one cell size-banding made worse rather than better (9x9
  very-easy went from 33% to 37% over the same commits, comfortably clear of the floor). The `variety` gate itself (`varietyProblem` in
  `src/content/packs/gates.ts`) did not change; what changed is `SOLVABLE_TIERS['very-easy'].bySize.large.maxChain` (`src/engine/solvable/tiers.ts`),
  raised from 2 to 3 for every size above 7 (SLAY-13.1/13.2, calibrated against the real 9x9/12x12 schedule population). Reverting just that one
  number to 2 for a local test brought 16x16 very-easy back to 28% at 100 seeds, confirming the cause: the looser chain cap lets the ladder planner
  accept more placements that lean on one easy-to-narrow card kind (`directlyNextToObject` on a 16x16 board, in the samples looked at), at the
  expense of the kind variety the pack gate wants. `maxChain` is banded by `sizeBandOf` into only two bands, `'small'` ({6,7}) and `'large'`
  ({9, 12, 16}); 16x16 shares the `'large'` number with 9x9 and 12x12 even though it is the one size in that band nothing ever schedules or packs
  (`SIZE_WEIGHTS` in `src/schedule/pick.ts`; CLAUDE.md: "never 16x16") and so had no real population for SLAY-13.1's calibration to weigh. Left as a
  known, accepted generator-health finding rather than fixed here: a real fix is a third, 16x16-only size band with its own calibrated `maxChain`,
  which means recalibrating `SOLVABLE_TIERS` (out of this page's and this finding's scope) against a 16x16 population that does not exist yet. Until
  then, `--count` for a 16x16 very-easy pack should plan for ~21%, not 25% (see "What this means" above).
