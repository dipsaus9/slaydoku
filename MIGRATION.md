# Migration notes

Slaydoku started from a private prototype (a single-player gift puzzle) whose personal content was cut out before this repository was created.
This file records what was removed, replaced or disabled on the way, and what the next stories have to rebuild. It names no people.

## Removed

- **Personal levels and scenes.** The three hand-made floor plans of the prototype, their puzzles, the level registry entries, their scene tests and
  the tests that were pinned to their exact content (solution grids, clue sentences, ladder orders).
- **The intro block** of the level list (photo and text) and its CSS.
- **The eight hand-drawn portraits** of the prototype's circle, and their names in `src/render/cards/cast.ts` and the ladder tools.
- **Committed pack data** (`src/content/packs/*.json`, `index.json`). The pipeline code stays (`build`, `gates`, `format`, `read`, `ids`, `types`,
  `sweep`, `articles`, `tools/pack.ts`, `tools/validate.ts`).
- **The extras browser** (`src/ui/extras`: browse, filters, play a pack puzzle, progress storage, tests) together with its routes (`/extras`,
  `/extras/<id>`) and the "Extra zaken" section of the level list. The lab lost its pack browser for the same reason.
- **Reports and fixtures built from the removed content**: `docs/difficulty/*.json|md` (calibration and score reports), `docs/solvability/report.*`,
  `docs/verification/report.md`, the house-level fixtures of the difficulty and human-solver tests, `backlog/`, `.claude/`.
- **A test that read puzzles from a folder outside the repository** (`solveHuman: real published puzzles`); third-party puzzles do not belong in a
  public repository.

## Replaced

- **Cast.** A pool of plain English names with genders and `castFor(size, seed, previousCast)` (`src/content/cast/`): distinct first letters, genders balanced, seeded.
  Portraits are generic designs picked by gender slot, not by name. The ladder tools (`ladderCast`, `castGenders`) and the pack cast builder use `castFor`; see `docs/authoring/cast.md`.
- **One demo level.** `src/content/demo/scene.ts` is a made-up 9x9 house (four rooms). `src/content/demo/puzzle.json` is the ladder generator's output for
  tier easy, seed 2, victim on the sofa (`bun tools/ladder.ts --scene demo --tier easy --seed 2 --victim 9,7 --cast --out src/content/demo/puzzle.json`).
  `src/content/levels.ts` registers it as level `demo`. `demo` is the built-in scene name of `tools/generate.ts`, `tools/ladder.ts`,
  `tools/screen-level.ts` and `src/engine/generator/tiers/main.ts`.
- **Tests that read committed data** now build what they need on the spot: `src/content/generated.testing.ts` (a sample of generated puzzles per theme),
  `src/content/packs/sample.testing.ts` (a small pack), `hardPuzzle()` in `src/game/hints.fixture.ts`. Exact-text pins on personal puzzles became
  pattern checks; house-style checks now run on the tutorial, the demo level, a hard puzzle and the generated sample.
- **Home theme.** The attic room is now called "Vliering", and test room names were made neutral.
- **Names and keys.** The prototype name became `slaydoku` everywhere: the package name, the localStorage keys (`slaydoku:progress`, `slaydoku:game:<id>`,
  `slaydoku:help-seen`, ...), the cache prefix, the page title, the manifest and the share image (regenerated with `bun tools/brand.ts`, no personal
  text). The gift-box art stays for now.
- **Docs.** The authoring guides now use the demo scene; `docs/authoring/new-house-scene.md` became `new-scene.md`; `docs/difficulty/README.md` and
  `docs/solvability/README.md` were rewritten without measurements of the removed content; `src/content/packs/README.md` describes the pipeline only.
- **Browser verification scripts** (`docs/verification`, run with `bun run verify:phone`): adapted to the single demo level. The parts that drove
  the extras browser, locked levels and pack chunks were removed; `legend.ts` and `screens.ts` sample pack puzzles only when pack files are on disk.

## Test suite changes for slower machines

- The 16x16 fixture regeneration test moved to `src/engine/solver/advanced/benchmark.regeneration.slow.test.ts` (`bun run test:slow`): one synchronous
  test of one to two minutes made vitest report "Timeout calling onTaskUpdate" as an unhandled error.
- The 20-seed tier test in `src/engine/generator/tiers/generate.test.ts` yields between seeds for the same reason.
- `src/engine/solver/perf.test.ts`: the 16x16 budget went from 2000 to 4000 ms and the tests got a 60 s timeout (the four solver runs of the
  best-of-three take longer than the default 5 s on a slower machine).
- A few generator tests got explicit timeouts.

## Disabled scripts

Removed from `package.json` (the code behind them was measuring the removed content):

| Script | Why |
|---|---|
| `pack:verify` | Verifies committed pack files, and there are none. Use `bun tools/pack.ts --verify` once packs exist. |
| `difficulty:report` | Built the score reports for the removed levels, fixtures and pack (`tools/difficulty-report.ts`, `tools/difficulty-data.ts` deleted). |
| `calibrate` | Fitted the score weights against that data (`tools/calibrate.ts` deleted; `src/engine/difficulty/calibrate.ts` and its unit tests stay). |
| `solvability:report` | Reported tiers of the removed levels and pack (`tools/solvability-report.ts` deleted; `src/engine/solvable/report.ts` stays). |

`test:slow` still runs, minus the committed-pack re-verification and the reproducibility check.

## Added

- `bun run audit:personal` (`tools/audit-personal.ts`, tested by `tools/audit-personal.test.ts`): scans the working tree for a deny-list of personal
  terms (stored base64-encoded, so the script does not match itself), e-mail addresses other than `noreply`, absolute home paths and image metadata.
  CI runs it after the tests.
- `LICENSE` (MIT, "Slaydoku contributors"), an English `README.md`, this file.

## Still to rebuild

1. **English interface text.** The engine text is English since SLAY-1.1: clue sentences (`src/engine/clues/en.ts`), solver explanations
   (`src/engine/solver/human/en.ts` and the advanced techniques), hints (`src/game/hintText.ts`), theme room and object names, generated titles, and
   "the victim" for the gift (`dutch.test.ts` keeps Dutch out of `src/engine`, `src/game`, `src/validation` and `src/content`). Still Dutch until
   SLAY-1.2: `src/content/help/help.ts`, `src/ui/*/strings.ts` (including the keyword glossary, whose examples still quote the old Dutch cards),
   `src/pwa/strings.ts`, the lab strings, `<html lang>` and `og:locale`. Remove the `src/content/help` skip from `dutch.test.ts` when that story lands.
2. **Daily schedule.** One puzzle per UTC day: a schedule (puzzle per date, generated ahead and committed or served), the date-based level id, the
   "next puzzle in ..." state, and a plan for regenerating puzzles without breaking saved boards (`puzzleFingerprint` already guards that).
3. **Daily flow and sharing.** Replace the level list, unlock order and solved screen with the daily flow; Wordle-like share text (result grid, time,
   hints used); streaks and statistics.
4. **Extras replacement.** An archive or practice mode on top of the pack pipeline, if wanted. The removed browser had filters by size and tier, saved
   progress per puzzle and offline play of every pack file.
5. **Portraits.** The placeholder cast uses generated busts. Real drawn characters, or a bigger generated pool, are a design decision.
6. **Brand.** Name, logo and share image: the gift-box mark and the "A new puzzle every day" tagline are placeholders. Regenerate with
   `bun tools/brand.ts` after editing `src/brand/*.svg`. Decide on `robots` and `X-Robots-Tag` (`vercel.json` and `index.html` still say noindex) and on
   the production domain (`src/brand/site.ts` derives it from the Vercel environment).
7. **Difficulty data.** Rebuild the reports and the calibration on the puzzles that are kept, and bring back the CLI for them if it is wanted.
8. **Verification scripts.** Extend `docs/verification` again when the daily flow exists.
