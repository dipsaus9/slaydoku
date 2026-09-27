import { isAboutPath } from '../about/route.ts'
import { parseRoute } from '../daily/route.ts'

/** The site name: the whole title on the start screen, and the suffix everywhere else. */
export const SITE_TITLE = 'Slaydoku'

/** English wording of the tab titles that are not the site name. */
export const TITLE_EN = {
  /** `Puzzle #43 – Slaydoku` while playing. */
  puzzle: (n: number) => `Puzzle #${n}`,
  /** `About – Slaydoku` on the About page. */
  about: 'About',
} as const

/** What the title of a screen is read from. */
export interface TitleContext {
  /** Number of the puzzle on the clock today, or null when nothing is scheduled today (before the launch, after the last day). */
  puzzleNumber: number | null
}

const withSite = (screen: string): string => `${screen} – ${SITE_TITLE}`

/**
 * The tab title of what the path shows. Mirrors the screens: the puzzle route names today's puzzle, `/about` the About page; the
 * start screen, an unknown path (`/lab`, the old `/level/...`) and a puzzle route with nothing scheduled get the site name.
 */
export function screenTitle(path: string, context: TitleContext): string {
  if (isAboutPath(path)) return withSite(TITLE_EN.about)
  const route = parseRoute(path)
  if (route.kind === 'play' && context.puzzleNumber !== null) return withSite(TITLE_EN.puzzle(route.n ?? context.puzzleNumber))
  return SITE_TITLE
}
