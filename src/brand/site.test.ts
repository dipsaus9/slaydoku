import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { IndexHtmlTransformContext } from 'vite'
import { describe, expect, it } from 'vitest'
import { parseIndexable } from './indexing.ts'
import { findHtmlProblems, injectSiteUrls, LOCAL_SITE_URL, resolveSiteUrl, siteMetaPlugin } from './site.ts'

const INDEX = readFileSync(join(import.meta.dirname, '../../index.html'), 'utf8')

/** Runs the plugin's html hook the way Vite does. */
function transform(env: Parameters<typeof siteMetaPlugin>[0], html = INDEX): string {
  const hook = siteMetaPlugin(env).transformIndexHtml
  if (typeof hook !== 'object' || hook === null || !('handler' in hook)) throw new Error('unexpected hook shape')
  return hook.handler.call({} as never, html, {} as IndexHtmlTransformContext) as string
}

function meta(html: string, key: string): string | undefined {
  return new RegExp(`<meta\\s+(?:property|name)="${key}"\\s+content="([^"]*)"`).exec(html)?.[1]
}

describe('resolveSiteUrl', () => {
  it('prefers VERCEL_PROJECT_PRODUCTION_URL', () => {
    expect(
      resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'slaydoku.vercel.app', VERCEL_URL: 'slaydoku-abc.vercel.app' }),
    ).toBe('https://slaydoku.vercel.app')
  })

  it('falls back to VERCEL_URL', () => {
    expect(resolveSiteUrl({ VERCEL_URL: 'slaydoku-abc.vercel.app' })).toBe('https://slaydoku-abc.vercel.app')
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: '', VERCEL_URL: 'slaydoku-abc.vercel.app' })).toBe(
      'https://slaydoku-abc.vercel.app',
    )
  })

  it('falls back to localhost', () => {
    expect(resolveSiteUrl({})).toBe(LOCAL_SITE_URL)
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: ' ', VERCEL_URL: '' })).toBe('http://localhost:5173')
  })

  it('keeps an explicit protocol and drops trailing slashes', () => {
    expect(resolveSiteUrl({ VERCEL_URL: 'http://example.test/' })).toBe('http://example.test')
  })
})

describe('siteMetaPlugin on the real index.html', () => {
  it.each([
    ['VERCEL_PROJECT_PRODUCTION_URL', { VERCEL_PROJECT_PRODUCTION_URL: 'prod.example.app', VERCEL_URL: 'x.example.app' }, 'https://prod.example.app'],
    ['VERCEL_URL', { VERCEL_URL: 'preview.example.app' }, 'https://preview.example.app'],
    ['localhost', {}, 'http://localhost:5173'],
  ])('%s fills absolute og and twitter URLs', (_source, env, origin) => {
    const html = transform(env)
    expect(meta(html, 'og:url')).toBe(`${origin}/`)
    expect(meta(html, 'og:image')).toBe(`${origin}/og-image.png`)
    expect(meta(html, 'twitter:image')).toBe(`${origin}/og-image.png`)
    expect(findHtmlProblems(html)).toEqual([])
  })

  it('leaves no relative og:image and no placeholder tokens', () => {
    const html = transform({ VERCEL_URL: 'preview.example.app' })
    expect(html).not.toContain('content="/og-image.png"')
    expect(html).not.toMatch(/%[A-Z_]+%|\{\{|__[A-Z_]+__|undefined/)
  })

  it('passes the manifest link and iOS meta tags through untouched', () => {
    const html = transform({ VERCEL_URL: 'preview.example.app' })
    for (const tag of [
      '<link rel="manifest" href="/manifest.webmanifest" />',
      '<meta name="apple-mobile-web-app-capable" content="yes" />',
      '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
      '<meta name="apple-mobile-web-app-title" content="Slaydoku" />',
    ]) expect(html).toContain(tag)
  })

  it('throws when a social tag is missing', () => {
    expect(() => transform({}, INDEX.replace(/<meta property="og:image" [^>]*>/, ''))).toThrow(/og:image meta tag is missing/)
  })
})

describe('injectSiteUrls', () => {
  it('keeps already absolute URLs', () => {
    const html = '<meta property="og:image" content="https://cdn.test/a.png" />'
    expect(injectSiteUrls(html, 'https://x.test')).toBe(html)
  })
})

describe('index.html head', () => {
  it('declares English language, title and description', () => {
    expect(INDEX).toContain('<html lang="en">')
    expect(meta(INDEX, 'og:locale')).toBe('en_US')
    expect(INDEX).toContain('<title>Slaydoku</title>')
    expect(meta(INDEX, 'description')).toBe('Slaydoku: a new murder mystery puzzle every day. Read the clues, place every suspect and find out who was alone with the victim.')
    expect(meta(INDEX, 'og:description')).toBe(meta(INDEX, 'description'))
    expect(meta(INDEX, 'twitter:description')).toBe(meta(INDEX, 'description'))
    expect(meta(INDEX, 'description')).toContain('a new murder mystery puzzle every day')
    expect(meta(INDEX, 'og:image:alt')).toContain('A new murder mystery puzzle every day')
  })

  it('has light and dark theme-color', () => {
    expect(INDEX).toMatch(/name="theme-color" media="\(prefers-color-scheme: light\)"/)
    expect(INDEX).toMatch(/name="theme-color" media="\(prefers-color-scheme: dark\)"/)
  })

  it('has the Open Graph and Twitter tags', () => {
    for (const key of ['og:title', 'og:description', 'og:type', 'og:url', 'og:image', 'og:locale']) {
      expect(meta(INDEX, key), key).toBeTruthy()
    }
    expect(meta(INDEX, 'twitter:card')).toBe('summary_large_image')
  })

  it('links the favicon and apple-touch-icon', () => {
    expect(INDEX).toContain('href="/favicon.svg"')
    expect(INDEX).toContain('href="/favicon.ico"')
    expect(INDEX).toContain('href="/favicon-32.png"')
    expect(INDEX).toContain('rel="apple-touch-icon"')
  })

  it('is noindex,nofollow in the source (the safe default; the build sets it from src/brand/site.json)', () => {
    expect(meta(INDEX, 'robots')).toBe('noindex,nofollow')
  })
})

describe('the indexing switch in the build', () => {
  const emitted = (indexable: boolean) => {
    const files = new Map<string, string>()
    const hook = siteMetaPlugin({ VERCEL_PROJECT_PRODUCTION_URL: 'slaydoku.example' }, indexable).generateBundle
    if (typeof hook !== 'function') throw new Error('unexpected hook shape')
    hook.call({ emitFile: (file: { fileName: string; source: string }) => files.set(file.fileName, file.source) } as never, {} as never, {} as never, false)
    return files
  }

  it('noindex mode: robots meta noindex, robots.txt without sitemap, no sitemap.xml', () => {
    expect(meta(transform({}, INDEX), 'robots')).toBe('noindex,nofollow')
    const files = emitted(false)
    expect([...files.keys()]).toEqual(['robots.txt'])
    expect(files.get('robots.txt')).toContain('User-agent: *\nDisallow: /')
  })

  it('indexable mode: robots meta index,follow, open robots.txt naming the sitemap, sitemap.xml with the pages', () => {
    const html = (() => {
      const hook = siteMetaPlugin({ VERCEL_URL: 'x.example' }, true).transformIndexHtml
      if (typeof hook !== 'object' || hook === null || !('handler' in hook)) throw new Error('unexpected hook shape')
      return hook.handler.call({} as never, INDEX, {} as IndexHtmlTransformContext) as string
    })()
    expect(meta(html, 'robots')).toBe('index,follow')
    const files = emitted(true)
    expect([...files.keys()].sort()).toEqual(['robots.txt', 'sitemap.xml'])
    expect(files.get('robots.txt')).toContain('Sitemap: https://slaydoku.example/sitemap.xml')
    expect(files.get('sitemap.xml')).toContain('<loc>https://slaydoku.example/</loc>')
  })

  it('the flag file is what vite.config.ts reads', () => {
    const config = readFileSync(join(import.meta.dirname, '../../vite.config.ts'), 'utf8')
    expect(config).toContain("src/brand/site.json")
    expect(config).toContain('siteMetaPlugin(process.env, INDEXABLE)')
    expect(typeof parseIndexable(readFileSync(join(import.meta.dirname, 'site.json'), 'utf8'))).toBe('boolean')
  })
})
