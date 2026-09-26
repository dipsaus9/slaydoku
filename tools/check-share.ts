// Share check for a deployed URL (Bun only, `import.meta.main`): `bun tools/check-share.ts <url> [--skip-headers]`.
// Verifies the head tags, the og:image (status 200, image/png, under 1 MB, declared size), the noindex
// header, robots.txt (preview bots allowed, everyone else disallowed), the titles, and the home-screen app setup
// (iOS meta tags, manifest link that resolves to JSON with the required fields, icons that exist at their declared size),
// and that a deep link (/level/demo, clean URLs) returns the same HTML shell with the same head tags as the root,
// and that the offline service worker /sw.js is served as JavaScript (not the HTML shell) with a no-cache header (CAD-10.6).
// Exits 1 when any check fails, 2 on bad usage.
//
// --skip-headers  leave out the X-Robots-Tag and the /sw.js Cache-Control check. `vite preview` does not apply vercel.json headers,
//                 so a local run needs it; a run against a real deployment must not use it.
//
// Local run: build with VERCEL_PROJECT_PRODUCTION_URL=http://localhost:4173 (so og:image points at the
// preview server), start `bun run preview`, then check http://localhost:4173.

export const EXPECTED_TITLE = 'Slaydoku'
export const MAX_IMAGE_BYTES = 1024 * 1024

/** A clean-URL deep link the host must answer with the HTML shell (History API routing, CAD-10.11). */
export const DEEP_LINK = '/level/demo'

/** The service worker of the offline support (CAD-10.6): must be a real file at the root, so it can control every clean URL. */
export const SERVICE_WORKER_PATH = '/sw.js'

/** Link preview crawlers that must stay allowed in robots.txt, or shared links lose their card. */
export const PREVIEW_BOTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'Slackbot',
  'Slack-ImgProxy',
  'LinkedInBot',
  'Discordbot',
  'WhatsApp',
  'TelegramBot',
] as const

export interface RobotsGroup {
  allow: string[]
  disallow: string[]
}

/** robots.txt groups keyed by lowercased user-agent. Consecutive User-agent lines share the rules that follow them. */
export function parseRobots(text: string): Map<string, RobotsGroup> {
  const groups = new Map<string, RobotsGroup>()
  let current: RobotsGroup[] = []
  let collecting = false
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim()
    const [field, ...rest] = line.split(':')
    const value = rest.join(':').trim()
    const key = field?.trim().toLowerCase()
    if (key === 'user-agent' && value) {
      if (!collecting) current = []
      collecting = true
      const name = value.toLowerCase()
      const group = groups.get(name) ?? { allow: [], disallow: [] }
      groups.set(name, group)
      current.push(group)
    } else if (key === 'allow' || key === 'disallow') {
      collecting = false
      for (const group of current) group[key].push(value)
    }
  }
  return groups
}

export interface Check {
  name: string
  ok: boolean
  detail: string
}

export interface CheckOptions {
  /** Skip the X-Robots-Tag header check (local preview does not apply vercel.json). */
  skipHeaders?: boolean
  expectedTitle?: string
}

type Meta = Map<string, string>

/** All `<meta>` tags with a `property` or `name` attribute, keyed by it; the first one wins, other attributes are ignored. */
export function parseMeta(html: string): Meta {
  const meta: Meta = new Map()
  for (const tag of html.matchAll(/<meta\s[^>]*>/gi)) {
    const attrs = new Map<string, string>()
    for (const a of tag[0].matchAll(/([a-zA-Z:-]+)\s*=\s*"([^"]*)"/g)) attrs.set(a[1]!.toLowerCase(), a[2]!)
    const key = attrs.get('property') ?? attrs.get('name')
    const media = attrs.get('media')
    if (key && !media && !meta.has(key)) meta.set(key, attrs.get('content') ?? '')
  }
  return meta
}

/** href of the `<link rel="manifest">` tag, or undefined when the page has none. */
export function parseManifestHref(html: string): string | undefined {
  for (const tag of html.matchAll(/<link\s[^>]*>/gi)) {
    const attrs = new Map<string, string>()
    for (const a of tag[0].matchAll(/([a-zA-Z:-]+)\s*=\s*"([^"]*)"/g)) attrs.set(a[1]!.toLowerCase(), a[2]!)
    if (attrs.get('rel')?.toLowerCase().split(/\s+/).includes('manifest')) return attrs.get('href')
  }
  return undefined
}

export function parseTitle(html: string): string | undefined {
  return /<title>([^<]*)<\/title>/i.exec(html)?.[1]?.trim()
}

/** Width and height from a PNG IHDR chunk, or undefined when the bytes are not a PNG. */
export function pngSize(bytes: Uint8Array): [number, number] | undefined {
  if (bytes.length < 24 || String.fromCharCode(...bytes.subarray(1, 4)) !== 'PNG') return undefined
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return [view.getUint32(16), view.getUint32(20)]
}

const pass = (name: string, detail = ''): Check => ({ name, ok: true, detail })
const fail = (name: string, detail: string): Check => ({ name, ok: false, detail })
const check = (name: string, ok: boolean, detail: string): Check => ({ name, ok, detail })

const REQUIRED_TAGS = [
  'description',
  'robots',
  'og:type',
  'og:locale',
  'og:site_name',
  'og:title',
  'og:description',
  'og:url',
  'og:image',
  'og:image:width',
  'og:image:height',
  'og:image:alt',
  'twitter:card',
  'twitter:title',
  'twitter:description',
  'twitter:image',
] as const

function directives(value: string | null | undefined): string[] {
  return (value ?? '').toLowerCase().split(',').map((d) => d.trim()).filter(Boolean)
}

function noindexProblem(what: string, value: string | null | undefined): Check {
  const have = directives(value)
  const missing = ['noindex', 'nofollow'].filter((d) => !have.includes(d))
  return missing.length === 0 ? pass(what, `${value}`) : fail(what, `missing ${missing.join(', ')} (got ${value ?? 'nothing'})`)
}

/** Fields a web app manifest must carry so the site installs as a standalone app; string values are compared exactly. */
export const MANIFEST_STRINGS = { display: 'standalone', lang: 'nl', name: 'Slaydoku' } as const
export const MANIFEST_REQUIRED = ['short_name', 'start_url', 'scope', 'orientation', 'theme_color', 'background_color'] as const
/** Icon sizes the manifest must offer with purpose `any`. */
export const MANIFEST_ICON_SIZES = ['192x192', '512x512'] as const

/** Meta tags iOS Safari reads for a home-screen web app, with the value each must have (`undefined` = any non-empty value). */
export const IOS_META: readonly (readonly [string, string | undefined])[] = [
  ['apple-mobile-web-app-capable', 'yes'],
  ['apple-mobile-web-app-status-bar-style', undefined],
  ['apple-mobile-web-app-title', undefined],
]

interface ManifestIcon {
  src?: unknown
  sizes?: unknown
  type?: unknown
  purpose?: unknown
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

async function get(url: string): Promise<{ res: Response; bytes: Uint8Array } | { error: string }> {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    return { res, bytes: new Uint8Array(await res.arrayBuffer()) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

async function checkImage(src: string, meta: Meta): Promise<Check[]> {
  const got = await get(src)
  if ('error' in got) return [fail('og:image reachable', `${src}: ${got.error}`)]
  const { res, bytes } = got
  const type = res.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
  const size = pngSize(bytes)
  const declared = [Number(meta.get('og:image:width')), Number(meta.get('og:image:height'))]
  return [
    check('og:image status 200', res.status === 200, `${src} -> ${res.status}`),
    check('og:image type image/png', type === 'image/png', `content-type ${type ?? 'missing'}`),
    check('og:image under 1 MB', bytes.length > 0 && bytes.length < MAX_IMAGE_BYTES, `${bytes.length} bytes`),
    check(
      'og:image size matches og:image:width/height',
      size !== undefined && size[0] === declared[0] && size[1] === declared[1],
      size ? `${size.join('x')}, declared ${declared.join('x')}` : 'not a PNG',
    ),
  ]
}

async function checkIcon(src: string, label: string, sizes: string, type: string | undefined): Promise<Check> {
  const name = `manifest icon ${label}`
  const got = await get(src)
  if ('error' in got) return fail(name, `${src}: ${got.error}`)
  const { res, bytes } = got
  const size = pngSize(bytes)
  const declared = sizes.split('x').map(Number)
  const contentType = res.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
  const problems = [
    res.status !== 200 && `status ${res.status}`,
    contentType !== 'image/png' && `content-type ${contentType ?? 'missing'}`,
    type !== 'image/png' && `declared type ${type ?? 'missing'}`,
    (!size || size[0] !== declared[0] || size[1] !== declared[1]) && `actual size ${size ? size.join('x') : 'not a PNG'}`,
  ].filter(Boolean)
  return problems.length === 0 ? pass(name, src) : fail(name, `${src}: ${problems.join(', ')}`)
}

/** Home-screen app checks: iOS meta tags, then the manifest link, its JSON, required fields and icons. */
export async function checkManifest(pageUrl: string, html: string, meta: Meta): Promise<Check[]> {
  const checks: Check[] = []
  for (const [key, want] of IOS_META) {
    const value = meta.get(key) ?? ''
    checks.push(check(`tag ${key}`, want === undefined ? value !== '' : value === want, value || 'missing'))
  }
  const href = parseManifestHref(html)
  if (!href) return [...checks, fail('manifest link', 'no <link rel="manifest"> in the page')]
  const url = new URL(href, pageUrl).href
  const got = await get(url)
  if ('error' in got) return [...checks, fail('manifest reachable', `${url}: ${got.error}`)]
  checks.push(check('manifest status 200', got.res.status === 200, `${url} -> ${got.res.status}`))
  let json: unknown
  try {
    json = JSON.parse(new TextDecoder().decode(got.bytes))
  } catch {
    return [...checks, fail('manifest is JSON', `${url} does not parse (an SPA rewrite serving index.html?)`)]
  }
  if (!isRecord(json)) return [...checks, fail('manifest is JSON', 'top level is not an object')]
  checks.push(pass('manifest is JSON', url))

  for (const [key, want] of Object.entries(MANIFEST_STRINGS)) checks.push(check(`manifest ${key} is ${want}`, json[key] === want, String(json[key] ?? 'missing')))
  for (const key of MANIFEST_REQUIRED) checks.push(check(`manifest ${key}`, typeof json[key] === 'string' && json[key] !== '', String(json[key] ?? 'missing')))

  const icons = (Array.isArray(json.icons) ? json.icons : []).filter(isRecord) as ManifestIcon[]
  for (const sizes of MANIFEST_ICON_SIZES) {
    const has = icons.some((i) => i.sizes === sizes && String(i.purpose ?? 'any').split(/\s+/).includes('any'))
    checks.push(check(`manifest offers a ${sizes} icon with purpose any`, has, has ? '' : 'missing'))
  }
  for (const icon of icons) {
    const label = `${String(icon.sizes)} ${String(icon.purpose ?? 'any')}`
    if (typeof icon.src !== 'string' || typeof icon.sizes !== 'string') checks.push(fail(`manifest icon ${label}`, 'entry without src or sizes'))
    else checks.push(await checkIcon(new URL(icon.src, url).href, label, icon.sizes, typeof icon.type === 'string' ? icon.type : undefined))
  }
  return checks
}

/** The tags a shared link is judged by, plus the title and the manifest link: what a deep link must have in common with the root. */
function headSignature(html: string, meta: Meta): Record<string, string> {
  const signature: Record<string, string> = { '<title>': parseTitle(html) ?? '', 'manifest link': parseManifestHref(html) ?? '' }
  for (const key of ['description', 'robots', 'og:type', 'og:locale', 'og:site_name', 'og:title', 'og:description', 'og:url', 'og:image', 'twitter:card', 'twitter:title', 'twitter:image']) {
    signature[key] = meta.get(key) ?? ''
  }
  return signature
}

/** A deep link returns the same HTML shell as the root (the SPA rewrite), with the same head tags and noindex header. */
async function checkDeepLink(url: string, html: string, meta: Meta, skipHeaders: boolean): Promise<Check[]> {
  const deep = new URL(DEEP_LINK, url).href
  const got = await get(deep)
  if ('error' in got) return [fail(`deep link ${DEEP_LINK} reachable`, `${deep}: ${got.error}`)]
  const type = got.res.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
  const deepHtml = new TextDecoder().decode(got.bytes)
  const checks: Check[] = [
    check(`deep link ${DEEP_LINK} status 200`, got.res.status === 200, `${deep} -> ${got.res.status}`),
    check(`deep link ${DEEP_LINK} is the HTML shell`, type === 'text/html' && /<html[\s>]/i.test(deepHtml), `content-type ${type ?? 'missing'}`),
  ]
  if (!skipHeaders) checks.push(noindexProblem(`deep link ${DEEP_LINK} X-Robots-Tag header`, got.res.headers.get('x-robots-tag')))
  const want = headSignature(html, meta)
  const have = headSignature(deepHtml, parseMeta(deepHtml))
  const different = Object.keys(want).filter((key) => want[key] !== have[key])
  checks.push(
    check(
      `deep link ${DEEP_LINK} has the same head tags`,
      different.length === 0,
      different.length === 0 ? 'same as the root' : different.map((key) => `${key}: ${have[key] || 'missing'} vs ${want[key] || 'missing'}`).join('; '),
    ),
  )
  return checks
}

/** A `Cache-Control` value that makes the browser revalidate: a worker cached for a year would never update. */
export function isRevalidated(value: string | null | undefined): boolean {
  const have = directives(value)
  return have.includes('no-cache') || have.includes('no-store') || have.includes('max-age=0')
}

/** The service worker is a JavaScript file (not the HTML shell an SPA rewrite would answer), revalidated on every visit. */
async function checkServiceWorker(url: string, skipHeaders: boolean): Promise<Check[]> {
  const sw = new URL(SERVICE_WORKER_PATH, url).href
  const got = await get(sw)
  if ('error' in got) return [fail(`${SERVICE_WORKER_PATH} reachable`, `${sw}: ${got.error}`)]
  const type = got.res.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? ''
  const checks: Check[] = [
    check(`${SERVICE_WORKER_PATH} status 200`, got.res.status === 200, `${sw} -> ${got.res.status}`),
    check(`${SERVICE_WORKER_PATH} is JavaScript`, /^(text|application)\/(x-)?javascript$/.test(type), `content-type ${type || 'missing'}`),
  ]
  if (!skipHeaders) {
    const cacheControl = got.res.headers.get('cache-control')
    checks.push(check(`${SERVICE_WORKER_PATH} Cache-Control is no-cache`, isRevalidated(cacheControl), cacheControl ?? 'missing'))
  }
  return checks
}

/** Runs every check against a deployed origin or page URL and returns the results (never throws on a bad deploy). */
export async function checkShare(url: string, options: CheckOptions = {}): Promise<Check[]> {
  const expectedTitle = options.expectedTitle ?? EXPECTED_TITLE
  const page = await get(url)
  if ('error' in page) return [fail('page reachable', `${url}: ${page.error}`)]
  const { res } = page
  const html = new TextDecoder().decode(page.bytes)
  const meta = parseMeta(html)
  const checks: Check[] = [check('page status 200', res.status === 200, `${url} -> ${res.status}`)]

  if (!options.skipHeaders) checks.push(noindexProblem('X-Robots-Tag header', res.headers.get('x-robots-tag')))

  for (const key of REQUIRED_TAGS) checks.push(check(`tag ${key}`, (meta.get(key) ?? '') !== '', meta.get(key) ?? 'missing'))
  if (meta.has('robots')) checks.push(noindexProblem('robots meta', meta.get('robots')))
  for (const key of ['og:url', 'og:image', 'twitter:image']) {
    const value = meta.get(key)
    if (value) checks.push(check(`${key} is absolute`, /^https?:\/\//.test(value), value))
  }
  checks.push(check('twitter:card summary_large_image', meta.get('twitter:card') === 'summary_large_image', meta.get('twitter:card') ?? 'missing'))

  const titles: [string, string | undefined][] = [
    ['<title>', parseTitle(html)],
    ['og:title', meta.get('og:title')],
    ['twitter:title', meta.get('twitter:title')],
  ]
  for (const [name, value] of titles) checks.push(check(`${name} is ${expectedTitle}`, value === expectedTitle, value ?? 'missing'))

  const image = meta.get('og:image')
  if (image && /^https?:\/\//.test(image)) checks.push(...(await checkImage(image, meta)))
  checks.push(check('twitter:image matches og:image', meta.get('twitter:image') === image, `${meta.get('twitter:image') ?? 'missing'} vs ${image ?? 'missing'}`))

  checks.push(...(await checkManifest(url, html, meta)))
  checks.push(...(await checkDeepLink(url, html, meta, options.skipHeaders === true)))

  checks.push(...(await checkServiceWorker(url, options.skipHeaders === true)))

  const robots = await get(new URL('/robots.txt', url).href)
  if ('error' in robots) checks.push(fail('robots.txt', robots.error))
  else {
    const text = new TextDecoder().decode(robots.bytes)
    const groups = robots.res.status === 200 ? parseRobots(text) : new Map<string, RobotsGroup>()
    checks.push(
      check(
        'robots.txt disallows all other crawlers',
        groups.get('*')?.disallow.includes('/') === true,
        `${robots.res.status} ${JSON.stringify(text.slice(0, 40))}`,
      ),
    )
    const blocked = PREVIEW_BOTS.filter((bot) => {
      const group = groups.get(bot.toLowerCase())
      return !group?.allow.includes('/') || group.disallow.includes('/')
    })
    checks.push(check('robots.txt allows the preview bots', blocked.length === 0, blocked.length === 0 ? PREVIEW_BOTS.join(', ') : `no Allow: / group for ${blocked.join(', ')}`))
  }
  return checks
}

export function formatChecks(url: string, checks: Check[]): string {
  const lines = checks.map((c) => `${c.ok ? 'ok  ' : 'FAIL'} ${c.name}${c.detail ? `  (${c.detail})` : ''}`)
  const failed = checks.filter((c) => !c.ok).length
  return [`check-share ${url}`, ...lines, failed === 0 ? `all ${checks.length} checks passed` : `${failed} of ${checks.length} checks failed`].join('\n')
}

async function main(argv: string[]): Promise<number> {
  const skipHeaders = argv.includes('--skip-headers')
  const [url] = argv.filter((a) => !a.startsWith('--'))
  if (!url || !/^https?:\/\//.test(url)) {
    console.error('usage: bun tools/check-share.ts <http(s) url> [--skip-headers]')
    return 2
  }
  const checks = await checkShare(url, { skipHeaders })
  console.log(formatChecks(url, checks))
  return checks.every((c) => c.ok) ? 0 : 1
}

if ((import.meta as { main?: boolean }).main) process.exit(await main(process.argv.slice(2)))
