import type { Plugin } from 'vite'
import { applyRobotsMeta, robotsTxt, sitemapXml } from './indexing.ts'

/** Environment variables the site URL is derived from (a subset of `process.env`). */
export interface SiteEnv {
  VERCEL_PROJECT_PRODUCTION_URL?: string
  VERCEL_URL?: string
}

export const LOCAL_SITE_URL = 'http://localhost:5173'

/** Meta tags whose `content` must be an absolute URL, keyed by their `property` or `name` attribute. */
const ABSOLUTE_META = ['og:url', 'og:image', 'twitter:image'] as const

/**
 * Origin of the deployed site, no trailing slash. Vercel exposes bare hosts (`slaydoku.vercel.app`), so `https://`
 * is added when a value carries no protocol. Order: production URL, then the deployment URL, then localhost.
 */
export function resolveSiteUrl(env: SiteEnv): string {
  const host = [env.VERCEL_PROJECT_PRODUCTION_URL, env.VERCEL_URL]
    .map((value) => value?.trim())
    .find((value): value is string => Boolean(value))
  if (!host) return LOCAL_SITE_URL
  const origin = /^https?:\/\//i.test(host) ? host : `https://${host}`
  return origin.replace(/\/+$/, '')
}

function metaContentPattern(key: string): RegExp {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(<meta\\s+(?:property|name)="${escaped}"\\s+content=")([^"]*)(")`)
}

function toAbsolute(site: string, value: string): string {
  return new URL(value, `${site}/`).href
}

/** Rewrites og:url, og:image and twitter:image content to absolute URLs on `site`. Absolute values stay as they are. */
export function injectSiteUrls(html: string, site: string): string {
  return ABSOLUTE_META.reduce(
    (out, key) =>
      out.replace(metaContentPattern(key), (_match, open: string, value: string, close: string) =>
        `${open}${toAbsolute(site, value)}${close}`,
      ),
    html,
  )
}

/** Everything wrong with the head of a finished page: relative social URLs, missing tags, leftover placeholders. */
export function findHtmlProblems(html: string): string[] {
  const problems: string[] = []
  for (const key of ABSOLUTE_META) {
    const value = metaContentPattern(key).exec(html)?.[2]
    if (value === undefined) problems.push(`${key} meta tag is missing`)
    else if (!/^https?:\/\//.test(value)) problems.push(`${key} is not an absolute URL: ${value}`)
  }
  const placeholder = /%[A-Z][A-Z0-9_]*%|\{\{[^}]*\}\}|__[A-Z][A-Z0-9_]*__|\bundefined\b/.exec(html)
  if (placeholder) problems.push(`placeholder token left in html: ${placeholder[0]}`)
  return problems
}

/**
 * Vite plugin: fills the absolute social URLs and the robots meta tag of index.html at build (and dev) time and fails on a bad
 * result, and adds robots.txt (and, in indexable mode only, sitemap.xml) to the build output. `indexable` comes from
 * src/brand/site.json (see indexing.ts).
 */
export function siteMetaPlugin(env: SiteEnv, indexable = false): Plugin {
  const site = resolveSiteUrl(env)
  return {
    name: 'slaydoku:site-meta',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const out = applyRobotsMeta(injectSiteUrls(html, site), indexable)
        const problems = findHtmlProblems(out)
        if (problems.length > 0) throw new Error(`index.html head is invalid:\n- ${problems.join('\n- ')}`)
        return out
      },
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(indexable, site) })
      if (indexable) this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(site) })
    },
  }
}
