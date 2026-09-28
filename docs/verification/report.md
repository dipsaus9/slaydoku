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

## 2026-09-27 (later) — Launch date moved to today

Owner decision, chore branch `chore/launch-date-today` (not a backlog story): the games could start right away rather than wait for the placeholder `2026-10-12`. `LAUNCH_DATE` in `src/schedule/launch.ts` is now `2026-09-27`; the 120-day schedule was regenerated from that date (`bun run schedule --start 2026-09-27 --days 120 --launch 2026-09-27`, `2026-09-27` to `2027-01-24`, 0 fallbacks) and every place that named a date (`docs/daily-flow.md`, `docs/launch.md`, `docs/authoring/schedule.md`, the verification drivers' date-override constants) was updated to match.

Fixed along the way, all pre-existing test/driver assumptions that this move exposed rather than product defects:
- `tools/schedule.test.ts`: read the real committed schedule and hardcoded the old launch/window dates throughout — updated to the new ones.
- `src/schedule/pick.test.ts`: assumed the launch date is always a Monday (true of the old placeholder, not of every date the owner might pick); `weeks()` now buckets by the real UTC week (`weekStartOf`) instead of naive 7-day chunks from day 0, so a partial head or tail week is handled correctly for any launch weekday.
- `src/schedule/schedule.test.ts`: the tamper test poked `days[3]`/`days[4]` of the first committed month file, which only has 4 days now that the schedule starts a few days before month-end; moved to `days[0]`/`days[1]`.
- `src/ui/daily/daily.test.tsx`, `docs/verification/daily.ts`, `docs/verification/drive.ts`, `docs/verification/offline.ts`: the fixed dev-only date-override day (`PLAY_DATE`, "puzzle #4, hard 9x9") is now `2026-09-30` instead of `2026-10-15` — same puzzle number and difficulty, new calendar date and weekday text.
- `docs/verification/drive.ts`'s "how it works" scenario tapped a fixed board coordinate (`cellSel(1, 1)`) to test note-writing; the new puzzle at `2026-09-30` happens to have a piece of furniture there, so the tap landed on decoration instead of the board cell. Replaced with a solution cell (index 1, never the victim's), the same reliable pattern already used by the other scenarios in this file.

**Result after every fix: 2742 browser checks on six viewports, 0 failures, plus 1175 checks on the all-days sweep, 0 failures.** `bun run lint`, `typecheck`, `test --maxWorkers=1` (136 files, 2553 tests) and `build` are all green.

## 2026-09-28 — SLAY-3.6: verification in both languages, no regressions

Story SLAY-3.6, the last of epic SLAY-3 (Dutch and English, same puzzle, player-selectable — SLAY-3.1 through 3.5 all landed already), on branch `SLAY-3.6/dutch-verification`. Run on a machine whose own OS/Chrome language is Dutch — the exact condition SLAY-3.1's browser-language default (`browserLocale`) is sensitive to, and the reason this story exists.

**A new bounded Dutch smoke driver, `docs/verification/locale.ts`** (one representative viewport, 390x844, not a repeat of the full English suite): switches the language toggle from the start screen, then checks the app actually reads in Dutch — the start screen's puzzle number/difficulty/size/Play button, the toggle itself (reachable and correctly labelled in both languages, choice persists across reload), a played day's clue cards (checked against `renderClue(..., 'nl')`, the exact pure function the cards call — not a guess at wording), a hint (checked against `getHint(..., 'nl')`'s own text), the toolbar's More sheet, Stats, About and a solved day's Share panel. **21 checks, 0 failures.**

**Two regressions found and fixed, both real product/tooling gaps this driver exists to catch, not restyle-story fixes:**

1. **Hints never actually localised (src/game/hints.ts, store.ts, src/ui/play/PlayScreen.tsx — SLAY-3.3's own files, outside this story's docs/verification/ References, fixed here per its own implementation plan: "fix any regression found, in the owning story's files if outside this story's own References").** SLAY-3.3 built the Dutch hint machinery (`hintText.nl.ts`, `focusHint`/`stepHint` with a `locale` parameter) but never wired the player's chosen locale through to it: `game/hints.ts`'s `getHint`/`hintFor`/`nextStep`/`deduction` had no `locale` parameter at all (so `solveHuman`'s own `options.locale` was always the default `'en'`, and `step.explanation` stayed English too), `GameStore.hint()` took only a level, and `PlayScreen.tsx` never read `useLocale()` to give it one. Every hint rendered in English regardless of the app's language. Fixed by threading `locale` the whole way down (each new parameter defaults to `'en'`, so every existing call site — tests included — keeps working unchanged) and having `PlayScreen.tsx` call `store.hint(hintLevel, locale)`. Confirmed with `getHint(puzzle, state, 1, 'nl')` computed independently and matched byte-for-byte against the rendered `.play-hint__text`.
2. **Three verification drivers never pinned locale to `'en'` (docs/verification/stats.ts, share.ts, offline.ts).** `drive.ts`, `zoom.ts`, `legend.ts` and `screens.ts` already carry this fix (SLAY-3.2, widened by SLAY-4.2 for the toolbar's More menu): without it, a Dutch browser language makes SLAY-3.1's browser-default logic load the app in Dutch and breaks every hardcoded English-text assertion. `stats.ts` and `share.ts` called `seedStorage(date, true)` without the third `locale` argument; `offline.ts` never calls `seedStorage` at all (it copies its date override through a `?date=` query param instead) and had no locale pin whatsoever. Fixed `stats.ts`/`share.ts` the same way as the other drivers, and gave `offline.ts` a `Page.addScriptToEvaluateOnNewDocument` that sets the locale key on every document load (before the app's own script runs), since that file reloads the page many times through the offline/update story and needed the pin to survive every one of them, not just the first.

**Result after both fixes: `bun run verify:phone` (English, default locale, 390x844) is 471 checks, 0 failures** (drive 111, zoom 43, legend 121, screens 106, stats 28, share 27, offline 35) — before the fix, stats/share/offline showed 27 failures total, every one of them Dutch text where English was asserted. `bun run lint`, `typecheck`, `test --maxWorkers=1` (138 files, 2866 tests) and `build` are all green.

## 2026-09-28 — SLAY-5.1: toolbar v2 (icon-only, six controls), no regressions

Story SLAY-5.1, epic SLAY-5, on branch `SLAY-5.1/toolbar-v2-icon-only`. The toolbar drops to six icon-only controls (Note, X, Erase, Undo, Hint, Zoom, the same set on every viewport), Place is gone (long-press already placed in every other mode), Redo moves behind a long press on Undo (the same tap-selects/long-press-clears-all machine the Erase button already used), and Options, Help and Legend move out of the toolbar into one small settings icon in the play-screen header, next to the timer.

**`bun run verify:phone` (English, all six viewports): 2826 checks, 0 failures** (drive 111, zoom 43, legend 121, screens 106, stats 28, share 27, offline 35 — the same seven-suite, 471-per-viewport shape SLAY-3.6 established; check counts are unchanged from before this story because the toolbar rewrite only changed how a control is found — by its `aria-label` now that it carries no visible text, instead of by a `.play-tool__label` span — never how many checks each scenario makes). `docs/verification/locale.ts` (the SLAY-3.6 Dutch smoke driver), run on all six viewports rather than its usual one: **21 checks per viewport, 0 failures, 126 total** — the header's settings sheet still reads "Opties, Help, Legenda" from every viewport.

No product regression found. Every driver that finds a toolbar control by label (`drive.ts`, `zoom.ts`, `legend.ts`, `screens.ts`, `locale.ts`) was updated in this story's own files (all declared References): the shared `tool()`/`toolRect()` helper in each now matches an element's visible `.play-tool__label` text *or* its `aria-label`, so it keeps working for both the toolbar's new icon-only controls and the header sheet's still-labelled Options/Help/Legend items unchanged. `drive.ts` gained a `toolHold()` helper (a long press instead of a tap) for the two scenarios that used to tap a dedicated Redo button. `legend.ts`'s "nine toolbar buttons, More last" check became "six toolbar buttons, Note through Zoom, none with a visible label". The Eraser and Undo buttons both needed the `play-tool--hold` marker class `drive.ts` used to find the eraser by; split into `play-tool--erase` and `play-tool--undo` so the two are no longer ambiguous under one selector.

`bun run lint`, `typecheck` and `test` (138 files, 2867 tests, only `intent.test.ts`, `Toolbar.test.tsx` and `PlayScreen.test.tsx` touched for the new shape) are all green.

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
| Countdown and local time (`Ends at 00:00 UTC (HH:MM Amsterdam time)`) | drive |
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
- [ ] `Ends in` counts down live, and `Ends at 00:00 UTC (HH:MM Amsterdam time)` shows the same Amsterdam time for every player, not each visitor's own device time (owner decision, 2026-09-27).
- [ ] After solving: `Next puzzle in` and `New puzzle at 00:00 UTC (...)`.
- [ ] Before the launch date: `Slaydoku starts on 27 September` and `Starts at 00:00 UTC (...)`. (Moot for now: the launch date is already today.)
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
