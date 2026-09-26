import { pathSegments } from '../router/index.ts'
import type { Level } from './registry.ts'
import { isUnlocked } from './progress.ts'
import type { Progress } from './progress.ts'

/** Where the app is: the list, one puzzle, or the solved screen of a level. */
export type Route =
  | { kind: 'list' }
  | { kind: 'play'; levelId: string }
  | { kind: 'solved'; levelId: string }

export type Refusal = 'locked' | 'unknown' | 'unsolved'

/** `/` list, `/level/<id>` puzzle, `/level/<id>/solved` solved screen. Anything else: the list. */
export function parseRoute(path: string): Route {
  const parts = pathSegments(path)
  if (!parts || parts[0] !== 'level' || parts[1] === undefined) return { kind: 'list' }
  if (parts.length === 2) return { kind: 'play', levelId: parts[1] }
  if (parts.length === 3 && parts[2] === 'solved') return { kind: 'solved', levelId: parts[1] }
  return { kind: 'list' }
}

export function routePath(route: Route): string {
  if (route.kind === 'list') return '/'
  const id = encodeURIComponent(route.levelId)
  return route.kind === 'play' ? `/level/${id}` : `/level/${id}/solved`
}

/** Whether a path is exactly the level list (`/`); any other path that parses to the list is unknown. */
export const isListPath = (path: string): boolean => pathSegments(path)?.length === 0

/**
 * What may actually be shown. A puzzle of a locked level, an unknown level, or the solved screen
 * of an unsolved level is refused and becomes the list (with the reason).
 */
export function resolveRoute(
  route: Route,
  levels: readonly Level[],
  progress: Progress,
): { route: Route; refused?: Refusal } {
  if (route.kind === 'list') return { route }
  const index = levels.findIndex((level) => level.id === route.levelId)
  if (index === -1) return { route: { kind: 'list' }, refused: 'unknown' }
  if (route.kind === 'solved') {
    return route.levelId in progress.solved ? { route } : { route: { kind: 'list' }, refused: 'unsolved' }
  }
  return isUnlocked(levels, progress, index) ? { route } : { route: { kind: 'list' }, refused: 'locked' }
}
