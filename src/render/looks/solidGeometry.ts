import { LINE } from './models.ts'
import { projectModel } from './project.ts'
import type { Solid } from './solid.ts'

const P = projectModel

/** Darker shade of a #rrggbb colour: the sides are darker than the top, a little less green and blue so shade stays warm. */
export function shade(hex: string, factor: number): string {
  const v = Number.parseInt(hex.slice(1), 16)
  const r = (v >> 16) & 255
  const g = (v >> 8) & 255
  const b = v & 255
  return `rgb(${Math.round(r * factor)},${Math.round(g * factor * 0.96)},${Math.round(b * factor * 0.94)})`
}

/** The ground shadow of an object: its cells pushed to the lower right (light from the top left), as one flat colour so overlaps do not darken. */
export function shadowRects(solid: Pick<Solid, 'cells'>): { x: number; y: number; w: number; h: number }[] {
  return solid.cells.map((c) => {
    const [x, y] = P(c.col * 100 + 14, c.row * 100 + 10, 0)
    return { x, y, w: 94, h: 94 }
  })
}

/** Screen box (model units, relative to the footprint's top-left) that an object's drawing covers: blocks, outline and ground shadow. */
export function solidBounds(solid: Pick<Solid, 'prims' | 'width' | 'height' | 'cells' | 'flat'>): { x0: number; y0: number; x1: number; y1: number } {
  const b = { x0: 0, y0: 0, x1: solid.width, y1: solid.height }
  const take = (x: number, y: number, pad = 0) => {
    b.x0 = Math.min(b.x0, x - pad)
    b.y0 = Math.min(b.y0, y - pad)
    b.x1 = Math.max(b.x1, x + pad)
    b.y1 = Math.max(b.y1, y + pad)
  }
  const half = LINE / 2 + 0.5
  for (const p of solid.prims) {
    if (p.kind === 'box') {
      for (const x of [p.x0, p.x1]) for (const y of [p.y0, p.y1]) for (const z of [p.z0, p.z1]) take(...P(x, y, z), half)
    } else if (p.kind === 'cylinder') {
      for (const z of [p.z0, p.z1]) for (const q of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) take(...P(p.x + q[0] * (z === p.z0 ? p.r : (p.r1 ?? p.r)), p.y + q[1] * (z === p.z0 ? p.r : (p.r1 ?? p.r)), z), half)
    } else if (p.kind === 'sphere') {
      const [cx, cy] = P(p.x, p.y, p.z)
      take(cx, cy, p.r + half)
    } else {
      for (const a of [0, 1, 2, 3]) {
        const ang = (a * Math.PI) / 2
        take(...(p.plane === 'xz' ? P(p.x + Math.cos(ang) * p.r, p.y, p.z + Math.sin(ang) * p.r) : P(p.x, p.y + Math.cos(ang) * p.r, p.z + Math.sin(ang) * p.r)), half + (p.ring ?? 0))
      }
    }
  }
  if (!solid.flat) for (const q of shadowRects(solid)) take(q.x + q.w, q.y + q.h, 6)
  return b
}
