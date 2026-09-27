import { LOCAL_SITE_URL } from '../brand/site.ts'

/**
 * Set at build time by `define` in vite.config.ts from `resolveSiteUrl(process.env)` (VERCEL_PROJECT_PRODUCTION_URL, then
 * VERCEL_URL, then localhost), the same source the social meta tags use. Absent in tests and in a bare `vite` dev server config.
 */
declare const __SITE_URL__: string | undefined

/** Origin of the deployed site, no trailing slash: one constant for everything a share carries (text and card). */
export const SITE_URL: string = typeof __SITE_URL__ === 'string' && __SITE_URL__ !== '' ? __SITE_URL__ : LOCAL_SITE_URL

/** The site as shown to people: the host without protocol (`slaydoku.vercel.app`). */
export function siteLabel(siteUrl: string = SITE_URL): string {
  try {
    return new URL(siteUrl).host
  } catch {
    return siteUrl.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
  }
}
