import type { Level } from '../levels/registry.ts'
import type { Progress } from '../levels/progress.ts'
import { resolveRoute, parseRoute } from '../levels/route.ts'

/** The site name: the whole title on the level list, and the suffix everywhere else. */
export const SITE_TITLE = 'Slaydoku'

/** Dutch wording of the tab titles that are not a level name. */
export const TITLE_NL = {
  /** `<level> opgelost – Slaydoku` on the solved screen. */
  solved: (levelTitle: string) => `${levelTitle} opgelost`,
} as const

/** What the title of a screen is read from. */
export interface TitleContext {
  /** Levels in play order. */
  levels: readonly Level[]
  progress: Progress
}

const withSite = (screen: string): string => `${screen} – ${SITE_TITLE}`

/**
 * The tab title of what the path shows. Mirrors the screens: a path the app refuses (locked or
 * unknown level, unsolved solved screen) shows the level list, so it gets the list's title; so
 * does any path the app does not know (`/lab`, junk).
 */
export function screenTitle(path: string, context: TitleContext): string {
  const { route } = resolveRoute(parseRoute(path), context.levels, context.progress)
  if (route.kind === 'list') return SITE_TITLE
  const level = context.levels.find((candidate) => candidate.id === route.levelId)
  if (!level) return SITE_TITLE
  return withSite(route.kind === 'solved' ? TITLE_NL.solved(level.title) : level.title)
}
