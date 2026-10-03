import type { ReactNode } from 'react'
import { Box, Disc, Feet, Oval, Shape, Stroke } from './shapes.tsx'
import { C, DETAIL, M, U } from './tokens.ts'

/** Round-door machine shared by washer and dryer; only glass, dial and vents differ. */
function laundryBody(glass: string, knobX: number): ReactNode {
  return (
    <>
      <Feet cols={1} rows={1} />
      <Box x={10} y={8} w={80} h={84} r={10} fill={C.white} />
      <Box x={17} y={15} w={66} h={14} r={3} fill={C.stone} sw={DETAIL} />
      <Disc x={knobX} y={22} r={4} fill={C.steelDark} sw={2} />
      <Box x={knobX === 27 ? 56 : 24} y={19} w={20} h={6} r={2} fill={C.skyLight} sw={2} />
      <Disc x={50} y={62} r={27} fill={C.white} />
      <Disc x={50} y={62} r={22} fill={C.steel} sw={DETAIL} />
      <Disc x={50} y={62} r={17} fill={glass} sw={DETAIL} />
      <Disc x={50} y={62} r={9} fill="none" stroke={C.steelDark} sw={2} opacity={0.5} />
    </>
  )
}

/** Washing machine: control strip on the north, round door in the middle. */
export function washingMachine(): ReactNode {
  return (
    <>
      {laundryBody(C.sky, 27)}
      <Shape d="M 39 58 Q 42 50 50 48" stroke={C.white} sw={DETAIL + 1} />
      <Stroke x1={58} y1={74} x2={62} y2={70} stroke={C.white} sw={DETAIL} opacity={0.7} />
    </>
  )
}

/** Dryer: like the washer but with a warm glass and vent slots. */
export function dryer(): ReactNode {
  return (
    <>
      {laundryBody(C.cream, 73)}
      <Stroke x1={42} y1={56} x2={58} y2={56} stroke={C.gold} sw={DETAIL} />
      <Stroke x1={41} y1={63} x2={59} y2={63} stroke={C.gold} sw={DETAIL} />
      <Stroke x1={42} y1={70} x2={58} y2={70} stroke={C.gold} sw={DETAIL} />
      <Shape d="M 39 58 Q 42 50 50 48" stroke={C.white} sw={DETAIL + 1} />
    </>
  )
}

/**
 * Staircase: `rows` is the run, treads across the width between two side rails, with a chevron
 * along the run pointing up the flight.
 */
export function stairs(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const treads: ReactNode[] = []
  for (let y = M + 14; y < h - M - 10; y += 24) {
    treads.push(
      <Box key={y} x={M + 14} y={y} w={w - 2 * M - 28} h={17} r={2} fill={C.creamLight} sw={DETAIL} />,
      <Stroke key={`n${y}`} x1={M + 20} y1={y + 4} x2={w - M - 20} y2={y + 4} stroke={C.white} sw={2} opacity={0.8} />,
    )
  }
  const cx = w / 2
  const cy = h / 2
  return (
    <>
      <Feet cols={cols} rows={rows} />
      <Box x={M + 2} y={M + 2} w={w - 2 * M - 4} h={h - 2 * M - 4} r={4} fill={C.paper} />
      <Box x={M + 2} y={M + 2} w={9} h={h - 2 * M - 4} r={3} fill={C.wood} sw={DETAIL} />
      <Box x={w - M - 11} y={M + 2} w={9} h={h - 2 * M - 4} r={3} fill={C.wood} sw={DETAIL} />
      {treads}
      <Shape d={`M ${cx - 18} ${cy + 8} L ${cx} ${cy - 12} L ${cx + 18} ${cy + 8}`} fill={C.woodDark} stroke={C.ink} sw={4} opacity={0.85} />
    </>
  )
}

/** Toilet: cistern on the north, bowl to the south. */
export function toilet(): ReactNode {
  return (
    <>
      <Feet cols={1} rows={1} />
      <Box x={26} y={9} w={48} h={24} r={7} fill={C.white} />
      <Box x={33} y={14} w={34} h={5} r={2} fill={C.stone} sw={2} />
      <Disc x={50} y={26} r={3} fill={C.steel} sw={2} />
      <Oval x={50} y={59} rx={24} ry={31} fill={C.white} />
      <Oval x={50} y={60} rx={17} ry={25} fill={C.cream} sw={DETAIL} />
      <Oval x={50} y={63} rx={10} ry={15} fill={C.skyLight} sw={DETAIL} />
      <Shape d="M 33 52 Q 35 42 43 38" stroke={C.white} sw={DETAIL} opacity={0.9} />
    </>
  )
}

/** Sink unit: a basin and tap per cell along the width. */
export function sink(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const basins = Array.from({ length: cols }, (_, i) => (
    <g key={i}>
      <Oval x={i * U + 50} y={h / 2 + 10} rx={29} ry={21} fill={C.white} sw={DETAIL} />
      <Oval x={i * U + 50} y={h / 2 + 10} rx={24} ry={16} fill={C.skyLight} sw={DETAIL} />
      <Disc x={i * U + 50} y={h / 2 + 12} r={3} fill={C.steelDark} sw={2} />
      <Box x={i * U + 44} y={h / 2 - 28} w={12} h={14} r={4} fill={C.steel} sw={DETAIL} />
      <Disc x={i * U + 36} y={h / 2 - 22} r={4} fill={C.steelDark} sw={2} />
      <Disc x={i * U + 64} y={h / 2 - 22} r={4} fill={C.steelDark} sw={2} />
    </g>
  ))
  return (
    <>
      <Feet cols={cols} rows={rows} inset={4} />
      <Box x={8} y={16} w={w - 16} h={h - 32} r={8} fill={C.white} />
      <Stroke x1={16} y1={22} x2={w - 16} y2={22} stroke={C.stone} sw={2} />
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
      <Feet cols={cols} rows={rows} />
      <Box x={M + 3} y={M + 3} w={w - 2 * M - 6} h={h - 2 * M - 6} r={5} fill={C.white} />
      <Box x={M + 11} y={M + 11} w={w - 2 * M - 22} h={h - 2 * M - 22} r={3} fill={C.skyLight} sw={DETAIL} />
      <Disc x={w / 2} y={h / 2} r={10} fill={C.steel} sw={DETAIL} />
      <Stroke x1={w / 2 - 6} y1={h / 2} x2={w / 2 + 6} y2={h / 2} stroke={C.steelDark} sw={2} />
      <Stroke x1={w / 2} y1={h / 2 - 6} x2={w / 2} y2={h / 2 + 6} stroke={C.steelDark} sw={2} />
      <Disc x={M + 25} y={M + 25} r={10} fill={C.steel} sw={DETAIL} />
      <Disc x={M + 25} y={M + 25} r={4} fill={C.steelDark} sw={2} />
      <Stroke x1={M + 17} y1={M + 18} x2={M + 21} y2={M + 15} stroke={C.white} sw={DETAIL} opacity={0.9} />
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
      [34, 40],
      [66, 40],
      [34, 72],
      [66, 72],
    ] as const) {
      parts.push(
        <Disc key={`${x}-${y}`} x={x} y={y} r={12} fill={C.stone} sw={DETAIL} />,
        <Disc key={`c${x}-${y}`} x={x} y={y} r={5} fill={C.slate} sw={2} />,
      )
    }
  } else {
    for (let i = 0; i < cols; i++) {
      if (cols === 3 && i === 2) {
        parts.push(
          <Box key="basin" x={i * U + 16} y={34} w={U - 32} h={h - 50} r={8} fill={C.steel} sw={DETAIL} />,
          <Box key="water" x={i * U + 22} y={40} w={U - 44} h={h - 62} r={6} fill={C.skyLight} sw={DETAIL} />,
          <Disc key="tap" x={i * U + 50} y={34} r={4} fill={C.steelDark} sw={2} />,
        )
      } else {
        parts.push(
          <Disc key={`o${i}`} x={i * U + 50} y={h / 2 + 8} r={18} fill={C.stone} sw={DETAIL} />,
          <Disc key={`m${i}`} x={i * U + 50} y={h / 2 + 8} r={12} fill={C.steel} sw={DETAIL} />,
          <Disc key={`i${i}`} x={i * U + 50} y={h / 2 + 8} r={6} fill={C.slate} sw={DETAIL} />,
        )
      }
    }
  }
  return (
    <>
      <Feet cols={cols} rows={rows} />
      <Box x={M + 3} y={M + 3} w={w - 2 * M - 6} h={h - 2 * M - 6} r={5} fill={C.white} />
      <Box x={M + 3} y={M + 3} w={w - 2 * M - 6} h={14} r={3} fill={C.stone} sw={DETAIL} />
      <Stroke x1={M + 14} y1={M + 10} x2={w - M - 14} y2={M + 10} stroke={C.white} sw={2} opacity={0.8} />
      {parts}
    </>
  )
}

/** Bicycle, side on: two wheels and a frame along the width. */
export function bicycle(): ReactNode {
  return (
    <>
      <Disc x={44} y={58} r={28} fill={C.white} />
      <Disc x={44} y={58} r={22} fill="none" stroke={C.steelDark} sw={DETAIL} />
      <Disc x={156} y={58} r={28} fill={C.white} />
      <Disc x={156} y={58} r={22} fill="none" stroke={C.steelDark} sw={DETAIL} />
      <Stroke x1={44} y1={36} x2={44} y2={80} stroke={C.steel} sw={2} />
      <Stroke x1={22} y1={58} x2={66} y2={58} stroke={C.steel} sw={2} />
      <Stroke x1={156} y1={36} x2={156} y2={80} stroke={C.steel} sw={2} />
      <Stroke x1={134} y1={58} x2={178} y2={58} stroke={C.steel} sw={2} />
      <Disc x={44} y={58} r={5} fill={C.ink} sw={2} />
      <Disc x={156} y={58} r={5} fill={C.ink} sw={2} />
      <Shape d="M 44 58 L 76 32 L 136 32 L 96 60 L 44 58 M 76 32 L 96 60 M 136 32 L 156 58" stroke={C.red} sw={DETAIL + 2} />
      <Disc x={96} y={60} r={7} fill={C.steelDark} sw={DETAIL} />
      <Stroke x1={90} y1={68} x2={102} y2={52} stroke={C.ink} sw={DETAIL} />
      <Box x={60} y={21} w={32} h={9} r={4} fill={C.ink} sw={2} />
      <Stroke x1={128} y1={22} x2={142} y2={22} sw={DETAIL + 2} />
    </>
  )
}
