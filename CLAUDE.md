# Slaydoku: notes for Claude

Slaydoku is a public, Wordle-style daily murder-grid puzzle (Murdoku-like), in English: everybody gets the same puzzle each UTC day, solves it, and shares time and hints on a card. The code started from an earlier private prototype; all personal content was removed before the first commit.

## Decisions (change only after asking the owner)

- Same puzzle for everyone per UTC day, names included: the names are baked into the pre-generated schedule file, never picked at runtime. UTC only, no clock check. The app shows puzzle number, UTC date and until when the puzzle runs (countdown to 00:00 UTC plus the local equivalent). No archive, accounts or leaderboard at launch; stats and streaks stay on the device.
- Grid: max 12x12, preference 6x6 and 9x9 (7x7 and 12x12 occasionally, never 16x16). Expert: exactly one per UTC week on a seeded random day; hard and expert only on 9x9 and 12x12. Other days: very-easy 15%, easy 30%, easy-medium 25%, medium 20%, hard 10%.
- Cast: simple neutral English names with genders, first letters unique within one puzzle, variety per puzzle from a pool (several names per letter, both genders, genders balanced within 1). Avatars are not tied to names.
- Sharing: PNG card (1200x630 and square) plus emoji text with puzzle number, difficulty, time and hints; no spoilers.
- Name: Slaydoku. Never call it Murdoku (an existing game by Manuel Garand); credit it on an about page. The repo stays private until the owner says go.
- Puzzles must be solvable by a human without holding dozens of squares in mind: see `docs/solvability/README.md` (ladder tiers, caps on squares per card and dependency chains). Every card a person holds must be visible on screen.

## Commands

`bun run dev` · `bun run lint` · `bun run typecheck` · `bun run test --maxWorkers=1` · `bun run build` · `bun run verify:phone` (browser checks on phone and iPad sizes, ~8 min) · `bun run validate:generation` (sweep on fresh seeds) · `bun run test:slow` (~15 min).

## Rules that saved time

- Bun only, never python3. Run long commands (tests, sweeps, generation) in the foreground with a generous timeout.
- Verification drivers and tests run on the dev-only date override (`?date=2026-10-15`, see `docs/daily-flow.md`); it works only in dev and on `localhost`.
- Git: use `git fetch origin` then `git merge --ff-only origin/main` (plain `git pull` can fail here). Stage explicit paths only; a hook blocks blanket staging. Never force-push. Open PRs with `gh pr create --head <branch> --base main`. Workflow files need the `workflow` token scope (`gh auth refresh -h github.com -s workflow`, run by the owner).
- Tests: `--maxWorkers=1` (parallel runs time out under load). Known load flakes: solver perf 16x16 and sweep wall-clock tests: rerun alone first.
- Sources under `src/` run in the browser: no `process.*`, no `node:` imports (a test guards it).
- Check the rendered screen, not only the puzzle data (`docs/verification/screens.ts`): an earlier bug showed only the first clue card of each person while all data checks passed.
- Workers deliver one story each with backlog-deliver in `.worktrees/<id>`, then a reviewer pass; if the review blocks only on scope, widen the story References with `backlog task edit --ref` (re-pass all existing refs) and re-review. Backlog tasks are edited only through the `backlog` CLI. Prefix: SLAY. Workflow config: `.claude/backlog-workflow.json`.
- Vercel: only main is built (`ignoreCommand` in `vercel.json`), because of the hobby deploy limit.
- Look for leftover background shells and headless Chrome after worker runs and stop them.

## Style

Short answers (see the parent folder's AGENTS.md); code, commits and PRs are written normally, in English. The owner chats in Dutch.
