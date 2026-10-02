const ALLOWED = new Set(['https://slaydoku.nl', 'https://www.slaydoku.nl', 'https://slaydoku.vercel.app'])

export function isAllowedOrigin(origin: string | null, dev = false): origin is string {
  if (!origin) return false
  if (ALLOWED.has(origin)) return true
  return dev && /^http:\/\/localhost(:\d+)?$/.test(origin)
}

/** CORS headers for an allowed origin, none at all otherwise. */
export function corsHeaders(origin: string | null, dev = false): Record<string, string> {
  if (!isAllowedOrigin(origin, dev)) return {}
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, DELETE, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'origin',
  }
}
