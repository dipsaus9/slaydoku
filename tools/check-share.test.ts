import { existsSync, readFileSync, statSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { parseIndexable, robotsTxt, SITEMAP_PATHS, vercelSendsNoindex } from '../src/brand/indexing.ts'
import {
  checkShare,
  formatChecks,
  isRevalidated,
  MANIFEST_ICON_SIZES,
  parseManifestHref,
  parseMeta,
  parseRobots,
  parseTitle,
  pngSize,
  PREVIEW_BOTS,
} from './check-share.ts'

const VERCEL = readFileSync(join(import.meta.dirname, '..', 'vercel.json'), 'utf8')
const vercelSendsNoindexNow = () => vercelSendsNoindex(VERCEL)
const INDEXABLE_NOW = parseIndexable(readFileSync(join(import.meta.dirname, '..', 'src/brand/site.json'), 'utf8'))

const ROOT = join(import.meta.dirname, '..')
const PNG = readFileSync(join(ROOT, 'public/og-image.png'))
const ICON_192 = readFileSync(join(ROOT, 'public/icon-192.png'))
const ICON_512 = readFileSync(join(ROOT, 'public/icon-512.png'))
const MANIFEST = readFileSync(join(ROOT, 'public/manifest.webmanifest'), 'utf8')

interface Site {
  headers?: Record<string, string>
  /** Receives the origin so og:url and og:image can be absolute, like the real build. */
  html?: (origin: string) => string
  image?: { status?: number; type?: string; body?: Buffer }
  robots?: string
  /** The mode the fake host is in. Default 'noindex': robots.txt, robots meta and X-Robots-Tag keep crawlers out. */
  mode?: 'noindex' | 'indexable'
  /** What `/sitemap.xml` answers. Default: a real sitemap in indexable mode, the SPA shell (a rewrite) in noindex mode. */
  sitemap?: { status?: number; type?: string; body?: (origin: string) => string }
  /** Replaces the served manifest; status and type override the response. Default: the real public/manifest.webmanifest. */
  manifest?: { status?: number; type?: string; body?: string }
  /** Replaces the served icon files by path. */
  icons?: Record<string, Buffer>
  /** What `/level/demo` (a clean-URL deep link) answers. Default: the same HTML shell as every other path. */
  deepLink?: { status?: number; type?: string; html?: (origin: string) => string }
  /** What `/sw.js` answers. Default: JavaScript with `Cache-Control: no-cache`, like the real deployment. A missing file falls to the SPA shell (type text/html). */
  sw?: { status?: number; type?: string; cacheControl?: string | null }
}

const GOOD_ROBOTS = [...PREVIEW_BOTS.map((b) => `User-agent: ${b}\nAllow: /\n`), 'User-agent: *\nDisallow: /\n'].join('\n')
const sitemapFor = (origin: string) => `<?xml version="1.0"?><urlset>${SITEMAP_PATHS.map((p) => `<url><loc>${origin}${p}</loc></url>`).join('')}</urlset>`

const HOME_SCREEN_HEAD = `<link rel="manifest" href="/manifest.webmanifest" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Slaydoku" />`

const head = (origin: string, extra: { title?: string; ogImage?: string; robots?: string } = {}) => `<!doctype html><html lang="en"><head>
<title>${extra.title ?? 'Slaydoku'}</title>
${HOME_SCREEN_HEAD}
<meta name="description" content="Slaydoku: a new murder mystery puzzle every day. Read the clues, place every suspect and find out who was alone with the victim." />
<meta name="robots" content="${extra.robots ?? 'noindex,nofollow'}" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="en_US" />
<meta property="og:site_name" content="Slaydoku" />
<meta property="og:title" content="Slaydoku" />
<meta property="og:description" content="Slaydoku: a new murder mystery puzzle every day. Read the clues, place every suspect and find out who was alone with the victim." />
<meta property="og:url" content="${origin}/" />
<meta property="og:image" content="${extra.ogImage ?? `${origin}/og-image.png`}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Slaydoku, a new murder mystery puzzle every day" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Slaydoku" />
<meta name="twitter:description" content="Slaydoku: a new murder mystery puzzle every day. Read the clues, place every suspect and find out who was alone with the victim." />
<meta name="twitter:image" content="${extra.ogImage ?? `${origin}/og-image.png`}" />
</head><body></body></html>`

let server: Server | undefined

async function serve(site: Site = {}): Promise<string> {
  const indexable = site.mode === 'indexable'
  const xRobots = indexable ? 'index,follow' : 'noindex,nofollow'
  const page = (origin: string) => (site.html ?? ((o: string) => head(o, { robots: xRobots })))(origin)
  server = createServer((req, res) => {
    const origin = `http://127.0.0.1:${(server!.address() as AddressInfo).port}`
    if (req.url === '/og-image.png') {
      const { status = 200, type = 'image/png', body = PNG } = site.image ?? {}
      res.writeHead(status, { 'content-type': type }).end(body)
    } else if (req.url === '/manifest.webmanifest') {
      const { status = 200, type = 'application/manifest+json', body = MANIFEST } = site.manifest ?? {}
      res.writeHead(status, { 'content-type': type }).end(body)
    } else if (req.url === '/icon-192.png' || req.url === '/icon-512.png') {
      const fallback = req.url === '/icon-192.png' ? ICON_192 : ICON_512
      res.writeHead(200, { 'content-type': 'image/png' }).end(site.icons?.[req.url] ?? fallback)
    } else if (req.url === '/level/demo' && site.deepLink) {
      const { status = 200, type = 'text/html', html = head } = site.deepLink
      res.writeHead(status, { 'content-type': type, 'x-robots-tag': xRobots }).end(html(origin))
    } else if (req.url === '/sw.js') {
      const { status = 200, type = 'text/javascript', cacheControl = 'no-cache' } = site.sw ?? {}
      res.writeHead(status, { 'content-type': type, ...(cacheControl === null ? {} : { 'cache-control': cacheControl }) }).end('self.addEventListener("fetch", () => {})')
    } else if (req.url === '/robots.txt') {
      res.writeHead(200, { 'content-type': 'text/plain' }).end(site.robots ?? (indexable ? robotsTxt(true, origin) : GOOD_ROBOTS))
    } else if (req.url === '/sitemap.xml' && (indexable || site.sitemap)) {
      const { status = 200, type = 'application/xml', body = sitemapFor } = site.sitemap ?? {}
      res.writeHead(status, { 'content-type': type }).end(body(origin))
    } else {
      res.writeHead(200, { 'content-type': 'text/html', 'x-robots-tag': xRobots, ...site.headers }).end(page(origin))
    }
  })
  await new Promise<void>((r) => server!.listen(0, '127.0.0.1', r))
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}/`
}

afterEach(() => new Promise<void>((r) => (server ? server.close(() => r()) : r())).then(() => (server = undefined)))

const failures = (checks: { ok: boolean; name: string }[]) => checks.filter((c) => !c.ok).map((c) => c.name)

describe('checkShare', () => {
  it('passes a correct deployment', async () => {
    const checks = await checkShare(await serve())
    expect(failures(checks)).toEqual([])
    expect(formatChecks('u', checks)).toContain('all ')
  })

  it('fails when the noindex header is missing, and skips that check with skipHeaders', async () => {
    const url = await serve({ headers: { 'x-robots-tag': '' } })
    expect(failures(await checkShare(url))).toEqual(['X-Robots-Tag header', 'deep link /level/demo X-Robots-Tag header', 'deep link /about X-Robots-Tag header'])
    expect(failures(await checkShare(url, { skipHeaders: true }))).toEqual([])
  })

  it('fails when a header carries only noindex', async () => {
    const url = await serve({ headers: { 'x-robots-tag': 'noindex' } })
    expect(failures(await checkShare(url))).toEqual(['X-Robots-Tag header', 'deep link /level/demo X-Robots-Tag header', 'deep link /about X-Robots-Tag header'])
  })

  it('fails on a wrong <title>', async () => {
    const url = await serve({ html: (o) => head(o, { title: 'Something else' }) })
    expect(failures(await checkShare(url))).toEqual(['<title> is Slaydoku'])
  })

  it('fails when the page is not English: html lang and og:locale', async () => {
    const dutch = await serve({ html: (o) => head(o).replace('<html lang="en">', '<html lang="nl">').replace('en_US', 'nl_NL') })
    expect(failures(await checkShare(dutch))).toEqual(expect.arrayContaining(['<html lang> is en', 'og:locale is en_US']))
    const noLang = await serve({ html: (o) => head(o).replace('<html lang="en">', '<html>') })
    expect(failures(await checkShare(noLang))).toContain('<html lang> is en')
  })

  it('fails when a tag is missing', async () => {
    const url = await serve({ html: (o) => head(o).replace(/<meta name="twitter:card"[^>]*>/, '') })
    expect(failures(await checkShare(url))).toContain('tag twitter:card')
  })

  it('fails on a relative og:image', async () => {
    const url = await serve({ html: (o) => head(o, { ogImage: '/og-image.png' }) })
    expect(failures(await checkShare(url))).toContain('og:image is absolute')
  })

  it('fails when the og:image is not found, has the wrong type or is over 1 MB', async () => {
    expect(failures(await checkShare(await serve({ image: { status: 404 } })))).toContain('og:image status 200')
    await new Promise<void>((r) => server!.close(() => r()))
    expect(failures(await checkShare(await serve({ image: { type: 'text/html' } })))).toContain('og:image type image/png')
    await new Promise<void>((r) => server!.close(() => r()))
    const big = Buffer.concat([PNG, Buffer.alloc(1024 * 1024)])
    expect(failures(await checkShare(await serve({ image: { body: big } })))).toContain('og:image under 1 MB')
  })

  describe('home-screen app', () => {
    const withManifest = (change: (m: Record<string, unknown>) => void) => {
      const m = JSON.parse(MANIFEST) as Record<string, unknown>
      change(m)
      return JSON.stringify(m)
    }
    const restart = () => new Promise<void>((r) => server!.close(() => r()))

    it('fails when the manifest link is missing', async () => {
      const url = await serve({ html: (o) => head(o).replace(/<link rel="manifest"[^>]*>/, '') })
      expect(failures(await checkShare(url))).toEqual(['manifest link'])
    })

    it('fails when an iOS meta tag is missing or has the wrong value', async () => {
      const gone = await serve({ html: (o) => head(o).replace(/<meta name="apple-mobile-web-app-title"[^>]*>/, '') })
      expect(failures(await checkShare(gone))).toEqual(['tag apple-mobile-web-app-title'])
      await restart()
      const no = await serve({ html: (o) => head(o).replace('apple-mobile-web-app-capable" content="yes"', 'apple-mobile-web-app-capable" content="no"') })
      expect(failures(await checkShare(no))).toEqual(['tag apple-mobile-web-app-capable'])
    })

    it('fails when the manifest is not found', async () => {
      const checks = await checkShare(await serve({ manifest: { status: 404 } }))
      expect(failures(checks)).toContain('manifest status 200')
    })

    it('fails when the manifest link is swallowed by an SPA rewrite and returns HTML', async () => {
      const url = await serve({ manifest: { type: 'text/html', body: '<!doctype html><html></html>' } })
      expect(failures(await checkShare(url))).toEqual(['manifest is JSON'])
    })

    it('fails when a required field is missing or wrong', async () => {
      const body = withManifest((m) => {
        delete m.short_name
        m.display = 'browser'
      })
      expect(failures(await checkShare(await serve({ manifest: { body } })))).toEqual(['manifest display is standalone', 'manifest short_name'])
    })

    it('fails when the 512 icon is missing', async () => {
      const body = withManifest((m) => {
        m.icons = (m.icons as { sizes: string }[]).filter((i) => i.sizes !== '512x512')
      })
      expect(failures(await checkShare(await serve({ manifest: { body } })))).toEqual(['manifest offers a 512x512 icon with purpose any'])
    })

    it('fails when an icon does not exist or is not the declared size', async () => {
      const body = withManifest((m) => {
        ;(m.icons as { src: string }[])[0]!.src = '/nope.png'
      })
      expect(failures(await checkShare(await serve({ manifest: { body } })))).toEqual(['manifest icon 192x192 any'])
      await restart()
      const checks = await checkShare(await serve({ icons: { '/icon-512.png': ICON_192 } }))
      expect(failures(checks)).toEqual(['manifest icon 512x512 any'])
      expect(checks.find((c) => !c.ok)?.detail).toContain('actual size 192x192')
    })

    it('checks a maskable icon too when one is declared', async () => {
      const body = withManifest((m) => {
        ;(m.icons as unknown[]).push({ src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' })
      })
      const checks = await checkShare(await serve({ manifest: { body } }))
      expect(failures(checks)).toEqual([])
      expect(checks.map((c) => c.name)).toContain('manifest icon 512x512 maskable')
    })
  })

  describe('deep link (clean URLs)', () => {
    it('passes when /level/demo returns the HTML shell with the same head tags', async () => {
      const checks = await checkShare(await serve())
      expect(checks.filter((c) => c.name.startsWith('deep link')).map((c) => c.name)).toEqual([
        'deep link /level/demo status 200',
        'deep link /level/demo is the HTML shell',
        'deep link /level/demo X-Robots-Tag header',
        'deep link /level/demo has the same head tags',
        'deep link /about status 200',
        'deep link /about is the HTML shell',
        'deep link /about X-Robots-Tag header',
        'deep link /about has the same head tags',
      ])
      expect(failures(checks)).toEqual([])
    })

    it('fails when the host has no rewrite and /level/demo is a 404', async () => {
      const url = await serve({ deepLink: { status: 404, type: 'text/plain', html: () => 'Not found' } })
      expect(failures(await checkShare(url))).toEqual([
        'deep link /level/demo status 200',
        'deep link /level/demo is the HTML shell',
        'deep link /level/demo has the same head tags',
      ])
    })

    it('fails when the deep link has other head tags than the root', async () => {
      const url = await serve({ deepLink: { html: (o) => head(o, { title: 'Attic' }).replace(`${o}/`, `${o}/level/demo`) } })
      const failed = (await checkShare(url)).filter((c) => !c.ok)
      expect(failed.map((c) => c.name)).toEqual(['deep link /level/demo has the same head tags'])
      expect(failed[0]!.detail).toContain('og:url')
      expect(failed[0]!.detail).toContain('<title>')
    })
  })

  describe('service worker (offline)', () => {
    it('fails when /sw.js is the HTML shell of the SPA rewrite instead of the worker', async () => {
      const url = await serve({ sw: { type: 'text/html' } })
      expect(failures(await checkShare(url))).toEqual(['/sw.js is JavaScript'])
    })

    it('fails when /sw.js is not found', async () => {
      expect(failures(await checkShare(await serve({ sw: { status: 404 } })))).toEqual(['/sw.js status 200'])
    })

    it('fails when /sw.js can be cached for long, and skips that check with skipHeaders', async () => {
      const url = await serve({ sw: { cacheControl: 'public, max-age=31536000, immutable' } })
      expect(failures(await checkShare(url))).toEqual(['/sw.js Cache-Control is no-cache'])
      expect(failures(await checkShare(url, { skipHeaders: true }))).toEqual([])
    })

    it('fails when /sw.js has no Cache-Control at all', async () => {
      const checks = await checkShare(await serve({ sw: { cacheControl: null } }))
      expect(failures(checks)).toEqual(['/sw.js Cache-Control is no-cache'])
      expect(checks.find((c) => !c.ok)?.detail).toBe('missing')
    })

    it('reads the revalidating Cache-Control values', () => {
      for (const ok of ['no-cache', 'public, max-age=0, must-revalidate', 'no-store']) expect(isRevalidated(ok), ok).toBe(true)
      for (const bad of ['public, max-age=3600', 'immutable', '', null, undefined]) expect(isRevalidated(bad), String(bad)).toBe(false)
    })
  })

  describe('indexable mode (the site is public)', () => {
    const check = async (site: Site = {}, options: { skipHeaders?: boolean } = {}) => checkShare(await serve({ mode: 'indexable', ...site }), { indexable: true, ...options })

    it('passes a correct indexable deployment: no noindex anywhere, robots.txt open, sitemap listing the pages', async () => {
      const checks = await check()
      expect(failures(checks)).toEqual([])
      const names = checks.map((c) => c.name)
      expect(names).toEqual(expect.arrayContaining(['robots.txt allows crawling', 'robots.txt names the sitemap', 'sitemap.xml status 200', 'sitemap.xml is XML', 'sitemap.xml lists the pages']))
      expect(names).not.toContain('robots.txt allows the preview bots')
    })

    it('fails a page that still says noindex: header, robots meta and deep links', async () => {
      const url = await serve({ mode: 'indexable', headers: { 'x-robots-tag': 'noindex,nofollow' }, html: (o) => head(o) })
      expect(failures(await checkShare(url, { indexable: true }))).toEqual(['X-Robots-Tag header', 'robots meta', 'deep link /level/demo X-Robots-Tag header', 'deep link /about X-Robots-Tag header'])
      expect(failures(await checkShare(url, { indexable: true, skipHeaders: true }))).toEqual(['robots meta'])
    })

    it('fails when robots.txt still disallows everything or does not name the sitemap', async () => {
      expect(failures(await check({ robots: GOOD_ROBOTS }))).toEqual(['robots.txt allows crawling', 'robots.txt names the sitemap'])
      expect(failures(await check({ robots: 'User-agent: *\nAllow: /\n' }))).toEqual(['robots.txt names the sitemap'])
    })

    it('fails when the sitemap is missing, is not XML or forgets a page', async () => {
      expect(failures(await check({ sitemap: { status: 404, type: 'text/plain', body: () => 'Not found' } }))).toEqual(['sitemap.xml status 200', 'sitemap.xml is XML', 'sitemap.xml lists the pages'])
      expect(failures(await check({ sitemap: { type: 'text/html' } }))).toEqual(['sitemap.xml is XML'])
      const noAbout = (o: string) => `<urlset><url><loc>${o}/</loc></url></urlset>`
      const checks = await check({ sitemap: { body: noAbout } })
      expect(failures(checks)).toEqual(['sitemap.xml lists the pages'])
      expect(checks.find((c) => !c.ok)?.detail).toBe('missing /about')
    })
  })

  describe('noindex mode publishes no sitemap', () => {
    it('fails when a sitemap is served while the site is noindex', async () => {
      const url = await serve({ sitemap: {} })
      expect(failures(await checkShare(url))).toEqual(['no sitemap.xml is published'])
    })

    it('is the default mode and passes when the sitemap path falls to the SPA shell', async () => {
      const checks = await checkShare(await serve())
      expect(checks.map((c) => c.name)).toContain('no sitemap.xml is published')
      expect(failures(checks)).toEqual([])
    })
  })

  it('fails when robots.txt does not disallow other crawlers', async () => {
    const url = await serve({ robots: GOOD_ROBOTS.replace('Disallow: /', 'Allow: /') })
    expect(failures(await checkShare(url))).toEqual(['robots.txt disallows all other crawlers'])
  })

  it('fails when robots.txt blocks everyone, previews included', async () => {
    const url = await serve({ robots: 'User-agent: *\nDisallow: /\n' })
    expect(failures(await checkShare(url))).toEqual(['robots.txt allows the preview bots'])
  })

  it('fails when one preview bot has no Allow group', async () => {
    const url = await serve({ robots: GOOD_ROBOTS.replace('User-agent: Slackbot\nAllow: /\n', '') })
    const checks = await checkShare(url)
    expect(failures(checks)).toEqual(['robots.txt allows the preview bots'])
    expect(checks.find((c) => !c.ok)?.detail).toBe('no Allow: / group for Slackbot')
  })

  it('reports an unreachable page as a failure instead of throwing', async () => {
    const checks = await checkShare('http://127.0.0.1:1/')
    expect(failures(checks)).toEqual(['page reachable'])
  })
})

describe('parsers', () => {
  it('finds the manifest link whatever the attribute order', () => {
    expect(parseManifestHref('<link rel="icon" href="/a.png"><link href="/m.json" rel="manifest">')).toBe('/m.json')
    expect(parseManifestHref('<link rel="icon" href="/a.png">')).toBeUndefined()
  })
  it('reads meta by property or name and ignores media-scoped tags', () => {
    const meta = parseMeta('<meta name="theme-color" media="(x)" content="#fff" /><meta property="og:title" content="A"><meta name="description" content="B" />')
    expect([...meta]).toEqual([['og:title', 'A'], ['description', 'B']])
  })
  it('groups robots.txt rules per user-agent, sharing rules across consecutive User-agent lines', () => {
    const groups = parseRobots('# c\nUser-agent: A\nUser-agent: B\nAllow: /\n\nUser-agent: *\nDisallow: /  # all\n')
    expect(Object.fromEntries(groups)).toEqual({
      a: { allow: ['/'], disallow: [] },
      b: { allow: ['/'], disallow: [] },
      '*': { allow: [], disallow: ['/'] },
    })
  })
  it('reads the title and PNG size', () => {
    expect(parseTitle('<title> Hi </title>')).toBe('Hi')
    expect(pngSize(PNG)).toEqual([1200, 630])
    expect(pngSize(new Uint8Array(30))).toBeUndefined()
  })
})

describe('home-screen manifest file', () => {
  const INDEX = readFileSync(join(ROOT, 'index.html'), 'utf8')
  const CSS = readFileSync(join(ROOT, 'src/index.css'), 'utf8')
  const manifest = JSON.parse(MANIFEST) as Record<string, unknown> & {
    icons: { src: string; sizes: string; type: string; purpose?: string }[]
  }

  it('is linked from index.html with the iOS meta tags', () => {
    expect(parseManifestHref(INDEX)).toBe('/manifest.webmanifest')
    const meta = parseMeta(INDEX)
    expect(meta.get('apple-mobile-web-app-capable')).toBe('yes')
    expect(meta.get('apple-mobile-web-app-title')).toBe(manifest.short_name)
    expect(meta.get('apple-mobile-web-app-status-bar-style')).toBeTruthy()
  })

  it('opens standalone in any orientation on the whole site', () => {
    expect(manifest).toMatchObject({ name: 'Slaydoku', lang: 'en', start_url: '/', scope: '/', display: 'standalone', orientation: 'any' })
  })

  it('uses the page colours: body background and the light theme-color', () => {
    const body = /body\s*{[^}]*background:\s*(#[0-9a-f]{6})/i.exec(CSS)?.[1]
    const themeLight = /name="theme-color" media="\(prefers-color-scheme: light\)" content="(#[0-9a-f]{6})"/i.exec(INDEX)?.[1]
    expect(body).toBeTruthy()
    expect(manifest.background_color).toBe(body)
    expect(manifest.theme_color).toBe(themeLight)
  })

  it('declares icons that exist at their declared size', () => {
    for (const sizes of MANIFEST_ICON_SIZES) expect(manifest.icons.some((i) => i.sizes === sizes && (i.purpose ?? 'any') === 'any')).toBe(true)
    for (const icon of manifest.icons) {
      expect(icon.type).toBe('image/png')
      expect(pngSize(readFileSync(join(ROOT, 'public', icon.src)))).toEqual(icon.sizes.split('x').map(Number))
    }
  })

  it('has no maskable icon: the magnifying glass handle reaches past the 80% safe zone of the full-bleed icon', () => {
    expect(manifest.icons.some((i) => i.purpose?.includes('maskable'))).toBe(false)
  })
})

describe('hosting config', () => {
  const vercel = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8')) as {
    buildCommand: string
    outputDirectory: string
    framework: string
    ignoreCommand: string
    rewrites: unknown[]
    headers: { source: string; headers: { key: string; value: string }[] }[]
  }
  const header = (source: string, key: string) =>
    vercel.headers.find((h) => h.source === source)?.headers.find((h) => h.key === key)?.value

  it('keeps the build config and the SPA rewrite', () => {
    expect(vercel).toMatchObject({ buildCommand: 'bun run build', outputDirectory: 'dist', framework: 'vite' })
    expect(vercel.rewrites).toEqual([{ source: '/(.*)', destination: '/index.html' }])
  })
  it('builds only main: every other branch is skipped so previews do not eat the daily deploy limit', () => {
    expect(vercel.ignoreCommand).toBe('[ "$VERCEL_GIT_COMMIT_REF" != "main" ]')
  })
  it('lets the manifest through: a static file in public/ wins over the SPA rewrite and only gets the noindex header (when the site is noindex)', () => {
    expect(existsSync(join(ROOT, 'public/manifest.webmanifest'))).toBe(true)
    const rules = vercel.headers.filter((h) => new RegExp(`^${h.source}$`).test('/manifest.webmanifest'))
    expect(rules.map((h) => h.source)).toEqual(INDEXABLE_NOW ? [] : ['/(.*)'])
    if (!INDEXABLE_NOW) expect(rules[0]!.headers.map((h) => h.key)).toEqual(['X-Robots-Tag'])
  })
  describe('clean URLs (History API routing)', () => {
    const rewrite = vercel.rewrites[0] as { source: string; destination: string }
    /** Vercel serves a file that exists before it applies a rewrite; every other path goes through the rewrite. */
    const isFile = (path: string) => existsSync(join(ROOT, 'public', path)) && statSync(join(ROOT, 'public', path)).isFile()
    const rewritten = (path: string) => new RegExp(`^${rewrite.source}$`).test(path) && !isFile(path)

    it('rewrites every app route to the HTML shell', () => {
      expect(rewrite.destination).toBe('/index.html')
      for (const path of ['/', '/level/demo', '/level/demo/solved', '/about', '/extras', '/extras/6-easy-home-200', '/lab', '/nonsense']) {
        expect(rewritten(path), path).toBe(true)
      }
    })

    it('serves static files as files: the rewrite never applies to them', () => {
      for (const path of ['/manifest.webmanifest', '/og-image.png', '/favicon.svg', '/favicon.ico', '/icon-192.png']) {
        expect(isFile(path), path).toBe(true)
        expect(rewritten(path), path).toBe(false)
      }
    })

    it('leaves the build output in /assets, which vercel.json caches as immutable', () => {
      // Vite writes /assets/* into dist by default (no build.assetsDir override); a built file is a file, not a route.
      expect(readFileSync(join(ROOT, 'vite.config.ts'), 'utf8')).not.toContain('assetsDir')
      expect(header('/assets/(.*)', 'Cache-Control')).toBe('public, max-age=31536000, immutable')
    })

    it('keeps og:url on the root URL for every route: the head is static', () => {
      expect(readFileSync(join(ROOT, 'index.html'), 'utf8')).toContain('<meta property="og:url" content="/" />')
    })
  })

  it('sends noindex everywhere while the site is not indexable (src/brand/site.json), and cache headers per path', () => {
    expect(header('/(.*)', 'X-Robots-Tag')).toBe(INDEXABLE_NOW ? undefined : 'noindex,nofollow')
    expect(vercelSendsNoindexNow()).toBe(!INDEXABLE_NOW)
    expect(header('/assets/(.*)', 'Cache-Control')).toBe('public, max-age=31536000, immutable')
    expect(header('/', 'Cache-Control')).toBe('no-cache')
    expect(header('/index.html', 'Cache-Control')).toBe('no-cache')
    expect(header('/sw.js', 'Cache-Control')).toBe('no-cache')
  })
  it('generates robots.txt per mode: preview bots in and everybody else out, or everything open', () => {
    const closed = parseRobots(robotsTxt(false, 'https://x.example'))
    for (const bot of PREVIEW_BOTS) expect(closed.get(bot.toLowerCase())).toEqual({ allow: ['/'], disallow: [] })
    expect(closed.get('*')).toEqual({ allow: [], disallow: ['/'] })
    expect(parseRobots(robotsTxt(true, 'https://x.example')).get('*')).toEqual({ allow: ['/'], disallow: [] })
  })
})
