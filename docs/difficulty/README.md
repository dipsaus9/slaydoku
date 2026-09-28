# Difficulty: the tier scale and score v2

Two numbers describe how hard a puzzle is.

- **The tier** says what a person can do. It is defined on the human-solvability scale (`src/engine/solvable`, rules in
  [../solvability/README.md](../solvability/README.md)): `tierFor(puzzle)` is the easiest of very-easy, easy, easy-medium, medium whose ladder
  rules the puzzle meets, else hard or expert (the hint solver decides). The tier table is `SOLVABLE_TIERS` in `src/engine/solvable/tiers.ts`.
- **Score v2** (`src/engine/difficulty`) is a secondary number from 0 to 100. It orders puzzles inside and across tiers, drives the lab's
  breakdown, and each tier has a **band** of it. It does not decide the tier.

## One source of truth

| What | Where |
|---|---|
| Tier ids, order, ladder rules, and the score v2 band of each tier | `SOLVABLE_TIERS` in `src/engine/solvable/tiers.ts` (`scoreBand`, read with `tierForScoreV2`) |
| Ladder generator (very-easy .. medium) | reads the rules from `SOLVABLE_TIERS` (`generateLadder`) |
| Generator tier table (label, clue kinds, clue policy, technique levels) | `TIERS` in `src/engine/generator/tiers/tiers.ts` |
| Hard and expert generator gate | `qualityGate` (`src/engine/generator/scale/gates.ts`): score v2 inside the tier's `scoreBand` |
| Pack gate | `entryProblems` (`src/content/packs/gates.ts`): `ladderCheck` and `tierFor` exact, score v2 inside the tier's `scoreBand` |
| Weights of the score | `DEFAULT_WEIGHTS` in `src/engine/difficulty/score.ts` |

## What score v2 measures

Eleven parts, each a number from 0 to 1 (`scoreParts`, ranges in `PART_RANGES`); the score is their weighted mean times 100.

| Part | Metric | Reads as hard when |
|---|---|---|
| level | hardest technique of the hint solver (1..5) | the hint solver needs level 4 or 5 |
| steps | hint-solver steps per person | more steps |
| chain | longest chain of dependent deductions per person | deeper chains |
| cluesPerStep | cards a step rests on, as a share of all cards | more cards held at once |
| indirectClues | share of cards that are not direct | fewer direct cards |
| candidates | open squares per step, as a share of the grid | a more open board |
| cards | mean cards per placement on the ladder | more cards per placement |
| references | share of placements using a card about another person | more |
| squares | mean squares a placement's own cards leave | more |
| ladderChain | mean chain of dependent placements on the ladder | longer |
| scarcity | 1 minus the share of people placeable from their own card alone | fewer such people |

The last five are the ladder parts, measured on the ladder of the easiest tier the puzzle meets. When no ladder tier fits (hard and expert) nobody
can place the people one at a time, and the ladder parts other than scarcity count as 1, the hardest.

## The calibration

The weights and the tier bands are fitted, not guessed: `src/engine/difficulty/calibrate.ts` measures a set of puzzles (each with its tier from
`tierFor`), searches whole-number weights that sum to 100 (every part keeping at least 2), and cuts the 0-100 score into one band per tier with the
fewest misplaced puzzles. It can also take telemetry (`slaydoku:telemetry`) and the lab's judgements (`slaydoku:lab-judgements`) into account. The
command line for it was dropped together with the committed puzzle data it once measured (from an earlier prototype); rebuild it around the puzzles you keep.
