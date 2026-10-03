import type { ReactNode } from 'react'
import { Box, Disc, Feet, Oval, Shape, Stroke } from '../art/shapes.tsx'
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
  waterDark: '#6bb4cf',
} as const

/*
 * Drawing rules (SLAY-16): detail inside the silhouette, feet at all four corners where the object
 * stands on legs, nothing that marks one side as lit (the wrapper filter adds light and shadow),
 * and every shape inside its footprint cells.
 */

/** Swivel office chair from above, backrest to the north, armrests either side. */
export function officeChair(): ReactNode {
  return (
    <>
      <Feet cols={1} rows={1} size={10} inset={5} fill={C.steelDark} />
      <Box x={8} y={40} w={12} h={34} r={5} fill={C.slate} sw={DETAIL} />
      <Box x={80} y={40} w={12} h={34} r={5} fill={C.slate} sw={DETAIL} />
      <Box x={22} y={M} w={56} h={22} r={11} fill={C.slate} />
      <Stroke x1={34} y1={17} x2={66} y2={17} stroke={C.steelDark} sw={DETAIL} />
      <Disc x={50} y={58} r={30} fill={C.steel} />
      <Shape d="M 50 32 L 50 84 M 24 58 L 76 58" stroke={C.steelDark} sw={DETAIL} />
      <Disc x={50} y={58} r={15} fill={C.steelDark} sw={DETAIL} />
      <Disc x={50} y={58} r={5} fill={C.slate} sw={DETAIL} />
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
      <Shape d="M 50 20 C 44 32 44 46 50 54 C 56 46 56 32 50 20 Z" fill={C.purple} sw={DETAIL} />
      <Shape d="M 24 40 C 34 48 42 52 50 54 C 60 52 70 48 78 40" stroke={C.purpleDark} sw={DETAIL} />
      <Shape d="M 30 72 C 38 64 44 58 50 54 C 58 60 66 68 72 76" stroke={C.purpleDark} sw={DETAIL} />
      <Disc x={50} y={54} r={5} fill={C.purpleDark} sw={DETAIL} />
      <Shape d="M 28 30 C 32 26 36 24 40 22" stroke={C.purpleDark} sw={2} />
      <Shape d="M 60 22 C 66 24 72 28 76 32" stroke={C.purpleDark} sw={2} />
    </>
  )
}

/** Picnic blanket of any size: red cloth with a white check. */
export function picnicBlanket(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const lines: ReactNode[] = []
  const nodes: ReactNode[] = []
  const xs: number[] = []
  const ys: number[] = []
  for (let x = M + 22; x < w - M - 10; x += 22) xs.push(x)
  for (let y = M + 22; y < h - M - 10; y += 22) ys.push(y)
  for (const x of xs) {
    lines.push(<Stroke key={`v${x}`} x1={x} y1={M + 4} x2={x} y2={h - M - 4} stroke={C.white} sw={DETAIL + 3} />)
  }
  for (const y of ys) {
    lines.push(<Stroke key={`h${y}`} x1={M + 4} y1={y} x2={w - M - 4} y2={y} stroke={C.white} sw={DETAIL + 3} />)
  }
  for (const x of xs) {
    for (const y of ys) nodes.push(<Box key={`n${x}-${y}`} x={x - 4} y={y - 4} w={8} h={8} r={1} fill={C.redDark} sw={0} />)
  }
  // Tassels at all four corners keep the cloth identical under rotation and mirroring.
  const tassel = (x: number, y: number) => <Disc key={`t${x}-${y}`} x={x} y={y} r={3.5} fill={C.cream} sw={2} />
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={3} fill={C.red} />
      {lines}
      {nodes}
      <Box x={M + 8} y={M + 8} w={w - 2 * M - 16} h={h - 2 * M - 16} r={2} fill="none" stroke={C.redDark} sw={DETAIL} />
      {tassel(M + 14, M + 14)}
      {tassel(w - M - 14, M + 14)}
      {tassel(M + 14, h - M - 14)}
      {tassel(w - M - 14, h - M - 14)}
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={3} fill="none" />
    </>
  )
}

/** Hammock between two posts, head to the north. One cell wide, two long. */
export function hammock(): ReactNode {
  return (
    <>
      <Feet cols={1} rows={2} size={10} inset={5} />
      <Box x={26} y={M} w={48} h={9} r={4} fill={C.woodDark} />
      <Box x={26} y={185} w={48} h={9} r={4} fill={C.woodDark} />
      <Stroke x1={36} y1={16} x2={30} y2={34} sw={DETAIL} />
      <Stroke x1={64} y1={16} x2={70} y2={34} sw={DETAIL} />
      <Stroke x1={36} y1={184} x2={30} y2={166} sw={DETAIL} />
      <Stroke x1={64} y1={184} x2={70} y2={166} sw={DETAIL} />
      <Box x={20} y={32} w={60} h={136} r={26} fill={C.greenLight} />
      <Box x={27} y={39} w={46} h={122} r={20} fill="none" stroke={C.greenDark} sw={DETAIL} />
      <Box x={30} y={46} w={40} h={24} r={10} fill={C.creamLight} sw={DETAIL} />
      <Stroke x1={50} y1={50} x2={50} y2={66} stroke={C.creamDark} sw={2} />
      <Stroke x1={26} y1={88} x2={74} y2={88} stroke={C.white} sw={DETAIL + 1} />
      <Stroke x1={26} y1={112} x2={74} y2={112} stroke={C.white} sw={DETAIL + 1} />
      <Stroke x1={26} y1={136} x2={74} y2={136} stroke={C.white} sw={DETAIL + 1} />
      <Stroke x1={50} y1={76} x2={50} y2={150} stroke={C.greenDark} sw={2} />
    </>
  )
}

/** Sandpit: wooden frame, sand, a bucket and a spade. */
export function sandbox(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const cornerBolt = (x: number, y: number) => <Disc key={`${x}-${y}`} x={x} y={y} r={3.5} fill={C.woodDeep} sw={2} />
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={6} fill={C.wood} />
      {cornerBolt(M + 6, M + 6)}
      {cornerBolt(w - M - 6, M + 6)}
      {cornerBolt(M + 6, h - M - 6)}
      {cornerBolt(w - M - 6, h - M - 6)}
      <Box x={M + 12} y={M + 12} w={w - 2 * M - 24} h={h - 2 * M - 24} r={4} fill={T.sand} sw={DETAIL} />
      <Shape d={`M ${M + 26} ${M + 30} Q ${M + 46} ${M + 22} ${M + 66} ${M + 32}`} stroke={T.sandDark} sw={DETAIL} />
      <Shape d={`M ${M + 30} ${M + 48} Q ${M + 52} ${M + 40} ${M + 78} ${M + 50}`} stroke={T.sandDark} sw={DETAIL} />
      <Shape d={`M ${M + 30} ${M + 62} L ${M + 46} ${M + 40} L ${M + 62} ${M + 62} Z`} fill={T.sandDark} stroke={T.sandDark} sw={DETAIL} />
      <Disc x={M + 46} y={M + 37} r={3} fill={C.red} sw={2} />
      <Disc x={w - M - 42} y={h - M - 40} r={13} fill={C.red} />
      <Disc x={w - M - 42} y={h - M - 40} r={7} fill={C.redDark} sw={DETAIL} />
      <Stroke x1={M + 30} y1={h - M - 30} x2={M + 52} y2={h - M - 50} stroke={C.woodDark} sw={DETAIL + 2} />
      <Box x={M + 24} y={h - M - 62} w={14} h={14} r={4} fill={C.yellow} sw={DETAIL} />
    </>
  )
}

/** Gym mat: blue slab with fold lines and grab straps at both ends. */
export function gymMat(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const folds: ReactNode[] = []
  const studs: ReactNode[] = []
  for (let c = 1; c < cols; c++) {
    folds.push(<Stroke key={c} x1={c * U} y1={M + 4} x2={c * U} y2={h - M - 4} stroke={T.blueDark} sw={DETAIL} />)
  }
  for (let c = 0; c < cols; c++) {
    for (const y of [34, 66]) {
      studs.push(<Disc key={`${c}-${y}`} x={c * U + 50} y={y} r={3} fill={T.blueDark} sw={0} />)
    }
  }
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={8} fill={T.blue} />
      <Box x={M + 10} y={M + 10} w={w - 2 * M - 20} h={h - 2 * M - 20} r={4} fill="none" stroke={T.blueDark} sw={DETAIL} />
      {folds}
      {studs}
      <Box x={w - M - 16} y={h / 2 - 12} w={12} h={24} r={4} fill={C.yellow} sw={DETAIL} />
      <Box x={M + 4} y={h / 2 - 12} w={12} h={24} r={4} fill={C.yellow} sw={DETAIL} />
      <Stroke x1={w - M - 10} y1={h / 2 - 6} x2={w - M - 10} y2={h / 2 + 6} stroke={C.goldDark} sw={2} />
      <Stroke x1={M + 10} y1={h / 2 - 6} x2={M + 10} y2={h / 2 + 6} stroke={C.goldDark} sw={2} />
    </>
  )
}

/** Fountain: stone rim, water and a central jet. Square footprints only. */
export function fountain(cols: number, rows: number): ReactNode {
  const cx = (cols * U) / 2
  const cy = (rows * U) / 2
  const rim = Math.min(cols, rows) * 50 - M - 2
  const inner = rim - 12
  const jet = Math.max(rim * 0.2, 7)
  const joints: ReactNode[] = []
  const drops: ReactNode[] = []
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + Math.PI / 8
    const ca = Math.cos(a)
    const sa = Math.sin(a)
    joints.push(
      <Stroke key={`j${k}`} x1={cx + ca * (inner + 2)} y1={cy + sa * (inner + 2)} x2={cx + ca * (rim - 1)} y2={cy + sa * (rim - 1)} stroke={C.steelDark} sw={DETAIL} />,
    )
    drops.push(<Disc key={`d${k}`} x={cx + Math.cos(a - Math.PI / 8) * inner * 0.38} y={cy + Math.sin(a - Math.PI / 8) * inner * 0.38} r={2.5} fill={C.white} sw={0} />)
  }
  return (
    <>
      <Disc x={cx} y={cy} r={rim} fill={C.stone} />
      {joints}
      <Disc x={cx} y={cy} r={inner} fill={T.water} sw={DETAIL} />
      <Disc x={cx} y={cy} r={inner * 0.78} fill="none" stroke={T.waterDark} sw={2} />
      <Disc x={cx} y={cy} r={inner * 0.55} fill="none" stroke={C.skyLight} sw={DETAIL} />
      {drops}
      <Disc x={cx} y={cy} r={jet + 4} fill={C.steel} sw={DETAIL} />
      <Disc x={cx} y={cy} r={jet} fill={C.white} sw={DETAIL} />
    </>
  )
}

/** Blackboard on legs, with chalk scribbles and a chalk tray. */
export function blackboard(cols: number, _rows: number): ReactNode {
  const w = cols * U
  return (
    <>
      <Feet cols={cols} rows={1} size={10} inset={5} />
      <Stroke x1={M + 12} y1={64} x2={M + 6} y2={90} stroke={C.woodDark} sw={DETAIL + 2} />
      <Stroke x1={w - M - 12} y1={64} x2={w - M - 6} y2={90} stroke={C.woodDark} sw={DETAIL + 2} />
      <Stroke x1={M + 16} y1={78} x2={w - M - 16} y2={78} stroke={C.woodDark} sw={DETAIL} />
      <Box x={M + 2} y={12} w={w - 2 * M - 4} h={46} r={4} fill={C.wood} />
      <Box x={M + 8} y={18} w={w - 2 * M - 16} h={34} r={2} fill={T.board} sw={DETAIL} />
      <Shape d={`M ${M + 16} 28 L ${M + 40} 28 M ${M + 16} 40 L ${M + 30} 40`} stroke={C.white} sw={DETAIL} />
      <Shape d={`M ${w - M - 44} 26 Q ${w - M - 32} 40 ${w - M - 18} 24`} stroke={C.yellow} sw={DETAIL} />
      <Shape d={`M ${w - M - 40} 44 L ${w - M - 24} 44`} stroke={T.boardLight} sw={DETAIL} />
      <Box x={M} y={58} w={w - 2 * M} h={8} r={3} fill={C.woodLight} sw={DETAIL} />
      <Box x={M + 10} y={59.5} w={14} h={5} r={2} fill={C.white} sw={2} />
      <Box x={w - M - 24} y={59.5} w={14} h={5} r={2} fill={C.pink} sw={2} />
    </>
  )
}

/** Office printer from above: paper tray, scanner lid and a control panel. */
export function printer(): ReactNode {
  return (
    <>
      <Feet cols={1} rows={1} size={10} inset={5} fill={C.slate} />
      <Box x={14} y={M} w={72} h={22} r={4} fill={C.white} />
      <Stroke x1={24} y1={13} x2={76} y2={13} stroke={C.steel} sw={2} />
      <Stroke x1={24} y1={19} x2={60} y2={19} stroke={C.steel} sw={2} />
      <Box x={10} y={26} w={80} h={62} r={9} fill={C.steel} />
      <Box x={18} y={34} w={64} h={34} r={5} fill={C.stone} sw={DETAIL} />
      <Box x={24} y={40} w={38} h={22} r={3} fill={C.sky} sw={DETAIL} />
      <Stroke x1={30} y1={46} x2={54} y2={46} stroke={C.white} sw={DETAIL} />
      <Stroke x1={30} y1={54} x2={46} y2={54} stroke={C.white} sw={DETAIL} />
      <Disc x={72} y={46} r={4} fill={C.green} sw={2} />
      <Disc x={72} y={58} r={4} fill={C.red} sw={2} />
      <Box x={24} y={74} w={52} h={8} r={3} fill={C.white} sw={DETAIL} />
      <Stroke x1={32} y1={78} x2={68} y2={78} stroke={C.steelDark} sw={2} />
    </>
  )
}

/** Vending machine seen from the front on its top: glass front, coin slot. */
export function vendingMachine(): ReactNode {
  const cans: ReactNode[] = []
  const shelves: ReactNode[] = []
  const keys: ReactNode[] = []
  const colours = [C.yellow, C.greenLight, C.pink, C.sky]
  for (let r = 0; r < 3; r++) {
    shelves.push(<Stroke key={`s${r}`} x1={21} y1={31 + r * 17} x2={63} y2={31 + r * 17} stroke={C.steelDark} sw={2} />)
    for (let c = 0; c < 4; c++) {
      cans.push(<Box key={`${r}${c}`} x={22 + c * 11} y={18 + r * 17} w={8} h={12} r={3} fill={colours[(r + c) % 4]} sw={2} />)
    }
  }
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) keys.push(<Disc key={`k${r}${c}`} x={74 + c * 6} y={58 + r * 6} r={1.8} fill={C.white} sw={0} />)
  }
  return (
    <>
      <Feet cols={1} rows={1} size={9} inset={4} fill={C.slate} />
      <Box x={12} y={8} w={76} h={84} r={8} fill={C.red} />
      <Box x={18} y={13} w={48} h={62} r={4} fill={C.skyLight} sw={DETAIL} />
      {shelves}
      {cans}
      <Box x={71} y={16} w={12} h={20} r={3} fill={C.slate} sw={DETAIL} />
      <Stroke x1={74} y1={22} x2={80} y2={22} stroke={C.greenLight} sw={2} />
      <Stroke x1={74} y1={28} x2={80} y2={28} stroke={C.greenLight} sw={2} />
      <Box x={71} y={44} w={12} h={10} r={3} fill={C.steel} sw={DETAIL} />
      <Stroke x1={74} y1={49} x2={80} y2={49} stroke={C.slate} sw={2} />
      {keys}
      <Box x={18} y={79} w={64} h={8} r={3} fill={C.redDark} sw={DETAIL} />
      <Stroke x1={28} y1={83} x2={72} y2={83} stroke={C.slate} sw={2} />
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
  const step = (w - 52) / count
  for (let i = 0; i < count; i++) {
    const x = 22 + i * step
    garments.push(
      <Box key={i} x={x} y={cy - 26} w={step - 4} h={52} r={5} fill={colours[i % colours.length]} sw={DETAIL} />,
      <Stroke key={`c${i}`} x1={x + (step - 4) / 2} y1={cy - 20} x2={x + (step - 4) / 2} y2={cy + 20} stroke={C.slate} sw={2} opacity={0.5} />,
    )
  }
  return (
    <>
      <Feet cols={cols} rows={rows} size={10} inset={5} fill={C.slate} />
      <Box x={M} y={cy - 22} w={9} h={44} r={4} fill={C.steelDark} sw={DETAIL} />
      <Box x={w - M - 9} y={cy - 22} w={9} h={44} r={4} fill={C.steelDark} sw={DETAIL} />
      {garments}
      <Stroke x1={M + 6} y1={cy} x2={w - M - 6} y2={cy} stroke={C.slate} sw={DETAIL + 1} />
      <Disc x={M + 4.5} y={cy} r={3} fill={C.steel} sw={2} />
      <Disc x={w - M - 4.5} y={cy} r={3} fill={C.steel} sw={2} />
    </>
  )
}

/** Shop mannequin: a bust on a round plinth. */
export function mannequin(): ReactNode {
  const bolts: ReactNode[] = []
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + Math.PI / 4
    bolts.push(<Disc key={k} x={50 + Math.cos(a) * 33} y={50 + Math.sin(a) * 33} r={3} fill={C.steelDark} sw={2} />)
  }
  return (
    <>
      <Disc x={50} y={50} r={40} fill={C.stone} />
      <Disc x={50} y={50} r={33} fill="none" stroke={C.steelDark} sw={DETAIL} />
      {bolts}
      <Oval x={50} y={56} rx={28} ry={13} fill={C.pink} sw={DETAIL + 1} />
      <Shape d="M 40 50 Q 44 60 40 64 M 60 50 Q 56 60 60 64" stroke={C.redDark} sw={2} />
      <Disc x={50} y={42} r={11} fill={C.paper} sw={DETAIL + 1} />
      <Disc x={50} y={42} r={4} fill="none" stroke={C.creamDark} sw={2} />
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
      <Feet cols={cols} rows={rows} size={10} inset={5} />
      <Box x={M} y={12} w={w - 2 * M} h={h - 24} r={6} fill={C.woodLight} />
      <Stroke x1={M + 12} y1={18} x2={w - M - 12} y2={18} stroke={C.wood} sw={2} />
      <Box x={M + 12} y={22} w={w - 2 * M - 70} h={h - 44} r={4} fill={C.slate} sw={DETAIL} />
      {rollers}
      <Box x={w - M - 50} y={20} w={40} h={h - 40} r={5} fill={C.steel} />
      <Box x={w - M - 44} y={26} w={28} h={18} r={3} fill={C.sky} sw={DETAIL} />
      <Stroke x1={w - M - 39} y1={32} x2={w - M - 21} y2={32} stroke={C.white} sw={2} />
      <Disc x={w - M - 40} y={55} r={2.5} fill={C.slate} sw={0} />
      <Disc x={w - M - 31} y={55} r={2.5} fill={C.slate} sw={0} />
      <Disc x={w - M - 22} y={55} r={2.5} fill={C.slate} sw={0} />
      <Box x={w - M - 42} y={h - 40} w={24} h={8} r={3} fill={C.steelDark} sw={DETAIL} />
    </>
  )
}
