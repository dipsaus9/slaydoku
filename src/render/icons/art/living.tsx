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

/** Wooden table top, any size: gold-wood top, double border, inlay line and a centre medallion. */
export function table(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  return (
    <>
      <Feet cols={cols} rows={rows} size={11} inset={4} />
      <Box x={M + 2} y={M + 2} w={w - 2 * M - 4} h={h - 2 * M - 4} r={8} fill={C.yellow} />
      <Box x={18} y={18} w={w - 36} h={h - 36} r={4} fill="none" sw={DETAIL} />
      <Box x={24} y={24} w={w - 48} h={h - 48} r={2} fill={C.yellowLight} sw={2.5} />
      <Box x={36} y={36} w={w - 72} h={h - 72} r={2} fill="none" stroke={C.goldDark} sw={2} opacity={0.6} />
      <Disc x={w / 2} y={h / 2} r={4} fill={C.gold} sw={DETAIL} />
    </>
  )
}

/** Dining table: pale top with plank lines, a raised edge band and a fruit bowl in the middle. */
export function diningTable(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const planks: ReactNode[] = []
  for (let y = 24; y < h - 18; y += 24) {
    planks.push(<Stroke key={y} x1={20} y1={y} x2={w - 20} y2={y} stroke={C.creamDark} sw={DETAIL} />)
  }
  return (
    <>
      <Feet cols={cols} rows={rows} size={11} inset={4} />
      <Box x={M + 2} y={M + 2} w={w - 2 * M - 4} h={h - 2 * M - 4} r={8} fill={C.cream} />
      <Box x={14} y={14} w={w - 28} h={h - 28} r={4} fill={C.creamLight} sw={DETAIL} />
      {planks}
      <Disc x={w / 2} y={h / 2} r={13} fill={C.woodLight} />
      <Disc x={w / 2} y={h / 2} r={7} fill={C.red} sw={DETAIL} />
      <Disc x={w / 2 + 2.5} y={h / 2 - 2.5} r={2.5} fill={C.white} sw={0} opacity={0.8} />
    </>
  )
}

/** Flat-screen television on a stand: bezel, screen with glare, power light, stand base. */
export function tv(): ReactNode {
  return (
    <>
      <Feet cols={1} rows={1} size={11} inset={4} />
      <Box x={22} y={70} w={56} h={18} r={6} fill={C.slate} />
      <Stroke x1={36} y1={79} x2={64} y2={79} stroke={C.steelDark} sw={2.5} />
      <Box x={10} y={12} w={80} h={58} r={7} fill={C.slate} />
      <Box x={18} y={20} w={64} h={42} r={3} fill={C.skyLight} sw={DETAIL} />
      <Stroke x1={26} y1={54} x2={40} y2={28} stroke={C.white} sw={DETAIL + 1} />
      <Stroke x1={38} y1={56} x2={46} y2={44} stroke={C.white} sw={DETAIL + 1} />
      <Disc x={50} y={66} r={1.8} fill={C.red} sw={0} />
    </>
  )
}

/** Bookcase, any width: wooden frame, three shelves of books, plank edges, four feet. */
export function bookshelf(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const colours = [C.red, C.cream, C.green, C.gold, C.purple, C.sky, C.pink]
  const books: ReactNode[] = []
  const perRow = Math.round(5.5 * cols)
  const step = (w - 32) / perRow
  for (let shelf = 0; shelf < 3; shelf++) {
    for (let k = 0; k < perRow; k++) {
      const drop = ((k * 2 + shelf) % 4) * 2.5
      books.push(
        <Box
          key={`${shelf}-${k}`}
          x={n(16 + k * step + 0.8)}
          y={n(16 + shelf * 23.5 + drop)}
          w={n(step - 2.2)}
          h={n(20 - drop)}
          r={1.5}
          fill={colours[(k + shelf * 3) % colours.length]}
          sw={2}
        />,
      )
    }
  }
  return (
    <>
      <Feet cols={cols} rows={rows} size={10} inset={3} />
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={7} fill={C.wood} />
      <Box x={13} y={13} w={w - 26} h={h - 26} r={3} fill={C.woodDeep} sw={DETAIL} />
      {books}
      <Stroke x1={13} y1={38.5} x2={w - 13} y2={38.5} stroke={C.woodLight} sw={3.5} />
      <Stroke x1={13} y1={62} x2={w - 13} y2={62} stroke={C.woodLight} sw={3.5} />
      <Stroke x1={13} y1={86} x2={w - 13} y2={86} stroke={C.woodLight} sw={3.5} />
    </>
  )
}

/** Storage chest: wooden body with a lid line, two iron bands with rivets, lock with keyhole. */
export function chest(): ReactNode {
  const rivets = [26, 64].flatMap((x) =>
    [20, 80].map((y) => <Disc key={`${x}-${y}`} x={x + 5} y={y} r={1.8} fill={C.steel} sw={0} />),
  )
  return (
    <>
      <Feet cols={1} rows={1} size={11} inset={4} />
      <Box x={M + 2} y={M + 4} w={U - 2 * M - 4} h={U - 2 * M - 8} r={9} fill={C.woodLight} />
      <Box x={16} y={16} w={68} h={68} r={5} fill="none" stroke={C.woodDark} sw={2} opacity={0.6} />
      <Box x={26} y={M + 4} w={10} h={U - 2 * M - 8} r={2} fill={C.steelDark} sw={DETAIL} />
      <Box x={64} y={M + 4} w={10} h={U - 2 * M - 8} r={2} fill={C.steelDark} sw={DETAIL} />
      {rivets}
      <Box x={42} y={42} w={16} h={16} r={4} fill={C.yellow} sw={DETAIL} />
      <Disc x={50} y={48} r={2.2} fill={C.woodDeep} sw={0} />
      <Stroke x1={50} y1={49} x2={50} y2={54} stroke={C.woodDeep} sw={2} />
    </>
  )
}

/** Cabinet, one door panel per cell along the width: framed doors, knobs and a stile between. */
export function cabinet(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const doors = Array.from({ length: cols }, (_, i) => (
    <g key={i}>
      <Box x={i * U + 14} y={14} w={U - 28} h={h - 28} r={4} fill={C.creamLight} sw={DETAIL} />
      <Box x={i * U + 22} y={22} w={U - 44} h={h - 44} r={2} fill="none" stroke={C.creamDark} sw={2} />
      <Disc x={i * U + U / 2} y={h - 28} r={4.5} fill={C.woodDark} sw={2} />
      <Disc x={i * U + U / 2 - 1.2} y={h - 29.2} r={1.4} fill={C.white} sw={0} opacity={0.7} />
    </g>
  ))
  return (
    <>
      <Feet cols={cols} rows={rows} size={11} inset={4} />
      <Box x={M + 2} y={M + 2} w={w - 2 * M - 4} h={h - 2 * M - 4} r={5} fill={C.cream} />
      {doors}
    </>
  )
}

/** Wardrobe (kast): wooden top slats, inset border, door seam per cell, knobs on the south face. */
export function wardrobe(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const parts: ReactNode[] = []
  for (let y = M + 18; y < h - M - 24; y += 22) {
    parts.push(<Stroke key={`p${y}`} x1={M + 8} y1={y} x2={w - M - 8} y2={y} stroke={C.woodDark} sw={2} />)
  }
  for (let i = 1; i < cols; i++) {
    parts.push(<Stroke key={`s${i}`} x1={i * U} y1={M + 2} x2={i * U} y2={h - M - 2} sw={DETAIL} />)
  }
  for (let i = 0; i < cols; i++) {
    parts.push(
      <Disc key={`k${i}`} x={i * U + U / 2} y={h - 18} r={4.5} fill={C.cream} sw={2} />,
      <Disc key={`h${i}`} x={i * U + U / 2 - 1.2} y={h - 19.2} r={1.4} fill={C.white} sw={0} opacity={0.8} />,
    )
  }
  return (
    <>
      <Feet cols={cols} rows={rows} size={11} inset={4} />
      <Box x={M + 2} y={M + 2} w={w - 2 * M - 4} h={h - 2 * M - 4} r={5} fill={C.woodLight} />
      <Box x={14} y={14} w={w - 28} h={h - 28} r={3} fill="none" stroke={C.woodDark} sw={2} opacity={0.6} />
      {parts}
    </>
  )
}

/** Desk with a monitor, keyboard, mouse and a mug; the chair is a separate object. */
export function desk(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const mid = w / 2
  return (
    <>
      <Feet cols={cols} rows={rows} size={11} inset={4} />
      <Box x={M + 2} y={M + 2} w={w - 2 * M - 4} h={h - 2 * M - 4} r={6} fill={C.cream} />
      <Box x={13} y={13} w={w - 26} h={h - 26} r={3} fill="none" stroke={C.creamDark} sw={2} />
      <Box x={mid - 32} y={16} w={64} h={30} r={3} fill={C.slate} />
      <Box x={mid - 28} y={20} w={56} h={22} r={2} fill={C.skyLight} sw={2} />
      <Stroke x1={mid - 20} y1={37} x2={mid - 10} y2={25} stroke={C.white} sw={DETAIL} />
      <Box x={mid - 28} y={56} w={56} h={16} r={3} fill={C.white} sw={DETAIL} />
      <Stroke x1={mid - 20} y1={61} x2={mid + 20} y2={61} stroke={C.creamDark} sw={2} />
      <Stroke x1={mid - 20} y1={67} x2={mid + 20} y2={67} stroke={C.creamDark} sw={2} />
      <Disc x={mid + 44} y={64} r={7} fill={C.white} sw={DETAIL} />
      <Stroke x1={mid + 44} y1={57} x2={mid + 44} y2={62} stroke={C.creamDark} sw={2} />
      <Disc x={mid - 46} y={62} r={7} fill={C.woodLight} sw={DETAIL} />
      <Disc x={mid - 46} y={62} r={3.5} fill={C.woodDeep} sw={0} />
    </>
  )
}

/** Framed painting lying on its square: bevelled frame, corner studs, sky, cloud, sun and hills. */
export function framedPainting(): ReactNode {
  return (
    <>
      <Feet cols={1} rows={1} size={11} inset={4} />
      <Box x={10} y={10} w={80} h={80} r={4} fill={C.wood} />
      <Box x={15} y={15} w={70} h={70} r={3} fill="none" stroke={C.woodLight} sw={2} />
      <Box x={21} y={21} w={58} h={58} r={2} fill={C.sky} sw={DETAIL} />
      <Disc x={34} y={34} r={5} fill={C.white} sw={0} />
      <Disc x={41} y={32} r={6} fill={C.white} sw={0} />
      <Disc x={66} y={35} r={7} fill={C.yellow} sw={DETAIL} />
      <Shape d="M 21 70 Q 38 44 56 62 Q 66 54 79 66 L 79 79 L 21 79 Z" fill={C.greenLight} sw={DETAIL} />
      <Shape d="M 21 76 Q 34 66 48 74 Q 62 66 79 75 L 79 79 L 21 79 Z" fill={C.green} sw={0} />
      <Disc x={15.5} y={15.5} r={2} fill={C.gold} sw={0} />
      <Disc x={84.5} y={15.5} r={2} fill={C.gold} sw={0} />
      <Disc x={15.5} y={84.5} r={2} fill={C.gold} sw={0} />
      <Disc x={84.5} y={84.5} r={2} fill={C.gold} sw={0} />
    </>
  )
}
