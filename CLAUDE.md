# Slaydoku: notes for Claude

**Read [docs/handoff.md](docs/handoff.md) first** — open decisions, what changed last session, and what a new session needs to know that isn't obvious from git history alone. Keep it updated as things resolve.

Slaydoku is a public, Wordle-style daily murder-grid puzzle (Murdoku-like), in English: everybody gets the same puzzle each UTC day, solves it, and shares time and hints on a card. The code started from an earlier private prototype; all personal content was removed before the first commit.

## Decisions (change only after asking the owner)

- Same puzzle for everyone per UTC day, names included: the names are baked into the pre-generated schedule file, never picked at runtime. UTC only, no clock check. The app shows a date-based puzzle label (e.g. "Puzzle of 29 September"), the UTC date and a countdown to 00:00 UTC. The unsolved screen no longer prints the "Ends at 00:00 UTC (02:00 Amsterdam time)" line (owner decision, SLAY-14.2); the Next/Starts lines still show the Amsterdam-time equivalent, fixed for every visitor, not detected per device (owner decision, 2026-09-27). The sequential puzzle number stays internal only (storage keys, stats dedup — SLAY-10.2), never shown to a player. No archive, accounts or leaderboard at launch; stats and streaks stay on the device. Push reminders are the one server-side exception: a Cloudflare Worker stores only the push endpoint, keys, chosen hour and the date you last solved, so the reminder can skip you, kept about a day (`docs/push.md`).
- Grid: max 12x12, preference 6x6 and 9x9 (7x7 and 12x12 occasionally, never 16x16). Expert: exactly one per UTC week on a seeded random day; hard and expert only on 9x9 and 12x12. Other days: very-easy 15%, easy 30%, easy-medium 25%, medium 20%, hard 10%. Ramp-up window: from launch (2026-09-27) through 2026-10-31 (`RAMP_UP_END_DATE` in `src/schedule/pick.ts`), hard and expert are suppressed entirely — no kept-expert exception — and those days draw very-easy 15%, easy 30%, easy-medium 25%, medium 30% instead (SLAY-10.1, extended from SLAY-6.3's original 28-day window).
- Cast: simple neutral English names with genders, first letters unique within one puzzle, variety per puzzle from a pool (several names per letter, both genders, genders balanced within 1). A theme may have a cast pool of its own (SLAY-18.2: Simpshouse, `src/content/cast/simpshouse.ts`, real first names of friends, 11 letters so at most 12x12; letters and genders are drawn together because most letters have one gender); such a day stays out of the nominal cast chain, so every other day's cast is unchanged. Avatars are not tied to names, with one named exception: Biko (Simpshouse pool only) always renders as the monkey portrait; every other name keeps its slot-based portrait.
- Sharing: one square PNG card (1200x1200, no wide variant and no shape choice, owner decision, SLAY-14.3) plus emoji text with puzzle number, difficulty, time and hints; no spoilers. Share and Copy carry image and text together.
- Name: Slaydoku. Never call it Murdoku (an existing game by Manuel Garand); credit it on an about page. The repo stays private until the owner says go.
- Puzzles must be solvable by a human without holding dozens of squares in mind: see `docs/solvability/README.md` (ladder tiers, caps on squares per card and dependency chains). Every card a person holds must be visible on screen.

## Commands

`bun run dev` · `bun run lint` · `bun run typecheck` · `bun run test --maxWorkers=1` · `bun run build` · `bun run verify:phone` (browser checks on phone and iPad sizes, ~8 min) · `bun run validate:generation` (sweep on fresh seeds) · `bun run test:slow` (~15 min).

## Rules that saved time

- Bun only, never python3. Run long commands (tests, sweeps, generation) in the foreground with a generous timeout.
- Verification drivers and tests run on the dev-only date override (`?date=2026-10-15`, see `docs/daily-flow.md`); it works only in dev and on `localhost`.
- Git: use `git fetch origin` then `git merge --ff-only origin/main` (plain `git pull` can fail here). Stage explicit paths only; a hook blocks blanket staging. Never force-push. Open PRs with `gh pr create --head <branch> --base main`. Workflow files need the `workflow` token scope (`gh auth refresh -h github.com -s workflow`, run by the owner).
- Tests: `--maxWorkers=1` (parallel runs time out under load). Wall-clock/ms-budget assertions live only in `*.slow.test.ts` files and `sweep.*.test.ts` (run via `bun run test:slow`), never in `bun run test`, so CPU variance can't flake a PR (SLAY-11.1).
- Sources under `src/` run in the browser: no `process.*`, no `node:` imports (a test guards it).
- Check the rendered screen, not only the puzzle data (`docs/verification/screens.ts`): an earlier bug showed only the first clue card of each person while all data checks passed.
- Workers deliver one story each with backlog-deliver in `.worktrees/<id>`, then a reviewer pass; if the review blocks only on scope, widen the story References with `backlog task edit --ref` (re-pass all existing refs) and re-review. Backlog tasks are edited only through the `backlog` CLI. Prefix: SLAY. Workflow config: `.claude/backlog-workflow.json`.
- Vercel: only main and branches named `*/preview-*` (e.g. `SLAY-17.8/preview-look-poc`) are built (`ignoreCommand` in `vercel.json`, owner decision 2026-10-08, SLAY-17.7), so the owner can test a feature on a phone; every other branch is skipped because of the hobby deploy limit. One deploy per push: delete preview branches once the owner has decided.
- Look for leftover background shells and headless Chrome after worker runs and stop them.

## Style

Short answers (see the parent folder's AGENTS.md); code, commits and PRs are written normally, in English. The owner chats in Dutch.
