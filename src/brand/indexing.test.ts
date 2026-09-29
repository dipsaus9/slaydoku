import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  applyRobotsMeta,
  applyVercelHeader,
  NOINDEX_HEADER_BLOCK,
  parseIndexable,
  PREVIEW_BOTS,
  robotsDirectives,
  robotsTxt,
  SITEMAP_PATHS,
  sitemapXml,
  vercelSendsNoindex,
} from './indexing.ts'

const ROOT = join(import.meta.dirname, '../..')
const read = (file: string) => readFileSync(join(ROOT, file), 'utf8')
const SITE = 'https://slaydoku.example'

describe('the switch file', () => {
  it('holds a boolean flag, true (indexable) now that the site is public', () => {
    expect(parseIndexable(read('src/brand/site.json'))).toBe(true)
  })

  it('rejects anything else', () => {
    for (const bad of ['{}', '{"indexable":"yes"}', '[]', 'null', '{"indexable":1}']) expect(() => parseIndexable(bad), bad).toThrow(/indexable/)
  })
})

describe('all copies of the decision agree with the flag', () => {
  const indexable = parseIndexable(read('src/brand/site.json'))

  it('vercel.json sends the X-Robots-Tag noindex header exactly when the flag is off', () => {
    expect(vercelSendsNoindex(read('vercel.json'))).toBe(!indexable)
  })

  it('the source index.html carries the safe default: noindex', () => {
    expect(/<meta name="robots" content="([^"]*)"/.exec(read('index.html'))?.[1]).toBe('noindex,nofollow')
  })

  it('there is no static robots.txt or sitemap.xml in public/: both are generated from the flag at build time', () => {
    for (const file of ['public/robots.txt', 'public/sitemap.xml']) expect(() => read(file), file).toThrow()
  })
})

describe('robots meta', () => {
  const page = '<head>\n<meta name="robots" content="whatever" />\n</head>'

  it('is noindex,nofollow or index,follow', () => {
    expect(robotsDirectives(false)).toBe('noindex,nofollow')
    expect(robotsDirectives(true)).toBe('index,follow')
    expect(applyRobotsMeta(page, false)).toContain('<meta name="robots" content="noindex,nofollow" />')
    expect(applyRobotsMeta(page, true)).toContain('<meta name="robots" content="index,follow" />')
  })

  it('fails loudly when the tag is missing', () => {
    expect(() => applyRobotsMeta('<head></head>', true)).toThrow(/robots/)
  })
})

describe('robots.txt', () => {
  it('noindex mode: preview bots may fetch, everybody else is disallowed, no sitemap', () => {
    const text = robotsTxt(false, SITE)
    for (const bot of PREVIEW_BOTS) expect(text).toContain(`User-agent: ${bot}\nAllow: /\n`)
    expect(text).toMatch(/User-agent: \*\nDisallow: \/\n$/)
    expect(text).not.toMatch(/sitemap/i)
  })

  it('indexable mode: everybody is allowed and the sitemap is named, no Disallow', () => {
    const text = robotsTxt(true, SITE)
    expect(text).toContain('User-agent: *\nAllow: /')
    expect(text).toContain(`Sitemap: ${SITE}/sitemap.xml`)
    expect(text).not.toContain('Disallow')
  })
})

describe('sitemap.xml', () => {
  it('lists the absolute URL of every page, starting with /', () => {
    const xml = sitemapXml(SITE)
    expect(SITEMAP_PATHS[0]).toBe('/')
    expect(SITEMAP_PATHS).toContain('/about')
    for (const path of SITEMAP_PATHS) expect(xml).toContain(`<loc>${SITE}${path}</loc>`)
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/)
  })
})

describe('vercel.json header', () => {
  const vercel = read('vercel.json')

  it('is removed and put back without touching anything else (round trip)', () => {
    const on = applyVercelHeader(vercel, true)
    expect(vercelSendsNoindex(on)).toBe(false)
    expect(on).not.toContain('X-Robots-Tag')
    const off = applyVercelHeader(on, false)
    expect(vercelSendsNoindex(off)).toBe(true)
    expect(off).toBe(applyVercelHeader(vercel, false))
    expect(JSON.parse(on).headers.length).toBe(JSON.parse(off).headers.length - 1)
    expect(JSON.parse(on).ignoreCommand).toBe(JSON.parse(off).ignoreCommand)
  })

  it('is idempotent in both directions', () => {
    expect(applyVercelHeader(applyVercelHeader(vercel, true), true)).toBe(applyVercelHeader(vercel, true))
    expect(applyVercelHeader(applyVercelHeader(vercel, false), false)).toBe(applyVercelHeader(vercel, false))
  })

  it('the block is valid JSON in the list', () => {
    expect(JSON.parse(`[${NOINDEX_HEADER_BLOCK.trim().replace(/,$/, '')}]`)[0].headers[0]).toEqual({ key: 'X-Robots-Tag', value: 'noindex,nofollow' })
  })
})
