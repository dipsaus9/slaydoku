# Regenerate the puzzle packs

No pack is committed in this repository at the moment (the pipeline is). When packs exist, they are pre-generated puzzle files for random themed boards: 5 sizes (6, 7, 9, 12, 16) x 6 tiers x 5 themes,
2 puzzles per (size, tier, theme) = 300 puzzles in 30 files plus `index.json`, all in `src/content/packs/`. Nothing is generated in
the browser: the app's "Extra zaken" section (unlocked once every registered level is solved) loads `index.json` when the browse screen opens
and one pack file when a case is opened (`src/ui/extras/packs.ts`). New or regenerated pack files are picked up by the build automatically. The format, quality gates and
sizes are described in [src/content/packs/README.md](../../src/content/packs/README.md). This page is the how-to.

The tiers very-easy to medium are made by the ladder generator and defined by the human-solvability scale (`docs/solvability/README.md`); hard and expert by the
advanced generator with score v2 bands ([docs/difficulty/README.md](../difficulty/README.md)). The tier table and the gates are in [src/content/packs/README.md](../../src/content/packs/README.md).

Same arguments give the same bytes: fixed key order, one puzzle per line, no timestamps, deterministic per (size, tier, theme, seed).
That is what makes "regenerate and look at the diff" a reliable check.

## When to regenerate

| Change | What to do |
|---|---|
| You changed the generator, solver, a tier band, the scene generator, a theme or a clue sentence and `bun tools/pack.ts --verify` (or the pack tests) now fail | Regenerate the affected files or all of them, then review the diff. |
| You added a theme or an object kind | Regenerate everything (a new theme must appear in every (size, tier) file). |
| You want more puzzles per cell | Raise `--count` and regenerate everything. |
| You changed nothing in the engine or content | Do not touch the packs. |
| A regenerated puzzle fails "score v2 ... outside the ... band" in `pack:verify` | The generator usually retries another seed. If the same id keeps landing one band off, it is a boundary case: read `docs/difficulty/README.md`, and either keep the seed away from it or add it to `BAND_EXCEPTIONS` (`src/engine/difficulty/exceptions.ts`) with a reason and to the README table; `bun run calibrate --check` and `calibration.test.ts` say what is stale. |

A pack change is a big diff. Keep it in its own commit, apart from the code change that caused it.

## Check first

```sh
bun tools/pack.ts --verify
```

```
[   4s] verified 300 puzzles in 30 files: all good
```

It re-verifies every committed puzzle (unique solution, human-solver deducible, `ladderCheck` and `tierFor` for the ladder tiers, the technique level for hard
and expert, the score v2 band for every tier, the clue-noun audit, rating and quality gates) and that `index.json` matches the files. About 50 seconds on a 14-core laptop. Exit code 0 ok, 1 on any problem (each printed as `PROBLEM ...`).
`bun run test:slow` runs the same check plus the generator sweeps (several minutes).

## Regenerate

```sh
bun run pack --count 2 --jobs 12     # everything: 5 sizes x 6 tiers x 5 themes x 2, this is how the committed pack was made
```

The whole pack takes 6 to 8 minutes at `--jobs 12` on a 14-core laptop (the 16x16 hard and expert files are the slow ones; a run for this guide took 494 s and
reproduced all 31 committed files byte for byte). The four ladder tiers alone (20 files) take about 30 seconds:
`bun run pack --tiers very-easy,easy,easy-medium,medium --count 2 --jobs 12`; hard and expert files stay as they are (their generator does not draw the kinds of CAD-9.1 to CAD-9.3, so it needs no regeneration; the ladder tiers got genders on the cast in CAD-9.4). `--jobs` defaults to
cores minus 2. It starts one child process per (size, tier) file, slowest first, then rebuilds `index.json` from every file on
disk. Exit codes: `0` ok, `1` generation or verification failed, `2` bad arguments.

Options (all optional):

| Flag | Meaning |
|---|---|
| `--sizes 6,9` | Only these sizes (from 6, 7, 9, 12, 16). |
| `--tiers all` or `--tiers hard,expert` | Only these tiers (`very-easy`, `easy`, `easy-medium`, `medium`, `hard`, `expert`). |
| `--themes all` or `--themes home,park` | Only these themes. |
| `--count N` | Puzzles per (size, tier, theme). Default 1; the committed pack uses 2. |
| `--jobs J` | Parallel child processes. |
| `--out dir` | Write somewhere else (compare two runs, or try a change without touching the repo). |
| `--verify` | Verify instead of generate (see above). |

A subset regenerates only those files; `index.json` is always rebuilt from every file on disk:

```sh
bun run pack --sizes 6 --tiers very-easy --count 2 --jobs 1
```

```
wrote 6-very-easy.json (10 puzzles)
[   0s] index.json: 300 puzzles in 30 files, 1691 KiB total
```

When nothing relevant changed, `git status` shows no change after this: the run reproduced the committed bytes. Use the same
`--count` as the committed pack, otherwise the file gets a different number of puzzles.

### Try a change without touching the repo

```sh
bun run pack --sizes 6 --tiers very-easy --count 2 --jobs 1 --out /tmp/packs
cmp /tmp/packs/6-very-easy.json src/content/packs/6-very-easy.json && echo BYTE-IDENTICAL
bun run pack --verify --out /tmp/packs
```

```
BYTE-IDENTICAL
6-very-easy.json: 10 puzzles ok
```

## What a run does with your candidates

For each (size, tier, theme) the pipeline walks seeds `seedBase(tier) + 0, 1, 2, ...` (tier windows of 100: very-easy 100, easy 200,
easy-medium 300, medium 400, hard 500, expert 600). Every seed builds a random scene for the theme (`generateScene`), a tier puzzle
for it (`generateLadder` for very-easy to medium, the advanced generator for hard and expert), dresses it (cast names, "het cadeau", articles on room names) and runs the gates in
`src/content/packs/gates.ts`. Rejected seeds are skipped and logged, so a committed id can have a gap below it:

```
6-very-easy-school-100: rejected: 6-very-easy-school-100: 3 of 9 clues are row/column/line numbers
6-very-easy-school-101: ok (10 clues, score 13, 33 ms)
```

About a third of the ladder-tier candidates are dropped (variety, the share of plain cards, the clue count range); 12% of the hard and expert ones (too many row/column/line clues). A puzzle id (`9-easy-home-201`: size, tier, theme, seed)
is its address and never changes for the same generator.

## After regenerating

```sh
bun tools/pack.ts --verify
bun run lint
bun run typecheck
bun run test
```

Then look at the diff: the file list, `index.json`, and the sizes. `packs.test.ts` fails when the folder passes 4 MiB and when
any file is not exactly what the pipeline writes. Update the numbers in `src/content/packs/README.md` if the counts or sizes changed.

## Troubleshooting

- **`pack:verify` fails after an engine change.** The generator's output changed for the same seeds. Regenerate (above), review the
  diff, commit it separately.
- **`only N of M puzzles inside seeds 200..299`.** A (size, tier, theme) ran out of its 100-seed window before reaching `--count`. The gates are in
  [src/content/packs/README.md](../../src/content/packs/README.md); a theme that produces boards which always fail a gate needs its
  objects or rooms adjusted ([theme-and-icons.md](theme-and-icons.md)).
- **Different bytes on a busy machine.** The pack uses a 180 second per-puzzle budget so load does not change the result; do not lower it.
  If two runs still differ, compare with `cmp` and check which seeds hit the budget.
- **Unknown size.** Only 6, 7, 9, 12 and 16 are known sizes; the tool exits with 2 and prints the usage.
