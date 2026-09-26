/*
 * The service worker (CAD-10.6). `vite build` bundles this file into `dist/sw.js` after the app, and fills
 * `__PRECACHE__` with the list of every file of that build (see `swPlugin` in vite.config.ts). It is not part
 * of the app bundle and is never loaded in `bun run dev`.
 *
 * - install: fetches every file of the build into one cache named after the build version. One failed
 *   file fails the install, so a half-filled cache never goes live and the old worker keeps serving.
 * - no skipWaiting on its own: a new worker waits until the player chooses "Reload" (the page
 *   sends SKIP_WAITING). Taking over on its own would swap the files under a page that is running the
 *   old build (its lazy pack chunks would be gone from the cache).
 * - activate: deletes the caches of older builds and claims the open page (`clients.claim`), which is what
 *   makes the very first visit work offline without a second load.
 * - fetch: see `routeRequest`.
 */
import { SHELL_URL, SKIP_WAITING_MESSAGE, cacheName, pathOf, precacheVersion, precachedPaths, routeRequest, staleCacheNames } from './cache.ts'
import type { PrecacheEntry } from './cache.ts'

declare const __PRECACHE__: readonly PrecacheEntry[]

interface WorkerEvent extends Event {
  waitUntil(promise: Promise<unknown>): void
}
interface WorkerFetchEvent extends WorkerEvent {
  readonly request: Request
  respondWith(response: Promise<Response> | Response): void
}
interface WorkerMessageEvent extends WorkerEvent {
  readonly data: unknown
}
interface WorkerScope {
  readonly location: Location
  readonly clients: { claim(): Promise<void> }
  skipWaiting(): Promise<void>
  addEventListener(type: 'install' | 'activate', listener: (event: WorkerEvent) => void): void
  addEventListener(type: 'fetch', listener: (event: WorkerFetchEvent) => void): void
  addEventListener(type: 'message', listener: (event: WorkerMessageEvent) => void): void
}

const scope = self as unknown as WorkerScope
const entries = __PRECACHE__
const CURRENT = cacheName(precacheVersion(entries))
const known = precachedPaths(entries)

async function precacheAll(): Promise<void> {
  const cache = await caches.open(CURRENT)
  try {
    await Promise.all(
      entries.map(async (entry) => {
        // `reload`: skip the HTTP cache, a file must come from this deploy.
        const response = await fetch(new Request(entry.url, { cache: 'reload' }))
        if (!response.ok) throw new Error(`${entry.url}: ${response.status}`)
        await cache.put(entry.url, response)
      }),
    )
  } catch (error) {
    await caches.delete(CURRENT)
    throw error
  }
}

async function dropOldCaches(): Promise<void> {
  const stale = staleCacheNames(await caches.keys(), CURRENT)
  await Promise.all(stale.map((name) => caches.delete(name)))
  await scope.clients.claim()
}

scope.addEventListener('install', (event) => event.waitUntil(precacheAll()))
scope.addEventListener('activate', (event) => event.waitUntil(dropOldCaches()))

scope.addEventListener('message', (event) => {
  const data = event.data as { type?: unknown } | null
  if (data?.type === SKIP_WAITING_MESSAGE) void scope.skipWaiting()
})

scope.addEventListener('fetch', (event) => {
  const { request } = event
  const kind = routeRequest(request, scope.location.origin, known)
  if (kind === 'network') return
  const key = kind === 'shell' ? SHELL_URL : pathOf(request.url)
  event.respondWith(caches.match(key, { cacheName: CURRENT }).then((hit) => hit ?? fetch(request)))
})
