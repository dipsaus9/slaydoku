# Authoring guide

How to add content to Slaydoku without the original author. Every command in these guides was run once against the repo
(bun 1.3, from the repo root) and works as written.

| I want to... | Read |
|---|---|
| Understand the rules the engine enforces, and which test proves each one | [rules.md](rules.md) |
| Add a new scene (a floor plan) | [new-scene.md](new-scene.md) |
| Generate a puzzle, verify it, and register it as a playable level | [generate-verify-register.md](generate-verify-register.md) |
| Build or regenerate puzzle packs | [regenerate-packs.md](regenerate-packs.md) |
| Measure the generator on fresh seeds, see how many more puzzles a cell can give, extend the pack safely | [scaling.md](scaling.md) |
| Add a scene theme, an object type or an object icon | [theme-and-icons.md](theme-and-icons.md) |
| Understand or change the cast: name pool, `castFor`, gates, portraits | [cast.md](cast.md) |
| Generate, extend or check the daily schedule (one puzzle per UTC day) | [schedule.md](schedule.md) |

## Map of the repo

| Path | What lives there |
|---|---|
| `src/engine/model/` | Scene, puzzle and rule types; `checkScene`, `checkPuzzle`, `validatePlacement`, `deriveMurderer`; the object catalog |
| `src/engine/clues/` | Clue vocabulary (`types.ts`, `relational/types.ts`), truth evaluation, the one file that words clue cards, `en.ts` |
| `src/engine/solver/` | Exhaustive solver (uniqueness), `verifyPuzzle`, the human-style solver that rates difficulty |
| `src/engine/generator/` | Puzzle generator; `tiers/` adds the six difficulty tiers |
| `src/engine/scenegen/` | Random scene generator used by the packs |
| `src/content/demo/` | The demo house scene and the demo puzzle generated on it |
| `src/content/levels.ts` | Registers the levels in play order (one demo level for now) |
| `src/content/themes/` | Scene themes (home, office, park, school, shop) for random scenes |
| `src/content/cast/` | The name pool, `castFor` (unique initials, balanced genders, seeded), `castProblems`, the generic portrait designs |
| `src/content/packs/` | The pack pipeline (build, gates, format, read, sweep); no pack data is committed |
| `src/schedule/`, `src/content/schedule/` | The daily schedule: the pure picker per UTC date, the build and gates of a day, and the committed month files |
| `src/render/icons/` | Object icons (engine catalog) and `themes/` (theme-only icons) |
| `tools/` | The `bun run` entry points: `generate`, `verify`, `pack`, `schedule`, `schedule:check`, `icon-sheet.ts` |

## Commands you will use

```sh
bun install
bun run dev            # dev server; open the printed URL, levels show up in the level list
bun run lint           # oxlint
bun run typecheck      # tsc -b --noEmit
bun run test           # vitest run, everything except the slow sweeps
bun run audit:personal # scan the tree for personal data (deny-list, e-mail addresses, image metadata)
bun run test:slow      # also the generator sweeps (several minutes)
bun run generate ...   # one puzzle from a scene, no difficulty tier   (see generate-verify-register.md)
bun run verify <file>  # check a puzzle file                           (see generate-verify-register.md)
bun run pack ...       # build the puzzle packs                        (see regenerate-packs.md)
bun tools/pack.ts --verify   # re-verify the pack files on disk (none are committed)
bun run schedule --days 60   # extend the daily schedule                (see schedule.md)
bun run schedule:check       # days left after today (UTC), exit 1 under 30
bun run validate:generation  # sweep fresh seeds per size x tier x theme, report success rate and yield (see scaling.md)
bun tools/icon-sheet.ts [out.html]   # contact sheet of every icon    (see theme-and-icons.md)
bun tools/portrait-sheet.ts [out.html]   # contact sheet of every portrait design and sample casts (see cast.md)
```

Run one test file with `bunx vitest run src/content/demo/scene.test.ts`.

All of `bun run lint`, `typecheck`, `test` and `audit:personal` must be green before any change is merged.

## Ground rules

- Only our own art and our own puzzles. No official Murdoku images, puzzles, logos or code in the repo.
- All player-facing text is English and neutral (no gendered pronouns; "woman" and "man" are nouns; the victim is "the victim").
  Clue sentences live in `src/engine/clues/en.ts` and nowhere else.
- Coordinates in code are 0-based `{ row, col }` with row 0 at the top. Everything a human reads or types
  (`--victim 6,2`, "r6c2", "row 3") is 1-based.
- Never change the `id` of a shipped level: it is the save slot, the progress key and part of the URL.
