import type { ReactNode } from 'react'
import { Box, Disc, Oval, Shape, Stroke } from '../art/shapes.tsx'
import { C, DETAIL, M, U } from '../art/tokens.ts'

/** Extra flat colours for the theme icons only. Own choices. */
const T = {
  sand: '#ecd9a0',
  sandDark: '#d6bd7c',
  blue: '#5b8fd6',
  blueDark: '#3f6fb0',
  board: '#33604c',
  boardLight: '#4d7d66',
  water: '#8fd0e6',
} as const

/** Swivel office chair from above, backrest to the north, armrests either side. */
export function officeChair(): ReactNode {
  return (
    <>
      <Box x={8} y={40} w={12} h={34} r={5} fill={C.slate} sw={DETAIL} />
      <Box x={80} y={40} w={12} h={34} r={5} fill={C.slate} sw={DETAIL} />
      <Box x={22} y={M} w={56} h={22} r={11} fill={C.slate} />
      <Disc x={50} y={58} r={30} fill={C.steel} />
      <Disc x={50} y={58} r={15} fill={C.steelDark} sw={DETAIL} />
    </>
  )
}

/** Beanbag: a lumpy pillow with a seam. */
export function beanbag(): ReactNode {
  return (
    <>
      <Shape
        d="M 50 12 C 76 8 90 32 88 56 C 86 80 66 92 46 88 C 22 90 10 68 14 44 C 16 24 32 14 50 12 Z"
        fill={C.lilac}
      />
      <Shape d="M 30 34 C 36 26 50 24 58 28 C 50 34 38 38 30 34 Z" fill={C.creamLight} stroke="none" />
      <Shape d="M 34 60 C 46 70 62 68 72 56" stroke={C.purpleDark} sw={DETAIL} />
    </>
  )
}

/** Picnic blanket of any size: red cloth with a white check. */
export function picnicBlanket(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const lines: ReactNode[] = []
  for (let x = M + 22; x < w - M - 10; x += 22) {
    lines.push(<Stroke key={`v${x}`} x1={x} y1={M + 4} x2={x} y2={h - M - 4} stroke={C.white} sw={DETAIL + 3} />)
  }
  for (let y = M + 22; y < h - M - 10; y += 22) {
    lines.push(<Stroke key={`h${y}`} x1={M + 4} y1={y} x2={w - M - 4} y2={y} stroke={C.white} sw={DETAIL + 3} />)
  }
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={3} fill={C.red} />
      {lines}
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={3} fill="none" />
    </>
  )
}

/** Hammock between two posts, head to the north. One cell wide, two long. */
export function hammock(): ReactNode {
  return (
    <>
      <Box x={26} y={M} w={48} h={9} r={4} fill={C.woodDark} />
      <Box x={26} y={185} w={48} h={9} r={4} fill={C.woodDark} />
      <Stroke x1={36} y1={16} x2={30} y2={34} sw={DETAIL} />
      <Stroke x1={64} y1={16} x2={70} y2={34} sw={DETAIL} />
      <Stroke x1={36} y1={184} x2={30} y2={166} sw={DETAIL} />
      <Stroke x1={64} y1={184} x2={70} y2={166} sw={DETAIL} />
      <Box x={20} y={32} w={60} h={136} r={26} fill={C.greenLight} />
      <Box x={30} y={42} w={40} h={24} r={10} fill={C.creamLight} sw={DETAIL} />
      <Stroke x1={26} y1={84} x2={74} y2={84} stroke={C.white} sw={DETAIL + 1} />
      <Stroke x1={26} y1={108} x2={74} y2={108} stroke={C.white} sw={DETAIL + 1} />
      <Stroke x1={26} y1={132} x2={74} y2={132} stroke={C.white} sw={DETAIL + 1} />
    </>
  )
}

/** Sandpit: wooden frame, sand, a bucket and a spade. */
export function sandbox(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={6} fill={C.wood} />
      <Box x={M + 12} y={M + 12} w={w - 2 * M - 24} h={h - 2 * M - 24} r={4} fill={T.sand} sw={DETAIL} />
      <Shape d={`M ${M + 26} ${M + 30} Q ${M + 46} ${M + 22} ${M + 66} ${M + 32}`} stroke={T.sandDark} sw={DETAIL} />
      <Disc x={w - M - 42} y={h - M - 40} r={13} fill={C.red} />
      <Disc x={w - M - 42} y={h - M - 40} r={7} fill={C.redDark} sw={DETAIL} />
      <Stroke x1={M + 30} y1={h - M - 30} x2={M + 52} y2={h - M - 50} stroke={C.woodDark} sw={DETAIL + 2} />
    </>
  )
}

/** Gym mat: blue slab with fold lines and grab straps at both ends. */
export function gymMat(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const folds: ReactNode[] = []
  for (let c = 1; c < cols; c++) {
    folds.push(<Stroke key={c} x1={c * U} y1={M + 4} x2={c * U} y2={h - M - 4} stroke={T.blueDark} sw={DETAIL} />)
  }
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={8} fill={T.blue} />
      <Box x={M + 10} y={M + 10} w={w - 2 * M - 20} h={h - 2 * M - 20} r={4} fill="none" stroke={T.blueDark} sw={DETAIL} />
      {folds}
      <Box x={w - M - 16} y={h / 2 - 12} w={12} h={24} r={4} fill={C.yellow} sw={DETAIL} />
    </>
  )
}

/** Fountain: stone rim, water and a central jet. Square footprints only. */
export function fountain(cols: number, rows: number): ReactNode {
  const cx = (cols * U) / 2
  const cy = (rows * U) / 2
  const rim = Math.min(cols, rows) * 50 - M - 2
  return (
    <>
      <Disc x={cx} y={cy} r={rim} fill={C.stone} />
      <Disc x={cx} y={cy} r={rim - 12} fill={T.water} sw={DETAIL} />
      <Disc x={cx} y={cy} r={(rim - 12) * 0.55} fill="none" stroke={C.skyLight} sw={DETAIL} />
      <Disc x={cx} y={cy} r={Math.max(rim * 0.2, 7)} fill={C.white} sw={DETAIL} />
    </>
  )
}

/** Blackboard on legs, with chalk scribbles and a chalk tray. */
export function blackboard(cols: number, _rows: number): ReactNode {
  const w = cols * U
  return (
    <>
      <Stroke x1={M + 12} y1={64} x2={M + 6} y2={90} stroke={C.woodDark} sw={DETAIL + 2} />
      <Stroke x1={w - M - 12} y1={64} x2={w - M - 6} y2={90} stroke={C.woodDark} sw={DETAIL + 2} />
      <Box x={M + 2} y={12} w={w - 2 * M - 4} h={46} r={4} fill={T.board} />
      <Shape d={`M ${M + 16} 30 L ${M + 40} 30 M ${M + 16} 42 L ${M + 30} 42`} stroke={C.white} sw={DETAIL} />
      <Shape d={`M ${w - M - 44} 26 Q ${w - M - 32} 40 ${w - M - 18} 24`} stroke={C.yellow} sw={DETAIL} />
      <Box x={M} y={58} w={w - 2 * M} h={8} r={3} fill={C.wood} sw={DETAIL} />
    </>
  )
}

/** Office printer from above: paper tray, scanner lid and a control panel. */
export function printer(): ReactNode {
  return (
    <>
      <Box x={14} y={M} w={72} h={22} r={4} fill={C.white} />
      <Box x={10} y={26} w={80} h={62} r={9} fill={C.steel} />
      <Box x={18} y={34} w={64} h={34} r={5} fill={C.stone} sw={DETAIL} />
      <Box x={24} y={40} w={38} h={22} r={3} fill={C.sky} sw={DETAIL} />
      <Disc x={72} y={46} r={4} fill={C.green} sw={2} />
      <Disc x={72} y={58} r={4} fill={C.red} sw={2} />
      <Box x={24} y={74} w={52} h={8} r={3} fill={C.white} sw={DETAIL} />
    </>
  )
}

/** Vending machine seen from the front on its top: glass front, coin slot. */
export function vendingMachine(): ReactNode {
  const cans: ReactNode[] = []
  const colours = [C.yellow, C.greenLight, C.pink, C.sky]
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      cans.push(<Box key={`${r}${c}`} x={22 + c * 11} y={18 + r * 17} w={8} h={12} r={3} fill={colours[(r + c) % 4]} sw={2} />)
    }
  }
  return (
    <>
      <Box x={12} y={8} w={76} h={84} r={8} fill={C.red} />
      <Box x={18} y={13} w={48} h={62} r={4} fill={C.skyLight} sw={DETAIL} />
      {cans}
      <Box x={71} y={16} w={12} h={20} r={3} fill={C.slate} sw={DETAIL} />
      <Box x={71} y={44} w={12} h={10} r={3} fill={C.steel} sw={DETAIL} />
      <Box x={18} y={79} w={64} h={8} r={3} fill={C.redDark} sw={DETAIL} />
    </>
  )
}

/** Clothes rail, two cells long: garments hanging from a rail between two feet. */
export function clothesRack(cols: number, rows: number): ReactNode {
  const w = cols * U
  const cy = (rows * U) / 2
  const colours = [C.pink, C.sky, C.yellow, C.greenLight, C.lilac, C.red]
  const garments: ReactNode[] = []
  const count = cols * 3
  for (let i = 0; i < count; i++) {
    garments.push(
      <Box key={i} x={22 + i * ((w - 52) / count)} y={cy - 26} w={(w - 52) / count - 4} h={52} r={5} fill={colours[i % colours.length]} sw={DETAIL} />,
    )
  }
  return (
    <>
      <Box x={M} y={cy - 22} w={9} h={44} r={4} fill={C.steelDark} sw={DETAIL} />
      <Box x={w - M - 9} y={cy - 22} w={9} h={44} r={4} fill={C.steelDark} sw={DETAIL} />
      {garments}
      <Stroke x1={M + 6} y1={cy} x2={w - M - 6} y2={cy} stroke={C.slate} sw={DETAIL + 1} />
    </>
  )
}

/** Shop mannequin: a bust on a round plinth. */
export function mannequin(): ReactNode {
  return (
    <>
      <Disc x={50} y={50} r={40} fill={C.stone} />
      <Oval x={50} y={56} rx={28} ry={13} fill={C.pink} sw={DETAIL + 1} />
      <Disc x={50} y={42} r={11} fill={C.paper} sw={DETAIL + 1} />
      <Stroke x1={38} y1={58} x2={62} y2={58} stroke={C.redDark} sw={DETAIL} />
    </>
  )
}

/** Checkout counter: belt on one side, the till at the east end. */
export function checkoutCounter(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const rollers: ReactNode[] = []
  for (let x = M + 26; x < w - 66; x += 18) {
    rollers.push(<Stroke key={x} x1={x} y1={24} x2={x} y2={h - 30} stroke={C.steel} sw={DETAIL} />)
  }
  return (
    <>
      <Box x={M} y={12} w={w - 2 * M} h={h - 24} r={6} fill={C.woodLight} />
      <Box x={M + 12} y={22} w={w - 2 * M - 70} h={h - 44} r={4} fill={C.slate} sw={DETAIL} />
      {rollers}
      <Box x={w - M - 50} y={20} w={40} h={h - 40} r={5} fill={C.steel} />
      <Box x={w - M - 44} y={26} w={28} h={18} r={3} fill={C.sky} sw={DETAIL} />
    </>
  )
}
