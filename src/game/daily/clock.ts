import { defaultStorage } from '../persistence.ts'
import type { StorageLike } from '../persistence.ts'

/**
 * The clock of the daily flow: the device clock (UTC, no server time, no clock check). For tests and the verification drivers there is
 * a date override, `?date=2026-10-15` in the URL or the localStorage key DATE_OVERRIDE_KEY, and it works ONLY in `bun run dev` or when the
 * page is served from `localhost`. A production build on any other host ignores both, always (`overrideAllowed`).
 */

/** URL query parameter of the override. */
export const DATE_PARAM = 'date'
/** localStorage key of the override (a URL parameter is copied into it, so a reload or a clean-URL navigation keeps it). */
export const DATE_OVERRIDE_KEY = 'slaydoku:dev-date'
/** Time of day of a date-only override: noon UTC, so the countdown to midnight is about twelve hours. */
const DEFAULT_HOUR = 12

/** The override may only be used in `bun run dev` (`import.meta.env.DEV`) or on the host `localhost`. */
export const overrideAllowed = (dev: boolean, hostname: string): boolean => dev || hostname === 'localhost'

/**
 * A date (`2026-10-15`, noon UTC) or a UTC date and time (`2026-10-15T23:59:50`, a trailing `Z` is fine) as ms since the epoch, or null when
 * the text is neither or not a real date.
 */
export function parseOverride(text: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?Z?$/.exec(text.trim())
  if (!match) return null
  const [, y, mo, d, h, mi, s] = match
  const hour = h === undefined ? DEFAULT_HOUR : Number(h)
  const minute = mi === undefined ? 0 : Number(mi)
  const second = s === undefined ? 0 : Number(s)
  const ms = Date.UTC(Number(y), Number(mo) - 1, Number(d), hour, minute, second)
  const date = new Date(ms)
  const same = date.getUTCFullYear() === Number(y) && date.getUTCMonth() === Number(mo) - 1 && date.getUTCDate() === Number(d)
  return same && hour < 24 && minute < 60 && second < 60 ? ms : null
}

export interface ClockEnv {
  /** `import.meta.env.DEV`. */
  dev: boolean
  hostname: string
  /** `location.search`, e.g. `?date=2026-10-15`. */
  search: string
  storage: StorageLike | null
  /** The device clock, ms. Default `Date.now`. */
  now?: () => number
}

/**
 * The override in effect, as the instant it starts at, or null. Returns null whenever `overrideAllowed` says no (the URL and the stored key
 * are not even read). A URL parameter wins over the stored key and is copied into it; `?date=off` (or an empty value) removes the key.
 */
export function readDateOverride(env: Pick<ClockEnv, 'dev' | 'hostname' | 'search' | 'storage'>): number | null {
  if (!overrideAllowed(env.dev, env.hostname)) return null
  let param: string | null = null
  try {
    param = new URLSearchParams(env.search).get(DATE_PARAM)
  } catch {
    param = null
  }
  try {
    if (param !== null) {
      if (param === '' || param === 'off') env.storage?.removeItem(DATE_OVERRIDE_KEY)
      else if (parseOverride(param) !== null) env.storage?.setItem(DATE_OVERRIDE_KEY, param)
      if (param === '' || param === 'off') return null
      const fromUrl = parseOverride(param)
      if (fromUrl !== null) return fromUrl
    }
    const stored = env.storage?.getItem(DATE_OVERRIDE_KEY)
    return stored ? parseOverride(stored) : null
  } catch {
    return null
  }
}

/**
 * The clock the app runs on: the device clock, or (dev and localhost only) the override instant that then moves on with real time from the
 * moment the page loaded. Returns ms since the epoch.
 */
export function createClock(env: ClockEnv): () => number {
  const real = env.now ?? Date.now
  const start = readDateOverride(env)
  if (start === null) return real
  const offset = start - real()
  return () => real() + offset
}

let shared: (() => number) | undefined
/** The clock of this page (made once, on first use, from the real environment). */
export function pageClock(): () => number {
  shared ??= createClock({ dev: import.meta.env.DEV, hostname: location.hostname, search: location.search, storage: defaultStorage() })
  return shared
}
