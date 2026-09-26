import type { Cell } from '../../../engine/model/index.ts'

// Geometry helpers for the footprint-bounds test (same approach as icons.test.tsx).

/** Points of every drawn shape, padded by half its stroke, as [x, y] pairs. */
export function shapeExtents(markup: string): { points: [number, number][]; pad: number }[] {
  const out: { points: [number, number][]; pad: number }[] = []
  const tag = /<(rect|circle|ellipse|line|polygon|polyline|path)\b([^>]*?)\/?>/g
  for (const match of markup.matchAll(tag)) {
    const name = match[1]!
    const attrs: Record<string, string> = {}
    for (const a of match[2]!.matchAll(/([\w-]+)="([^"]*)"/g)) attrs[a[1]!] = a[2]!
    const num = (k: string) => Number(attrs[k] ?? 0)
    const stroked = attrs.stroke !== undefined && attrs.stroke !== 'none'
    const pad = stroked ? num('stroke-width') / 2 : 0
    const points: [number, number][] = []
    if (name === 'rect') {
      points.push([num('x'), num('y')], [num('x') + num('width'), num('y') + num('height')])
    } else if (name === 'circle') {
      points.push([num('cx') - num('r'), num('cy') - num('r')], [num('cx') + num('r'), num('cy') + num('r')])
    } else if (name === 'ellipse') {
      points.push([num('cx') - num('rx'), num('cy') - num('ry')], [num('cx') + num('rx'), num('cy') + num('ry')])
    } else if (name === 'line') {
      points.push([num('x1'), num('y1')], [num('x2'), num('y2')])
    } else if (name === 'polygon' || name === 'polyline') {
      const v = attrs.points!.trim().split(/[\s,]+/).map(Number)
      for (let i = 0; i < v.length; i += 2) points.push([v[i]!, v[i + 1]!])
    } else {
      points.push(...pathPoints(attrs.d!))
    }
    out.push({ points, pad })
  }
  return out
}

/** Vertices plus sampled curve points of an absolute M/L/H/V/C/Q/Z path. */
function pathPoints(d: string): [number, number][] {
  const tokens = d.match(/[MLHVCQZ]|-?\d*\.?\d+/g)!
  const pts: [number, number][] = []
  let i = 0
  let cmd = ''
  let cur: [number, number] = [0, 0]
  let start: [number, number] = [0, 0]
  const read = () => Number(tokens[i++])
  while (i < tokens.length) {
    if (/[A-Z]/.test(tokens[i]!)) cmd = tokens[i++]!
    if (cmd === 'Z') {
      cur = start
      continue
    }
    if (cmd === 'M' || cmd === 'L') {
      cur = [read(), read()]
      if (cmd === 'M') start = cur
      pts.push(cur)
      if (cmd === 'M') cmd = 'L'
    } else if (cmd === 'H') {
      cur = [read(), cur[1]]
      pts.push(cur)
    } else if (cmd === 'V') {
      cur = [cur[0], read()]
      pts.push(cur)
    } else if (cmd === 'Q') {
      const c: [number, number] = [read(), read()]
      const p: [number, number] = [read(), read()]
      for (let t = 0.125; t <= 1; t += 0.125) {
        const u = 1 - t
        pts.push([u * u * cur[0] + 2 * u * t * c[0] + t * t * p[0], u * u * cur[1] + 2 * u * t * c[1] + t * t * p[1]])
      }
      cur = p
    } else if (cmd === 'C') {
      const c1: [number, number] = [read(), read()]
      const c2: [number, number] = [read(), read()]
      const p: [number, number] = [read(), read()]
      for (let t = 0.125; t <= 1; t += 0.125) {
        const u = 1 - t
        pts.push([
          u ** 3 * cur[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * p[0],
          u ** 3 * cur[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * p[1],
        ])
      }
      cur = p
    } else {
      throw new Error(`unsupported path command ${cmd}`)
    }
  }
  return pts
}

export function insideCells(x: number, y: number, cells: readonly Cell[]): boolean {
  const eps = 1e-6
  return cells.some(
    (c) => x >= c.col * 100 - eps && x <= (c.col + 1) * 100 + eps && y >= c.row * 100 - eps && y <= (c.row + 1) * 100 + eps,
  )
}
