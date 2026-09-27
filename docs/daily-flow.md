# The daily flow

What a player sees, where it lives in the code and what it stores. Story SLAY-1.5; statistics (SLAY-1.6) and the share card (SLAY-1.7), both below, build on the results described here.

## Screens and URLs

| URL | Screen |
|---|---|
| `/` | Start screen: `Puzzle #N`, the UTC date, difficulty (Very easy, Easy, Easy-medium, Medium, Hard, Expert), grid size, **Play** (or **Continue** when a board is saved), and a live countdown to 00:00 UTC with the local time (`Ends at 00:00 UTC (02:00 your time)`). A solved day shows its result (time, hints, the murderer) instead of Play, and `Next puzzle in ...`. Before the launch date: `Slaydoku starts on 27 September` with a countdown. After the last scheduled day: `New puzzles are coming soon`. |
| `/play`, `/play/<n>` | The puzzle of the day on the existing play screen (hints, zoom, legend). `/play/<n>` only works for the day on screen (no archive). The How it works card opens by itself on the first Play. A solved day, an unscheduled day or another number goes back to `/`. |
| `/about` | About page, linked from the start screen footer. |
| anything else, old `/level/...` | Replaced by `/`. |

## Which day is it

The app trusts the device clock in UTC: no clock check, no server time. `src/schedule/today.ts` holds the pure part (UTC date of a reading, ms to the next midnight, the day of a date through the index and at most three month files). The month files are lazy chunks (`src/game/daily/source.ts`): a visit fetches the month of the day on screen, and falls back to the neighbouring month across a boundary. Offline, the service worker has every month chunk in its precache.

**Midnight while the page is open.** The day on screen is kept. A `New puzzle available` notice with a `Show puzzle #N+1` button appears (on the start screen and over the puzzle). A player in the middle of a puzzle keeps playing it (the notice can be hidden); when they leave it, the start screen shows the ended day and the same button. The button loads the new day. Nothing of the earlier day is touched: its board save and its result stay.

## The date override (dev and tests only)

`?date=2026-09-30` (noon UTC of that day) or `?date=2026-09-30T23:59:50` (that UTC moment, then the clock runs on) sets the clock. The value is copied into localStorage (`slaydoku:dev-date`) so reloads and clean-URL navigation keep it; `?date=off` removes it. It works only in `bun run dev` or when the page host is `localhost` (a production build served by `vite preview` counts); on any other host both the URL parameter and the key are ignored (`src/game/daily/clock.ts`, tested in `clock.test.ts`, and checked in `docs/verification/drive.ts` on the host `[::1]`). Scheduled dates: 2026-09-27 to 2027-01-24.

## What is stored (localStorage)

| Key | What |
|---|---|
| `slaydoku:game:daily-<n>` | Board, notes and clock of puzzle number `n`, with the puzzle fingerprint (a save of another puzzle is ignored). |
| `slaydoku:daily-results` | `{ "version": 1, "results": { "<n>": DailyResult } }`. |
| `slaydoku:telemetry` | Local play sessions (hints and failed checks are summed from it when a day is solved). |
| `slaydoku:help-seen`, `slaydoku:game-options` | The help card and the options, global. |

Every read and write is in try/catch: a missing, full or blocked store reads as empty and play goes on.

### The results API (`src/game/daily/results.ts`)

```ts
interface DailyResult { n: number; date: string; tier?: TierId; fp: string; elapsedMs: number; hints: number; wrongChecks: number; murdererId: string }
recordResult(storage, result): boolean      // the first result of a day stays; false when it already exists or the write failed
readResult(storage, n, fp?): DailyResult | null
readAllResults(storage): DailyResult[]      // oldest puzzle first
```

`hints` is how many times a hint was opened (all sessions of the day), `wrongChecks` how many times a complete board was not right. A solved day cannot be replayed for a new time. `dayStatus(storage, day)` (`src/game/daily/status.ts`) says new, in progress or solved. The start screen has two reserved slots (`data-slot="share"`, `data-slot="stats"`; props `share` and `stats` of `StartScreen` and `DailyFlow`) for the share card (filled by `SharePanel`, see Share card below) and the statistics (filled by `StatsEntry`, see Statistics below).

## Statistics (SLAY-1.6)

`src/game/stats/` computes the numbers, `src/ui/stats/` shows them. Everything stays on the device: the numbers are read from the results and play records above, nothing is fetched or sent.

**Where.** The start screen's `stats` slot shows `Streak 5 · Best 12` and a **Stats** button (`StatsEntry`, filled by `DailyFlow` unless a `stats` prop replaces it). The slot is there on every state of the start screen, so it is also there after a solve (a solved day goes straight back to `/`). The button opens the Stats card, a modal: Escape, its Close button or a tap on the backdrop close it and the focus goes back to the Stats button; Tab stays inside it; the card scrolls inside itself.

**What it shows.** Played (started), solved, solve rate, current streak, best streak, hints used (total) and hints per solved puzzle, and a bar list of best and median time per difficulty (tiers with a solved puzzle only, easiest first; the bar is the median, the darker mark the best time).

**Rules** (`compute.ts`, pure, tested):
- *Played* is every solved day plus every day with a play record (`slaydoku:telemetry`, `puzzleId` `daily-<n>`, written from the first move) that was not solved. It is never lower than solved. Play records are capped at 500 sessions on the device, so very old unsolved days may drop out of *played*; solved days never do.
- *Streak.* A result belongs to the UTC date of its own puzzle, not to the moment it was solved, so a day solved the next morning counts for its own day (a solved day cannot be replayed anyway). The current streak is the run of consecutive solved dates ending at the latest solved date, and it is alive only while that date is today or yesterday UTC; a missed day resets it. The best streak is the longest run ever (month, year and leap-day boundaries are plain calendar days: `src/schedule/dates.ts`).
- *Times.* Best is the fastest, median the middle time (the mean of the two middle ones, rounded to a ms, for an even count). The tier of a result is stored with it (`DailyResult.tier`, new in SLAY-1.6); results stored before that have no tier and count everywhere except in the times per difficulty.
- *Hints per puzzle* is total hints over solved puzzles. Results that are unusable (no real date, a bad number or time) are ignored; when two results share a number, the first one is used.
- Statistics depend only on stored results, never on the schedule, so extending the schedule changes nothing.

**Reset stats** asks for confirmation ("This deletes your solved puzzles, times and streaks from this device, and the saved boards of the puzzles you played. Those days show as new again. It cannot be undone."). It removes `slaydoku:daily-results`, the play records of the daily puzzles and the saved boards (`slaydoku:game:daily-<n>`) of every daily puzzle that was played or solved: without the boards, a solved board would bring its result straight back (see `dayStatus`). Nothing else is touched: options, the how-it-works flag, play records of other puzzles and the dev date override stay. A solved day therefore becomes playable again after a reset. All strings live in `src/ui/stats/strings.ts`.

## Share card (SLAY-1.7)

`src/share/` builds what is shared (pure, tested), `src/ui/share/` shows and sends it. English only, light theme, everything is made on the device: the card is an SVG drawn from text and shapes with system fonts, turned into a PNG on a canvas in the page. No network call, no dependency, so it works offline. Nothing leaves the device except through the player's own action (the system share sheet, the clipboard, a saved file).

**Where.** After a solve the app goes back to `/`, so the card is the `share` slot of the start screen (`SharePanel`, filled by `DailyFlow` unless a `share` prop replaces it; the slot stays empty on a day that is not solved). The result overlay of the play screen has the same slot (`ResultOverlay`'s `share`, fed by `PlayScreen`'s `resultShare`); in the daily flow the overlay is left at once for the start screen, so the start screen is where the card is seen.

**The panel.** A preview of the card, two shapes (Wide 1200x630, Square 1080x1080; the PNG is drawn at exactly that size), the text that will be shared, and:
- **Share** when the browser has `navigator.share`: the PNG together with the text when `navigator.canShare({ files })` says yes, else the text alone. The PNG of the shape on screen is made in advance so the share starts inside the tap. Closing the share sheet is not an error. If sharing fails, the message says so and Copy text and Download image appear.
- **Copy text** and **Download image** when there is no share sheet. Copy uses the clipboard API and falls back to a textarea with `execCommand('copy')`. Download saves `slaydoku-<n>.png` (`-square` for the square).
- A polite status line: Shared., Copied to your clipboard., Image saved to your device., or what went wrong.

**The text.**

```
Slaydoku #43 · Medium · 9x9
⏱ 04:12 · 💡 2 hints
🟦🟦🟦🟦🟦🟦🟦🟨🟨
slaydoku.vercel.app
```

Time is `mm:ss` (`h:mm:ss` from an hour), hints read `no hints`, `1 hint`, `2 hints`. The **strip** has one square per suspect (6 to 12): blue for a person placed on your own, yellow for each hint opened, red for each time a full board was checked and was not right, in that order (blue first; more than the board holds are cut off, hints first). It says how the solve went and nothing about the puzzle: it depends only on the board size and the two counts, never on the solution, the names or the clues (the order in which people were placed is not stored, so a per-move strip is not possible). The card carries the same facts (wordmark, puzzle number, date, difficulty pill, big time, hints, the strip with a small legend, the site) in the brand colours.

**No spoilers.** Both builders take a `DailyResult` and the tier and size of the day and never see the puzzle. `src/share/share.test.ts` scans the text and both cards of a spread of scheduled days for every suspect name, every rendered clue text, the fingerprint and every solution cell.

**The site line** comes from one constant, `SITE_URL` (`src/share/site.ts`): the origin the build was made for (`VERCEL_PROJECT_PRODUCTION_URL`, then `VERCEL_URL`, else `http://localhost:5173`, the same `resolveSiteUrl` the social meta tags use), put in by `define` in `vite.config.ts`. The text and the card show its host. A build outside Vercel therefore says `localhost:5173`.

## Verifying

`bun run verify:phone` (see `docs/verification/phone.ts`): the drivers run on the date override at 390x844 and 1024x768 among others: the statistics (`stats.ts`: two consecutive days solved through the UI, the streak, the card, a missed day, Reset), start screen states, rollover with a shifted clock, clean URLs, a full play-through and the result, zoom, legend, the card text of 10 scheduled days on the rendered screen, the share card (`share.ts`: a solved day, the text, both PNG sizes on a canvas, Share with files and with text only, a closed and a failing share sheet, Copy text with and without the clipboard API, Download image, the keyboard, offline), offline.
