import type { ReactNode } from 'react'
import { Box, Disc, Oval, Shape, Stroke } from './shapes.tsx'
import { C, DETAIL, M, U } from './tokens.ts'

/** Washing machine: control strip on the north, round door in the middle. */
export function washingMachine(): ReactNode {
  return (
    <>
      <Box x={10} y={8} w={80} h={84} r={10} fill={C.white} />
      <Box x={17} y={15} w={66} h={14} r={3} fill={C.stone} sw={DETAIL} />
      <Disc x={27} y={22} r={3} fill={C.steelDark} sw={2} />
      <Disc x={50} y={62} r={26} fill={C.white} />
      <Disc x={50} y={62} r={17} fill={C.sky} sw={DETAIL} />
      <Stroke x1={42} y1={56} x2={47} y2={51} stroke={C.white} sw={DETAIL} />
    </>
  )
}

/** Dryer: like the washer but with a warm glass and vent slots. */
export function dryer(): ReactNode {
  return (
    <>
      <Box x={10} y={8} w={80} h={84} r={10} fill={C.white} />
      <Box x={17} y={15} w={66} h={14} r={3} fill={C.stone} sw={DETAIL} />
      <Disc x={73} y={22} r={3} fill={C.steelDark} sw={2} />
      <Disc x={50} y={62} r={26} fill={C.white} />
      <Disc x={50} y={62} r={17} fill={C.cream} sw={DETAIL} />
      <Stroke x1={41} y1={56} x2={59} y2={56} stroke={C.gold} sw={DETAIL} />
      <Stroke x1={41} y1={63} x2={59} y2={63} stroke={C.gold} sw={DETAIL} />
      <Stroke x1={41} y1={70} x2={59} y2={70} stroke={C.gold} sw={DETAIL} />
    </>
  )
}

/** Staircase: `rows` is the run, treads across the width. */
export function stairs(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const treads: ReactNode[] = []
  for (let y = M + 16; y < h - M - 4; y += 20) {
    treads.push(<Stroke key={y} x1={M + 8} y1={y} x2={w - M - 8} y2={y} sw={DETAIL} />)
  }
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={3} fill={C.paper} />
      {treads}
    </>
  )
}

/** Toilet: cistern on the north, bowl to the south. */
export function toilet(): ReactNode {
  return (
    <>
      <Box x={28} y={10} w={44} h={22} r={7} fill={C.white} />
      <Oval x={50} y={58} rx={22} ry={30} fill={C.white} />
      <Oval x={50} y={60} rx={12} ry={19} fill={C.skyLight} sw={DETAIL} />
    </>
  )
}

/** Sink unit: a basin and tap per cell along the width. */
export function sink(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const basins = Array.from({ length: cols }, (_, i) => (
    <g key={i}>
      <Oval x={i * U + 50} y={h / 2 + 10} rx={26} ry={18} fill={C.skyLight} sw={DETAIL} />
      <Disc x={i * U + 50} y={h / 2 - 22} r={5} fill={C.steel} sw={DETAIL} />
    </g>
  ))
  return (
    <>
      <Box x={8} y={16} w={w - 16} h={h - 32} r={8} fill={C.white} />
      {basins}
    </>
  )
}

/** Shower tray with a drain and a shower head in the north-west corner. */
export function shower(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={4} fill={C.white} />
      <Box x={M + 10} y={M + 10} w={w - 2 * M - 20} h={h - 2 * M - 20} r={3} fill={C.skyLight} sw={DETAIL} />
      <Disc x={w / 2} y={h / 2} r={7} fill={C.white} sw={DETAIL} />
      <Disc x={M + 24} y={M + 24} r={8} fill={C.steel} sw={DETAIL} />
    </>
  )
}

/**
 * Kitchen counter along the width. A single cell is a four-burner hob;
 * wider counters get one ring per cell, and a three-cell counter ends in a
 * sink basin.
 */
export function kitchenCounter(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const parts: ReactNode[] = []
  if (cols === 1 && rows === 1) {
    for (const [x, y] of [
      [34, 38],
      [66, 38],
      [34, 70],
      [66, 70],
    ] as const) {
      parts.push(<Disc key={`${x}-${y}`} x={x} y={y} r={11} fill={C.stone} sw={DETAIL} />)
    }
  } else {
    for (let i = 0; i < cols; i++) {
      if (cols === 3 && i === 2) {
        parts.push(<Box key="basin" x={i * U + 18} y={34} w={U - 36} h={h - 52} r={8} fill={C.skyLight} sw={DETAIL} />)
      } else {
        parts.push(
          <Disc key={`o${i}`} x={i * U + 50} y={h / 2 + 8} r={17} fill={C.stone} sw={DETAIL} />,
          <Disc key={`i${i}`} x={i * U + 50} y={h / 2 + 8} r={7} fill={C.slate} sw={DETAIL} />,
        )
      }
    }
  }
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={4} fill={C.white} />
      <Box x={M} y={M} w={w - 2 * M} h={14} r={3} fill={C.stone} sw={DETAIL} />
      {parts}
    </>
  )
}

/** Bicycle, side on: two wheels and a frame along the width. */
export function bicycle(): ReactNode {
  return (
    <>
      <Disc x={44} y={58} r={28} fill={C.white} />
      <Disc x={156} y={58} r={28} fill={C.white} />
      <Disc x={44} y={58} r={4} fill={C.ink} sw={2} />
      <Disc x={156} y={58} r={4} fill={C.ink} sw={2} />
      <Shape d="M 44 58 L 76 32 L 136 32 L 96 60 L 44 58 M 76 32 L 96 60 M 136 32 L 156 58" stroke={C.ink} sw={DETAIL + 1} />
      <Stroke x1={66} y1={26} x2={88} y2={26} sw={DETAIL + 2} />
      <Stroke x1={128} y1={22} x2={142} y2={22} sw={DETAIL + 2} />
    </>
  )
}
