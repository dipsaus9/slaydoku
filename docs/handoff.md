# Handoff: where things stand

Read this first in a new session, before touching the go-public steps (`docs/launch.md`) or
regenerating any schedule content. It has the open decisions and recent history that git history
and the other docs alone don't make obvious. Update it (don't just append forever) whenever the
open items here get resolved.

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

All epics SLAY-1 through SLAY-7 are Done. **SLAY-8 is the only open epic**, with one open story:

- **SLAY-8.3** (hint quality) — investigated and written up, **not implemented**. Root cause:
  `src/game/hints.ts`'s `deduction()` fallback reaches for the omniscient "advanced" solver
  regardless of the puzzle's actual difficulty tier, and only single-candidate hints get a proper
  derivation trail back to what the player has actually seen (`chainTo` in
  `src/game/knowledge.ts`). Flagged **medium-to-high risk**: this touches the core solvability
  guarantee, and `src/game/hints.test.ts` documents a deliberate existing invariant ("does not
  depend on what the player crossed out or noted") that a real fix needs to consciously
  reconsider, not silently break. Full diagnosis: `backlog task SLAY-8.3 --plain`.

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
