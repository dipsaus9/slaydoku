import { isAboutPath } from '../about/route.ts'

/**
 * The canonical path for the page currently shown at `path` (SLAY-12.4): self-references for the
 * two routes src/brand/indexing.ts's SITEMAP_PATHS lists (/ and /about), the site root for every
 * other route (/play, /lab, ...) — those are not independently indexed, so pointing their canonical
 * at the root avoids inventing a canonical target the sitemap never names.
 */
export function canonicalPath(path: string): string {
  return isAboutPath(path) ? '/about' : '/'
}
