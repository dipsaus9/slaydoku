# Handoff: where things stand

Read this first in a new session, before touching the go-public steps (`docs/launch.md`) or
regenerating any schedule content. It has the open decisions and recent history that git history
and the other docs alone don't make obvious. Update it (don't just append forever) whenever the
open items here get resolved.

## Simpshouse day 2026-10-14 (SLAY-18.4, awaiting owner approval)

The seasonal theme `simpshouse` (src/content/themes/simpshouse.ts, art in src/render/icons/themes/simpshouseArt.tsx) is registered and 2026-10-14 is regenerated as a 12x12 Simpshouse puzzle (only that day changed). Owner decisions applied: Iris repeats from 2026-10-13 (the pairwise gate allows one shared name next to a day with its own cast pool, `THEMED_DAY_SHARED_NAMES` in src/schedule/gates.ts); Pikachu plush is the only third-party name. Deviation from the approved preview: the glam vanity is now 2x1 and 3x1 (its engine type `desk` needs 2-3 cells). Screenshots: docs/verification/simpshouse-day/. Must be merged and deployed before 2026-10-14 UTC. `PLAY_DATE=2026-10-14` overrides the date the drivers play (default 2026-10-15); the drive suite is repaired again (SLAY-17.10).

## Preview deployments (SLAY-17.7)

Vercel builds `main` plus branches named `*/preview-*` (for example `SLAY-17.8/preview-look-poc`), so the owner can test on a phone; all other branches stay skipped (hobby deploy limit, one deploy per push). Rule: `ignoreCommand` in `vercel.json`, tested in `tools/vercel-ignore.test.ts`. Delete preview branches once the owner has decided. Owner decision 2026-10-08, recorded in CLAUDE.md.

## Object looks A2 and A3, preview only (SLAY-17.8)

Branch `SLAY-17.8/preview-look-poc`: Options has a Look entry (Now / A2 / A3) that shows only on localhost and preview hosts (`src/render/looks/look.ts`), default Now, so production behaviour is unchanged. The owner tests on a phone through the Vercel preview and picks one; until then the story stays In Progress and its last criterion is the owner's. Code in `src/render/looks/` (block models, projection, painter order), the diamond transform in `src/render/scene/geometry.ts` and `SceneView.tsx`, driver `docs/verification/looks.ts`, findings and tap sizes in `docs/design/looks.md`. After the pick: delete this branch and the losing look, move the winner into the real object art (SLAY-17.4), remove the Options entry or keep it behind the host check. Honest read: A3 is the prettiest but its cells are about half the area of a square cell on a phone (a 15 px high diamond on a 12x12 board at 360 wide), fine with the 2x pinch zoom.

## Depth look in the board objects (SLAY-16, checked in SLAY-16.9)

Objects on the board and in the legend are drawn with a screen-space SVG depth filter (rim light, inner shade, ground shadow; approved 2026-10-03 at depth 55/100). It lives in `src/render/icons/ObjectIcon.tsx`: `ICON_DEPTH_FILTER` (the constants), `IconDepthScope` (once per SVG that draws icons) and `IconDepthGroup` (wraps the art outside its orientation transform, so light stays top-left in all 8 orientations). Constants, drawing rules (rotation-safe detail only, feet at all four corners, nothing baked in) and the check results are in `docs/design/depth.md`; the check itself is `docs/verification/depth.ts`. Screenshots of the SLAY-16.9 run are outside the repo in `/private/tmp/claude-501/w-16.9/shots/` (regenerate with the driver).

Open items found by the SLAY-16.9 check, not fixed there (details in docs/design/depth.md):
- Legend swatches clipped the ground shadow: fixed in SLAY-16.10 (padded viewBox, see docs/design/depth.md).
- Room labels vs. the player's own marks (SLAY-17.5; the first reading of this story, objects under labels, was not the real problem): on the play board people, X marks and notes were drawn over the room name, so a room the player had filled in lost its label. Now the labels are drawn above marks and people with a paper-coloured halo and no pill (treatment B, chosen by the owner from a side-by-side comparison of four). Compared treatments and screenshots: `docs/design/label-treatments/`; the check is `docs/verification/labelshots.ts` (seeds a crowded board). The "Speelgoedafdeling" overlap with the bookshelf is not changed by this; the owner chose treatment B.
- Board shadow at the viewBox edge: fine (margin 12 against about 7). Performance: no task over 100 ms; the filter roughly doubles to triples raster time on software raster, see the design doc.
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
