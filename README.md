# Slaydoku

**A new murder mystery puzzle every day.** Slaydoku is a browser puzzle: read the suspects' statements, place everybody on the floor plan, and work out
who was alone with the victim. Every puzzle has exactly one solution and can be solved by reasoning alone. It runs on phone, iPad and desktop, works offline
once opened, and keeps everything on your device: no accounts, no tracking. The goal is one puzzle per UTC day for everybody, with Wordle-like sharing of the result.

**Status: work in progress, not public yet.** The daily flow and the schedule are not built yet. What runs today is one demo level, the play
screen with hints and a legend, an About page (`/about`), and the puzzle generator behind it. All text is English: clues, hints and solver text, and the interface (menus, help card, legend, update notice).

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
bun run indexing       # show whether the site is open for search engines (default: not), see docs/launch.md
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
| `src/ui/` | Screens: level list, play, help, about, lab (dev only), router |
| `src/brand/` | Logo, favicons and share image sources, the site tags and the indexing switch |
| `src/pwa/` | Offline support and the update notice |
| `tools/` | Command-line tools (`generate`, `verify`, `pack`, `brand`, `check-share`, `audit-personal`) |
| `docs/` | Authoring guides, the difficulty scale, browser verification scripts |

## Deploy

The site is a static Vite build on its own Vercel project (`slaydoku`); `vercel.json` describes the setup and only `main` builds. The site is not open for
search engines yet: one switch (`src/brand/site.json`, flipped with `bun tools/indexing.ts on`) controls the robots meta tag, `robots.txt`, `sitemap.xml` and the
`X-Robots-Tag` header together, see [docs/launch.md](docs/launch.md). `bun tools/check-share.ts <url>` checks the share tags, the icons, the manifest, the deep
links and the indexing setup of a deployed site. Brand images (the magnifying glass over a grid, the favicons and the share image) are generated from
`src/brand/*.svg` with `bun tools/brand.ts` (needs Chrome).

## Contributing

Only your own art and puzzles: no images, puzzles, logos or code of other Murdoku products. `bun run lint`, `bun run typecheck`, `bun run test` and
`bun run audit:personal` must be green before a change is merged.

## Credit

Inspired by Murdoku by Manuel Garand. Slaydoku is an independent project and uses no official assets: every puzzle, name and drawing here is original.

## License

[MIT](LICENSE).
