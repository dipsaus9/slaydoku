import { pathSegments } from '../router/index.ts'

/** Where the daily flow is: the start screen, the puzzle of the day (optionally with its number in the URL), or a path the app does not know. */
export type Route = { kind: 'start' } | { kind: 'play'; n: number | null } | { kind: 'unknown' }

/**
 * `/` start screen, `/play` today's puzzle, `/play/<n>` the puzzle with that number (only the day on screen: there is no archive).
 * Everything else, the old `/level/...` paths included, is unknown and goes to `/`. `/about` and the dev-only `/lab` are handled above this.
 */
export function parseRoute(path: string): Route {
  const parts = pathSegments(path)
  if (!parts) return { kind: 'unknown' }
  if (parts.length === 0) return { kind: 'start' }
  if (parts[0] !== 'play') return { kind: 'unknown' }
  if (parts.length === 1) return { kind: 'play', n: null }
  if (parts.length === 2 && /^[1-9]\d{0,5}$/.test(parts[1]!)) return { kind: 'play', n: Number(parts[1]) }
  return { kind: 'unknown' }
}

export function routePath(route: Route): string {
  if (route.kind === 'play') return route.n === null ? '/play' : `/play/${route.n}`
  return '/'
}
