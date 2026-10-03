import type { ReactNode } from 'react'
import { Box, Disc, Feet, Shape, Stroke } from './shapes.tsx'
import { C, DETAIL, M, U, n } from './tokens.ts'

/** Armchair, seen from above, back to the north: cushioned seat, rolled arms, four feet. */
export function chair(): ReactNode {
  return (
    <>
      <Feet cols={1} rows={1} size={13} inset={3} />
      <Box x={14} y={6} w={72} h={34} r={16} fill={C.cream} />
      <Box x={M} y={24} w={22} h={68} r={10} fill={C.cream} />
      <Box x={72} y={24} w={22} h={68} r={10} fill={C.cream} />
      <Box x={22} y={12} w={56} h={24} r={10} fill={C.creamLight} sw={DETAIL} />
      <Box x={26} y={38} w={48} h={50} r={10} fill={C.creamLight} />
      <Stroke x1={50} y1={42} x2={50} y2={84} stroke={C.creamDark} sw={2.5} />
      <Stroke x1={32} y1={62} x2={68} y2={62} stroke={C.creamDark} sw={2.5} opacity={0.8} />
      <Stroke x1={17} y1={34} x2={17} y2={80} stroke={C.white} sw={3} opacity={0.8} />
      <Stroke x1={83} y1={34} x2={83} y2={80} stroke={C.white} sw={3} opacity={0.8} />
    </>
  )
}

/** Rug of any size: gold border, woven field, inner frame line and a centre medallion. */
export function rug(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const cx = w / 2
  const cy = h / 2
  const fringe: ReactNode[] = []
  for (let i = 0; i < cols * 5; i++) {
    const x = n(10 + ((w - 20) * (i + 0.5)) / (cols * 5))
    fringe.push(
      <Stroke key={`t${i}`} x1={x} y1={M + 2} x2={x} y2={M + 7} stroke={C.goldDark} sw={2} opacity={0.7} />,
      <Stroke key={`b${i}`} x1={x} y1={h - M - 7} x2={x} y2={h - M - 2} stroke={C.goldDark} sw={2} opacity={0.7} />,
    )
  }
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={4} fill={C.gold} />
      {fringe}
      <Box x={M + 12} y={M + 12} w={w - 2 * M - 24} h={h - 2 * M - 24} r={2} fill={C.yellow} sw={DETAIL} />
      <Box x={M + 22} y={M + 22} w={w - 2 * M - 44} h={h - 2 * M - 44} r={2} fill="none" stroke={C.goldDark} sw={2} opacity={0.8} />
      <Box x={M + 26} y={M + 26} w={w - 2 * M - 52} h={h - 2 * M - 52} r={2} fill={C.yellowLight} sw={0} />
      <Shape d={`M ${cx} ${cy - 16} L ${cx + 16} ${cy} L ${cx} ${cy + 16} L ${cx - 16} ${cy} Z`} fill={C.gold} sw={DETAIL} />
      <Disc x={cx} y={cy} r={4} fill={C.yellowLight} sw={0} />
    </>
  )
}

/** Bed, head (pillows) to the north. Each column of cells adds one pillow. */
export function bed(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const pillows = Array.from({ length: cols }, (_, i) => (
    <Box key={i} x={i * U + 16} y={M + 10} w={U - 32} h={28} r={10} fill={C.cream} sw={DETAIL} />
  ))
  const pillowCreases = Array.from({ length: cols }, (_, i) => (
    <Stroke key={i} x1={i * U + 38} y1={M + 24} x2={i * U + U - 38} y2={M + 24} stroke={C.creamDark} sw={2.5} />
  ))
  const folds = Array.from({ length: rows - 1 }, (_, i) => (
    <Stroke key={i} x1={M + 18} y1={92 + i * U} x2={w - M - 18} y2={92 + i * U} stroke={C.purpleDark} sw={2.5} opacity={0.6} />
  ))
  return (
    <>
      <Feet cols={cols} rows={rows} size={13} inset={3} />
      <Box x={9} y={9} w={w - 18} h={h - 18} r={10} fill={C.white} />
      {pillows}
      {pillowCreases}
      <Box x={9} y={56} w={w - 18} h={h - 56 - 9} r={8} fill={C.purple} />
      <Box x={9} y={56} w={w - 18} h={12} r={6} fill={C.white} sw={DETAIL} />
      <Stroke x1={M + 18} y1={78} x2={w - M - 18} y2={78} stroke={C.purpleDark} sw={DETAIL} />
      {folds}
      <Stroke x1={M + 18} y1={h - 18} x2={w - M - 18} y2={h - 18} stroke={C.purpleDark} sw={2.5} opacity={0.6} />
    </>
  )
}

/** Straight sofa, back to the north: tufted back, rolled arms, seat cushions with seams, four feet. */
export function sofa(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const inner = w - 40
  const cushions = Array.from({ length: cols }, (_, i) => (
    <Box
      key={i}
      x={n(20 + (i * inner) / cols + 2)}
      y={38}
      w={n(inner / cols - 4)}
      h={h - 38 - 16}
      r={9}
      fill={C.sofa}
      sw={DETAIL}
    />
  ))
  const tufts = Array.from({ length: cols * 2 }, (_, i) => (
    <Disc key={i} x={n(20 + ((i + 0.5) * inner) / (cols * 2))} y={22} r={2.6} fill={C.sofa} sw={0} />
  ))
  return (
    <>
      <Feet cols={cols} rows={rows} size={13} inset={3} />
      <Box x={9} y={9} w={w - 18} h={h - 18} r={14} fill={C.sofa} />
      <Box x={9} y={9} w={w - 18} h={30} r={12} fill={C.sofaDark} />
      {tufts}
      <Box x={9} y={22} w={14} h={h - 22 - 9} r={7} fill={C.sofaDark} />
      <Box x={w - 9 - 14} y={22} w={14} h={h - 22 - 9} r={7} fill={C.sofaDark} />
      <Stroke x1={16} y1={34} x2={16} y2={h - 20} stroke={C.white} sw={3} opacity={0.4} />
      <Stroke x1={w - 16} y1={34} x2={w - 16} y2={h - 20} stroke={C.white} sw={3} opacity={0.4} />
      {cushions}
    </>
  )
}

/**
 * L-shaped sofa with two arms of `arm` cells each: a row along the north and
 * a column down the west side, sharing the corner cell.
 */
export function sofaL(arm: number): ReactNode {
  const far = arm * U
  const e = 9
  const outline = `M ${e} ${e} L ${far - e} ${e} L ${far - e} ${U - e} L ${U - e} ${U - e} L ${U - e} ${far - e} L ${e} ${far - e} Z`
  const back = `M ${e} ${e} L ${far - e} ${e} L ${far - e} ${e + 28} L ${e + 28} ${e + 28} L ${e + 28} ${far - e} L ${e} ${far - e} Z`
  const cushions: ReactNode[] = [
    <Box key="corner" x={38} y={38} w={52} h={52} r={9} fill={C.sofa} sw={DETAIL} />,
  ]
  for (let i = 1; i < arm; i++) {
    cushions.push(
      <Box key={`h${i}`} x={i * U + 4} y={38} w={U - 14} h={52} r={9} fill={C.sofa} sw={DETAIL} />,
      <Box key={`v${i}`} x={38} y={i * U + 4} w={52} h={U - 14} r={9} fill={C.sofa} sw={DETAIL} />,
    )
  }
  const tufts: ReactNode[] = []
  for (let i = 0; i < arm * 2 - 1; i++) {
    const t = n(20 + i * 45)
    if (t < far - 20) tufts.push(<Disc key={`th${i}`} x={t} y={22} r={2.6} fill={C.sofa} sw={0} />)
    if (i > 0 && t < far - 20) tufts.push(<Disc key={`tv${i}`} x={22} y={t} r={2.6} fill={C.sofa} sw={0} />)
  }
  // Feet at the three outer corners of the L (the fourth bounding corner is empty floor).
  const feet = [
    [3, 3],
    [far - 16, 3],
    [3, far - 16],
  ].map(([x, y]) => <Box key={`${x}-${y}`} x={x} y={y} w={13} h={13} r={3} fill={C.woodDeep} sw={DETAIL} />)
  return (
    <>
      {feet}
      <Shape d={outline} fill={C.sofa} />
      <Shape d={back} fill={C.sofaDark} sw={DETAIL} />
      {tufts}
      {cushions}
    </>
  )
}

/** Wooden table top, any size. */
export function table(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  return (
    <>
      <Box x={M + 2} y={M + 2} w={w - 2 * M - 4} h={h - 2 * M - 4} r={6} fill={C.wood} />
      <Box x={M + 14} y={M + 14} w={w - 2 * M - 28} h={h - 2 * M - 28} r={3} fill={C.woodLight} sw={DETAIL} />
    </>
  )
}

/** Dining table: pale top with plank lines. Chairs are separate chair objects. */
export function diningTable(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const planks: ReactNode[] = []
  for (let y = M + 24; y < h - M - 12; y += 24) {
    planks.push(<Stroke key={y} x1={M + 12} y1={y} x2={w - M - 12} y2={y} stroke={C.woodLight} sw={DETAIL} />)
  }
  return (
    <>
      <Box x={M} y={M + 4} w={w - 2 * M} h={h - 2 * M - 8} r={8} fill={C.cream} />
      {planks}
    </>
  )
}

/** Flat-screen television on a stand. */
export function tv(): ReactNode {
  return (
    <>
      <Box x={22} y={70} w={56} h={18} r={6} fill={C.slate} />
      <Box x={10} y={12} w={80} h={58} r={7} fill={C.slate} />
      <Box x={18} y={20} w={64} h={42} r={3} fill={C.skyLight} sw={DETAIL} />
      <Stroke x1={26} y1={54} x2={40} y2={28} stroke={C.white} sw={DETAIL + 1} />
      <Stroke x1={38} y1={56} x2={46} y2={44} stroke={C.white} sw={DETAIL + 1} />
    </>
  )
}

/** Bookcase, any width: three shelves of books. */
export function bookshelf(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const colours = [C.red, C.cream, C.green, C.gold, C.purple, C.sky]
  const books: ReactNode[] = []
  const perRow = 5 * cols
  const step = (w - 24) / perRow
  for (let shelf = 0; shelf < 3; shelf++) {
    const top = 14 + shelf * 27
    for (let k = 0; k < perRow; k++) {
      const drop = ((k + shelf) % 3) * 3
      books.push(
        <Box
          key={`${shelf}-${k}`}
          x={n(12 + k * step + 1)}
          y={top + drop}
          w={n(step - 2.5)}
          h={22 - drop}
          r={1}
          fill={colours[(k + shelf * 2) % colours.length]}
          sw={2}
        />,
      )
    }
  }
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={6} fill={C.woodDark} />
      <Box x={M + 4} y={M + 4} w={w - 2 * M - 8} h={h - 2 * M - 8} r={3} fill={C.wood} sw={2} />
      {books}
      <Stroke x1={M + 4} y1={38} x2={w - M - 4} y2={38} sw={2} />
      <Stroke x1={M + 4} y1={65} x2={w - M - 4} y2={65} sw={2} />
    </>
  )
}

/** Storage chest: wooden body, two iron bands, lock. */
export function chest(): ReactNode {
  return (
    <>
      <Box x={M + 2} y={M + 6} w={U - 2 * M - 4} h={U - 2 * M - 12} r={9} fill={C.woodLight} />
      <Box x={26} y={M + 6} w={10} h={U - 2 * M - 12} r={2} fill={C.steelDark} sw={DETAIL} />
      <Box x={64} y={M + 6} w={10} h={U - 2 * M - 12} r={2} fill={C.steelDark} sw={DETAIL} />
      <Box x={42} y={42} w={16} h={16} r={4} fill={C.yellow} sw={DETAIL} />
    </>
  )
}

/** Cabinet, one door panel per cell along the width. Doors face south. */
export function cabinet(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const doors = Array.from({ length: cols }, (_, i) => (
    <g key={i}>
      <Box x={i * U + 14} y={14} w={U - 28} h={h - 28} r={4} fill={C.creamLight} sw={DETAIL} />
      <Disc x={i * U + U / 2} y={h - 24} r={4} fill={C.woodDark} sw={2} />
    </g>
  ))
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={5} fill={C.cream} />
      {doors}
    </>
  )
}

/** Wardrobe (kast): wooden top, door seam per cell, knobs on the south face. */
export function wardrobe(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const parts: ReactNode[] = []
  for (let y = M + 18; y < h - M - 20; y += 22) {
    parts.push(<Stroke key={`p${y}`} x1={M + 4} y1={y} x2={w - M - 4} y2={y} stroke={C.woodDark} sw={2} />)
  }
  for (let i = 1; i < cols; i++) {
    parts.push(<Stroke key={`s${i}`} x1={i * U} y1={M} x2={i * U} y2={h - M} sw={DETAIL} />)
  }
  for (let i = 0; i < cols; i++) {
    parts.push(<Disc key={`k${i}`} x={i * U + U / 2} y={h - 18} r={4} fill={C.cream} sw={2} />)
  }
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={4} fill={C.woodLight} />
      {parts}
    </>
  )
}

/** Desk with a monitor, keyboard and mouse; the chair is a separate object. */
export function desk(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const mid = w / 2
  return (
    <>
      <Box x={M} y={M + 2} w={w - 2 * M} h={h - 2 * M - 4} r={5} fill={C.cream} />
      <Box x={mid - 32} y={16} w={64} h={30} r={3} fill={C.slate} />
      <Box x={mid - 28} y={20} w={56} h={22} r={2} fill={C.skyLight} sw={2} />
      <Box x={mid - 28} y={56} w={56} h={16} r={3} fill={C.white} sw={DETAIL} />
      <Disc x={mid + 44} y={64} r={7} fill={C.white} sw={DETAIL} />
    </>
  )
}

/** Framed painting lying on its square. */
export function framedPainting(): ReactNode {
  return (
    <>
      <Box x={10} y={10} w={80} h={80} r={4} fill={C.wood} />
      <Box x={21} y={21} w={58} h={58} r={2} fill={C.sky} sw={DETAIL} />
      <Shape d="M 21 70 Q 38 44 56 62 Q 66 54 79 66 L 79 79 L 21 79 Z" fill={C.greenLight} sw={DETAIL} />
      <Disc x={66} y={35} r={7} fill={C.yellow} sw={DETAIL} />
    </>
  )
}
