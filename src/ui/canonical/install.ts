import { SITE_URL } from '../../share/site.ts'
import { getRouter } from '../router/index.ts'
import type { Router } from '../router/index.ts'
import { canonicalPath } from './model.ts'

export interface CanonicalLinkOptions {
  /** The router to follow. Default: the router of the page. */
  router?: Pick<Router, 'path' | 'subscribe'>
  /** The document whose canonical link is read. Default: the global one. */
  doc?: Pick<Document, 'querySelector'>
}

/**
 * Keeps `<link rel="canonical">` in step with the path: once now, and on every navigation (SLAY-12.4).
 * The server always sends the same static index.html for every route (a single-file SPA; vercel.json
 * rewrites every path to it, and tools/check-share.ts asserts that invariant), with a root-relative
 * canonical as the safe pre-hydration default. This is what makes /about self-canonicalize correctly
 * for a crawler that executes JavaScript (Google's does) instead of every route pointing at "/".
 * No React: same pattern as installScreenTitles (src/ui/title/install.ts). Returns a stop function.
 */
export function installCanonicalLink(options: CanonicalLinkOptions = {}): () => void {
  const router = options.router ?? getRouter()
  const doc = options.doc ?? document

  const update = (): void => {
    doc.querySelector('link[rel="canonical"]')?.setAttribute('href', `${SITE_URL}${canonicalPath(router.path())}`)
  }

  const unsubscribe = router.subscribe(update)
  update()
  return unsubscribe
}
