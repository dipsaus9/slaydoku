import { describe, expect, it } from 'vitest'
import { fakeWindow } from '../router/fakeWindow.ts'
import { createRouter } from '../router/index.ts'
import { installCanonicalLink } from './install.ts'
import { canonicalPath } from './model.ts'

describe('canonicalPath', () => {
  it('self-references the two routes the sitemap lists', () => {
    expect(canonicalPath('/')).toBe('/')
    expect(canonicalPath('/about')).toBe('/about')
    expect(canonicalPath('/about/')).toBe('/about')
  })

  it('falls back to the site root for every other route: not independently indexed', () => {
    for (const path of ['/play', '/play/3', '/lab', '/lab/puzzle', '/nonsense', '', '/level/demo']) {
      expect(canonicalPath(path), path).toBe('/')
    }
  })
})

describe('installCanonicalLink', () => {
  const setup = (start: string) => {
    const win = fakeWindow(start)
    return { win, router: createRouter(win) }
  }

  /** A fake document exposing only the one canonical link the installer touches. */
  function fakeDoc() {
    let href = 'unset'
    const link = { setAttribute: (name: string, value: string) => (name === 'href' ? (href = value) : undefined) }
    const doc: Pick<Document, 'querySelector'> = { querySelector: (() => link) as Document['querySelector'] }
    return { doc, hrefOf: () => href }
  }

  it('sets the canonical link on load and on every navigation', () => {
    const { router } = setup('/')
    const { doc, hrefOf } = fakeDoc()
    installCanonicalLink({ router, doc })
    expect(hrefOf()).toBe('http://localhost:5173/')
    router.navigate('/about')
    expect(hrefOf()).toBe('http://localhost:5173/about')
    router.navigate('/play')
    expect(hrefOf()).toBe('http://localhost:5173/')
  })

  it('stops listening when stopped', () => {
    const { win, router } = setup('/')
    const { doc, hrefOf } = fakeDoc()
    const stop = installCanonicalLink({ router, doc })
    stop()
    expect(win.listenerCount()).toBe(0)
    router.navigate('/about')
    expect(hrefOf()).toBe('http://localhost:5173/')
  })

  it('does nothing when the page has no canonical link', () => {
    const { router } = setup('/')
    const doc: Pick<Document, 'querySelector'> = { querySelector: (() => null) as Document['querySelector'] }
    expect(() => installCanonicalLink({ router, doc })).not.toThrow()
  })
})
