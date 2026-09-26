/** Tiny hex colour helpers for deriving shades and backdrops. */

function parse(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Blend `a` towards `b` by `t` (0 = a, 1 = b). Returns a #rrggbb string. */
export function mix(a: string, b: string, t: number): string {
  const pa = parse(a)
  const pb = parse(b)
  const out = pa.map((v, i) => Math.round(v + ((pb[i] as number) - v) * t))
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export const darken = (hex: string, t: number) => mix(hex, '#000000', t)
export const lighten = (hex: string, t: number) => mix(hex, '#ffffff', t)
