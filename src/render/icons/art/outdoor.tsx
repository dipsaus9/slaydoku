import type { ReactNode } from 'react'
import { Box, Disc, Feet, Oval, Shape, Stroke } from './shapes.tsx'
import { C, DETAIL, M, U, n } from './tokens.ts'

/**
 * SLAY-16.5: the outdoor art with interior detail. Rotation-safe detail only, no baked light or
 * shadow (the wrapper filter adds both). The car's wheels are its feet; the oil slick lies flat
 * on the ground (no feet); tree, plant and flowers are living things seen from above and carry
 * no feet.
 */

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
      {/* bonnet and boot centre seams */}
      <Stroke x1={50} y1={16} x2={50} y2={44} stroke={C.redDark} sw={DETAIL} opacity={0.8} />
      <Stroke x1={50} y1={168} x2={50} y2={186} stroke={C.redDark} sw={DETAIL} opacity={0.8} />
      {/* door seams, roof rails, windscreen glints, wing mirrors */}
      <Stroke x1={22} y1={100} x2={22} y2={122} stroke={C.redDark} sw={DETAIL} opacity={0.9} />
      <Stroke x1={78} y1={100} x2={78} y2={122} stroke={C.redDark} sw={DETAIL} opacity={0.9} />
      <Stroke x1={32} y1={95} x2={68} y2={95} stroke={C.red} sw={DETAIL} opacity={0.9} />
      <Stroke x1={32} y1={127} x2={68} y2={127} stroke={C.red} sw={DETAIL} opacity={0.9} />
      <Stroke x1={30} y1={60} x2={46} y2={60} stroke={C.white} sw={DETAIL} opacity={0.8} />
      <Stroke x1={30} y1={146} x2={44} y2={146} stroke={C.white} sw={DETAIL} opacity={0.8} />
      <Disc x={12} y={86} r={4} fill={C.redDark} sw={DETAIL} />
      <Disc x={88} y={86} r={4} fill={C.redDark} sw={DETAIL} />
      <Disc x={29} y={22} r={6} fill={C.yellow} sw={DETAIL} />
      <Disc x={71} y={22} r={6} fill={C.yellow} sw={DETAIL} />
      <Disc x={29} y={22} r={2} fill={C.yellowLight} stroke="none" />
      <Disc x={71} y={22} r={2} fill={C.yellowLight} stroke="none" />
      <Disc x={29} y={180} r={5} fill={C.redDark} sw={DETAIL} />
      <Disc x={71} y={180} r={5} fill={C.redDark} sw={DETAIL} />
    </>
  )
}

/** Oil slick: a dark puddle with sheen patches. Flat on the ground: no feet. */
export function oilSlick(): ReactNode {
  return (
    <>
      <Shape
        d="M 50 14 C 72 10 92 30 84 52 C 90 72 70 92 50 86 C 30 94 12 76 18 52 C 8 30 28 18 50 14 Z"
        fill={C.slick}
      />
      {/* inner ripple: a smaller puddle outline inside the edge */}
      <Shape
        d="M 50 24 C 66 22 80 36 74 52 C 78 66 64 78 50 76 C 36 82 24 68 28 52 C 22 36 36 28 50 24 Z"
        fill="none"
        stroke={C.purpleDark}
        sw={DETAIL}
        opacity={0.55}
      />
      <Shape d="M 34 36 C 42 28 56 30 58 38 C 52 44 40 46 34 36 Z" fill={C.lilac} stroke="none" />
      <Shape d="M 52 60 C 60 54 72 58 70 66 C 64 74 54 72 52 60 Z" fill={C.greenLight} stroke="none" />
      <Shape d="M 60 28 C 66 26 72 32 70 38 C 66 40 60 36 60 28 Z" fill={C.sky} stroke="none" opacity={0.8} />
      <Shape d="M 26 58 C 30 52 38 54 38 60 C 34 66 28 64 26 58 Z" fill={C.pink} stroke="none" opacity={0.8} />
      <Disc x={46} y={54} r={2.5} fill={C.skyLight} stroke="none" opacity={0.8} />
    </>
  )
}

/** Potted plant from above: saucer, eight veined leaves, a pot with soil. */
export function plant(): ReactNode {
  const leaves: ReactNode[] = []
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + Math.PI / 8
    const tip = 41
    const mid = 26
    const wing = 11
    const [ca, sa] = [Math.cos(a), Math.sin(a)]
    const c1 = [50 + ca * mid - sa * wing, 50 + sa * mid + ca * wing]
    const c2 = [50 + ca * mid + sa * wing, 50 + sa * mid - ca * wing]
    const t = [50 + ca * tip, 50 + sa * tip]
    leaves.push(
      <Shape
        key={`leaf-${k}`}
        d={`M 50 50 Q ${n(c1[0])} ${n(c1[1])} ${n(t[0])} ${n(t[1])} Q ${n(c2[0])} ${n(c2[1])} 50 50 Z`}
        fill={k % 2 === 0 ? C.green : C.greenLight}
        sw={DETAIL + 0.5}
      />,
      <Stroke
        key={`vein-${k}`}
        x1={n(50 + ca * 10)}
        y1={n(50 + sa * 10)}
        x2={n(50 + ca * 34)}
        y2={n(50 + sa * 34)}
        stroke={C.greenDark}
        sw={2.2}
        opacity={0.85}
      />,
    )
  }
  return (
    <>
      <Disc x={50} y={50} r={33} fill={C.terraDark} sw={DETAIL} opacity={0.9} />
      {leaves}
      <Disc x={50} y={50} r={14} fill={C.terracotta} sw={4} />
      <Disc x={50} y={50} r={8.5} fill={C.soil} sw={2.5} />
      <Disc x={46} y={46} r={2.5} fill={C.wood} stroke="none" />
    </>
  )
}

/** Tree canopy from above: a scalloped cloud, leaf clumps, spoked branches and a trunk. */
export function tree(): ReactNode {
  const bumps = 9
  const inner = 33
  const ctrl = 51
  let d = ''
  const clumps: ReactNode[] = []
  const spokes: ReactNode[] = []
  for (let k = 0; k < bumps; k++) {
    const a0 = (k * 2 * Math.PI) / bumps
    const a1 = ((k + 1) * 2 * Math.PI) / bumps
    const am = (a0 + a1) / 2
    const p0 = [50 + Math.cos(a0) * inner, 50 + Math.sin(a0) * inner]
    const p1 = [50 + Math.cos(a1) * inner, 50 + Math.sin(a1) * inner]
    const c = [50 + Math.cos(am) * ctrl, 50 + Math.sin(am) * ctrl]
    d += `${k === 0 ? `M ${n(p0[0])} ${n(p0[1])} ` : ''}Q ${n(c[0])} ${n(c[1])} ${n(p1[0])} ${n(p1[1])} `
    clumps.push(
      <Disc
        key={`clump-${k}`}
        x={n(50 + Math.cos(am) * 33)}
        y={n(50 + Math.sin(am) * 33)}
        r={7}
        fill={C.greenDark}
        stroke="none"
        opacity={0.55}
      />,
      <Disc
        key={`glint-${k}`}
        x={n(50 + Math.cos(a0) * 35)}
        y={n(50 + Math.sin(a0) * 35)}
        r={2.2}
        fill={C.yellowLight}
        stroke="none"
        opacity={0.8}
      />,
    )
    spokes.push(
      <Stroke
        key={`spoke-${k}`}
        x1={n(50 + Math.cos(a0) * 9)}
        y1={n(50 + Math.sin(a0) * 9)}
        x2={n(50 + Math.cos(a0) * 22)}
        y2={n(50 + Math.sin(a0) * 22)}
        stroke={C.woodDark}
        sw={DETAIL}
        opacity={0.6}
      />,
    )
  }
  return (
    <>
      <Shape d={`${d}Z`} fill={C.green} />
      {clumps}
      <Disc x={50} y={50} r={22} fill={C.greenLight} stroke="none" opacity={0.9} />
      {spokes}
      <Disc x={50} y={50} r={8} fill={C.woodDark} sw={DETAIL} />
      <Disc x={50} y={50} r={3.5} fill={C.wood} stroke="none" />
    </>
  )
}

/** A small flower bed: a soil bed with three blooms on green leaves. */
export function flowers(): ReactNode {
  const blooms: [number, number, string][] = [
    [32, 36, C.pink],
    [66, 32, C.yellow],
    [50, 68, C.lilac],
  ]
  return (
    <>
      <Box x={8} y={8} w={84} h={84} r={16} fill={C.soil} sw={DETAIL} />
      <Box x={14} y={14} w={72} h={72} r={12} fill="none" stroke={C.woodDark} sw={DETAIL} opacity={0.7} />
      <Oval x={30} y={52} rx={12} ry={6} fill={C.greenLight} sw={DETAIL} />
      <Oval x={70} y={54} rx={12} ry={6} fill={C.greenLight} sw={DETAIL} />
      <Oval x={50} y={44} rx={6} ry={11} fill={C.green} sw={DETAIL} />
      {blooms.map(([x, y, colour]) => (
        <g key={`${x}-${y}`}>
          {[0, 1, 2, 3, 4].map((k) => {
            const a = (k * 2 * Math.PI) / 5 - Math.PI / 2
            return (
              <g key={k}>
                <Disc x={n(x + Math.cos(a) * 11)} y={n(y + Math.sin(a) * 11)} r={8} fill={colour} sw={DETAIL} />
                <Disc
                  x={n(x + Math.cos(a) * 12)}
                  y={n(y + Math.sin(a) * 12)}
                  r={2.5}
                  fill={C.white}
                  stroke="none"
                  opacity={0.7}
                />
              </g>
            )
          })}
          <Disc x={x} y={y} r={6} fill={C.gold} sw={DETAIL} />
          <Disc x={x} y={y} r={2.5} fill={C.goldDark} stroke="none" />
        </g>
      ))}
    </>
  )
}

/** Painter's easel with a small canvas. */
export function easel(): ReactNode {
  return (
    <>
      <Feet cols={1} rows={1} />
      <Stroke x1={34} y1={62} x2={22} y2={90} stroke={C.woodDark} sw={DETAIL + 2} />
      <Stroke x1={66} y1={62} x2={78} y2={90} stroke={C.woodDark} sw={DETAIL + 2} />
      <Stroke x1={50} y1={62} x2={50} y2={92} stroke={C.woodDark} sw={DETAIL + 2} />
      <Box x={22} y={10} w={56} h={46} r={3} fill={C.white} />
      {/* canvas: border, sky wash, hills, sun, cloud */}
      <Box x={27} y={15} w={46} h={36} r={2} fill={C.skyLight} sw={DETAIL - 1} />
      <Shape d="M 27 46 Q 38 28 52 42 Q 62 34 73 42 L 73 51 L 27 51 Z" fill={C.greenLight} sw={DETAIL} />
      <Shape d="M 27 49 Q 42 40 56 48 Q 64 44 73 48 L 73 51 L 27 51 Z" fill={C.green} stroke="none" />
      <Disc x={62} y={24} r={5} fill={C.yellow} sw={DETAIL} />
      <Oval x={38} y={25} rx={7} ry={3} fill={C.white} sw={DETAIL - 1} />
      {/* canvas clips, and the ledge with three paint dabs */}
      <Box x={20} y={8} w={8} h={6} r={2} fill={C.steelDark} sw={DETAIL - 1} />
      <Box x={72} y={8} w={8} h={6} r={2} fill={C.steelDark} sw={DETAIL - 1} />
      <Box x={18} y={56} w={64} h={9} r={3} fill={C.wood} sw={DETAIL} />
      <Disc x={30} y={60.5} r={2.2} fill={C.red} stroke="none" />
      <Disc x={38} y={60.5} r={2.2} fill={C.gold} stroke="none" />
      <Disc x={46} y={60.5} r={2.2} fill={C.greenDark} stroke="none" />
    </>
  )
}

/** Statue: a bust on a square stone plinth. */
export function statue(): ReactNode {
  return (
    <>
      <Feet cols={1} rows={1} fill={C.steelDark} />
      <Box x={12} y={12} w={76} h={76} r={7} fill={C.stone} />
      <Box x={19} y={19} w={62} h={62} r={4} fill="none" stroke={C.steel} sw={DETAIL} />
      <Disc x={24} y={24} r={2.5} fill={C.steelDark} stroke="none" />
      <Disc x={76} y={24} r={2.5} fill={C.steelDark} stroke="none" />
      <Disc x={24} y={76} r={2.5} fill={C.steelDark} stroke="none" />
      <Disc x={76} y={76} r={2.5} fill={C.steelDark} stroke="none" />
      <Oval x={50} y={58} rx={26} ry={13} fill={C.white} sw={DETAIL + 1} />
      <Oval x={50} y={58} rx={17} ry={7} fill="none" stroke={C.steel} sw={DETAIL - 1} />
      <Disc x={50} y={44} r={13} fill={C.white} sw={DETAIL + 1} />
      <Disc x={50} y={44} r={7} fill="none" stroke={C.steel} sw={DETAIL - 1} />
    </>
  )
}

/** Garden table: round on one cell, a rounded slab on wider ones. */
export function gardenTable(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const r = Math.min(w, h) / 2 - M - 2
  const holes: ReactNode[] = []
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      holes.push(
        <Disc key={`${cx}-${cy}`} x={cx * U + 50} y={cy * U + 50} r={5} fill={C.creamDark} sw={DETAIL - 1} />,
      )
    }
  }
  return (
    <>
      <Feet cols={cols} rows={rows} />
      <Box x={M + 2} y={M + 2} w={w - 2 * M - 4} h={h - 2 * M - 4} r={r} fill={C.cream} />
      <Box
        x={M + 10}
        y={M + 10}
        w={w - 2 * M - 20}
        h={h - 2 * M - 20}
        r={Math.max(r - 8, 4)}
        fill="none"
        stroke={C.creamDark}
        sw={DETAIL}
      />
      <Box
        x={M + 16}
        y={M + 16}
        w={w - 2 * M - 32}
        h={h - 2 * M - 32}
        r={Math.max(r - 14, 4)}
        fill={C.creamLight}
        sw={DETAIL}
      />
      {holes}
    </>
  )
}

/** Garden bench: slatted seat with a backrest on the north side. */
export function bench(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const slats: ReactNode[] = []
  for (let k = 1; k < 3; k++) {
    slats.push(
      <Stroke key={k} x1={M + 8} y1={34 + k * 14} x2={w - M - 8} y2={34 + k * 14} stroke={C.woodDark} sw={DETAIL} />,
    )
  }
  return (
    <>
      <Feet cols={cols} rows={rows} />
      <Box x={M} y={12} w={w - 2 * M} h={20} r={5} fill={C.woodDark} />
      {/* backrest slat line and bolts */}
      <Stroke x1={M + 10} y1={22} x2={w - M - 10} y2={22} stroke={C.wood} sw={DETAIL} opacity={0.8} />
      <Disc x={M + 6} y={22} r={2.2} fill={C.gold} stroke="none" />
      <Disc x={w - M - 6} y={22} r={2.2} fill={C.gold} stroke="none" />
      <Box x={M} y={34} w={w - 2 * M} h={h - 34 - 12} r={6} fill={C.woodLight} />
      {slats}
      {/* armrest caps at both ends of the seat */}
      <Box x={M} y={34} w={10} h={h - 34 - 12} r={4} fill={C.wood} sw={DETAIL} />
      <Box x={w - M - 10} y={34} w={10} h={h - 34 - 12} r={4} fill={C.wood} sw={DETAIL} />
    </>
  )
}
