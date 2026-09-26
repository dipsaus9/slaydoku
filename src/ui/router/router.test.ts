import { describe, expect, it } from 'vitest'
import { parseLabRoute } from '../lab/model.ts'
import { parseRoute, routePath } from '../daily/route.ts'
import { fakeWindow } from './fakeWindow.ts'
import { createRouter, legacyHashPath, pathSegments, shouldIntercept } from './router.ts'

describe('paths', () => {
  it('splits a path into decoded segments, null on bad escapes', () => {
    expect(pathSegments('/')).toEqual([])
    expect(pathSegments('/level/a%20b/solved')).toEqual(['level', 'a b', 'solved'])
    expect(pathSegments('/level/%E0%A4%A')).toBeNull()
  })

  it('tells the start screen and the puzzle from a path the app does not know', () => {
    expect(parseRoute('/')).toEqual({ kind: 'start' })
    expect(parseRoute('')).toEqual({ kind: 'start' })
    for (const path of ['/nonsense', '/level', '/level/demo', '/level/demo/solved', '/play/x', '/play/0', '/play/3/x', '/index.html', '/lab', '/%E0%A4%A']) {
      expect(parseRoute(path), path).toEqual({ kind: 'unknown' })
    }
  })

  it('formats and parses the daily routes', () => {
    expect(routePath({ kind: 'start' })).toBe('/')
    expect(routePath({ kind: 'play', n: null })).toBe('/play')
    expect(routePath({ kind: 'play', n: 43 })).toBe('/play/43')
    expect(parseRoute('/play')).toEqual({ kind: 'play', n: null })
    expect(parseRoute('/play/')).toEqual({ kind: 'play', n: null })
    expect(parseRoute('/play/43')).toEqual({ kind: 'play', n: 43 })
  })
})

describe('router', () => {
  it('pushes a path, tells the subscribers and follows back and forward', () => {
    const win = fakeWindow('/')
    const router = createRouter(win)
    const seen: string[] = []
    router.subscribe(() => seen.push(router.path()))
    router.navigate('/level/demo')
    router.navigate('/level/demo/solved')
    expect(win.entries).toEqual(['/', '/level/demo', '/level/demo/solved'])
    win.back()
    win.back()
    win.forward()
    expect(seen).toEqual(['/level/demo', '/level/demo/solved', '/level/demo', '/', '/level/demo'])
  })

  it('replaces the current entry for a redirect, so back does not return to it', () => {
    const win = fakeWindow('/')
    const router = createRouter(win)
    router.navigate('/level/nonsense')
    router.navigate('/', { replace: true })
    expect(win.entries).toEqual(['/', '/'])
    expect(win.index).toBe(1)
  })

  it('does not add a history entry for the path it is already on', () => {
    const win = fakeWindow('/nonsense')
    const router = createRouter(win)
    let calls = 0
    router.subscribe(() => (calls += 1))
    router.navigate('/nonsense')
    expect(win.entries).toEqual(['/nonsense'])
    expect(calls).toBe(0)
  })

  it('listens to the window only while somebody subscribes', () => {
    const win = fakeWindow('/')
    const router = createRouter(win)
    expect(win.listenerCount()).toBe(0)
    const a = router.subscribe(() => {})
    const b = router.subscribe(() => {})
    expect(win.listenerCount()).toBe(2)
    a()
    expect(win.listenerCount()).toBe(2)
    b()
    expect(win.listenerCount()).toBe(0)
  })
})

describe('old hash URLs', () => {
  const old: [string, string, unknown][] = [
    ['#/level/demo', '/level/demo', parseRoute('/level/demo')],
    ['#/level/demo/solved', '/level/demo/solved', parseRoute('/level/demo/solved')],
    ['#/lab', '/lab', parseLabRoute('/lab')],
    ['#/lab/pack/6-easy-home-1', '/lab/pack/6-easy-home-1', parseLabRoute('/lab/pack/6-easy-home-1')],
    ['#/', '/', parseRoute('/')],
  ]

  it.each(old)('%s is rewritten once to %s, without a history entry', (hash, path) => {
    const win = fakeWindow(`/${hash}`)
    const router = createRouter(win)
    expect(legacyHashPath(hash)).toBe(path)
    expect(router.migrateLegacyHash()).toBe(true)
    expect(win.url()).toBe(path)
    expect(win.entries).toHaveLength(1)
    expect(router.migrateLegacyHash()).toBe(false)
  })

  it.each(old)('%s lands on the route it always meant', (hash, path, route) => {
    expect(legacyHashPath(hash)).toBe(path)
    const parsed = [parseRoute(path), parseLabRoute(path)]
    expect(parsed).toContainEqual(route)
  })

  it('leaves a clean URL and other hashes alone', () => {
    for (const start of ['/', '/level/demo', '/#', '/#anker']) {
      const win = fakeWindow(start)
      expect(createRouter(win).migrateLegacyHash()).toBe(false)
      expect(win.url()).toBe(start)
    }
  })

  it('rewrites an old link typed into a running page and tells the subscribers', () => {
    const win = fakeWindow('/level/demo')
    const router = createRouter(win)
    const seen: string[] = []
    router.subscribe(() => seen.push(router.path()))
    win.typeHash('#/nonsense')
    expect(win.url()).toBe('/nonsense')
    expect(seen).toEqual(['/nonsense'])
  })
})

describe('shouldIntercept', () => {
  const plain = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false }
  const here = 'https://slaydoku.vercel.app'

  it('takes over a plain left click on an in-app link', () => {
    expect(shouldIntercept(plain, { origin: here }, here)).toBe(true)
    expect(shouldIntercept(plain, { target: '_self', origin: here }, here)).toBe(true)
  })

  it('leaves every other click to the browser', () => {
    expect(shouldIntercept({ ...plain, button: 1 }, { origin: here }, here)).toBe(false)
    expect(shouldIntercept({ ...plain, button: 2 }, { origin: here }, here)).toBe(false)
    for (const key of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey'] as const) {
      expect(shouldIntercept({ ...plain, [key]: true }, { origin: here }, here)).toBe(false)
    }
    expect(shouldIntercept({ ...plain, defaultPrevented: true }, { origin: here }, here)).toBe(false)
    expect(shouldIntercept(plain, { target: '_blank', origin: here }, here)).toBe(false)
    expect(shouldIntercept(plain, { download: true, origin: here }, here)).toBe(false)
    expect(shouldIntercept(plain, { origin: 'https://example.com' }, here)).toBe(false)
  })
})
