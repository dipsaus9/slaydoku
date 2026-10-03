import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ORIENTATIONS, applyMatrix, orientationMatrix } from '../orientation.ts'
import { Box, Disc, Feet, Oval, Shape, Stroke } from './shapes.tsx'
import { C, DETAIL, SW, U } from './tokens.ts'

const html = (node: React.ReactNode) => renderToStaticMarkup(<svg>{node}</svg>)

describe('shape opacity', () => {
  it('leaves markup untouched when opacity is not given', () => {
    expect(html(<Box x={1} y={2} w={3} h={4} fill={C.wood} />)).toBe(
      `<svg><rect x="1" y="2" width="3" height="4" rx="8" fill="${C.wood}" stroke="${C.ink}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round"></rect></svg>`,
    )
    expect(html(<Disc x={1} y={2} r={3} />)).not.toContain('opacity')
  })

  it('writes opacity on every primitive when given', () => {
    const all = html(
      <>
        <Box x={0} y={0} w={1} h={1} opacity={0.5} />
        <Disc x={0} y={0} r={1} opacity={0.5} />
        <Oval x={0} y={0} rx={1} ry={1} opacity={0.5} />
        <Stroke x1={0} y1={0} x2={1} y2={1} opacity={0.5} />
        <Shape d="M 0 0 L 1 1 Z" opacity={0.5} />
      </>,
    )
    expect(all.match(/opacity="0.5"/g)).toHaveLength(5)
  })

  it('draws no outline for a stroke of none', () => {
    const out = html(<Box x={0} y={0} w={1} h={1} stroke="none" />)
    expect(out).toContain('stroke="none"')
    expect(out).toContain('stroke-width="0"')
  })
})

describe('Feet', () => {
  function feet(cols: number, rows: number) {
    const markup = html(<Feet cols={cols} rows={rows} />)
    return [...markup.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)].map(
      (m) => ({ x: +m[1]!, y: +m[2]!, w: +m[3]!, h: +m[4]! }),
    )
  }

  it('draws four feet inside the footprint, stroke included', () => {
    for (const [cols, rows] of [[1, 1], [2, 1], [3, 2], [1, 3]] as const) {
      const f = feet(cols, rows)
      expect(f).toHaveLength(4)
      for (const r of f) {
        expect(r.x - DETAIL / 2).toBeGreaterThanOrEqual(0)
        expect(r.y - DETAIL / 2).toBeGreaterThanOrEqual(0)
        expect(r.x + r.w + DETAIL / 2).toBeLessThanOrEqual(cols * U)
        expect(r.y + r.h + DETAIL / 2).toBeLessThanOrEqual(rows * U)
      }
    }
  })

  it('is the same set of feet under all 8 orientations', () => {
    const cols = 3
    const rows = 2
    const key = (xs: number[]) => xs.map((v) => Math.round(v * 10) / 10).join(',')
    const base = feet(cols, rows)
    const baseSet = new Set(base.map((r) => key([r.x, r.y])))
    for (const o of ORIENTATIONS) {
      const swap = o.rotation === 90 || o.rotation === 270
      const m = orientationMatrix(cols, rows, o)
      const turned = base.map((r) => {
        const [x1, y1] = applyMatrix(m, r.x / U, r.y / U)
        const [x2, y2] = applyMatrix(m, (r.x + r.w) / U, (r.y + r.h) / U)
        return [Math.min(x1, x2) * U, Math.min(y1, y2) * U]
      })
      const expected = new Set(feet(swap ? rows : cols, swap ? cols : rows).map((r) => key([r.x, r.y])))
      expect(new Set(turned.map(([x, y]) => key([x!, y!])))).toEqual(expected)
    }
    expect(baseSet.size).toBe(4)
  })
})
