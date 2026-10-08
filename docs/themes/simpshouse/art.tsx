/* oxlint-disable react/only-export-components -- draft art and a build script, not app components */
import type { ReactNode } from 'react'
import { Box, Disc, Feet, Oval, Shape, Stroke } from '../../../src/render/icons/art/shapes.tsx'
import { C, DETAIL, M, U } from '../../../src/render/icons/art/tokens.ts'

/**
 * DRAFT art for the Simpshouse fun objects (SLAY-18.3). Only what the engine and the other themes
 * do not already draw. Same rules as src/render/icons/themes/art.tsx (SLAY-16): detail inside the
 * silhouette, feet at all four corners where it stands on legs, nothing that marks one side as lit,
 * every shape inside its footprint. The theme story moves this into src/render/icons/themes/art.tsx
 * and registers the ids in THEME_ICON_IDS and the registry.
 */

const G = {
  felt: '#4f8a6a',
  feltDark: '#3a6b50',
  mirror: '#cfe6f0',
  bulb: '#f7e28a',
  magenta: '#c76aa6',
  magentaDark: '#a04b86',
  water: '#8fd0e6',
  waterDark: '#6bb4cf',
  cardBlue: '#5b7fc4',
} as const

/** A sparkle: four-point star at (x, y). */
function sparkle(x: number, y: number, r: number, key: string): ReactNode {
  return <Shape key={key} d={`M ${x} ${y - r} L ${x + r * 0.3} ${y - r * 0.3} L ${x + r} ${y} L ${x + r * 0.3} ${y + r * 0.3} L ${x} ${y + r} L ${x - r * 0.3} ${y + r * 0.3} L ${x - r} ${y} L ${x - r * 0.3} ${y - r * 0.3} Z`} fill={C.white} sw={2} />
}

/** Shelf of trading-card binders: coloured spines side by side, each with a ring and a label. */
export function cardBinderShelf(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const colours = [C.red, G.cardBlue, C.yellow, C.greenLight, G.magenta, C.sky]
  const count = cols * 4
  const step = (w - 2 * M - 20) / count
  const binders: ReactNode[] = []
  for (let i = 0; i < count; i++) {
    const x = M + 10 + i * step
    binders.push(
      <Box key={i} x={x} y={M + 14} w={step - 3} h={h - 2 * M - 28} r={3} fill={colours[i % colours.length]} sw={DETAIL} />,
      <Box key={`l${i}`} x={x + 2} y={h / 2 - 8} w={step - 7} h={16} r={2} fill={C.white} sw={2} />,
      <Disc key={`r${i}`} x={x + (step - 3) / 2} y={M + 24} r={2.5} fill={C.steelDark} sw={0} />,
      <Disc key={`s${i}`} x={x + (step - 3) / 2} y={h - M - 24} r={2.5} fill={C.steelDark} sw={0} />,
    )
  }
  return (
    <>
      <Feet cols={cols} rows={rows} size={10} inset={5} />
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={6} fill={C.wood} />
      <Box x={M + 6} y={M + 8} w={w - 2 * M - 12} h={h - 2 * M - 16} r={3} fill={C.woodDark} sw={DETAIL} />
      {binders}
    </>
  )
}

/** Card-trading table: green felt, fanned cards and two piles of cards, in a wooden rim. */
export function cardTable(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const cx = w / 2
  const cy = h / 2
  const fan = [-24, -8, 8, 24].map((deg, i) => (
    <g key={deg} transform={`rotate(${deg} ${cx} ${cy + 16})`}>
      <Box x={cx - 9} y={cy - 22} w={18} h={28} r={2} fill={i % 2 ? C.white : C.creamLight} sw={2} />
      <Box x={cx - 4} y={cy - 16} w={8} h={8} r={1} fill={i % 2 ? C.red : G.cardBlue} sw={0} />
    </g>
  ))
  return (
    <>
      <Feet cols={cols} rows={rows} size={10} inset={5} />
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={10} fill={C.woodDark} />
      <Box x={M + 8} y={M + 8} w={w - 2 * M - 16} h={h - 2 * M - 16} r={6} fill={G.felt} sw={DETAIL} />
      <Box x={M + 14} y={M + 14} w={w - 2 * M - 28} h={h - 2 * M - 28} r={4} fill="none" stroke={G.feltDark} sw={2} />
      {fan}
      <Box x={M + 20} y={h - M - 42} w={18} h={26} r={2} fill={G.cardBlue} sw={DETAIL} />
      <Box x={M + 23} y={h - M - 45} w={18} h={26} r={2} fill={G.cardBlue} sw={DETAIL} />
      <Box x={w - M - 42} y={M + 18} w={18} h={26} r={2} fill={C.red} sw={DETAIL} />
      <Box x={w - M - 45} y={M + 15} w={18} h={26} r={2} fill={C.red} sw={DETAIL} />
      <Disc x={w - M - 24} y={h - M - 26} r={7} fill={C.gold} sw={DETAIL} />
      <Disc x={M + 26} y={M + 26} r={7} fill={C.gold} sw={DETAIL} />
    </>
  )
}

/** Glam vanity: a table with a big mirror ringed by bulbs, perfume and lipstick on top. */
export function vanity(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const bulbs: ReactNode[] = []
  const count = cols * 4
  for (let i = 0; i < count; i++) bulbs.push(<Disc key={i} x={M + 14 + (i * (w - 2 * M - 28)) / (count - 1)} y={M + 12} r={3.5} fill={G.bulb} sw={2} />)
  return (
    <>
      <Feet cols={cols} rows={rows} size={10} inset={5} />
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={8} fill={C.pink} />
      <Box x={M + 6} y={M + 20} w={w - 2 * M - 12} h={34} r={4} fill={G.mirror} sw={DETAIL} />
      <Stroke x1={M + 16} y1={M + 44} x2={M + 34} y2={M + 28} stroke={C.white} sw={DETAIL} />
      {bulbs}
      <Box x={M + 12} y={h - M - 36} w={14} h={22} r={5} fill={C.lilac} sw={DETAIL} />
      <Box x={M + 16} y={h - M - 42} w={6} h={7} r={1} fill={C.gold} sw={2} />
      <Box x={w - M - 40} y={h - M - 34} w={7} h={20} r={2} fill={C.red} sw={DETAIL} />
      <Box x={w - M - 28} y={h - M - 30} w={7} h={16} r={2} fill={G.magenta} sw={DETAIL} />
      <Oval x={w / 2} y={h - M - 20} rx={13} ry={8} fill={C.white} sw={DETAIL} />
    </>
  )
}

/** Disc-ball stand: a round base and the mirror ball with colourful facets and sparkles. */
export function discoBall(): ReactNode {
  const facets: ReactNode[] = []
  const tones = [C.sky, C.white, C.lilac, C.pink, C.skyLight, C.steel]
  let k = 0
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const x = 32 + c * 9
      const y = 32 + r * 9
      if ((x - 50 + 4.5) ** 2 + (y - 50 + 4.5) ** 2 < 19 ** 2) facets.push(<Box key={k} x={x} y={y} w={8} h={8} r={1} fill={tones[k % tones.length]} sw={1} />)
      k++
    }
  }
  return (
    <>
      <Disc x={50} y={50} r={42} fill={C.steelDark} />
      <Disc x={50} y={50} r={34} fill="none" stroke={C.steel} sw={DETAIL} />
      <Disc x={50} y={50} r={26} fill={C.steel} sw={DETAIL} />
      {facets}
      <Disc x={50} y={50} r={26} fill="none" sw={DETAIL} />
      {sparkle(24, 24, 9, 'a')}
      {sparkle(78, 30, 7, 'b')}
      {sparkle(72, 76, 9, 'c')}
      {sparkle(26, 72, 6, 'd')}
    </>
  )
}

/** Karaoke stage: a magenta platform with gold trim, a mic stand in the middle and stage lights. */
export function karaokeStage(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const lights: ReactNode[] = []
  for (const [x, y] of [[M + 14, M + 14], [w - M - 14, M + 14], [M + 14, h - M - 14], [w - M - 14, h - M - 14]] as const) {
    lights.push(<Disc key={`${x}-${y}`} x={x} y={y} r={6} fill={C.yellow} sw={DETAIL} />)
  }
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={8} fill={G.magenta} />
      <Box x={M + 8} y={M + 8} w={w - 2 * M - 16} h={h - 2 * M - 16} r={4} fill={G.magentaDark} sw={DETAIL} />
      <Box x={M + 8} y={M + 8} w={w - 2 * M - 16} h={h - 2 * M - 16} r={4} fill="none" stroke={C.gold} sw={DETAIL} />
      {lights}
      <Disc x={w / 2} y={h / 2} r={14} fill={C.slate} sw={DETAIL} />
      <Disc x={w / 2} y={h / 2} r={8} fill={C.steel} sw={DETAIL} />
      <Disc x={w / 2} y={h / 2} r={3.5} fill={C.red} sw={0} />
      <Stroke x1={w / 2 - 22} y1={h / 2} x2={w / 2 + 22} y2={h / 2} stroke={C.slate} sw={DETAIL} />
    </>
  )
}

/** Arcade cabinet from above: dark cabinet, bright screen strip, joystick and buttons. */
export function arcadeCabinet(): ReactNode {
  return (
    <>
      <Feet cols={1} rows={1} size={10} inset={5} fill={C.slate} />
      <Box x={14} y={M} w={72} h={88} r={6} fill={C.slate} />
      <Box x={20} y={12} w={60} h={30} r={3} fill={C.sky} sw={DETAIL} />
      <Shape d="M 28 36 L 40 22 L 50 32 L 62 20 L 72 34" stroke={G.cardBlue} sw={DETAIL} />
      <Box x={20} y={48} w={60} h={34} r={3} fill={G.magentaDark} sw={DETAIL} />
      <Disc x={34} y={65} r={7} fill={C.red} sw={DETAIL} />
      <Disc x={34} y={65} r={2.5} fill={C.redDark} sw={0} />
      <Disc x={56} y={60} r={4.5} fill={C.yellow} sw={2} />
      <Disc x={68} y={60} r={4.5} fill={C.greenLight} sw={2} />
      <Disc x={56} y={72} r={4.5} fill={C.sky} sw={2} />
      <Disc x={68} y={72} r={4.5} fill={C.pink} sw={2} />
    </>
  )
}

/** Bubble bath tub: white rim, clear blue water and a heap of bubbles, taps at one end. */
export function bubbleBath(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={22} fill={C.white} />
      <Box x={M + 12} y={M + 12} w={w - 2 * M - 24} h={h - 2 * M - 24} r={16} fill={G.water} sw={DETAIL} />
      <Box x={M + 20} y={M + 20} w={w - 2 * M - 40} h={h - 2 * M - 40} r={12} fill="none" stroke={G.waterDark} sw={2} />
      <Disc x={w * 0.38} y={h * 0.42} r={13} fill={C.white} sw={DETAIL} />
      <Disc x={w * 0.5} y={h * 0.6} r={16} fill={C.white} sw={DETAIL} />
      <Disc x={w * 0.62} y={h * 0.4} r={11} fill={C.white} sw={DETAIL} />
      <Disc x={w * 0.3} y={h * 0.62} r={8} fill={C.skyLight} sw={2} />
      <Disc x={w * 0.72} y={h * 0.64} r={8} fill={C.skyLight} sw={2} />
      <Disc x={w - M - 22} y={h / 2 - 9} r={5.5} fill={C.gold} sw={DETAIL} />
      <Disc x={w - M - 22} y={h / 2 + 9} r={5.5} fill={C.gold} sw={DETAIL} />
      <Disc x={M + 22} y={h / 2} r={6} fill={C.pink} sw={DETAIL} />
    </>
  )
}

export const SIMPS_ICON_IDS = ['cardBinderShelf', 'cardTable', 'vanity', 'discoBall', 'karaokeStage', 'arcadeCabinet', 'bubbleBath'] as const
export type SimpsIconId = (typeof SIMPS_ICON_IDS)[number]

export interface DraftIcon {
  id: SimpsIconId
  /** Footprint sizes (cols, rows) in canonical orientation, the same ones the theme file lists. */
  sizes: readonly (readonly [number, number])[]
  draw: (cols: number, rows: number) => ReactNode
}

export const SIMPS_ICONS: Record<SimpsIconId, DraftIcon> = {
  cardBinderShelf: { id: 'cardBinderShelf', sizes: [[1, 1], [2, 1]], draw: cardBinderShelf },
  cardTable: { id: 'cardTable', sizes: [[2, 1], [2, 2]], draw: cardTable },
  vanity: { id: 'vanity', sizes: [[1, 1], [2, 1]], draw: vanity },
  discoBall: { id: 'discoBall', sizes: [[1, 1]], draw: () => discoBall() },
  karaokeStage: { id: 'karaokeStage', sizes: [[2, 1], [2, 2]], draw: karaokeStage },
  arcadeCabinet: { id: 'arcadeCabinet', sizes: [[1, 1]], draw: () => arcadeCabinet() },
  bubbleBath: { id: 'bubbleBath', sizes: [[2, 1], [3, 1]], draw: bubbleBath },
}
export const U_CELL = U
