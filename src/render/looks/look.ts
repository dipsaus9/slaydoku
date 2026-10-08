/**
 * The object looks of the SLAY-17.8 proof of concept: 'now' is the shipped flat art, 'a2' draws oblique 3D blocks (from the front and above)
 * on the unchanged square grid, 'a3' draws isometric 30-degree blocks on a diamond grid. Only a few object kinds have blocks; the rest
 * keep the flat art in every look.
 */
export type Look = 'now' | 'a2' | 'a3'

export const LOOKS: readonly Look[] = ['now', 'a2', 'a3']

export const DEFAULT_LOOK: Look = 'now'

export const isLook = (value: unknown): value is Look => value === 'now' || value === 'a2' || value === 'a3'

/** The production host: the one place the Look switch must never show. Any other `*.vercel.app` host is a preview deployment. */
const PRODUCTION_HOSTS: readonly string[] = ['slaydoku.vercel.app']

/**
 * Where the Look entry in Options may show: `bun run dev`, `localhost` (also a production build served locally by the drivers) and Vercel
 * preview hosts. Never the live site, its custom domain or anything else.
 */
export function lookSwitchAllowed(dev: boolean, hostname: string): boolean {
  if (dev) return true
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1') return true
  return host.endsWith('.vercel.app') && !PRODUCTION_HOSTS.includes(host)
}

/** `lookSwitchAllowed` for the page that is running now. */
export function lookSwitchAvailable(): boolean {
  const hostname = typeof location === 'undefined' ? '' : location.hostname
  return lookSwitchAllowed(Boolean(import.meta.env?.DEV), hostname)
}
