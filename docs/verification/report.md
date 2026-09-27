# Slaydoku: launch verification report

Story SLAY-1.10. Run 2026-09-27 on the production build of branch `SLAY-1.10/launch-verification` (main f7b72b4 plus the audit, launch checklist and About checks).

## Result

- **2736 browser checks on six viewports, 0 failures**, plus **1174 checks on all 120 scheduled days, 0 failures**.
- No product defect found. Changes in this story: the new About checks in the drive suite, the history scan in the audit tool (with tests), and the CI workflow (full checkout, allowed-identity variable).
- Not part of this run: the production check (see "Production check"); the history audit is discussed under "Other checks".

## 2026-09-27 — SLAY-2.7: warm evidence-board styling pass, no regressions

Story SLAY-2.7, on branch `SLAY-2.7/styling-verification` (origin/main 5939fa3, the tip after SLAY-2.1 through SLAY-2.6 — design tokens, and the start, play-chrome, cards, about/stats and share/OG restyles — had all landed).

**Result: 2736 browser checks on six viewports, 0 failures, plus 1174 checks on all 120 scheduled days (the all-days rendered-screen sweep), 0 failures.** `bun run lint`, `typecheck`, `test --maxWorkers=1` (136 files, 2553 tests) and `build` are all green.

Commands run (from the repo root, `OUT` outside the repo):

```sh
bun run verify:phone
ALL=1 SUITES=screens VIEWPORTS=390x844 bun run verify:phone
```

One regression found and fixed, in this story's own files (`docs/verification/`, its declared References — not a restyle-story fix): the `share` suite's `probeBlob` pixel sampler (`docs/verification/share.ts`) still tested the share card's panel for literal white (`>250,>250,>250`). SLAY-2.6 intentionally moved that panel from white to the warm evidence-board cream (`card.ts`'s `PANEL`, `#fdf8ec`) — by design, not a defect — so every `share` check that samples the panel failed across all six viewports (12 failures: 2 checks x 6 viewports; the brand-blue/`ACCENT` pixels were untouched and still matched). Fixed by sampling for `PANEL`'s exact tone instead, the same tolerance style already used for the blue/`ACCENT` check (commit `40dd53c`). Re-run after the fix: 0 failures.

No other regression: every other suite (drive, zoom, legend, screens, stats, offline) was green first try, on every viewport, both in this run and in the all-days sweep — the warm-token pass (SLAY-2.1–2.6) changed only colour, type and motion, never the DOM structure, board illustrations, room icons, portrait avatars, or drawn game logic these drivers probe.

Screenshots and logs: outside the repo (regenerate with the commands above); not archived by this story.

## How it was run

Commands, with `OUT` pointing outside the repo:

```sh
VIEWPORTS=360x640,390x844,430x932 bun run verify:phone
VIEWPORTS=844x390,1024x768,768x1024 bun run verify:phone
ALL=1 SUITES=screens VIEWPORTS=390x844 bun run verify:phone
```

The split into two runs was only for the tool time limit; the default `bun run verify:phone` does all six viewports in about 8 minutes. The runner builds the app, serves `dist/` with `vite preview`, and runs seven drivers in headless Chrome 152 with touch emulation. It uses the dev-only date override (works on localhost only) and a shifted clock for the midnight scenarios.

## Counts per viewport

Each of the six viewports (360x640, 390x844, 430x932, 844x390, 1024x768, 768x1024) ran the same 456 checks with 0 failures.

| Suite | Checks per viewport | Total over six viewports |
|---|---|---|
| drive | 111 | 666 |
| zoom | 43 | 258 |
| legend | 113 | 678 |
| screens | 99 | 594 |
| stats | 28 | 168 |
| share | 27 | 162 |
| offline | 35 | 210 |
| **all** | **456** | **2736** |

## What the suites cover

| Item | Where it is checked |
|---|---|
| Today's puzzle on the date override | drive |
| Countdown and local time (`Ends at 00:00 UTC (HH:MM your time)`) | drive |
| First-visit "How it works" card | drive |
| Play: note, undo/redo, X, place, hints 1 to 3, reload, rotation, clear-all, wrong board | drive |
| Solve, result, no replay of a solved day | drive |
| Board zoom (button, pinch, pan, clamping, one finger still notes and places) | zoom |
| Legend rows equal the objects drawn, tap a row to flash squares | legend |
| Every card text of every person on screen, every drawn object has a legend row | screens |
| Stats: streak across two days, alive the day after, reset after a missed day, Reset asks first | stats |
| Share: PNG 1200x630 and 1080x1080, Share with files and text-only, closed and failing sheet, Copy with and without the clipboard API, Download, offline | share |
| Offline reload of `/`, `/play` and `/about` | offline |
| Update notice: old version keeps running, "New version available" with Reload, cache swap, storage untouched | offline |
| Midnight rollover: "New puzzle available" / "Show puzzle #5", the player is not switched away, earlier board and result stay | drive |
| About page: content, layout, deep link, offline | drive, offline |
| Pre-launch ("Slaydoku starts on 12 October") and post-schedule ("New puzzles are coming soon") states, override refused on another host | drive |

## All-days rendered-screen check

`ALL=1 SUITES=screens VIEWPORTS=390x844` opens every one of the 120 scheduled days on the real page: 1174 checks, 0 failures. Every card text of every person is on screen (898 suspect cards), no line is cut off, every drawn object has a legend row, and door and window rows match what is drawn.

Mix of the 120 days: sizes 6x6 40, 7x7 4, 9x9 54, 12x12 22; tiers very-easy 14, easy 28, easy-medium 28, medium 24, hard 9, expert 17.

The default sample of 10 days (without `ALL=1`): 2026-10-27, 10-29, 11-06, 11-19, 12-01, 12-10, 12-12, 12-19, 2027-01-23 and 2027-01-24.

## Screenshots and logs

Stored outside the repo (74 JPEGs per viewport): a folder per suite and viewport, `<suite>-<viewport>/`, plus `run-1.txt`, `run-2.txt` and the all-days folder `slaydoku-all-days/`. Regenerate them with the commands above.

## Other checks

| Check | Result |
|---|---|
| `bun run lint` | clean |
| `bun run typecheck` | clean |
| `bun run test --maxWorkers=1` | 137 files, 2618 tests pass |
| `bun run build` | ok |
| `bun tools/check-share.ts` on a local preview (`--skip-headers`) | 61 checks pass |
| Personal-data audit, working tree | 0 hits |
| Personal-data audit, git history | see below |
| Secrets scan of tree and all revisions | 0 matches (command in `docs/launch.md`) |

History audit: the first run found 12 hits, all of rule `account`, all in GitHub's generated merge subjects ("Merge pull request #N from <owner account>/<branch>"). Nothing was found in any file version, file name, ref name or author field. The account name is public in the repository URL, so the audit now allows exactly that GitHub-generated merge-subject form for the `account` rule and keeps every other place strict. History was not rewritten.

## Production check

Not run by this story: nothing is deployed from the branch. After the merge, the orchestrator deploys the merged commit and runs the check from that commit, without `--skip-headers`:

```sh
bun tools/check-share.ts https://slaydoku.vercel.app
```

Expected: all checks pass in noindex mode. After the go-public switch (`docs/launch.md`, indexing step) run it again with `--indexable`. The Vercel project is not connected to GitHub yet (`docs/launch.md`, Vercel step), so until then a deploy is `vercel deploy --prod` by hand.

## Owner checklist

For a real phone and an iPad, in iOS Safari and Android Chrome, and again from the home-screen icon.

**Install and offline**
- [ ] Add to Home Screen. Icon and the name "Slaydoku" are right.
- [ ] Airplane mode: reopen from the icon, play, the move is kept, `/about` opens. Back online the board is still there.

**Layout**
- [ ] Rotate an open puzzle, portrait and landscape, on phone and iPad: board whole, nothing lost.
- [ ] Every card of every person is visible and the victim card is last. Try a larger system text size.

**Playing**
- [ ] Zoom: button, pinch, pan; one finger still notes, drags notes and long-press places.
- [ ] Notes, X, undo, redo.
- [ ] Hints 1 to 3: the squares they point at stay visible, also when zoomed; the hint count shows on the result.
- [ ] Fresh start (private tab or cleared site data): "How it works" opens on the first Play, does not reopen on the second visit, and the wording reads well.
- [ ] Solving returns to the start screen with Solved, time, hints and the murderer.

**The clock**
- [ ] `Ends in` counts down live, and `Ends at 00:00 UTC (HH:MM your time)` shows your real local time.
- [ ] After solving: `Next puzzle in` and `New puzzle at 00:00 UTC (...)`.
- [ ] Before the launch date: `Slaydoku starts on 12 October` and `Starts at 00:00 UTC (...)`.
- [ ] Midnight with the app open in launch week: `New puzzle available` and `Show puzzle #N`; a puzzle in progress is not switched away.

**Sharing**
- [ ] iOS Safari share sheet on iPhone and iPad: image and text; cancelling shows no error.
- [ ] Android Chrome share sheet (WhatsApp or Telegram).
- [ ] On a browser without a share sheet: Copy text says "Copied to your clipboard." and pastes four lines; Download image saves `slaydoku-N.png` (1200x630) and `slaydoku-N-square.png`.
- [ ] Link preview in a chat shows the Slaydoku image.
- [ ] No spoilers in the text or on the card.

**Stats**
- [ ] Two consecutive days give `Streak 2 · Best 2`; a skipped day resets the current streak; Reset asks first.

**After a deploy**
- [ ] With the installed app open, deploy to main, wait for Ready, reopen: `New version available` and `Reload`; board and stats are untouched; the notice is gone after Reload.

**About page and site**
- [ ] Tagline, How it works, the Murdoku credit, privacy, MIT, and a real contact line before going public.
- [ ] Tab titles read `Puzzle #N – Slaydoku` and `Slaydoku`; clean URLs; reload on `/play` works.
