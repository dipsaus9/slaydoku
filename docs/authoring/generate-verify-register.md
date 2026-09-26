# Generate, verify and register a level

From a finished scene ([new-scene.md](new-scene.md)) to a playable level in the level list.

1. Screen seeds with the ladder generator and pick one.
2. Dress the puzzle (cast names, "the victim").
3. Verify it.
4. Register it in `src/content/levels.ts`.
5. Play it.

## Generators

| Command | Use it for |
|---|---|
| `bun tools/ladder.ts --scene <scene> --tier <very-easy\|easy\|easy-medium\|medium> --seed N [--victim r,c] [--cast] [--out f.json]` | **Levels.** The ladder generator plans the order in which a person places the people and the cards each placement uses, so the tier means what a person can do (`docs/solvability/README.md`). It prints the board, the ladder and the clue lines. |
| `bun tools/screen-level.ts --scene <scene> --tier <tier> --victim r,c --from 1 --to 400 [...]` | **Screening.** Runs the ladder generator over a range of seeds and keeps the puzzles that pass the audits and the hint walk, printing their clue lines. |
| `bun src/engine/generator/tiers/main.ts --scene <scene> --tier <hard\|expert> --seed N [--victim r,c] [--out f.json]` | The older tier generator (score bands, hint solver). Still what makes hard and expert. |
| `bun run generate --scene <scene> --seed N [--victim r,c] [--out f.json]` | A quick puzzle from a scene with no tier. Handy while checking that a new scene works. |

`--scene` is a built-in name (`demo`, plus anything you added to the `builtins` maps) or the path to a JSON file holding a scene or a whole puzzle.
`--victim` is 1-based `row,col` (the "r9c7" of the drawings is `9,7`). It pins the victim cell; it must be occupiable, otherwise the tool stops with
"Victim cell r1c1 is not occupiable.". Without `--out` the puzzle JSON is not written; `--json` prints it. `--cast` labels the suspects with the cast
names (`castFor`, see [cast.md](cast.md)) and the victim "the victim".

Exit codes: `0` generated, `1` no puzzle possible for this scene (or within the time budget), `2` bad arguments or unreadable scene. Tiers are
`very-easy`, `easy`, `easy-medium`, `medium`, `hard`, `expert` (see [rules.md](rules.md) and [docs/solvability/README.md](../solvability/README.md));
the ladder generator makes the first four. The generator is deterministic: the same scene, tier, seed and victim cell give the same puzzle, as long as
the generator and the tier table are unchanged (the search has a wall-clock budget; a level takes about 50 ms).

## 1. Screen seeds

A new scene must first be added to the `builtins` maps of the tools ([new-scene.md](new-scene.md), step 5), or passed as a JSON path. Screen a range of
seeds for each victim cell you allow. Generating one takes about 50 ms:

```sh
bun tools/screen-level.ts --scene demo --tier easy --victim 9,7 --from 1 --to 400 --min-kinds 5 --max-lines 3 --max-kind 4
```

```
seed 2: 11 cards, 6 kinds, most used 4x, 2 row/column, 50% direct, 9 hint requests, most squares left by a card 5, chain 2, order Henry(1) Chloe(1) ...
  Emma stood in a corner of the Kitchen.
  ...
400 seeds: 400 generated, 400 pass the audits, 400 pass the hint walk, 8 pass the screen
```

A seed is kept when the ladder generator finds a puzzle for the tier with the victim pinned (`ladderCheck` passes the tier, `tierFor` gives exactly the tier,
`verifyPuzzle` finds one solution), the clue-noun audit, `auditHints` and `auditClues` are clean, and a hint walk (`walkHints`, every hint the game gives)
needs at most 1.3 x the number of people requests. The flags then screen on variety: a handful of clue kinds, no kind too often, few row/column/line
cards; `--plain 1` drops "did not stand next to", "nobody in" and "the only person on" cards for the easiest levels. Read every sentence: the screen prints them.
Pick by hand: varied, natural, no stiff sentence, no card that names its answer.

To look at one candidate in full (board with the order of placing, the cards each placement uses, the clue lines):

```sh
bun tools/ladder.ts --scene demo --tier easy --seed 2 --victim 9,7 --cast
```

To see how often a scene delivers a tier over a run of seeds (success rate and time) without writing files:
`bun tools/ladder.ts --scene demo --tier easy --seed 1 --victim 9,7 --report 20`.

## 2. Write the file

The generator labels suspects A..H and the victim V. A level file carries the cast names and the victim label `the victim`; `--cast` does the
relabelling (names and genders from `castFor`, alphabetical by first letter, so `--cast` output is the same on every run):

```sh
bun tools/ladder.ts --scene demo --tier easy --seed 2 --victim 9,7 --cast --out src/content/demo/puzzle.json
```

Never edit ids, the solution or the clues by hand after generating; regenerate instead.

## 3. Verify

```sh
bun run verify src/content/demo/puzzle.json
```

```
Puzzle: puzzle.json
Valid rules: yes
Solutions: 1
Murderer: C
Matches stored solution: yes
Result: OK
```

`verify` accepts any path, in or outside the repo. It loads the file (schema), checks the rules, counts solutions (capped at 2) and compares with the
stored solution. `Solutions: 2+` means a clue is missing, `0` means clues contradict each other. Exit codes: `0` valid and unique, `1` not, `2` usage or
unreadable file. What each check proves: U1 to U5 in [rules.md](rules.md).

## 4. Register the level

Edit `src/content/levels.ts`. Levels are registered in play order; level N+1 unlocks when level N is solved.

```ts
import myLevelJson from './my-level/puzzle.json?raw'
import { myRoomStyles } from './my-level/scene.ts'

// ... inside the levels array, at the position where it should be played:
  { id: 'my-level', title: 'My level', puzzle: load('my-level', myLevelJson), roomStyles: myRoomStyles },
```

- `id`: lowercase letters, digits, `-` and `_`. It is the save slot (`slaydoku:game:<id>`), the progress key and the URL (`/level/<id>`). Never change it
  once shipped.
- `title`: English, shown in the level list and above the puzzle.
- `roomStyles`: the floor per room id from the scene file. A room not listed gets a style guessed from its name (kitchen: tiles, garden: grass, ...), else one
  cycled from the pattern list.
- `load` parses the file and throws with a readable list of problems at start-up, so a broken file never fails mid-game.

Then:

```sh
bun run lint
bun run typecheck
bun run test
```

## 5. Play it

```sh
bun run dev
```

Open the printed URL (default `http://localhost:5173/`). The level list shows the levels in order; a new one is locked until the one before it is solved;
a URL pointing at a locked level (`/level/my-level`) is refused and shows the list. To reach a late level, solve the earlier ones in the browser. Progress is
stored in the browser's local storage, so clearing site data resets it.

## If no seed gives a good puzzle

- Try another tier, or a different victim cell, before changing the scene. Look at the counts `tools/screen-level.ts` prints: a big drop between
  "generated" and "pass the audits" or between "audits" and "hint walk" says which gate the scene fails.
- If the generator reports no puzzle at all (exit 1), the scene is too constrained: check `checkAdmissible` ([new-scene.md](new-scene.md)), and look for a
  room, row or column that leaves almost no free cells.
- If a scene must change, change it and start again at step 1; a level's puzzle embeds its scene.
