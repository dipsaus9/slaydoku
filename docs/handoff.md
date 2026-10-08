# Handoff: where things stand

Read this first in a new session, before touching the go-public steps (`docs/launch.md`) or
regenerating any schedule content. It has the open decisions and recent history that git history
and the other docs alone don't make obvious. Update it (don't just append forever) whenever the
open items here get resolved.

## Decor objects (SLAY-19.1, awaiting owner approval)

Nineteen new blocking engine types (lamp, mirror, coatRack, fridge, bathtub, fireplace, piano, aquarium, exerciseBike, bin, waterCooler, serverRack, globe, gymBox, playEquipment, barbecue, tent, shoppingCart, kiosk) with block models (`src/render/looks/decorModels.ts`), English and Dutch nouns, and 31 theme kinds with allow-lists (`docs/authoring/room-rules.md`, "Decor kinds"). Distinct kinds per room rose in every theme (home 2.45 → 2.78), chairs stay under 15%. Deviations from the story list, all for the owner's "name exactly what is drawn" rule: one lamp kind per theme (floor lamp / lantern), the school drinking fountain is a water cooler, no table lamp, laundry basket, lab table or bird bath; details in `docs/design/looks.md`, "Decor objects". No facing rule for the new kinds (fronts stay toward the viewer). The schedule is untouched: no baked day shows a decor object until SLAY-18.10 regenerates the future days; until then `bun run dev` → `/lab` generates boards with them. Screenshots: `docs/design/looks-shots/slay-19.1/`. The owner has not yet approved the art or the Dutch words (table in the PR).

## Simpshouse day 2026-10-14 (SLAY-18.4, awaiting owner approval)

The seasonal theme `simpshouse` (src/content/themes/simpshouse.ts, block models in src/render/looks/modelsSimpshouse.ts since SLAY-17.4) is registered and 2026-10-14 is regenerated as a 12x12 Simpshouse puzzle (only that day changed). Owner decisions applied: Iris repeats from 2026-10-13 (the pairwise gate allows one shared name next to a day with its own cast pool, `THEMED_DAY_SHARED_NAMES` in src/schedule/gates.ts); Pikachu plush is the only third-party name. Deviation from the approved preview: the glam vanity is now 2x1 and 3x1 (its engine type `desk` needs 2-3 cells). Screenshots: docs/verification/simpshouse-day/. Must be merged and deployed before 2026-10-14 UTC. `PLAY_DATE=2026-10-14` overrides the date the drivers play (default 2026-10-15); the drive suite is repaired again (SLAY-17.10).

## Theme registry in per-theme modules (SLAY-18.11)

Fall, carnaval, christmas and halloween each have stub files (`src/content/themes/<id>.ts`, `src/render/icons/themes/<id>Icons.ts`, `<id>Art.tsx`) that register nothing; the shared registries merge them, so a theme story edits only its own files. Recipe: `docs/authoring/add-theme.md`.

## Preview deployments (SLAY-17.7)

Vercel builds `main` plus branches named `*/preview-*` (for example `SLAY-17.8/preview-look-poc`), so the owner can test on a phone; all other branches stay skipped (hobby deploy limit, one deploy per push). Rule: `ignoreCommand` in `vercel.json`, tested in `tools/vercel-ignore.test.ts`. Delete preview branches once the owner has decided. Owner decision 2026-10-08, recorded in CLAUDE.md.

## Objects are blocks in the A2 look (SLAY-17.4, awaiting owner approval)

The owner picked A2 (oblique 3D blocks on the square grid) on 2026-10-08; SLAY-17.4 makes it the only look. The Look switch, the stored `slaydoku:look` and the A3 code are removed (history: SLAY-17.8, `docs/design/looks.md`). Every object kind of the engine, the five regular themes and Simpshouse is a block model in `src/render/looks/`; the flat art and the SLAY-16 SVG depth filter (`ObjectIcon.tsx`, `docs/verification/depth.ts`) are deleted, because the blocks carry their own light and shadow. Painter's order, nothing clipped (owner, after two rejected clip attempts): walls, doors and windows lie under every object, objects are painted flat first and then by the row of their front edge and column (`src/render/looks/drawOrder.ts`), each with its own shadow just under it; a block may rise over the wall behind it, and the grid has 44 units of headroom above it (boards 5.4% taller on 12x12, 7.0% on 9x9, 10.1% on 6x6; details in `docs/design/looks.md`). `docs/design/looks.md` also has the confusable-pairs audit and the section "How to draw a new object" that SLAY-18.6 to 18.9 follow. The look-completeness test (`src/render/looks/completeness.test.tsx`) fails when a kind of a registered theme has no block art. The app has no bath kind; the bathtub is a model only. The last acceptance criterion (the owner has seen the screenshots) is the owner's; the PR carries the screenshots. Check: `docs/verification/looks.ts` (header has the command).

Dutch object names (fix round on the same PR, owner report "een lavalamp is een plant, een filing cabinet een kast"): every `ThemeObject` now carries a required `nameNl` (`src/content/themes/*.ts`, 146 kinds across the six registered themes), the Dutch clue text (`objectNounsNl`, `src/engine/clues/nl.ts`), the Dutch Legend rows with their "ook" siblings (`src/ui/help/legend.ts`) and the clue-noun audit (`auditObjectNames(..., currentNounsNl, 'nl')`, run in both languages by the pack gate) use it exactly like English uses `name`/`clueNoun`. Three generic nouns changed too: sink "gootsteen" → "wasbak" (the art is a basin), flowers "bloembed" → "bloemperk", bench "tuinbank" → "bankje". `themes.test.ts` fails a kind without a Dutch noun; `docs/authoring/theme-and-icons.md` (job A) and `docs/design/looks.md` ("How to draw a new object") say so, so SLAY-18.6 to 18.9 must name their kinds in Dutch too (the drafts in `docs/themes/seasonal/` already carry an `OBJECT_NAMES_NL` table to copy from). The owner has not yet approved the Dutch words themselves (table in the PR).

Carried over from the SLAY-16 notes (still true):
- `bun run verify:phone` is green end to end again (SLAY-17.10, 3108 checks on six viewports): the drivers play `PLAY_DATE` (2026-10-15 by default, a medium 9x9; `PLAY_DATE=...` overrides) and no longer assume the old flow. Repaired: the install notice covered the start screen's language switch (every `seedStorage` now dismisses it), the player places the victim too, the victim card is found by `.polaroid--victim[data-selected]`, the unsolved screen has no "Ends at" line, About has six sections, the Share panel's Copy button reads "Kopiëren", Options/Help sit directly in the header from 641px, and the header is two rows in a short landscape column. A driver that hard-codes a date or a month breaks when `PLAY_DATE` moves: derive it from `DAY`.
- When running drivers, start the preview server on a port nobody else uses: port 5231 was another worker's dev server and silently served its code.

## This session

Overnight, 2026-09-28 into 2026-09-29. Claude Code, model **Claude Sonnet 5** (`claude-sonnet-5`).
Scope: a production-readiness pass (README/About/secrets scan), SLAY-6.1 (play-screen header),
SLAY-8.1 (delivery-van-in-a-bedroom content fix), SLAY-8.2 (toolbar Place button back, labels
return on wider screens, direct Legend icon), SLAY-8.4 (PostHog play counters, replacing the
Vercel KV/Redis design), and backlog cleanup (epics closed out). Merged as PRs #46-#51 to `main`,
squash merges throughout.

## THE ONE OPEN DECISION blocking public launch

Two conflicting instructions were given in the same overnight session and never reconciled by the
owner before the session ended:

- Earlier: *"Je mag het aanzetten. Ik verdien er geen geld mee dus maak mij geen zorgen over
  juridisch risico."* (go public + turn on indexing now, don't worry about legal risk) and
  *"Vervangen"* (replace `tutorial.fixture.ts`, see below).
- Later, the same night: *"Do NOT flip the repo to public or turn on search-engine indexing —
  those wait for the owner's trademark/name check and the tutorial.fixture.ts decision, both
  still unresolved."*

Nothing was flipped public because of this conflict. **Ask the owner directly which one is
current** before running step 11 of `docs/launch.md` (`gh repo edit ... --visibility public`) or
the indexing switch.

## `tutorial.fixture.ts` (a deviation from a direct "Vervangen" instruction)

Attempted a full replacement of `src/engine/model/tutorial.fixture.ts` with an original puzzle;
it broke 126 tests across 31 files, because many tests assert exact geometry/label-wrap outcomes
tied to this fixture's specific values (e.g. "Large Bedroom" being long enough to wrap over two
lines), not just its shape. Reverted the fixture to its original content and disclosed the
transcription in README's Credit section instead: *"...the small 4x4 walkthrough puzzle used in
tests (`src/engine/model/tutorial.fixture.ts`) is a structural transcription (layout and solution
only, no art or text) of the public tutorial example on murdokus.nl."* A careful future story
could still do a real replacement, by auditing each dependent test's actual intent first rather
than swapping values blind.

## Content bug found and code-fixed; 5 already-live days still need an owner decision

SLAY-8.1 added a general `RoomType`/`excludeRoomTypes` mechanism (`src/content/themes/types.ts`,
`src/engine/scenegen/objects.ts`): a vehicle can never be placed in a room tagged `'sleeping'`.
The code fix is merged and covers every future day the schedule generator makes. But the
**already-committed** schedule (`src/content/schedule/*.json`) still has 5 real instances of the
old bug (a vehicle decoratively placed in a bedroom-type room):

- **2026-09-28 (day #2)** — already played
- **2026-10-08 (day #12), 2026-10-24 (day #28), 2026-11-07 (day #42), 2027-01-11 (day #107)** —
  not yet played

None were regenerated. Regenerating day 2 alone was tested and it produces a **fully different
puzzle** — different clues, different solution mapping, different fingerprint — not a one-object
swap: removing a candidate from a room's pool shifts every later random draw in that scene. The
owner's call, not a safe default:

1. Leave all 5 as-is (cosmetic only — a decorative object in the wrong-themed room, not a
   solvability issue) and let normal schedule turnover retire them.
2. Regenerate just the 4 future days — nobody has seen them yet, essentially free.
3. Also regenerate day 2 — lower stakes since it is over, but it is still a real content change
   for an already-played day.

See `backlog task SLAY-8.1 --plain` for the exact mechanism and the full list.

## PostHog (SLAY-8.4, replaced the Vercel KV/Redis design)

- Project created by the owner directly (EU region, `eu.i.posthog.com`). The project key is
  hardcoded in `src/analytics/posthog.ts` — intentionally public/non-secret, same reasoning as
  `@vercel/analytics` needing no config at all.
- Configured for anonymous counts only: no autocapture, no automatic page views, no session
  recording, no person profiles, memory-only persistence (nothing written to a cookie or
  localStorage by PostHog itself).
- Lazy-loaded (dynamic `import()`), so it costs nothing in the main bundle for a visitor who
  never opens today's puzzle.
- The old design (`api/`, `tools/stats.ts`, `@upstash/redis`) was removed entirely.
- Alternatives considered and rejected by the owner: Vercel KV/Upstash via the Vercel Marketplace
  (didn't want a billing-adjacent database provisioned, even a free-tier one); Vercel Web
  Analytics custom events (confirmed via Vercel's own pricing docs that Custom Events need the
  paid Pro plan — only automatic page views are free on Hobby).

## Confirmed live and working (checked directly this session, not assumed)

- Vercel auto-deploys on push to `main` (`vercel inspect` showed a fresh Production deployment
  created within minutes of the last merge).
- Custom domain connected: `slaydoku.nl` and `www.slaydoku.nl` both alias the current production
  deployment.
- GitHub Actions: enabled, `can_approve_pull_request_reviews: true` already set (needed for the
  monthly schedule top-up PR to be mergeable).
- GitHub ruleset (branch protection) configured by the owner; confirmed via the API to be
  correctly inert while the repo is private (the API itself refuses to even read it, same
  "upgrade to Pro or make this repository public" error) — will activate the moment the repo
  goes public, no further action needed there.
- Vercel Web Analytics / Speed Insights: owner reports both enabled in the dashboard. The code
  side (`@vercel/analytics`, `@vercel/speed-insights` in `src/main.tsx`) has been wired in since
  the launch-cleanup PR (#47).

## Backlog state

All epics SLAY-1 through SLAY-7 are Done. **SLAY-8 is the only open epic.**

- **SLAY-8.3** (hint quality) — delivered on `SLAY-8.3/hint-derivation-trail`, PR open, pending
  merge and review by the owner. Root cause was exactly as diagnosed: only single-candidate
  placements got a derivation chain back to what the player had actually seen (`chainTo` in
  `src/game/knowledge.ts`); every elimination hint from scan/overload/intersect/victim-room and
  every hard/expert technique handed the player a technique's own bare, self-contained conclusion.
  Fix: `chainTo` generalised to take several subjects (not just one placed person) and to work for
  elimination steps too; `hints.ts`'s `deduction()` now also filters the *displayed* subject of an
  elimination hint to drop the victim and anybody already correctly placed (the "hints about
  someone already solved" bug report), while still letting the chain reference them as background
  derivation. **Deliberately did not touch which technique fires, when, or in what order** — only
  what an elimination hint's text says and who it names; `docs/solvability/README.md` gained a new
  section reasoning through why the tier table is unaffected. The existing "does not depend on
  what the player crossed out or noted" invariant (`hints.test.ts`) was verified to still hold
  (the chain is built from the deterministic solve trace, never from board marks/notes) and is
  untouched. A `bun run validate:generation` sweep across very-easy through expert on 6x6 and 9x9
  (36 cells, `--seeds 6`) passed every gate, including the hint audit — hard/expert puzzles are
  still fully hintable. Full diagnosis and design notes: `backlog task SLAY-8.3 --plain`.

## Exact commands once the go-public decision is made

```sh
# from a clean checkout of main
git fetch origin && git switch main && git merge --ff-only origin/main
bun run lint && bun run typecheck && bun run test --maxWorkers=1 && bun run build
gh repo edit dipsaus9/slaydoku --visibility public --accept-visibility-change-consequences
gh repo view dipsaus9/slaydoku --json visibility,url -q '.visibility + " " + .url'
```

Then the indexing switch (`docs/launch.md`, "Flipping it: one commit") as its own small PR, since
it changes committed files (`src/brand/site.json`, `vercel.json`). After going public: re-check
branch protection is actually enforcing (it was inert before), and run
`bun tools/check-share.ts https://slaydoku.vercel.app --indexable` once the indexing PR deploys.
