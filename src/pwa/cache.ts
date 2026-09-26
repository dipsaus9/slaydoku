/*
 * Pure parts of the offline support (CAD-10.6): the precache list, the cache name that is tied to the
 * build, the cleanup of caches from older builds and the decision what the service worker does with a
 * request. No browser or node globals, so the worker (sw.ts), the build plugin (vite.config.ts) and the
 * tests all share one definition. The moving parts are described in README.md next to this file.
 */

/** One file in the precache. `revision` is a hash of the file content, so an edited file always changes the build version. */
export interface PrecacheEntry {
  /** Absolute path on the site, e.g. `/assets/index-abc123.js`. */
  url: string
  revision: string
}

/** The HTML shell every navigation is answered with: the app decides from the path which screen to show. */
export const SHELL_URL = '/index.html'

/** All caches this app makes start with this, so cleanup never touches a cache of something else on the same origin. */
export const CACHE_PREFIX = 'slaydoku-precache-'

/** Message the page sends to a waiting worker when the player chooses to reload into the new version. */
export const SKIP_WAITING_MESSAGE = 'SKIP_WAITING'

/** cyrb53: a small, well-spread 53-bit string hash. It only has to notice change, not resist an attacker. */
function hash53(text: string): number {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ code, 2654435761)
    h2 = Math.imul(h2 ^ code, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

/** Text to a 14 digit hex string. Same text, same string. */
export function hashText(text: string): string {
  return hash53(text).toString(16).padStart(14, '0')
}

/**
 * The version of a build: a hash over every file and its content revision, independent of the order of
 * the list. A changed, added or removed file gives a different version; the same output gives the same one.
 */
export function precacheVersion(entries: readonly PrecacheEntry[]): string {
  const lines = entries.map((entry) => `${entry.url}@${entry.revision}`).sort()
  return hashText(lines.join('\n'))
}

/** Name of the cache that holds one build. Built once per version, so two builds never share a cache and never mix files. */
export function cacheName(version: string): string {
  return `${CACHE_PREFIX}${version}`
}

/** The caches of this app that belong to another build than `current`: the ones to delete when a new worker activates. */
export function staleCacheNames(existing: readonly string[], current: string): string[] {
  return existing.filter((name) => name.startsWith(CACHE_PREFIX) && name !== current)
}

/** Path of a URL without origin, query or hash. `/play?x=1#y` gives `/play`. */
export function pathOf(url: string): string {
  const cut = url.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*/i, '')
  return cut.replace(/[?#].*$/, '') || '/'
}

/** The paths that are in the precache, for `routeRequest`. */
export function precachedPaths(entries: readonly PrecacheEntry[]): Set<string> {
  return new Set(entries.map((entry) => entry.url))
}

export interface RequestInfo {
  method: string
  /** `Request.mode`; a page load is `navigate`. */
  mode: string
  url: string
}

/**
 * What the worker does with a request:
 *  - `shell`: answer with the cached index.html (a page load of any clean URL: `/`, `/play`, `/about`);
 *  - `precached`: answer from the cache (a build file);
 *  - `network`: not ours, leave it to the browser (other origins, non-GET, sw.js itself, anything not in the build).
 * A page load of a path with a file extension that is not in the build (`/robots.txt`, `/foo.png`) goes to the network,
 * so a missing file is not disguised as the app.
 */
export function routeRequest(request: RequestInfo, origin: string, precached: ReadonlySet<string>): 'shell' | 'precached' | 'network' {
  if (request.method !== 'GET') return 'network'
  if (!request.url.startsWith(`${origin}/`) && request.url !== origin) return 'network'
  const path = pathOf(request.url)
  if (precached.has(path)) return 'precached'
  if (request.mode === 'navigate' && !/\.[a-z0-9]+$/i.test(path)) return 'shell'
  return 'network'
}
