# The daily schedule

Everybody gets the same puzzle on the same UTC day, names included. The puzzles are not made in the browser: `bun run schedule` builds a
puzzle for every date ahead of time, gates it, and writes committed files under `src/content/schedule/`. This page says how it works, how
to extend it, what the time budgets are and what happens when a board is too slow to make.

```sh
bun run schedule --start 2026-09-27 --days 120   # what the current schedule was made with (about 1 minute on 4 jobs)
bun run schedule --days 60                       # extend: starts the day after the last scheduled day
bun run schedule:check                           # days left after today (UTC); exit 1 when fewer than 30
bun run schedule:next                            # is a top-up due (fewer than 60 left)? where it starts, and the exact command
bun run test:slow                                # includes the re-verification of every committed day from scratch
```

## Files

| Path | What it is |
|---|---|
| `src/content/schedule/2026-11.json`, ... | One file per UTC month: a small header, then one day per line. Self-contained, so the app can load only the current month. |
| `src/content/schedule/index.json` | Launch date, first and last date, day count and one line per month file (file name, first, last, count). |
| `src/schedule/` | The pure part (the app may import it through `index.ts`): dates, launch date, the picker, the cast chain, the file format, `scheduleStatus`. |
| `src/schedule/build.ts`, `gates.ts`, `check.ts` | The node-side part (renders the card grid to markup, runs the solvers): build one day, gate one day, check a whole schedule. Imported by path, never by the app. |
| `tools/schedule.ts`, `tools/schedule-check.ts`, `tools/schedule-next.ts` | The entry points: generate, count the days left, plan the next top-up. |
| `.github/workflows/schedule-top-up.yml` | The monthly top-up (see "Keeping the schedule filled"). |
| `reports/schedule/` (git-ignored) | The report of the last run: `report.md` and `report.json`, one row per day with the seeds that were rejected and the gate that rejected each. |

There is no separate solution file: the solution is part of the day, next to the puzzle, because the app needs it to check a board.

One day looks like this (keys in this order, one line in the file):

```
n, date, size, tier, theme, seed, attempts, [fallbackFrom], title, portraits, puzzle, fp
```

- `n`: puzzle number, counted from the launch date (launch day = 1). `date`: UTC date `YYYY-MM-DD`.
- `size`, `tier`, `theme`: what was made. `seed`: the seed of the attempt that passed; the puzzle id is `<size>-<tier>-<theme>-<seed>`.
  `attempts`: seeds tried until one passed, that one included (1 = the first seed of the day's window).
- `title`, `puzzle` (scene, people with names and genders, clue cards, solution), `portraits` (one per suspect, in seat order): what the play screen needs.
- `fp`: `puzzleFingerprint` of the puzzle (`src/game/fingerprint.ts`); saves and solved records key on it.
- `fallbackFrom`: only on a day that fell back from a planned 12x12 (see below).

Names and genders are baked into `puzzle.people`: nothing is picked at runtime. Files are compact JSON with fixed key order and no timestamps, so
the same days always give the same bytes and a change shows up in a diff as changed days.

## The launch date

`src/schedule/launch.ts` holds `LAUNCH_DATE` (`2026-09-27`, set by the owner; changed from the earlier placeholder `2026-10-12` on 2026-09-27). Only the puzzle number
depends on it: the puzzle of a date is a pure function of the date. To move the launch date, change the constant and regenerate
(`bun run schedule --start <launch> --days N --out <empty folder>`, then replace the folder), or pass `--launch` for a one-off run. The
tool refuses to extend a folder that was made for another launch date. `index.json` records the launch date; a test checks it equals the constant.

## How a day is picked (`src/schedule/pick.ts`)

Everything is a pure function of the date: no clock, no previous day, no state. That is why a run can be split over processes, extended
later or repeated and stay identical.

- **Expert:** exactly one per UTC week (Monday to Sunday), on a weekday drawn per week from the week's Monday (`expertWeekday`). A schedule that
  starts in the middle of a week may have no expert in that first partial week; every whole week has exactly one.
- **Other days:** tier from the mix very-easy 15, easy 30, easy-medium 25, medium 20, hard 10 (percent), then a size the tier allows.
- **First 4 weeks (`isRampUp`, the 28 days from `LAUNCH_DATE`), a gentler exception:** no `hard` — `medium` picks up its 10-point share (20 -> 30:
  very-easy 15, easy 30, easy-medium 25, medium 30, `RAMP_UP_TIER_MIX`), and only the chronologically first would-be expert day in the window stays
  `expert` (`rampUpKeptExpertDate`); every later one in the window falls back to that hard-free mix instead, so its week holds zero experts, not one
  (`scheduleProblems` allows for it). A day whose unmodified draw was already outside `hard` (or a normal week's single expert, or any day outside the
  window) is untouched: it keeps the exact tier the unmodified mix would give it, so the mix table's shape change never shifts an already-fine day's plan.
- **Size weights:** 6x6 40, 9x9 40, 7x7 8, 12x12 12. Hard and expert only on 9x9 and 12x12 (weights 40 : 12 there), so 6x6 and 7x7 only carry very-easy to
  medium. Never 16x16 (the picker has no such size and every gate refuses one).
- **Themes:** the five themes rotate in cycles of five days (each theme once per cycle, a seeded order per cycle); a cycle that would start with the theme
  the last one ended on swaps its first two. So the same theme never lands on two days in a row, and consecutive days can never share size, tier and
  theme together (a test and `pairProblems` check it).
- **Seed window:** day `d` may try the seeds `dayNumber(d) * 50` to `dayNumber(d) * 50 + 49` (`ATTEMPT_WINDOW = 50`, `seedOf`). Windows of two days never overlap.

Over 365 days the picker gives a mix within a few points of the owner's numbers (the tests pin this over 365 and 730 days).

## The cast (`src/schedule/cast.ts`)

`castFor(size, seed, previousNames)` (`src/content/cast`) makes the names and genders. To keep a day independent of how the day before was built, the schedule
defines a **nominal cast chain**: the cast of a date is `castFor(planned size, date, nominal cast of the day before)`, starting on a fixed anchor
(`CAST_CHAIN_START`, 2026-01-01). It is a pure function of the date, so consecutive days share no name, in any build order. The cast is passed into
`buildEntry` (`src/content/packs/build.ts`, the `cast` argument) instead of the pack's own draw, and the portraits of the same cast are baked into the day.

## Gates and retries

A day is built by `buildDay` (`src/schedule/build.ts`): it walks the day's seeds in order and keeps the first that passes everything.

1. `buildEntry`: random scene, `generateLadder` for very-easy to medium and the advanced generator (`tryGenerateForScene`) for hard and expert, dressing with the cast,
   then every gate of `entryProblems` (`src/content/packs/gates.ts`): unique solution (`verifyPuzzle`), human-solvable at the tier (ladder check or technique
   level), `tierFor` equal to the tier, score band, hint audit, clue audit, clue-noun audit, clue count and variety, and the cast audit (`castProblems`).
2. `missingCardText` (`src/render/cards/cardText.ts`): the card grid is rendered and every card of every suspect must be on the screen.

A seed that fails any of them is recorded (seed, gate, reason) and the next seed is tried, up to 50. The report lists every rejected seed per day. In the first
120 days 24 days needed a second seed or more (96 took the first), 35 seeds were rejected: score band 19, variety 10, clue audit 3, clue count 2, hint audit 1,
generation 1.

`dayProblems` (`src/schedule/gates.ts`) runs the same gates on a stored day from scratch, plus shape, the fingerprint and the day-to-day rules; the tests re-verify a
sample of ten days, `bun run test:slow` all of them. `scheduleProblems` (`src/schedule/check.ts`) checks the whole set without solver runs: the picker's plan is
followed, numbers and dates run without a gap from the launch date, exactly one expert per whole week, no name shared with the day before, no repeated board, and
`index.json` lists exactly the month files. `bun run schedule` runs it before it writes anything.

## Budgets and the fallback rule

| Budget | Value | Where |
|---|---|---|
| Seeds per day | 50 | `ATTEMPT_WINDOW` in `pick.ts` |
| Wall clock per seed | 60 s; 120 s for 12x12 hard and expert | `attemptBudgetMs` in `build.ts` |
| Wall clock per day, all seeds | 600 s | `DAY_BUDGET_MS` in `build.ts` |

12x12 hard and expert are the slow boards: 5 to 30 s a seed on a busy 14-core laptop with 12 processes running, once 79 s. Measured on 96 fresh 12x12 days
(48 hard, 48 expert, run in parallel): all 96 gave a puzzle, on average 1.1 seeds a day, at most 2. In the committed 120 days 6 planned 12x12 hard or expert days
all passed (five on the first seed, one on the second).

**Fallback rule.** A planned 12x12 hard or expert day whose window ran dry (50 seeds without a pass, or the 600 s day budget used up) is built again as **9x9 with the
same tier, theme and seed window** (`withFallback`, `FALLBACK_SIZE = 9`). The day then carries `fallbackFrom: 12`, the report marks it, and the tool prints it. Its cast
is `fallbackCast`: it keeps out the names of the day before as built and of the day after, so no neighbour shares a name with it. Every other day that runs dry (any other
size or tier) is an error: nothing is written and the report says which day and why. Fallbacks have not happened yet (0 of 120 days, 0 of 96 forced 12x12 runs); if they
start to, raise `attemptBudgetMs` or improve the generator rather than accept more 9x9s.

The wall-clock budgets are the only place the schedule reads the clock. On a machine fast enough for the seeds to finish inside them (all of them did here) the output
does not depend on the machine or on `--jobs`; the fallback rule is the one thing that could, so a fallback is always visible in the file and the report.

## Keeping the schedule filled

The schedule must never run dry: the app has no puzzle for a date beyond the last scheduled day. Two numbers rule it (`src/schedule/status.ts`): a top-up is **due below 60 days left**
(`TOP_UP_BELOW`) and the schedule is **in trouble below 30** (`MIN_DAYS_LEFT`, `schedule:check` exits 1). Days left are the scheduled days after today (UTC). With a monthly run and a
60-day trigger there are still at least 29 days between two runs in the worst case.

**The routine.** Nothing to do by hand while the workflow runs. Once a month a pull request "Schedule: <first> to <last>" appears with 90 new days (only added lines in one or two month files
and `index.json`). Read the diff, then merge it. Merge it well before the days run out: the app only knows what is on main.

**What the workflow does** (`.github/workflows/schedule-top-up.yml`, on the 1st of every month at 06:00 UTC, and on demand):

1. Checks out main, installs bun, runs `bun run schedule:check` (a warning when under 30) and `bun run schedule:next --days <N> --github`, which reads the schedule and decides.
2. 60 days or more left: it stops there (green, nothing generated).
3. Fewer than 60: it looks for an open top-up pull request (then it warns and generates nothing, so merge that one) or a stale `schedule/<date>` branch (then it fails and says to delete it).
4. Otherwise it runs `bun run schedule --start <day after the last scheduled day> --days <N> --jobs 2`. Same input, same bytes, whatever `--jobs` is, so a rerun gives the same days. The first
   lines of the report go to the job summary and the whole report is attached as the artifact `schedule-report`. Expect minutes, not seconds (12x12 hard and expert days are the slow ones); the job
   has a 60-minute ceiling.
5. It checks that only `src/content/schedule/` changed, commits on branch `schedule/<first-date>`, pushes and opens the pull request with `gh pr create --base main`.
6. Last, it runs `bun run schedule:check` again on what it has: **the run is red with an error message when fewer than 30 days are left** after the top-up (also when a top-up was due but skipped because its
   pull request is still open and main is under 30). A red run is the alarm: read the message in the run.

Pull requests opened with the workflow's own token do not start other workflows: CI does not run on the top-up PR. Close and reopen it (a human action) to run CI, or run
`bun run lint`, `typecheck` and `test --maxWorkers=1` on the branch. Vercel builds main only.

**Settings the owner must enable** (the workflow declares `contents: write` and `pull-requests: write`, but a repository setting can still forbid PRs):

- Settings > Actions > General > Workflow permissions: tick **Allow GitHub Actions to create and approve pull requests**. Without it the run fails at `gh pr create`
  ("GitHub Actions is not permitted to create or approve pull requests"); the branch is already pushed then, so you can open the PR by hand from `schedule/<first-date>`.
- Actions must be enabled for the repository. GitHub switches scheduled workflows off after 60 days without repository activity; merging the monthly top-up counts as activity, and the
  workflow can be re-enabled on the Actions tab. Pushing the workflow file itself needs the `workflow` token scope (`gh auth refresh -h github.com -s workflow`).

**Running it by hand.** Actions tab > Schedule top-up > Run workflow, or:

```sh
gh workflow run schedule-top-up.yml --ref main -f days=90 -f dry_run=false
gh workflow run schedule-top-up.yml --ref main -f dry_run=true -f force=true -f days=3     # rehearsal: 3 days, nothing committed
```

Inputs: `days` (default 90, 1 to 366), `force` (generate even when 60 or more days are left, to try the workflow out; `schedule:next --force`) and `dry_run`. A **dry run** does everything up to the generation and stops: it prints the plan, generates the days in the runner's working copy,
shows the diff stat and the report in the job summary, and does not commit, push or open a pull request. Without `force` a top-up runs only when one is due, also by hand. The workflow always uses
main's schedule, whichever branch you pick to run the workflow file from.

To rehearse the same on your own machine without touching the repository, work on a copy of the schedule folder and give `--today` to the plan:

```sh
cp -R src/content/schedule /tmp/schedule-copy
bun run schedule:next --dir /tmp/schedule-copy --today 2027-01-15 --days 3      # prints the start and the command
bun run schedule --start 2027-02-09 --days 3 --jobs 2 --out /tmp/schedule-copy --report /tmp/schedule-report
bun run schedule:check --dir /tmp/schedule-copy --today 2027-01-15
```

**When a day cannot be generated.** The generation step fails (exit 1), nothing is written, no branch is pushed and the run is red; `PROBLEM <date>: ...` in the log names the day and the gate
(see "Gates and retries" and "Budgets and the fallback rule"). A 12x12 hard or expert day falls back to 9x9 by itself and is marked `fallbackFrom` in the PR, in the report and in the log:
look at those in the diff. Any other day that runs dry is a generator problem: run `bun run schedule --start <that date> --days 1 --out <empty copy>` locally to reproduce, fix the generator
or raise a budget in a normal PR (new days only, see "Extending the schedule safely"), and run the workflow again. While that is open, add days by hand with a shorter `--days` that stops
before the problem day, so the schedule does not run dry. A red run with "Schedule is running dry" needs action within days: at 30 days left you have a month.

## Extending the schedule safely

1. `bun run schedule:check` says how many days are left after today (UTC) and where to start: `days left after <today>` counts the scheduled days strictly after today
   (before launch: all of them). It exits 1 under 30 days (`MIN_DAYS_LEFT`). `bun run schedule:next` says whether a top-up is due and prints the command; the monthly workflow (see below) acts on it.
2. `bun run schedule --days 60` starts on the day after the last scheduled day (or pass `--start`). `--start` may not leave a gap and may not be before the launch date;
   with an empty folder it must be the launch date.
3. **A published day never changes.** Days already in the folder that come out different are refused (exit 1, nothing written) unless `--overwrite`. Regenerating the same
   range with the same code gives the same bytes, so the normal case is a diff with only added days. If a change to the generator or a gate makes old days come out different,
   do not overwrite the days people have already played: extend from the last day and let the change apply to new days only.
4. Check the diff: new lines only, `index.json` count, last date and month lines changed. Read `reports/schedule/report.md` for retries and fallbacks.
5. `bun run lint`, `typecheck` and `test --maxWorkers=1`; run `bun run test:slow` for the full re-verification.

A fallback day's cast depends on the day before it. When extending, the day before is read from the folder; if you generate into another `--out` folder, extend from a
folder that holds it, or that fallback day may get another cast than in the committed run.

### Flags of `bun run schedule`

| Flag | Meaning |
|---|---|
| `--start YYYY-MM-DD` | First date (default: the day after the last scheduled day, or the launch date). |
| `--days N` | Number of consecutive days (required). |
| `--out dir` | Schedule folder (default `src/content/schedule`); other folders are handy to compare two runs. |
| `--jobs n` | Worker processes (default cores minus 2); the bytes do not depend on it. Days are dealt to the workers slowest first. |
| `--launch YYYY-MM-DD` | Launch date for the numbering (default `LAUNCH_DATE`). |
| `--report dir` | Where `report.md` and `report.json` go (default `reports/schedule`, git-ignored). |
| `--overwrite` | Let days that already exist come out different. |

Exit codes: 0 ok, 1 a day could not be built or a check failed, 2 bad arguments. `bun run schedule:check [--today YYYY-MM-DD] [--dir folder]`: 0 with at least 30
days left, 1 with fewer or no schedule, 2 bad arguments.
