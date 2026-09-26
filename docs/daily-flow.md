# The daily flow

What a player sees, where it lives in the code and what it stores. Story SLAY-1.5; statistics (SLAY-1.6) and the share card (SLAY-1.7) build on the results described here.

## Screens and URLs

| URL | Screen |
|---|---|
| `/` | Start screen: `Puzzle #N`, the UTC date, difficulty (Very easy, Easy, Easy-medium, Medium, Hard, Expert), grid size, **Play** (or **Continue** when a board is saved), and a live countdown to 00:00 UTC with the local time (`Ends at 00:00 UTC (02:00 your time)`). A solved day shows its result (time, hints, the murderer) instead of Play, and `Next puzzle in ...`. Before the launch date: `Slaydoku starts on 12 October` with a countdown. After the last scheduled day: `New puzzles are coming soon`. |
| `/play`, `/play/<n>` | The puzzle of the day on the existing play screen (hints, zoom, legend). `/play/<n>` only works for the day on screen (no archive). The How it works card opens by itself on the first Play. A solved day, an unscheduled day or another number goes back to `/`. |
| `/about` | About page, linked from the start screen footer. |
| anything else, old `/level/...` | Replaced by `/`. |

## Which day is it

The app trusts the device clock in UTC: no clock check, no server time. `src/schedule/today.ts` holds the pure part (UTC date of a reading, ms to the next midnight, the day of a date through the index and at most three month files). The month files are lazy chunks (`src/game/daily/source.ts`): a visit fetches the month of the day on screen, and falls back to the neighbouring month across a boundary. Offline, the service worker has every month chunk in its precache.

**Midnight while the page is open.** The day on screen is kept. A `New puzzle available` notice with a `Show puzzle #N+1` button appears (on the start screen and over the puzzle). A player in the middle of a puzzle keeps playing it (the notice can be hidden); when they leave it, the start screen shows the ended day and the same button. The button loads the new day. Nothing of the earlier day is touched: its board save and its result stay.

## The date override (dev and tests only)

`?date=2026-10-15` (noon UTC of that day) or `?date=2026-10-15T23:59:50` (that UTC moment, then the clock runs on) sets the clock. The value is copied into localStorage (`slaydoku:dev-date`) so reloads and clean-URL navigation keep it; `?date=off` removes it. It works only in `bun run dev` or when the page host is `localhost` (a production build served by `vite preview` counts); on any other host both the URL parameter and the key are ignored (`src/game/daily/clock.ts`, tested in `clock.test.ts`, and checked in `docs/verification/drive.ts` on the host `[::1]`). Scheduled dates: 2026-10-12 to 2027-02-08.

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
interface DailyResult { n: number; date: string; fp: string; elapsedMs: number; hints: number; wrongChecks: number; murdererId: string }
recordResult(storage, result): boolean      // the first result of a day stays; false when it already exists or the write failed
readResult(storage, n, fp?): DailyResult | null
readAllResults(storage): DailyResult[]      // oldest puzzle first
```

`hints` is how many times a hint was opened (all sessions of the day), `wrongChecks` how many times a complete board was not right. A solved day cannot be replayed for a new time. `dayStatus(storage, day)` (`src/game/daily/status.ts`) says new, in progress or solved. The start screen has two reserved slots (`data-slot="share"`, `data-slot="stats"`; props `share` and `stats` of `StartScreen` and `DailyFlow`) for the share button and the statistics.

## Verifying

`bun run verify:phone` (see `docs/verification/phone.ts`): the drivers run on the date override at 390x844 and 1024x768 among others: start screen states, rollover with a shifted clock, clean URLs, a full play-through and the result, zoom, legend, the card text of 10 scheduled days on the rendered screen, offline.
