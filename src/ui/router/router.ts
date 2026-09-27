/*
 * The one router of the app: History API paths (`/`, `/play`, `/play/<n>`, `/about`,
 * and `/lab` in dev). `pushState` and `replaceState` fire no event, so every
 * navigation goes through here and tells the subscribers; `popstate` (back, forward) does the same.
 * the route parsers stay with their screens (daily, lab); they read the path from here.
 */

/** The part of `window` the router uses, so tests can hand it a fake. */
export interface RouterWindow {
  location: Pick<Location, 'pathname' | 'hash'>
  history: Pick<History, 'pushState' | 'replaceState'>
  addEventListener: (type: 'popstate' | 'hashchange', listener: () => void) => void
  removeEventListener: (type: 'popstate' | 'hashchange', listener: () => void) => void
}

export interface NavigateOptions {
  /** Replace the current history entry instead of adding one (redirects). */
  replace?: boolean
}

export interface Router {
  /** The current path, `location.pathname` (percent-encoded as the browser holds it). */
  path: () => string
  navigate: (path: string, options?: NavigateOptions) => void
  /** Calls `listener` after every navigation, back or forward. Returns the unsubscribe function. */
  subscribe: (listener: () => void) => () => void
  /** Rewrites an old `#/...` URL to its clean path, once. True when it did. */
  migrateLegacyHash: () => boolean
}

/**
 * The clean path an old hash URL stands for, or null when the hash is not an old route.
 * `#/play` -> `/play`, `#/` -> `/`. Anything not starting with `#/` is left alone.
 */
export function legacyHashPath(hash: string): string | null {
  return hash.startsWith('#/') ? hash.slice(1) : null
}

/** Path segments, decoded. Null when a segment is not valid percent-encoding. */
export function pathSegments(path: string): string[] | null {
  try {
    return path.split('/').filter(Boolean).map(decodeURIComponent)
  } catch {
    return null
  }
}

export function createRouter(win: RouterWindow): Router {
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())

  const migrateLegacyHash = (): boolean => {
    const path = legacyHashPath(win.location.hash)
    if (path === null) return false
    win.history.replaceState(null, '', path)
    return true
  }
  const onHistory = () => {
    migrateLegacyHash()
    emit()
  }

  return {
    path: () => win.location.pathname,
    navigate(path, { replace = false } = {}) {
      if (path === win.location.pathname && win.location.hash === '') return
      if (replace) win.history.replaceState(null, '', path)
      else win.history.pushState(null, '', path)
      emit()
    },
    subscribe(listener) {
      if (listeners.size === 0) {
        win.addEventListener('popstate', onHistory)
        win.addEventListener('hashchange', onHistory)
      }
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0) {
          win.removeEventListener('popstate', onHistory)
          win.removeEventListener('hashchange', onHistory)
        }
      }
    },
    migrateLegacyHash,
  }
}

/** What a click on an `<a>` looks like to the router. */
export interface ClickLike {
  button: number
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  defaultPrevented: boolean
}

/**
 * True for a plain left click on an in-app link: the router takes it over. Anything else (right
 * click, middle click, modifier keys for a new tab or window, `target`, `download`, another origin)
 * is left to the browser, so "open in new tab" keeps working.
 */
export function shouldIntercept(
  event: ClickLike,
  anchor: { target?: string; download?: boolean; origin?: string },
  currentOrigin: string,
): boolean {
  if (event.defaultPrevented || event.button !== 0) return false
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  if (anchor.target && anchor.target !== '_self') return false
  if (anchor.download) return false
  return anchor.origin === undefined || anchor.origin === currentOrigin
}

let shared: Router | undefined
/** The router of the page (created on first use, so importing this in a test without a window is fine). */
export function getRouter(): Router {
  shared ??= createRouter(window)
  return shared
}

export const navigate = (path: string, options?: NavigateOptions): void => getRouter().navigate(path, options)
export const subscribe = (listener: () => void): (() => void) => getRouter().subscribe(listener)
export const currentPath = (): string => getRouter().path()
