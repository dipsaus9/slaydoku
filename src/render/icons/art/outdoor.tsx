import type { ReactNode } from 'react'
import { Box, Disc, Oval, Shape, Stroke } from './shapes.tsx'
import { C, DETAIL, M, U, n } from './tokens.ts'

/** Car from above, bonnet to the north. Two cells long. */
export function car(): ReactNode {
  return (
    <>
      <Box x={6} y={40} w={12} h={32} r={4} fill={C.slate} sw={DETAIL} />
      <Box x={82} y={40} w={12} h={32} r={4} fill={C.slate} sw={DETAIL} />
      <Box x={6} y={132} w={12} h={32} r={4} fill={C.slate} sw={DETAIL} />
      <Box x={82} y={132} w={12} h={32} r={4} fill={C.slate} sw={DETAIL} />
      <Box x={14} y={M} w={72} h={188} r={28} fill={C.red} />
      <Box x={23} y={52} w={54} h={32} r={8} fill={C.sky} sw={DETAIL} />
      <Box x={25} y={88} w={50} h={46} r={8} fill={C.redDark} sw={DETAIL} />
      <Box x={23} y={138} w={54} h={24} r={8} fill={C.sky} sw={DETAIL} />
      <Disc x={29} y={22} r={6} fill={C.yellow} sw={DETAIL} />
      <Disc x={71} y={22} r={6} fill={C.yellow} sw={DETAIL} />
      <Disc x={29} y={180} r={5} fill={C.redDark} sw={DETAIL} />
      <Disc x={71} y={180} r={5} fill={C.redDark} sw={DETAIL} />
    </>
  )
}

/** Oil slick: a dark puddle with a couple of sheen patches. */
export function oilSlick(): ReactNode {
  return (
    <>
      <Shape
        d="M 50 14 C 72 10 92 30 84 52 C 90 72 70 92 50 86 C 30 94 12 76 18 52 C 8 30 28 18 50 14 Z"
        fill={C.slick}
      />
      <Shape d="M 34 36 C 42 28 56 30 58 38 C 52 44 40 46 34 36 Z" fill={C.lilac} stroke="none" />
      <Shape d="M 52 60 C 60 54 72 58 70 66 C 64 74 54 72 52 60 Z" fill={C.greenLight} stroke="none" />
    </>
  )
}

/** Potted plant from above: leaves around a terracotta pot. */
export function plant(): ReactNode {
  const leaves: ReactNode[] = []
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3 + Math.PI / 6
    const tip = 39
    const mid = 24
    const wing = 13
    const [ca, sa] = [Math.cos(a), Math.sin(a)]
    const c1 = [50 + ca * mid - sa * wing, 50 + sa * mid + ca * wing]
    const c2 = [50 + ca * mid + sa * wing, 50 + sa * mid - ca * wing]
    const t = [50 + ca * tip, 50 + sa * tip]
    leaves.push(
      <Shape
        key={k}
        d={`M 50 50 Q ${n(c1[0])} ${n(c1[1])} ${n(t[0])} ${n(t[1])} Q ${n(c2[0])} ${n(c2[1])} 50 50 Z`}
        fill={k % 2 === 0 ? C.green : C.greenLight}
        sw={DETAIL + 1}
      />,
    )
  }
  return (
    <>
      {leaves}
      <Disc x={50} y={50} r={13} fill={C.terracotta} />
      <Disc x={50} y={50} r={6} fill={C.woodDark} sw={2} />
    </>
  )
}

/** Tree canopy from above: a scalloped cloud with a light centre. */
export function tree(): ReactNode {
  const bumps = 9
  const inner = 33
  const ctrl = 51
  let d = ''
  for (let k = 0; k < bumps; k++) {
    const a0 = (k * 2 * Math.PI) / bumps
    const a1 = ((k + 1) * 2 * Math.PI) / bumps
    const am = (a0 + a1) / 2
    const p0 = [50 + Math.cos(a0) * inner, 50 + Math.sin(a0) * inner]
    const p1 = [50 + Math.cos(a1) * inner, 50 + Math.sin(a1) * inner]
    const c = [50 + Math.cos(am) * ctrl, 50 + Math.sin(am) * ctrl]
    d += `${k === 0 ? `M ${n(p0[0])} ${n(p0[1])} ` : ''}Q ${n(c[0])} ${n(c[1])} ${n(p1[0])} ${n(p1[1])} `
  }
  return (
    <>
      <Shape d={`${d}Z`} fill={C.green} />
      <Disc x={50} y={50} r={22} fill={C.greenLight} stroke="none" />
      <Disc x={50} y={50} r={7} fill={C.woodDark} sw={DETAIL} />
    </>
  )
}

/** A small flower bed: three blooms on green leaves. */
export function flowers(): ReactNode {
  const blooms: [number, number, string][] = [
    [32, 36, C.pink],
    [66, 32, C.yellow],
    [50, 68, C.lilac],
  ]
  return (
    <>
      <Oval x={30} y={52} rx={12} ry={6} fill={C.greenLight} sw={DETAIL} />
      <Oval x={70} y={54} rx={12} ry={6} fill={C.greenLight} sw={DETAIL} />
      {blooms.map(([x, y, colour]) => (
        <g key={`${x}-${y}`}>
          {[0, 1, 2, 3, 4].map((k) => {
            const a = (k * 2 * Math.PI) / 5 - Math.PI / 2
            return (
              <Disc
                key={k}
                x={n(x + Math.cos(a) * 11)}
                y={n(y + Math.sin(a) * 11)}
                r={8}
                fill={colour}
                sw={DETAIL}
              />
            )
          })}
          <Disc x={x} y={y} r={6} fill={C.gold} sw={DETAIL} />
        </g>
      ))}
    </>
  )
}

/** Painter's easel with a small canvas. */
export function easel(): ReactNode {
  return (
    <>
      <Stroke x1={34} y1={62} x2={22} y2={90} stroke={C.woodDark} sw={DETAIL + 2} />
      <Stroke x1={66} y1={62} x2={78} y2={90} stroke={C.woodDark} sw={DETAIL + 2} />
      <Stroke x1={50} y1={62} x2={50} y2={92} stroke={C.woodDark} sw={DETAIL + 2} />
      <Box x={22} y={10} w={56} h={46} r={3} fill={C.white} />
      <Shape d="M 22 46 Q 38 28 52 42 Q 62 34 78 44 L 78 56 L 22 56 Z" fill={C.greenLight} sw={DETAIL} />
      <Disc x={62} y={22} r={5} fill={C.yellow} sw={DETAIL} />
      <Box x={18} y={56} w={64} h={9} r={3} fill={C.wood} sw={DETAIL} />
    </>
  )
}

/** Statue: a bust on a square stone plinth. */
export function statue(): ReactNode {
  return (
    <>
      <Box x={12} y={12} w={76} h={76} r={7} fill={C.stone} />
      <Oval x={50} y={58} rx={26} ry={13} fill={C.white} sw={DETAIL + 1} />
      <Disc x={50} y={44} r={13} fill={C.white} sw={DETAIL + 1} />
    </>
  )
}

/** Garden table: round on one cell, a rounded slab on wider ones. */
export function gardenTable(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const r = Math.min(w, h) / 2 - M - 2
  return (
    <>
      <Box x={M + 2} y={M + 2} w={w - 2 * M - 4} h={h - 2 * M - 4} r={r} fill={C.cream} />
      <Box x={M + 16} y={M + 16} w={w - 2 * M - 32} h={h - 2 * M - 32} r={Math.max(r - 14, 4)} fill={C.creamLight} sw={DETAIL} />
    </>
  )
}

/** Garden bench: slatted seat with a backrest on the north side. */
export function bench(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  return (
    <>
      <Box x={M} y={12} w={w - 2 * M} h={20} r={5} fill={C.woodDark} />
      <Box x={M} y={34} w={w - 2 * M} h={h - 34 - 12} r={6} fill={C.woodLight} />
      <Stroke x1={M + 8} y1={54} x2={w - M - 8} y2={54} stroke={C.woodDark} sw={DETAIL} />
      <Stroke x1={M + 8} y1={70} x2={w - M - 8} y2={70} stroke={C.woodDark} sw={DETAIL} />
    </>
  )
}

