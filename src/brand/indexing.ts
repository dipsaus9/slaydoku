/*
 * The indexing switch: one decision, "may search engines list this site", that shows up in four places.
 *
 *   src/brand/site.json   { "indexable": false }   the one flag (read by the build, tools/check-share.ts and the tests)
 *   index.html            <meta name="robots">     written at build time from the flag (siteMetaPlugin in site.ts)
 *   robots.txt            in dist/                 generated at build time from the flag
 *   sitemap.xml           in dist/                 generated at build time, only when the flag is on
 *   vercel.json           X-Robots-Tag header      the only committed copy; a header cannot depend on a build variable
 *
 * `bun tools/indexing.ts on|off` changes the flag and the vercel.json header together, so going public is one commit.
 * A test fails when the flag and vercel.json disagree. See docs/launch.md.
 */

/** Paths listed in sitemap.xml (indexable mode only). Every route that is a page of its own. */
export const SITEMAP_PATHS = ['/', '/about'] as const

/** Link preview crawlers: allowed in noindex mode too, or a shared link loses its card. */
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

export const NOINDEX_DIRECTIVES = 'noindex,nofollow'
export const INDEX_DIRECTIVES = 'index,follow'

/** Reads the flag from the text of site.json; anything but a boolean `indexable` is an error. */
export function parseIndexable(json: string): boolean {
  const value: unknown = JSON.parse(json)
  const flag = typeof value === 'object' && value !== null ? (value as { indexable?: unknown }).indexable : undefined
  if (typeof flag !== 'boolean') throw new Error('src/brand/site.json must hold {"indexable": true|false}')
  return flag
}

/** Content of `<meta name="robots">` and of the X-Robots-Tag header for a mode. */
export const robotsDirectives = (indexable: boolean): string => (indexable ? INDEX_DIRECTIVES : NOINDEX_DIRECTIVES)

/** Sets the content of `<meta name="robots">` for a mode. Throws when the page has no such tag. */
export function applyRobotsMeta(html: string, indexable: boolean): string {
  const pattern = /(<meta\s+name="robots"\s+content=")[^"]*(")/
  if (!pattern.test(html)) throw new Error('index.html has no <meta name="robots" content="..."> tag')
  return html.replace(pattern, `$1${robotsDirectives(indexable)}$2`)
}

/** robots.txt: noindex mode lets the preview bots in and keeps everybody else out; indexable mode allows all and names the sitemap. */
export function robotsTxt(indexable: boolean, site: string): string {
  if (indexable) return `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`
  const previews = PREVIEW_BOTS.map((bot) => `User-agent: ${bot}\nAllow: /\n`).join('\n')
  return [
    '# The site is not open for search engines yet (see docs/launch.md). Link preview bots may fetch the page and its share image.',
    previews,
    'User-agent: *\nDisallow: /\n',
  ].join('\n')
}

/** sitemap.xml with the absolute URL of every page. */
export function sitemapXml(site: string): string {
  const urls = SITEMAP_PATHS.map((path) => `  <url><loc>${site}${path}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

/** The vercel.json entry that sends noindex on every response, exactly as it is written in the file. */
export const NOINDEX_HEADER_BLOCK = `    {
      "source": "/(.*)",
      "headers": [{ "key": "X-Robots-Tag", "value": "${NOINDEX_DIRECTIVES}" }]
    },
`

/** Whether the text of vercel.json sends the noindex header. */
export const vercelSendsNoindex = (vercelJson: string): boolean => vercelJson.includes(NOINDEX_HEADER_BLOCK)

/** vercel.json text with the noindex header present (noindex mode) or removed (indexable mode). Idempotent. */
export function applyVercelHeader(vercelJson: string, indexable: boolean): string {
  const without = vercelJson.replace(NOINDEX_HEADER_BLOCK, '')
  if (indexable) return without
  const anchor = '  "headers": [\n'
  const at = without.indexOf(anchor)
  if (at === -1) throw new Error('vercel.json has no "headers": [ list to put the noindex header in')
  const end = at + anchor.length
  return `${without.slice(0, end)}${NOINDEX_HEADER_BLOCK}${without.slice(end)}`
}
