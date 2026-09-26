# Slaydoku

Slaydoku is a murder mystery logic puzzle in the style of Murdoku: read the suspects' statements, place everybody on the floor plan, and work out
who was alone with the victim. The goal is a new puzzle every day, one per UTC day, with Wordle-like sharing of the result.

**Status: work in progress.** The daily flow and the schedule are not built yet. What runs today is one demo level, the play
screen with hints and a legend, and the puzzle generator behind it. All text is English: clues, hints and solver text, and the interface (menus, help card, legend, update notice).

## Run it

You need [Bun](https://bun.sh).

```sh
bun install
bun run dev            # dev server; the level list opens at the printed URL, the puzzle lab at /lab
bun run test           # unit tests (vitest)
bun run lint           # oxlint
bun run typecheck      # tsc -b --noEmit
bun run build          # production build into dist/, including the offline service worker
bun run audit:personal # scan the tree for personal data before publishing
```

Other entry points: `bun run generate` (one puzzle from a scene), `bun tools/ladder.ts` (the ladder generator), `bun run verify <file>` (check a
puzzle file), `bun run pack` (the puzzle pack pipeline), `bun run validate:generation` (sweep the generators on fresh seeds).
`bun run test:slow` adds the slow generator sweeps. See [docs/authoring/README.md](docs/authoring/README.md) for how the pieces fit together and
[MIGRATION.md](MIGRATION.md) for what this repository does not have yet.

## How the game works

- The board is a floor plan with rooms, furniture, doors and windows. There is one suspect per row and column, plus the victim.
- Every suspect has cards with statements ("stood next to a plant", "was in the kitchen, north of the sofa"). Every puzzle has exactly one solution,
  and it can be solved by reasoning alone.
- The murderer is the only suspect in the victim's room.
- Difficulty is measured by what a person can do, one placement at a time (see [docs/solvability/README.md](docs/solvability/README.md)).

## Project layout

| Path | What |
|---|---|
| `src/engine/` | Model and rules, clues (with the English wording), solvers, generators, difficulty and human-solvability scales |
| `src/content/` | Demo scene and level, themes for random scenes, the pack pipeline, help text |
| `src/game/` | Game state, hints, persistence, telemetry |
| `src/render/` | Board, icons, suspect cards and portraits |
| `src/ui/` | Screens: level list, play, help, lab (dev only), router |
| `src/pwa/` | Offline support and the update notice |
| `tools/` | Command-line tools (`generate`, `verify`, `pack`, `brand`, `check-share`, `audit-personal`) |
| `docs/` | Authoring guides, the difficulty scale, browser verification scripts |

## Deploy

The site is a static Vite build. `vercel.json` describes the Vercel setup (only `main` builds; every response carries `X-Robots-Tag: noindex,nofollow`
for now). `bun tools/check-share.ts <url>` checks the share tags, the icons, the manifest and the deep links of a deployed site. Brand images are
generated from `src/brand/*.svg` with `bun tools/brand.ts` (needs Chrome).

## Contributing

Only your own art and puzzles: no images, puzzles, logos or code of other Murdoku products. `bun run lint`, `bun run typecheck`, `bun run test` and
`bun run audit:personal` must be green before a change is merged.

## License

[MIT](LICENSE).
