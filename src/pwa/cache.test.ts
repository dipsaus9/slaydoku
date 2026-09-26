import { describe, expect, it } from 'vitest'
import { CACHE_PREFIX, SHELL_URL, cacheName, hashText, pathOf, precacheVersion, precachedPaths, routeRequest, staleCacheNames } from './cache.ts'
import type { PrecacheEntry } from './cache.ts'

const BUILD: PrecacheEntry[] = [
  { url: '/index.html', revision: 'aaaa' },
  { url: '/assets/index-abc.js', revision: 'bbbb' },
  { url: '/assets/12-easy-def.js', revision: 'cccc' },
  { url: '/manifest.webmanifest', revision: 'dddd' },
  { url: '/icon-192.png', revision: 'eeee' },
]

describe('precacheVersion', () => {
  it('is 14 hex digits and the same for the same build', () => {
    expect(precacheVersion(BUILD)).toMatch(/^[0-9a-f]{14}$/)
    expect(precacheVersion(structuredClone(BUILD))).toBe(precacheVersion(BUILD))
  })

  it('does not depend on the order of the list', () => {
    expect(precacheVersion([...BUILD].reverse())).toBe(precacheVersion(BUILD))
  })

  it('changes when one file changes content', () => {
    const changed = BUILD.map((entry) => (entry.url === '/assets/12-easy-def.js' ? { ...entry, revision: 'cccd' } : entry))
    expect(precacheVersion(changed)).not.toBe(precacheVersion(BUILD))
  })

  it('changes when a file is added, removed or renamed', () => {
    expect(precacheVersion([...BUILD, { url: '/extra.png', revision: 'ffff' }])).not.toBe(precacheVersion(BUILD))
    expect(precacheVersion(BUILD.slice(1))).not.toBe(precacheVersion(BUILD))
    expect(precacheVersion(BUILD.map((e) => (e.url === '/icon-192.png' ? { ...e, url: '/icon-193.png' } : e)))).not.toBe(precacheVersion(BUILD))
  })

  it('does not confuse a url with a revision (a moved character between the two)', () => {
    expect(precacheVersion([{ url: '/a', revision: 'bc' }])).not.toBe(precacheVersion([{ url: '/ab', revision: 'c' }]))
  })
})

describe('hashText', () => {
  it('is stable and spreads small changes', () => {
    expect(hashText('slaydoku')).toBe(hashText('slaydoku'))
    expect(hashText('slaydoku')).not.toBe(hashText('cadeaukp'))
    expect(hashText('')).toMatch(/^[0-9a-f]{14}$/)
  })
})

describe('cache names', () => {
  it('a cache is named after its version, under the app prefix', () => {
    expect(cacheName('abc')).toBe(`${CACHE_PREFIX}abc`)
    expect(cacheName(precacheVersion(BUILD))).not.toBe(cacheName(precacheVersion(BUILD.slice(1))))
  })

  it('deletes the caches of other builds and keeps the current one', () => {
    const current = cacheName('new')
    expect(staleCacheNames([cacheName('old'), current, cacheName('older')], current)).toEqual([cacheName('old'), cacheName('older')])
  })

  it('never touches a cache that is not ours', () => {
    const current = cacheName('new')
    expect(staleCacheNames(['workbox-precache-v2', 'other-app', current], current)).toEqual([])
  })

  it('has nothing to delete on the first install', () => {
    expect(staleCacheNames([], cacheName('new'))).toEqual([])
  })
})

describe('pathOf', () => {
  it('strips origin, query and hash', () => {
    expect(pathOf('https://slaydoku.vercel.app/level/demo?x=1#y')).toBe('/level/demo')
    expect(pathOf('http://localhost:4173')).toBe('/')
    expect(pathOf('/assets/a.js')).toBe('/assets/a.js')
  })
})

describe('routeRequest', () => {
  const origin = 'https://slaydoku.example'
  const known = precachedPaths(BUILD)
  const get = (path: string, mode = 'cors') => routeRequest({ method: 'GET', mode, url: `${origin}${path}` }, origin, known)

  it('answers a page load of every clean URL with the shell', () => {
    for (const path of ['/', '/level/demo', '/level/demo/solved', '/about', '/about/', '/extras', '/extras/12-easy-home-3', '/nonsense/path', '/level/demo?utm=1']) {
      expect(get(path, 'navigate'), path).toBe('shell')
    }
    expect(SHELL_URL).toBe('/index.html')
    expect(known.has(SHELL_URL)).toBe(true)
  })

  it('answers build files from the cache, even with a query', () => {
    expect(get('/assets/index-abc.js')).toBe('precached')
    expect(get('/assets/12-easy-def.js?v=2')).toBe('precached')
    expect(get('/manifest.webmanifest')).toBe('precached')
    expect(get('/index.html', 'navigate')).toBe('precached')
  })

  it('leaves everything else to the network', () => {
    expect(get('/assets/unknown-zzz.js')).toBe('network')
    expect(get('/sw.js')).toBe('network')
    expect(get('/robots.txt', 'navigate')).toBe('network')
    expect(get('/api/x')).toBe('network')
  })

  it('leaves other origins and other methods alone', () => {
    expect(routeRequest({ method: 'GET', mode: 'navigate', url: 'https://other.example/' }, origin, known)).toBe('network')
    expect(routeRequest({ method: 'GET', mode: 'cors', url: `${origin}.evil.example/assets/index-abc.js` }, origin, known)).toBe('network')
    expect(routeRequest({ method: 'POST', mode: 'navigate', url: `${origin}/level/demo` }, origin, known)).toBe('network')
  })
})
