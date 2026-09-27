# Offline support (CAD-10.6)

After one visit the game runs without internet. A service worker keeps the whole build in a cache and answers page loads and files from it. A new deploy is picked up on the next visit, and the player decides when to switch to it.

## Choice: a small hand-written worker, not vite-plugin-pwa / workbox

| | hand-written (chosen) | vite-plugin-pwa + workbox |
|---|---|---|
| Worker size | `dist/sw.js` 4.4 KB, file list included | about 15-20 KB of workbox runtime, plus the generated list |
| Page side | 1.6 KB in the app bundle (`main` chunk 481.25 -> 482.82 KB, gzip +0.6 KB) | a virtual register module and its own update logic |
| Dependencies | none | the plugin and the workbox-* packages with their own dependency tree, and a peer range that has to follow Vite (here Vite 8) |
| Fit | one strategy: precache everything, versioned by build | many strategies we would not use |

The game has one strategy (everything is in the build, nothing is fetched from elsewhere), so the worker is about 60 lines and the pure decisions (cache name, version, cleanup, request routing, update flow) are plain functions with unit tests. The worker source is `sw.ts`; `swPlugin` in `vite.config.ts` bundles it into `dist/sw.js` after every production build and embeds the file list.

## What is cached: precache everything, no runtime caching

Every file of the build goes into the cache at install: `index.html`, the hashed `/assets/*` (main JS, CSS, any lazily loaded chunks, the schedule month chunks `/assets/<YYYY-MM>-<hash>.js` included), the manifest, the icons and favicons. Not cached: `sw.js` itself, `robots.txt`, `sitemap.xml` and `og-image.png` (only crawlers read them). The About page (`/about`) is a clean URL like `/`: the cached `index.html` answers it, so it works offline.

Why precache all instead of caching a file the first time it is used: offline play should not depend on what was opened before. A runtime cache-first would leave everything that was never opened unplayable offline. It also keeps files that belong together (an index and the data files it lists) in one cache from one build.

The schedule (SLAY-1.5): the app loads only the month file that holds the day on screen (a dynamic import per month, chunked by Vite; the small `index.json` is in the main bundle), so a normal visit fetches one month chunk. The worker still precaches every month chunk of the build, so any scheduled day is playable offline after the first visit. `docs/verification/offline.ts` checks both: the page fetches one month chunk, the precache holds all of them.

The build fails when the precache goes over 6 MiB raw (`PRECACHE_BUDGET_BYTES` in `vite.config.ts`; it was 3 MiB until the schedule came, about 1.2 MiB used at 120 days). Every month chunk is about 45 KB per week of schedule, so a 90 day top-up adds about 0.5 MiB; raise the budget on purpose when the schedule grows, or stop precaching months that are already past. The download happens once in the background after the first load, and again (for a new build) only when the site changes.

## Cache versioning

`vite.config.ts` lists every file of the output with a hash of its content; `precacheVersion` (in `cache.ts`) hashes that list (order does not matter) into the build version, and the cache is named `slaydoku-precache-<version>`. Consequences:

- A changed, added or removed file changes the version, and `sw.js` (which contains the list) changes byte for byte, which is what makes the browser install a new worker. An unchanged build gives an identical `sw.js` and nothing happens.
- Each build has its own cache. Files of two builds never mix.
- Install is all or nothing: one failed fetch fails the install, the half-filled cache is deleted and the old worker keeps serving.
- On activate the worker deletes every `slaydoku-precache-*` cache that is not its own. Caches of other names are never touched.
- Files are fetched with `cache: 'reload'` so the HTTP cache cannot hand the new worker a file of the old deploy.

## Request handling (`routeRequest`)

- A page load of any clean URL (`/`, `/play`, `/play/<n>`, `/about`, any unknown path) is answered with the cached `index.html`, exactly like the catch-all rewrite in `vercel.json`. The app decides from the path what to show.
- A file of the build is answered from the cache. A page load of a path with a file extension that is not in the build (`/robots.txt`) goes to the network, so a missing file is not disguised as the app.
- Everything else (other origins, non-GET, `/sw.js`) is left to the browser.

## Update: skipWaiting and clients.claim

- **No automatic `skipWaiting()`.** A new worker installs (fills its cache) and then waits. Taking over by itself would swap the files under a page that is running the old build: its lazily loaded chunks (`/assets/<name>-<oldhash>.js`) would no longer be in the cache or on the server. The new worker is asked to take over (`postMessage({ type: 'SKIP_WAITING' })`) only when the player presses "Reload".
- **`clients.claim()` on activate.** The very first install claims the open page, so it works offline without a second load. On an update it makes the new worker control the page that pressed the button; the page then reloads once (`controllerchange`, only when the player asked; the first claim never reloads).
- **The notice** (`UpdateNotice`, `updater.ts`): shown when a new worker is waiting and an older one controls the page. Text: "New version available", button "Reload". A first install never shows it (the page is already the newest build). Until the button is pressed the page keeps running the old build completely from its own cache: nothing changes under the player.
- **When it appears:** the browser checks `sw.js` on every page load (the next visit), and the app also asks again whenever the tab or home-screen app becomes visible, so an app that stays open for days finds a new build. Vercel serves `sw.js` with `Cache-Control: no-cache` (`vercel.json`) so that check is never answered from an HTTP cache; `index.html` is no-cache too.
- **Saves are never touched.** The worker only reads and writes its own `slaydoku-precache-*` caches. Board saves, progress and options live in `localStorage`, which a service worker cannot reach and which no update code touches. An update also does not delete anything from it. `docs/verification/offline.ts` checks this byte for byte.

## Where the worker is registered

Only in the production build: `startOfflineSupport` checks `import.meta.env.PROD`. `bun run dev` (and so the lab, which only exists there) never registers a worker, so edits are never hidden behind a cached shell. `sw.js` is not built in dev either.

While the site is not indexable (`src/brand/site.json`, see `docs/launch.md`), `sw.js` carries the same `X-Robots-Tag: noindex,nofollow` header as every file. That only keeps search engines out; it does not stop a browser from registering the worker, and `robots.txt` does not apply to service worker registration either.

## Verifying

- Unit tests: `cache.test.ts` (version, names, cleanup, routing), `updater.test.ts` (update flow with fake registrations), `pwa.test.tsx` (notice text, production-only registration).
- `bun tools/check-share.ts <url>` also checks `/sw.js`: status 200, a JavaScript content type (not the SPA shell), a revalidating `Cache-Control`.
- `bun docs/verification/offline.ts` (headless Chrome, needs Chrome): builds and serves the site, waits for the worker to control the page, goes offline with `Network.emulateNetworkConditions`, reloads on `/`, `/play` and `/about` (today's puzzle through the date override), plays the puzzle, then simulates a new deploy and checks the notice, the reload into the new build, the removal of the old cache and that `localStorage` is identical.
- On a real iPad after a deploy: open the site, wait a few seconds, switch on flight mode, open the home-screen app. See `docs/verification`.
