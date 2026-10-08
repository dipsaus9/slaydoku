import type { ReactNode } from 'react'
import type { Cell } from '../../../src/engine/model/index.ts'
import { Box, Disc, Oval, Shape, Stroke } from '../../../src/render/icons/art/shapes.tsx'
import { C, DETAIL, M, U } from '../../../src/render/icons/art/tokens.ts'

/**
 * Draft art for the four seasonal themes (SLAY-18.5). Same rules as src/render/icons/themes/art.tsx:
 * 100 units per cell, every shape inside its footprint, no baked-in light (the depth filter adds it).
 * Drawn only where a theme needs something the engine icons cannot show. Promotion: move these into
 * src/render/icons/themes/art.tsx and add the ids to THEME_ICON_IDS and the registry.
 */

const T = {
  orange: '#e29a4d',
  orangeDark: '#c47a33',
  maple: '#c9553f',
  mapleGold: '#e3b04b',
  hay: '#e3c777',
  hayDark: '#c4a550',
  leaf: '#b8763d',
  straw: '#ead28a',
  fire: '#e8743b',
  snow: '#f6fafc',
  snowShade: '#d5e3ec',
  night: '#3b354f',
  nightLight: '#5a5275',
  slime: '#8fd16b',
  tomb: '#b9bbc4',
  froggy: '#6fb04e',
  froggyDark: '#4d8a36',
  ginger: '#b9794a',
  gingerDark: '#8f5530',
  cap: '#cf4f48',
  candy: '#e86aa0',
} as const

const r1 = (v: number) => Math.round(v * 10) / 10

/** Points of a regular star around (cx, cy): `points` tips, outer radius `outer`, inner radius `inner`. */
function star(cx: number, cy: number, points: number, outer: number, inner: number): string {
  const parts: string[] = []
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? outer : inner
    const a = (Math.PI * i) / points - Math.PI / 2
    parts.push(`${i === 0 ? 'M' : 'L'} ${r1(cx + rad * Math.cos(a))} ${r1(cy + rad * Math.sin(a))}`)
  }
  return `${parts.join(' ')} Z`
}

/** Confetti, leaves or candy scattered at fixed, repeatable positions over a rounded base. */
function scatter(cols: number, rows: number, base: string, baseEdge: string, palette: readonly string[], shape: 'leaf' | 'dot'): ReactNode {
  const w = cols * U
  const h = rows * U
  const bits: ReactNode[] = []
  const count = cols * rows * 9
  for (let i = 0; i < count; i++) {
    const x = M + 14 + ((i * 41) % (w - 2 * M - 28))
    const y = M + 14 + ((i * 59 + (i % 3) * 17) % (h - 2 * M - 28))
    const fill = palette[i % palette.length] as string
    bits.push(
      shape === 'leaf' ? (
        <Oval key={i} x={x} y={y} rx={9} ry={5.5} fill={fill} sw={2} stroke={baseEdge} />
      ) : i % 2 === 0 ? (
        <Disc key={i} x={x} y={y} r={4.2} fill={fill} sw={0} stroke="none" />
      ) : (
        <Box key={i} x={x - 4} y={y - 2.5} w={8} h={5} r={1} fill={fill} sw={0} stroke="none" />
      ),
    )
  }
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={shape === 'leaf' ? 34 : 8} fill={base} stroke={baseEdge} sw={DETAIL} />
      {bits}
    </>
  )
}

/* ---------- Fall ---------- */

/** Pumpkin from above: ribs, stem and a curl of vine. */
export function pumpkin(): ReactNode {
  return (
    <>
      <Oval x={50} y={54} rx={41} ry={37} fill={T.orange} />
      <Oval x={29} y={54} rx={17} ry={33} fill={T.orangeDark} sw={DETAIL} />
      <Oval x={71} y={54} rx={17} ry={33} fill={T.orangeDark} sw={DETAIL} />
      <Oval x={50} y={54} rx={16} ry={35} fill={T.orange} sw={DETAIL} />
      <Box x={44} y={26} w={12} h={18} r={4} fill={C.woodDark} sw={DETAIL} />
      <Shape d="M 58 34 C 70 24 82 28 80 40" stroke={C.greenDark} sw={DETAIL + 1} />
      <Shape d="M 40 36 C 30 30 24 22 30 16 C 38 18 42 26 40 36 Z" fill={C.greenLight} sw={DETAIL} />
    </>
  )
}

/** Maple tree crown from above: warm leaf clusters round a red star of leaves. */
export function mapleTree(): ReactNode {
  return (
    <>
      <Disc x={50} y={52} r={41} fill={T.mapleGold} />
      <Disc x={30} y={36} r={20} fill={T.maple} sw={DETAIL} />
      <Disc x={70} y={36} r={20} fill={T.orange} sw={DETAIL} />
      <Disc x={28} y={68} r={19} fill={T.orange} sw={DETAIL} />
      <Disc x={72} y={68} r={19} fill={T.maple} sw={DETAIL} />
      <Shape d={star(50, 52, 5, 27, 12)} fill={T.maple} sw={DETAIL} />
      <Disc x={50} y={52} r={6} fill={C.woodDark} sw={DETAIL} />
    </>
  )
}

/** Toadstools: one big red cap with white spots, one small brown. */
export function mushroom(): ReactNode {
  return (
    <>
      <Disc x={46} y={46} r={38} fill={T.cap} />
      <Disc x={46} y={46} r={29} fill="none" stroke={C.redDark} sw={DETAIL} />
      <Disc x={32} y={34} r={7} fill={C.white} sw={DETAIL} />
      <Disc x={54} y={28} r={5} fill={C.white} sw={DETAIL} />
      <Disc x={58} y={52} r={8} fill={C.white} sw={DETAIL} />
      <Disc x={34} y={58} r={5} fill={C.white} sw={DETAIL} />
      <Disc x={76} y={78} r={14} fill={C.woodLight} />
      <Disc x={76} y={78} r={7} fill={C.wood} sw={DETAIL} />
    </>
  )
}

/** Scarecrow from above: straw hat with a red band over a crossbar of arms. */
export function scarecrow(): ReactNode {
  return (
    <>
      <Stroke x1={10} y1={52} x2={90} y2={52} stroke={C.woodDark} sw={9} />
      <Stroke x1={10} y1={52} x2={10} y2={62} stroke={T.straw} sw={7} />
      <Stroke x1={90} y1={52} x2={90} y2={62} stroke={T.straw} sw={7} />
      <Disc x={50} y={50} r={37} fill={T.straw} />
      <Disc x={50} y={50} r={26} fill="none" stroke={T.hayDark} sw={DETAIL} />
      <Disc x={50} y={50} r={15} fill={T.hayDark} sw={DETAIL} />
      <Disc x={50} y={50} r={15} fill="none" stroke={C.red} sw={7} />
      <Box x={40} y={76} w={20} h={14} r={3} fill={C.red} sw={DETAIL} />
    </>
  )
}

/** Campfire ring of stones, crossed logs, flames. */
export function bonfire(): ReactNode {
  const stones: ReactNode[] = []
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10
    stones.push(<Disc key={i} x={r1(50 + 38 * Math.cos(a))} y={r1(50 + 38 * Math.sin(a))} r={8} fill={C.stone} sw={DETAIL} stroke={C.steelDark} />)
  }
  return (
    <>
      {stones}
      <Disc x={50} y={50} r={30} fill={C.slate} sw={DETAIL} />
      <Stroke x1={26} y1={26} x2={74} y2={74} stroke={C.woodDark} sw={11} />
      <Stroke x1={74} y1={26} x2={26} y2={74} stroke={C.wood} sw={11} />
      <Disc x={50} y={50} r={19} fill={T.fire} sw={DETAIL} />
      <Disc x={50} y={50} r={12} fill={T.orange} sw={DETAIL} />
      <Disc x={50} y={50} r={5} fill={C.yellowLight} sw={0} stroke="none" />
    </>
  )
}

/** Hay bale of any size: straw colour, tied with two ropes. */
export function hayBale(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const straws: ReactNode[] = []
  for (let y = M + 14; y < h - M - 8; y += 14) {
    for (let x = M + 12; x < w - M - 16; x += 26) {
      straws.push(<Stroke key={`${x}-${y}`} x1={x + (y % 28 === 0 ? 0 : 9)} y1={y} x2={x + 14 + (y % 28 === 0 ? 0 : 9)} y2={y} stroke={T.hayDark} sw={2} />)
    }
  }
  const ropeAt = (frac: number) => <Stroke key={frac} x1={r1(w * frac)} y1={M + 2} x2={r1(w * frac)} y2={h - M - 2} stroke={C.woodDark} sw={5} />
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={8} fill={T.hay} />
      {straws}
      {cols >= 2 ? [0.3, 0.7].map(ropeAt) : [0.5].map(ropeAt)}
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={8} fill="none" />
    </>
  )
}

/** Leaf pile of any size. */
export function leafPile(cols: number, rows: number): ReactNode {
  return scatter(cols, rows, '#c98a4f', T.orangeDark, [T.maple, T.orange, T.mapleGold, '#9b5a2e'], 'leaf')
}

/** Hearth from the front: stone surround, dark firebox, flames and a log. Shared by fall and Christmas. */
export function fireplace(): ReactNode {
  return (
    <>
      <Box x={M} y={M} w={88} h={88} r={6} fill={C.stone} />
      <Box x={M + 6} y={M + 6} w={76} h={16} r={3} fill={C.steel} sw={DETAIL} />
      <Box x={22} y={34} w={56} h={56} r={14} fill={C.slate} sw={DETAIL} />
      <Shape d="M 50 40 C 62 54 68 62 64 74 C 60 84 40 84 36 74 C 32 62 44 56 50 40 Z" fill={T.fire} sw={DETAIL} />
      <Shape d="M 50 56 C 56 64 58 70 54 76 C 50 80 44 78 44 72 C 44 66 48 62 50 56 Z" fill={C.yellow} sw={DETAIL} />
      <Stroke x1={30} y1={84} x2={70} y2={84} stroke={C.woodDark} sw={8} />
      <Disc x={20} y={28} r={0.1} fill="none" stroke="none" />
    </>
  )
}

/* ---------- Carnaval (Oeteldonk) ---------- */

/** The Oeteldonk frog seen from above, a red, white and yellow scarf round its neck. */
export function frog(): ReactNode {
  return (
    <>
      <Oval x={22} y={74} rx={12} ry={16} fill={T.froggyDark} sw={DETAIL} />
      <Oval x={78} y={74} rx={12} ry={16} fill={T.froggyDark} sw={DETAIL} />
      <Oval x={50} y={56} rx={30} ry={32} fill={T.froggy} />
      <Oval x={50} y={32} rx={26} ry={20} fill={T.froggy} />
      <Disc x={34} y={20} r={11} fill={C.white} sw={DETAIL} />
      <Disc x={66} y={20} r={11} fill={C.white} sw={DETAIL} />
      <Disc x={34} y={21} r={5} fill={C.ink} sw={0} stroke="none" />
      <Disc x={66} y={21} r={5} fill={C.ink} sw={0} stroke="none" />
      <Box x={22} y={50} w={19} h={14} r={2} fill={C.red} sw={DETAIL} />
      <Box x={41} y={50} w={18} h={14} r={2} fill={C.white} sw={DETAIL} />
      <Box x={59} y={50} w={19} h={14} r={2} fill={C.yellow} sw={DETAIL} />
      <Shape d="M 38 74 Q 50 82 62 74" stroke={C.greenDark} sw={DETAIL} />
    </>
  )
}

/** Beer barrel from above: staves, hoops, bung. */
export function barrel(): ReactNode {
  return (
    <>
      <Disc x={50} y={50} r={41} fill={C.wood} />
      <Disc x={50} y={50} r={33} fill="none" stroke={C.steelDark} sw={5} />
      <Disc x={50} y={50} r={28} fill={C.woodLight} sw={DETAIL} />
      <Stroke x1={26} y1={36} x2={74} y2={36} stroke={C.wood} sw={DETAIL} />
      <Stroke x1={22} y1={50} x2={78} y2={50} stroke={C.wood} sw={DETAIL} />
      <Stroke x1={26} y1={64} x2={74} y2={64} stroke={C.wood} sw={DETAIL} />
      <Disc x={50} y={50} r={6} fill={C.woodDeep} sw={DETAIL} />
    </>
  )
}

/** Marching-band drum from above: red rim, white head, crossed sticks. */
export function drum(): ReactNode {
  const studs: ReactNode[] = []
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 * i) / 12
    studs.push(<Disc key={i} x={r1(50 + 35 * Math.cos(a))} y={r1(50 + 35 * Math.sin(a))} r={2.8} fill={C.yellow} sw={1.5} />)
  }
  return (
    <>
      <Disc x={50} y={50} r={42} fill={C.red} />
      <Disc x={50} y={50} r={31} fill={C.white} sw={DETAIL} />
      {studs}
      <Stroke x1={30} y1={30} x2={70} y2={70} stroke={C.woodLight} sw={6} />
      <Stroke x1={70} y1={30} x2={30} y2={70} stroke={C.wood} sw={6} />
      <Disc x={30} y={30} r={4.5} fill={C.yellow} sw={DETAIL} />
      <Disc x={70} y={30} r={4.5} fill={C.yellow} sw={DETAIL} />
    </>
  )
}

/** Confetti drift of any size: red, white and yellow plus a little blue and green. */
export function confettiPile(cols: number, rows: number): ReactNode {
  return scatter(cols, rows, C.creamLight, C.creamDark, [C.red, C.white, C.yellow, '#5b8fd6', C.greenLight, C.pink], 'dot')
}

/** Parade float, one cell wide, two long: red, white and yellow stripes, bunting, wheels. */
export function floatCart(): ReactNode {
  return (
    <>
      <Box x={4} y={14} w={12} h={30} r={4} fill={C.slate} sw={DETAIL} />
      <Box x={84} y={14} w={12} h={30} r={4} fill={C.slate} sw={DETAIL} />
      <Box x={4} y={156} w={12} h={30} r={4} fill={C.slate} sw={DETAIL} />
      <Box x={84} y={156} w={12} h={30} r={4} fill={C.slate} sw={DETAIL} />
      <Box x={14} y={8} w={72} h={184} r={14} fill={C.white} />
      <Box x={14} y={8} w={72} h={56} r={14} fill={C.red} />
      <Box x={14} y={136} w={72} h={56} r={14} fill={C.yellow} />
      <Box x={14} y={52} w={72} h={12} r={0} fill={C.red} sw={0} stroke="none" />
      <Box x={14} y={136} w={72} h={12} r={0} fill={C.yellow} sw={0} stroke="none" />
      <Box x={14} y={8} w={72} h={184} r={14} fill="none" />
      <Disc x={50} y={100} r={24} fill={T.froggy} />
      <Disc x={42} y={92} r={6} fill={C.white} sw={DETAIL} />
      <Disc x={58} y={92} r={6} fill={C.white} sw={DETAIL} />
      <Shape d="M 40 110 Q 50 118 60 110" stroke={C.greenDark} sw={DETAIL} />
    </>
  )
}

/* ---------- Christmas ---------- */

/** Christmas tree from above: green rings, baubles, a golden star. */
export function christmasTree(): ReactNode {
  const baubles: ReactNode[] = []
  const colours = [C.red, C.yellow, '#5b8fd6', C.pink]
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8 + Math.PI / 8
    baubles.push(<Disc key={i} x={r1(50 + 29 * Math.cos(a))} y={r1(50 + 29 * Math.sin(a))} r={5.5} fill={colours[i % 4] as string} sw={DETAIL} />)
  }
  return (
    <>
      <Shape d={star(50, 50, 8, 43, 30)} fill={C.greenDark} />
      <Disc x={50} y={50} r={28} fill={C.green} sw={DETAIL} />
      <Disc x={50} y={50} r={17} fill={C.greenLight} sw={DETAIL} />
      {baubles}
      <Shape d={star(50, 50, 5, 14, 6)} fill={C.yellow} stroke={C.goldDark} sw={DETAIL} />
    </>
  )
}

/** Wrapped present: red paper, gold ribbon and bow. */
export function present(): ReactNode {
  return (
    <>
      <Box x={14} y={14} w={72} h={72} r={6} fill={C.red} />
      <Box x={14} y={14} w={72} h={72} r={6} fill="none" />
      <Box x={43} y={14} w={14} h={72} r={0} fill={C.yellow} sw={DETAIL} />
      <Box x={14} y={43} w={72} h={14} r={0} fill={C.yellow} sw={DETAIL} />
      <Oval x={38} y={46} rx={11} ry={7} fill={C.gold} sw={DETAIL} />
      <Oval x={62} y={46} rx={11} ry={7} fill={C.gold} sw={DETAIL} />
      <Disc x={50} y={50} r={6} fill={C.goldDark} sw={DETAIL} />
    </>
  )
}

/** Santa's sleigh, one cell wide and two long: red body, cream seat, gold runners. */
export function sleigh(): ReactNode {
  return (
    <>
      <Stroke x1={14} y1={20} x2={14} y2={184} stroke={C.gold} sw={7} />
      <Stroke x1={86} y1={20} x2={86} y2={184} stroke={C.gold} sw={7} />
      <Disc x={14} y={16} r={5} fill={C.gold} sw={DETAIL} />
      <Disc x={86} y={16} r={5} fill={C.gold} sw={DETAIL} />
      <Box x={20} y={10} w={60} h={180} r={26} fill={C.red} />
      <Box x={28} y={22} w={44} h={70} r={16} fill={C.creamLight} sw={DETAIL} />
      <Box x={28} y={104} w={44} h={74} r={16} fill={C.redDark} sw={DETAIL} />
      <Box x={36} y={112} w={28} h={24} r={6} fill={C.gold} sw={DETAIL} />
      <Disc x={50} y={156} r={9} fill={C.white} sw={DETAIL} />
      <Stroke x1={50} y1={36} x2={50} y2={78} stroke={C.creamDark} sw={2} />
    </>
  )
}

/** Snowman from above: round body, hat with a red band, carrot nose pointing south. */
export function snowman(): ReactNode {
  return (
    <>
      <Disc x={50} y={52} r={40} fill={T.snow} />
      <Disc x={50} y={52} r={26} fill={T.snowShade} sw={DETAIL} />
      <Disc x={50} y={52} r={17} fill={C.ink} sw={DETAIL} />
      <Disc x={50} y={52} r={17} fill="none" stroke={C.red} sw={6} />
      <Shape d="M 44 66 L 56 66 L 50 90 Z" fill={C.terracotta} sw={DETAIL} />
      <Disc x={36} y={76} r={3} fill={C.ink} sw={0} stroke="none" />
      <Disc x={64} y={76} r={3} fill={C.ink} sw={0} stroke="none" />
    </>
  )
}

/** Gingerbread house roof from above: icing ridge, candy, a chimney. */
export function gingerbreadHouse(): ReactNode {
  return (
    <>
      <Box x={M} y={M} w={88} h={88} r={6} fill={T.ginger} />
      <Stroke x1={M} y1={50} x2={94} y2={50} stroke={C.white} sw={7} />
      <Shape d="M 12 20 Q 20 30 28 20 Q 36 30 44 20 Q 52 30 60 20 Q 68 30 76 20 Q 84 30 90 22" stroke={C.white} sw={DETAIL + 1} />
      <Shape d="M 12 80 Q 20 90 28 80 Q 36 90 44 80 Q 52 90 60 80 Q 68 90 76 80 Q 84 90 90 82" stroke={C.white} sw={DETAIL + 1} />
      <Disc x={30} y={36} r={5} fill={C.red} sw={DETAIL} />
      <Disc x={68} y={36} r={5} fill={C.greenLight} sw={DETAIL} />
      <Disc x={30} y={66} r={5} fill={C.greenLight} sw={DETAIL} />
      <Disc x={68} y={66} r={5} fill={C.red} sw={DETAIL} />
      <Box x={72} y={52} w={16} h={16} r={2} fill={T.gingerDark} sw={DETAIL} />
      <Disc x={50} y={50} r={5} fill={C.yellow} sw={DETAIL} />
    </>
  )
}

/** Rocking horse from above: two rockers, a body, a head and a red saddle. */
export function rockingHorse(): ReactNode {
  return (
    <>
      <Stroke x1={20} y1={16} x2={20} y2={84} stroke={C.woodDark} sw={7} />
      <Stroke x1={80} y1={16} x2={80} y2={84} stroke={C.woodDark} sw={7} />
      <Oval x={50} y={56} rx={17} ry={30} fill={C.woodLight} />
      <Oval x={50} y={22} rx={11} ry={13} fill={C.woodLight} />
      <Stroke x1={50} y1={12} x2={50} y2={42} stroke={C.ink} sw={DETAIL + 1} />
      <Oval x={50} y={60} rx={12} ry={14} fill={C.red} sw={DETAIL} />
      <Disc x={44} y={18} r={2.5} fill={C.ink} sw={0} stroke="none" />
      <Disc x={56} y={18} r={2.5} fill={C.ink} sw={0} stroke="none" />
    </>
  )
}

/** Reindeer from above: body, head, antlers, shiny red nose. */
export function reindeer(): ReactNode {
  return (
    <>
      <Shape d="M 40 24 L 30 10 M 36 18 L 24 20 M 60 24 L 70 10 M 64 18 L 76 20" stroke={C.woodDark} sw={5} />
      <Oval x={50} y={62} rx={21} ry={28} fill={C.woodLight} />
      <Oval x={50} y={30} rx={13} ry={15} fill={C.wood} />
      <Disc x={50} y={42} r={5.5} fill={C.red} sw={DETAIL} />
      <Disc x={43} y={26} r={2.5} fill={C.ink} sw={0} stroke="none" />
      <Disc x={57} y={26} r={2.5} fill={C.ink} sw={0} stroke="none" />
      <Oval x={50} y={74} rx={12} ry={10} fill={C.cream} sw={DETAIL} />
    </>
  )
}

/* ---------- Halloween ---------- */

/** Jack-o'-lantern: carved, glowing face. */
export function jackOLantern(): ReactNode {
  return (
    <>
      <Oval x={50} y={56} rx={42} ry={36} fill={T.orange} />
      <Oval x={28} y={56} rx={15} ry={32} fill={T.orangeDark} sw={DETAIL} />
      <Oval x={72} y={56} rx={15} ry={32} fill={T.orangeDark} sw={DETAIL} />
      <Box x={44} y={16} w={12} h={14} r={3} fill={C.greenDark} sw={DETAIL} />
      <Shape d="M 26 46 L 40 46 L 33 58 Z" fill={C.yellow} sw={DETAIL} />
      <Shape d="M 60 46 L 74 46 L 67 58 Z" fill={C.yellow} sw={DETAIL} />
      <Shape d="M 28 68 L 38 74 L 44 68 L 50 76 L 56 68 L 62 74 L 72 68 L 66 82 L 34 82 Z" fill={C.yellow} sw={DETAIL} />
    </>
  )
}

/** Witch's cauldron from above: iron rim, green brew, bubbles. */
export function cauldron(): ReactNode {
  return (
    <>
      <Box x={4} y={40} w={14} h={20} r={5} fill={C.slate} sw={DETAIL} />
      <Box x={82} y={40} w={14} h={20} r={5} fill={C.slate} sw={DETAIL} />
      <Disc x={50} y={50} r={38} fill={C.slate} />
      <Disc x={50} y={50} r={29} fill={T.slime} sw={DETAIL} />
      <Disc x={38} y={42} r={7} fill="#c8efae" sw={DETAIL} />
      <Disc x={60} y={36} r={5} fill="#c8efae" sw={DETAIL} />
      <Disc x={58} y={60} r={8} fill="#c8efae" sw={DETAIL} />
      <Disc x={40} y={64} r={4} fill="#c8efae" sw={DETAIL} />
    </>
  )
}

/** Friendly ghost, white sheet with a wavy hem. */
export function ghost(): ReactNode {
  return (
    <>
      <Shape d="M 20 88 L 20 44 C 20 12 80 12 80 44 L 80 88 L 68 78 L 56 88 L 44 78 L 32 88 Z" fill={C.white} />
      <Oval x={38} y={42} rx={5} ry={7} fill={C.ink} sw={0} stroke="none" />
      <Oval x={62} y={42} rx={5} ry={7} fill={C.ink} sw={0} stroke="none" />
      <Oval x={50} y={60} rx={6} ry={8} fill={C.ink} sw={0} stroke="none" />
    </>
  )
}

/** Coffin, one cell wide and two long: dark lid, purple trim, a golden cross. */
export function coffin(): ReactNode {
  return (
    <>
      <Shape d="M 36 8 L 64 8 L 86 54 L 70 192 L 30 192 L 14 54 Z" fill={C.woodDark} />
      <Shape d="M 40 24 L 60 24 L 74 58 L 62 176 L 38 176 L 26 58 Z" fill={C.wood} sw={DETAIL} />
      <Stroke x1={50} y1={52} x2={50} y2={110} stroke={C.yellow} sw={6} />
      <Stroke x1={36} y1={70} x2={64} y2={70} stroke={C.yellow} sw={6} />
      <Disc x={50} y={150} r={7} fill={C.purple} sw={DETAIL} />
    </>
  )
}

/** Tombstone with a cross and a bit of moss. */
export function tombstone(): ReactNode {
  return (
    <>
      <Shape d="M 18 90 L 18 44 C 18 8 82 8 82 44 L 82 90 Z" fill={T.tomb} />
      <Stroke x1={50} y1={26} x2={50} y2={64} stroke={C.steelDark} sw={6} />
      <Stroke x1={38} y1={38} x2={62} y2={38} stroke={C.steelDark} sw={6} />
      <Oval x={30} y={82} rx={11} ry={5} fill={C.green} sw={DETAIL} />
      <Oval x={72} y={78} rx={8} ry={5} fill={C.greenLight} sw={DETAIL} />
    </>
  )
}

/** Cobweb floor of any size: dark cloth with a white web and one spider. */
export function cobwebRug(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const cx = w / 2
  const cy = h / 2
  const spokes: ReactNode[] = []
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8
    spokes.push(<Stroke key={i} x1={cx} y1={cy} x2={r1(cx + (w / 2 - M - 4) * Math.cos(a) * 1.0)} y2={r1(cy + (h / 2 - M - 4) * Math.sin(a) * 1.0)} stroke={C.white} sw={2} />)
  }
  const rings = [0.3, 0.55, 0.8].map((f) => <Oval key={f} x={cx} y={cy} rx={r1((w / 2 - M - 4) * f)} ry={r1((h / 2 - M - 4) * f)} fill="none" stroke={C.white} sw={2} />)
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={10} fill={T.night} />
      {spokes}
      {rings}
      <Disc x={cx + 12} y={cy + 8} r={6} fill={C.ink} sw={DETAIL} stroke={T.nightLight} />
      <Disc x={cx + 12} y={cy + 8} r={2} fill={C.red} sw={0} stroke="none" />
    </>
  )
}

/** Witch's broomstick, two cells long: wooden handle, red binding, straw bristles. */
export function broomstick(): ReactNode {
  return (
    <>
      <Stroke x1={10} y1={50} x2={128} y2={50} stroke={C.wood} sw={9} />
      <Shape d="M 126 40 L 190 18 L 190 82 L 126 60 Z" fill={T.straw} sw={DETAIL} />
      <Stroke x1={134} y1={50} x2={188} y2={50} stroke={T.hayDark} sw={2} />
      <Stroke x1={134} y1={44} x2={188} y2={30} stroke={T.hayDark} sw={2} />
      <Stroke x1={134} y1={56} x2={188} y2={70} stroke={T.hayDark} sw={2} />
      <Box x={120} y={36} w={10} h={28} r={3} fill={C.red} sw={DETAIL} />
      <Disc x={12} y={50} r={5} fill={C.woodDark} sw={DETAIL} />
    </>
  )
}

/** Bowl of wrapped sweets. */
export function candyBowl(): ReactNode {
  const sweets: [number, number, string][] = [
    [36, 38, T.candy],
    [58, 34, C.yellow],
    [66, 56, C.greenLight],
    [42, 62, C.red],
    [50, 48, C.lilac],
    [30, 54, C.greenLight],
  ]
  return (
    <>
      <Disc x={50} y={50} r={40} fill={C.purple} />
      <Disc x={50} y={50} r={32} fill={C.purpleDark} sw={DETAIL} />
      {sweets.map(([x, y, fill]) => (
        <g key={`${x}-${y}`}>
          <Shape d={`M ${x - 11} ${y - 5} L ${x - 4} ${y} L ${x - 11} ${y + 5} Z M ${x + 11} ${y - 5} L ${x + 4} ${y} L ${x + 11} ${y + 5} Z`} fill={fill} sw={2} />
          <Disc x={x} y={y} r={6} fill={fill} sw={DETAIL} />
        </g>
      ))}
    </>
  )
}

/** Bare dead tree from above: grey trunk, crooked branches. */
export function deadTree(): ReactNode {
  return (
    <>
      <Shape d="M 50 50 L 20 20 M 50 50 L 80 18 M 50 50 L 14 62 M 50 50 L 86 66 M 50 50 L 44 88 M 50 50 L 64 86" stroke={C.woodDeep} sw={7} />
      <Shape d="M 28 28 L 14 26 M 72 26 L 84 34 M 30 58 L 22 76 M 78 62 L 88 50" stroke={C.woodDeep} sw={DETAIL + 1} />
      <Disc x={50} y={50} r={11} fill={C.woodDark} />
      <Disc x={50} y={50} r={5} fill={C.woodDeep} sw={DETAIL} />
    </>
  )
}

/* ---------- registry ---------- */

export interface DraftVariant {
  id: string
  cells: Cell[]
  cols: number
  rows: number
  draw: () => ReactNode
}

function rectCells(cols: number, rows: number): Cell[] {
  const cells: Cell[] = []
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) cells.push({ row, col })
  return cells
}

type Size = readonly [cols: number, rows: number]
function define(sizes: readonly Size[], draw: (cols: number, rows: number) => ReactNode): DraftVariant[] {
  return sizes.map(([cols, rows]) => ({ id: `${cols}x${rows}`, cells: rectCells(cols, rows), cols, rows, draw: () => draw(cols, rows) }))
}

/** Every new drawing, by icon id. The ids are what a draft `themeIcon` names. */
export const SEASONAL_ICONS = {
  pumpkin: define([[1, 1]], pumpkin),
  mapleTree: define([[1, 1]], mapleTree),
  mushroom: define([[1, 1]], mushroom),
  scarecrow: define([[1, 1]], scarecrow),
  bonfire: define([[1, 1]], bonfire),
  hayBale: define([[1, 1], [2, 1], [2, 2]], hayBale),
  leafPile: define([[1, 1], [2, 1], [2, 2]], leafPile),
  fireplace: define([[1, 1]], fireplace),
  frog: define([[1, 1]], frog),
  barrel: define([[1, 1]], barrel),
  drum: define([[1, 1]], drum),
  confettiPile: define([[1, 1], [2, 1], [2, 2]], confettiPile),
  floatCart: define([[1, 2]], floatCart),
  christmasTree: define([[1, 1]], christmasTree),
  present: define([[1, 1]], present),
  sleigh: define([[1, 2]], sleigh),
  snowman: define([[1, 1]], snowman),
  gingerbreadHouse: define([[1, 1]], gingerbreadHouse),
  rockingHorse: define([[1, 1]], rockingHorse),
  reindeer: define([[1, 1]], reindeer),
  jackOLantern: define([[1, 1]], jackOLantern),
  cauldron: define([[1, 1]], cauldron),
  ghost: define([[1, 1]], ghost),
  coffin: define([[1, 2]], coffin),
  tombstone: define([[1, 1]], tombstone),
  cobwebRug: define([[1, 1], [2, 1], [2, 2]], cobwebRug),
  broomstick: define([[2, 1]], broomstick),
  candyBowl: define([[1, 1]], candyBowl),
  deadTree: define([[1, 1]], deadTree),
} as const

export type SeasonalIconId = keyof typeof SEASONAL_ICONS
