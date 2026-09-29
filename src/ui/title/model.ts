import { formatDayMonth } from '../../schedule/index.ts'
import { isAboutPath } from '../about/route.ts'
import { parseRoute } from '../daily/route.ts'

/** The site name: the whole title on the start screen, and the suffix everywhere else. */
export const SITE_TITLE = 'Slaydoku'

/** English wording of the tab titles that are not the site name. */
export const TITLE_EN = {
  /** `Puzzle of 29 September – Slaydoku` while playing (SLAY-10.2: a date-based label, not the puzzle number). */
  puzzle: (date: string) => `Puzzle of ${formatDayMonth(date)}`,
  /** `About – Slaydoku` on the About page. */
  about: 'About',
} as const

/** What the title of a screen is read from. */
export interface TitleContext {
  /** UTC date of the puzzle on the clock today, or null when nothing is scheduled today (before the launch, after the last day). */
  puzzleDate: string | null
}

const withSite = (screen: string): string => `${screen} – ${SITE_TITLE}`

/**
 * The tab title of what the path shows. Mirrors the screens: the puzzle route names today's puzzle, `/about` the About page; the
 * start screen, an unknown path (`/lab`, the old `/level/...`) and a puzzle route with nothing scheduled get the site name.
 * `route.n` (an explicit `/play/<n>` in the URL) is not resolved to a date here: there is no archive, so a mismatched `n` is refused
 * and sent back to `/` by the daily flow anyway (see `route.ts`) — the tab title just follows `context.puzzleDate`.
 */
export function screenTitle(path: string, context: TitleContext): string {
  if (isAboutPath(path)) return withSite(TITLE_EN.about)
  const route = parseRoute(path)
  if (route.kind === 'play' && context.puzzleDate !== null) return withSite(TITLE_EN.puzzle(context.puzzleDate))
  return SITE_TITLE
}
