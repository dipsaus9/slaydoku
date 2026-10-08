import type { ReactNode } from 'react'
import { Box, Disc, Feet, Oval, Shape, Stroke } from '../art/shapes.tsx'
import { C, DETAIL, M, U } from '../art/tokens.ts'

/**
 * Art for the Simpshouse fun objects (SLAY-18.4, promoted unchanged from the approved SLAY-18.3 draft). Only what the engine and the
 * other themes do not already draw. Same rules as art.tsx (SLAY-16): detail inside the silhouette, feet at all four corners where it
 * stands on legs, nothing that marks one side as lit, every shape inside its footprint. Each drawing is self-contained (SLAY-17.4
 * redraws them in the chosen 3D look).
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

// ---- Round two (owner: much more party): garden, glamour, party and sweets ----

const P = {
  ink2: '#2a2430',
  liquorice: '#2e2733',
  liquoriceLight: '#4a4152',
  orange: '#e8955a',
  red2: '#d9534f',
  sky2: '#7fb6e6',
  fur: '#f4efe6',
} as const

/** Rabbit hutch: a wooden house with a plank roof; with a second cell, a wire run with a rabbit and a carrot. */
export function rabbitHutch(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const houseW = cols > 1 ? U : w
  const planks: ReactNode[] = []
  for (let y = M + 18; y < h - M - 8; y += 16) planks.push(<Stroke key={y} x1={M + 8} y1={y} x2={houseW - M - 8} y2={y} stroke={C.woodDeep} sw={2} />)
  const bunny = (cx: number, cy: number): ReactNode => (
    <>
      <Oval x={cx - 7} y={cy - 22} rx={5} ry={13} fill={P.fur} sw={DETAIL} />
      <Oval x={cx + 7} y={cy - 22} rx={5} ry={13} fill={P.fur} sw={DETAIL} />
      <Oval x={cx - 7} y={cy - 22} rx={2} ry={8} fill={C.pink} sw={0} />
      <Oval x={cx + 7} y={cy - 22} rx={2} ry={8} fill={C.pink} sw={0} />
      <Disc x={cx} y={cy} r={17} fill={P.fur} sw={DETAIL} />
      <Disc x={cx - 6} y={cy - 3} r={2.2} fill={C.ink} sw={0} />
      <Disc x={cx + 6} y={cy - 3} r={2.2} fill={C.ink} sw={0} />
      <Disc x={cx} y={cy + 4} r={3} fill={C.pink} sw={0} />
    </>
  )
  if (cols === 1) {
    return (
      <>
        <Feet cols={cols} rows={rows} size={10} inset={5} />
        <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={6} fill={C.wood} />
        <Box x={M + 8} y={M + 8} w={w - 2 * M - 16} h={h - 2 * M - 16} r={4} fill={C.woodLight} sw={DETAIL} />
        {planks}
        {bunny(50, 56)}
      </>
    )
  }
  return (
    <>
      <Feet cols={cols} rows={rows} size={10} inset={5} />
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={6} fill={C.woodDark} />
      <Box x={M + 8} y={M + 8} w={houseW - 2 * M - 8} h={h - 2 * M - 16} r={4} fill={C.woodLight} sw={DETAIL} />
      {planks}
      <Box x={houseW + 4} y={M + 8} w={w - houseW - M - 12} h={h - 2 * M - 16} r={4} fill={C.greenLight} sw={DETAIL} />
      {[0.3, 0.5, 0.7].map((f) => (
        <Stroke key={f} x1={houseW + 4 + f * (w - houseW - M - 12)} y1={M + 10} x2={houseW + 4 + f * (w - houseW - M - 12)} y2={h - M - 10} stroke={C.steelDark} sw={2} />
      ))}
      {bunny(houseW + (w - houseW) / 2 - 4, h / 2 + 6)}
      <Shape d={`M ${w - M - 20} ${h - M - 18} L ${w - M - 10} ${h - M - 30} L ${w - M - 8} ${h - M - 16} Z`} fill={P.orange} sw={2} />
    </>
  )
}

/** Red carpet with a velvet rope: red runner, gold borders, gold posts at the four corners. */
export function redCarpet(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  return (
    <>
      <Box x={M + 10} y={M + 4} w={w - 2 * M - 20} h={h - 2 * M - 8} r={4} fill={C.red} />
      <Box x={M + 16} y={M + 10} w={w - 2 * M - 32} h={h - 2 * M - 20} r={3} fill="none" stroke={C.gold} sw={DETAIL + 1} />
      <Shape d={`M ${w / 2 - 12} ${h / 2} L ${w / 2} ${h / 2 - 12} L ${w / 2 + 12} ${h / 2} L ${w / 2} ${h / 2 + 12} Z`} fill={C.gold} sw={DETAIL} />
      <Stroke x1={M + 8} y1={M + 14} x2={M + 8} y2={h - M - 14} stroke={C.redDark} sw={DETAIL + 1} />
      <Stroke x1={w - M - 8} y1={M + 14} x2={w - M - 8} y2={h - M - 14} stroke={C.redDark} sw={DETAIL + 1} />
      {[[M + 8, M + 10], [w - M - 8, M + 10], [M + 8, h - M - 10], [w - M - 8, h - M - 10]].map(([x, y]) => (
        <Disc key={`${x}-${y}`} x={x} y={y} r={7} fill={C.gold} sw={DETAIL} />
      ))}
    </>
  )
}

/** Champagne tower from above: a gold tray, rings of glasses, a bottle on top. */
export function champagneTower(): ReactNode {
  const ring = (r: number, count: number, fill: string, size: number): ReactNode[] =>
    Array.from({ length: count }, (_, k) => {
      const a = (k * 2 * Math.PI) / count
      return <Disc key={`${r}-${k}`} x={50 + Math.cos(a) * r} y={50 + Math.sin(a) * r} r={size} fill={fill} sw={2} />
    })
  return (
    <>
      <Disc x={50} y={50} r={42} fill={C.gold} />
      <Disc x={50} y={50} r={35} fill={C.goldDark} sw={DETAIL} />
      {ring(28, 10, C.creamLight, 6)}
      {ring(17, 6, C.white, 6)}
      <Disc x={50} y={50} r={9} fill={C.yellowLight} sw={DETAIL} />
      {sparkle(78, 22, 7, 's1')}
      {sparkle(22, 78, 6, 's2')}
    </>
  )
}

/** Big gold mirror: carved gold frame around a pale glass with two glints. */
export function goldMirror(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  return (
    <>
      <Box x={M} y={M + 14} w={w - 2 * M} h={h - 2 * M - 28} r={10} fill={C.gold} />
      <Box x={M + 8} y={M + 22} w={w - 2 * M - 16} h={h - 2 * M - 44} r={6} fill={G.mirror} sw={DETAIL} />
      <Box x={M + 4} y={M + 18} w={w - 2 * M - 8} h={h - 2 * M - 36} r={8} fill="none" stroke={C.goldDark} sw={2} />
      <Stroke x1={M + 22} y1={h / 2 + 12} x2={M + 40} y2={h / 2 - 12} stroke={C.white} sw={DETAIL + 2} />
      <Stroke x1={M + 34} y1={h / 2 + 14} x2={M + 46} y2={h / 2 - 2} stroke={C.white} sw={DETAIL} />
      {[M + 10, w - M - 10].map((x) => [M + 22, h - M - 22].map((y) => <Disc key={`${x}-${y}`} x={x} y={y} r={4} fill={C.yellowLight} sw={2} />))}
    </>
  )
}

/** Glitter shoe wall: shelves with pairs of party shoes in pink, gold, red and blue. */
export function shoeWall(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const tones = [C.pink, C.gold, C.red, G.cardBlue, C.lilac]
  const shoes: ReactNode[] = []
  const count = cols * 3
  const step = (w - 2 * M - 20) / count
  for (const y of [h / 2 - 20, h / 2 + 20]) {
    for (let i = 0; i < count; i++) {
      const x = M + 10 + step * i + step / 2
      shoes.push(<Oval key={`${y}-${i}`} x={x} y={y} rx={step / 2 - 2} ry={9} fill={tones[(i + (y > h / 2 ? 2 : 0)) % tones.length]} sw={2} />)
      shoes.push(<Disc key={`g${y}-${i}`} x={x + step / 5} y={y - 2} r={1.8} fill={C.white} sw={0} />)
    }
  }
  return (
    <>
      <Feet cols={cols} rows={rows} size={10} inset={5} />
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={6} fill={C.wood} />
      <Box x={M + 6} y={M + 8} w={w - 2 * M - 12} h={h - 2 * M - 16} r={3} fill={C.woodDark} sw={DETAIL} />
      <Stroke x1={M + 6} y1={h / 2} x2={w - M - 6} y2={h / 2} stroke={C.woodLight} sw={DETAIL} />
      {shoes}
    </>
  )
}

/** Photo wall: a board pinned with photos, hearts and a string of fairy lights. */
export function photoWall(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const photos: ReactNode[] = []
  const count = cols * 2
  const step = (w - 2 * M - 16) / count
  for (let i = 0; i < count; i++) {
    const x = M + 10 + step * i
    const y = i % 2 ? h / 2 - 6 : h / 2 - 22
    photos.push(
      <Box key={i} x={x} y={y} w={step - 6} h={26} r={2} fill={C.white} sw={2} />,
      <Box key={`p${i}`} x={x + 3} y={y + 3} w={step - 12} h={14} r={1} fill={[G.cardBlue, C.pink, C.greenLight, C.yellow][i % 4]} sw={0} />,
    )
  }
  return (
    <>
      <Box x={M} y={M + 10} w={w - 2 * M} h={h - 2 * M - 20} r={5} fill={C.slate} />
      <Box x={M + 6} y={M + 16} w={w - 2 * M - 12} h={h - 2 * M - 32} r={3} fill={G.magentaDark} sw={DETAIL} />
      {photos}
      <Shape d={`M ${M + 8} ${M + 24} Q ${w / 2} ${M + 40} ${w - M - 8} ${M + 24}`} stroke={C.gold} sw={2} />
      {[0.15, 0.35, 0.5, 0.65, 0.85].map((f) => <Disc key={f} x={M + 8 + f * (w - 2 * M - 16)} y={M + 24 + 11 * Math.sin(f * Math.PI)} r={3} fill={C.yellowLight} sw={1.5} />)}
    </>
  )
}

/** DJ booth: a dark desk, two turntables and a mixer with sliders between them. */
export function djBooth(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const deck = (x: number): ReactNode => (
    <>
      <Box x={x - 36} y={h / 2 - 38} w={72} h={76} r={5} fill={C.slate} sw={DETAIL} />
      <Disc x={x} y={h / 2} r={29} fill={C.ink} sw={DETAIL} />
      <Disc x={x} y={h / 2} r={20} fill="none" stroke={C.slate} sw={2} />
      <Disc x={x} y={h / 2} r={9} fill={G.magenta} sw={DETAIL} />
      <Disc x={x} y={h / 2} r={2.5} fill={C.white} sw={0} />
    </>
  )
  const mid = w / 2
  const ax = 50
  return (
    <>
      <Feet cols={cols} rows={rows} size={10} inset={5} fill={C.slate} />
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={6} fill={P.ink2} />
      {deck(ax)}
      {deck(w - ax)}
      <Box x={mid - 20} y={M + 14} w={40} h={h - 2 * M - 28} r={4} fill={C.steel} sw={DETAIL} />
      {[-9, 0, 9].map((dx) => <Stroke key={dx} x1={mid + dx} y1={M + 24} x2={mid + dx} y2={h - M - 24} stroke={C.slate} sw={2} />)}
      {[[-9, 0.4], [0, 0.65], [9, 0.3]].map(([dx, f]) => <Box key={dx} x={mid + dx - 4} y={M + 20 + f * (h - 2 * M - 52)} w={8} h={6} r={1} fill={G.magenta} sw={1.5} />)}
    </>
  )
}

/** Dance floor: a lit checkerboard of pink, sky, yellow and lilac tiles in a dark frame. */
export function danceFloor(cols: number, rows: number): ReactNode {
  const tiles: ReactNode[] = []
  const tone = [C.pink, C.sky, C.yellow, C.lilac]
  const nx = cols * 2
  const ny = rows * 2
  const tw = (cols * U - 2 * M - 12) / nx
  const th = (rows * U - 2 * M - 12) / ny
  for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) tiles.push(<Box key={`${x}-${y}`} x={M + 6 + x * tw} y={M + 6 + y * th} w={tw} h={th} r={1} fill={tone[(x + 2 * y + (y % 2)) % 4]} sw={1} />)
  return (
    <>
      <Box x={M} y={M} w={cols * U - 2 * M} h={rows * U - 2 * M} r={6} fill={P.ink2} />
      {tiles}
      {sparkle(cols * U / 2, rows * U / 2, 14, 'sp')}
    </>
  )
}

/** Confetti cannon: a round base, a striped cone and a burst of confetti. */
export function confettiCannon(): ReactNode {
  const bits: ReactNode[] = [[22, 26, C.red], [76, 22, G.cardBlue], [30, 78, C.yellow], [74, 74, C.greenLight], [50, 16, C.pink], [84, 50, G.magenta], [16, 52, C.lilac]].map(([x, y, fill], i) => (
    <Box key={i} x={Number(x) - 4} y={Number(y) - 2.5} w={8} h={5} r={1} fill={String(fill)} sw={1.5} />
  ))
  return (
    <>
      <Disc x={50} y={50} r={40} fill={C.steelDark} />
      <Disc x={50} y={50} r={30} fill={G.magenta} sw={DETAIL} />
      <Disc x={50} y={50} r={20} fill={C.yellow} sw={DETAIL} />
      <Disc x={50} y={50} r={10} fill={C.ink} sw={DETAIL} />
      {bits}
    </>
  )
}

/** Balloons: three balloons from above on a weight, with ribbons. */
export function balloons(): ReactNode {
  return (
    <>
      <Disc x={50} y={54} r={12} fill={C.steelDark} sw={DETAIL} />
      <Shape d="M 50 54 Q 36 42 34 34 M 50 54 Q 62 42 66 34 M 50 54 Q 50 70 46 82" stroke={C.slate} sw={2} />
      <Oval x={32} y={30} rx={17} ry={20} fill={P.red2} />
      <Oval x={68} y={30} rx={17} ry={20} fill={P.sky2} />
      <Oval x={46} y={72} rx={17} ry={20} fill={C.yellow} />
      <Oval x={26} y={22} rx={4} ry={6} fill={C.white} sw={0} opacity={0.7} />
      <Oval x={62} y={22} rx={4} ry={6} fill={C.white} sw={0} opacity={0.7} />
      <Oval x={40} y={64} rx={4} ry={6} fill={C.white} sw={0} opacity={0.7} />
    </>
  )
}

/** Snack table: a white cloth, bowls of crisps, a plate of cake and paper cups. */
export function snackTable(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  return (
    <>
      <Feet cols={cols} rows={rows} size={10} inset={5} />
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={8} fill={C.white} />
      <Box x={M + 6} y={M + 6} w={w - 2 * M - 12} h={h - 2 * M - 12} r={5} fill="none" stroke={C.pink} sw={DETAIL} />
      <Disc x={w * 0.25} y={h / 2} r={19} fill={C.yellowLight} sw={DETAIL} />
      <Disc x={w * 0.25} y={h / 2} r={11} fill={C.yellow} sw={2} />
      <Disc x={w * 0.55} y={h / 2 - 2} r={16} fill={C.creamLight} sw={DETAIL} />
      <Shape d={`M ${w * 0.55 - 9} ${h / 2 + 6} L ${w * 0.55} ${h / 2 - 12} L ${w * 0.55 + 9} ${h / 2 + 6} Z`} fill={C.pink} sw={2} />
      {[[w - M - 26, h / 2 - 16], [w - M - 26, h / 2 + 4], [w - M - 42, h / 2 - 6]].map(([x, y]) => <Disc key={`${x}-${y}`} x={x} y={y} r={7} fill={P.red2} sw={2} />)}
    </>
  )
}

/** Cocktail bar: dark counter with a gold rail, bottles along the back and glasses with pink drinks. */
export function cocktailBar(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const n = cols * 4
  const bottles = Array.from({ length: n }, (_, i) => <Disc key={i} x={M + 14 + (i * (w - 2 * M - 28)) / (n - 1)} y={M + 16} r={5} fill={[C.greenLight, P.orange, G.cardBlue, C.pink][i % 4]} sw={2} />)
  const glasses = Array.from({ length: cols * 2 }, (_, i) => (
    <g key={i}>
      <Disc x={M + 22 + (i * (w - 2 * M - 44)) / (cols * 2 - 1)} y={h - M - 24} r={8} fill={C.white} sw={2} />
      <Disc x={M + 22 + (i * (w - 2 * M - 44)) / (cols * 2 - 1)} y={h - M - 24} r={4.5} fill={G.magenta} sw={0} />
    </g>
  ))
  return (
    <>
      <Feet cols={cols} rows={rows} size={10} inset={5} fill={C.slate} />
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={6} fill={C.woodDeep} />
      <Box x={M + 6} y={M + 30} w={w - 2 * M - 12} h={h - 2 * M - 40} r={4} fill={C.woodDark} sw={DETAIL} />
      <Stroke x1={M + 8} y1={M + 34} x2={w - M - 8} y2={M + 34} stroke={C.gold} sw={DETAIL + 1} />
      {bottles}
      {glasses}
    </>
  )
}

/** Photo booth: a dark cabinet with a magenta curtain, a stool and a row of lights. */
export function photoBooth(): ReactNode {
  return (
    <>
      <Feet cols={1} rows={1} size={10} inset={5} fill={C.slate} />
      <Box x={M} y={M} w={88} h={88} r={6} fill={C.slate} />
      <Box x={16} y={22} w={68} h={62} r={3} fill={G.magentaDark} sw={DETAIL} />
      {[34, 50, 66].map((x) => <Stroke key={x} x1={x} y1={24} x2={x} y2={82} stroke={G.magenta} sw={DETAIL} />)}
      <Stroke x1={14} y1={22} x2={86} y2={22} stroke={C.gold} sw={DETAIL + 1} />
      {[22, 36, 50, 64, 78].map((x) => <Disc key={x} x={x} y={14} r={3.5} fill={C.yellowLight} sw={1.5} />)}
      <Disc x={50} y={64} r={9} fill={C.pink} sw={DETAIL} />
    </>
  )
}

/** Lava lamp from above: a round base, a glowing orange lamp with blobs and a gold cap. */
export function lavaLamp(): ReactNode {
  return (
    <>
      <Disc x={50} y={50} r={38} fill={C.slate} />
      <Disc x={50} y={50} r={30} fill={P.orange} sw={DETAIL} />
      <Disc x={42} y={42} r={9} fill={P.red2} sw={2} />
      <Disc x={58} y={52} r={7} fill={C.yellow} sw={2} />
      <Disc x={46} y={60} r={5} fill={P.red2} sw={2} />
      <Disc x={50} y={50} r={11} fill="none" stroke={C.yellowLight} sw={2} />
      <Disc x={50} y={50} r={4} fill={C.gold} sw={DETAIL} />
    </>
  )
}

/** Salmari bar: a dark liquorice liqueur bottle (no label) and a row of shot glasses on a dark tray. */
export function salmariBar(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const shots: ReactNode[] = []
  const n = cols * 2 + 1
  for (let i = 0; i < n; i++) {
    const x = w * 0.42 + ((i + 0.5) * (w * 0.5 - M - 6)) / n
    const y = i % 2 ? h / 2 + 15 : h / 2 - 15
    shots.push(<Disc key={`s${i}`} x={x} y={y} r={8} fill={C.white} sw={2} />, <Disc key={`d${i}`} x={x} y={y} r={5} fill={P.liquorice} sw={0} />)
  }
  return (
    <>
      <Feet cols={cols} rows={rows} size={10} inset={5} />
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={8} fill={C.woodDeep} />
      <Box x={M + 6} y={M + 6} w={w - 2 * M - 12} h={h - 2 * M - 12} r={5} fill={C.woodDark} sw={DETAIL} />
      <Stroke x1={M + 10} y1={M + 12} x2={w - M - 10} y2={M + 12} stroke={C.gold} sw={DETAIL} />
      <Disc x={w * 0.22} y={h / 2 + 4} r={22} fill={P.liquorice} sw={DETAIL} />
      <Disc x={w * 0.22} y={h / 2 + 4} r={15} fill="none" stroke={P.liquoriceLight} sw={2} />
      <Disc x={w * 0.22} y={h / 2 + 4} r={7} fill={P.liquoriceLight} sw={DETAIL} />
      <Disc x={w * 0.22} y={h / 2 + 4} r={3} fill={C.gold} sw={1.5} />
      <Oval x={w * 0.22 - 9} y={h / 2 - 6} rx={3} ry={5} fill={C.white} sw={0} opacity={0.5} />
      {shots}
    </>
  )
}

/** Card display case: a wooden base under a glass lid, a fan of cards inside and a gold lock. */
export function cardDisplayCase(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  const cx = w / 2
  const fan = [-22, -7, 8, 23].map((deg, i) => (
    <g key={deg} transform={`rotate(${deg} ${cx} ${h / 2 + 14})`}>
      <Box x={cx - 8} y={h / 2 - 22} w={16} h={26} r={2} fill={[C.white, C.creamLight, C.white, C.creamLight][i]} sw={2} />
      <Box x={cx - 4} y={h / 2 - 17} w={8} h={8} r={1} fill={[C.red, G.cardBlue, C.yellow, C.greenLight][i]} sw={0} />
    </g>
  ))
  return (
    <>
      <Feet cols={cols} rows={rows} size={10} inset={5} />
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={6} fill={C.woodDark} />
      <Box x={M + 8} y={M + 8} w={w - 2 * M - 16} h={h - 2 * M - 16} r={4} fill={G.mirror} sw={DETAIL} />
      <Box x={M + 14} y={M + 14} w={w - 2 * M - 28} h={h - 2 * M - 28} r={3} fill={C.skyLight} sw={0} />
      {fan}
      <Stroke x1={M + 18} y1={M + 34} x2={M + 34} y2={M + 18} stroke={C.white} sw={DETAIL + 1} />
      <Disc x={w - M - 14} y={h - M - 14} r={4} fill={C.gold} sw={2} />
    </>
  )
}

/** Reading corner: a soft rug with a cushion, an open book and a small lamp. A person can sit here. */
export function readingNook(cols: number, rows: number): ReactNode {
  const w = cols * U
  const h = rows * U
  return (
    <>
      <Box x={M} y={M} w={w - 2 * M} h={h - 2 * M} r={Math.min(w, h) / 4} fill={G.cardBlue} />
      <Box x={M + 8} y={M + 8} w={w - 2 * M - 16} h={h - 2 * M - 16} r={Math.min(w, h) / 5} fill="none" stroke={C.skyLight} sw={DETAIL} />
      <Disc x={M + 30} y={M + 32} r={17} fill={C.pink} sw={DETAIL} />
      <Disc x={M + 30} y={M + 32} r={6} fill={C.red} sw={2} />
      <Box x={w / 2 - 6} y={h / 2 - 8} w={22} h={28} r={2} fill={C.white} sw={DETAIL} />
      <Box x={w / 2 + 16} y={h / 2 - 8} w={22} h={28} r={2} fill={C.creamLight} sw={DETAIL} />
      <Stroke x1={w / 2 - 1} y1={h / 2 + 2} x2={w / 2 + 10} y2={h / 2 + 2} stroke={C.creamDark} sw={2} />
      <Stroke x1={w / 2 + 22} y1={h / 2 + 2} x2={w / 2 + 33} y2={h / 2 + 2} stroke={C.creamDark} sw={2} />
      <Disc x={w - M - 20} y={h - M - 20} r={11} fill={C.yellowLight} sw={DETAIL} />
      <Disc x={w - M - 20} y={h - M - 20} r={4} fill={C.gold} sw={2} />
    </>
  )
}

/**
 * Pikachu plush (owner decision, 2026-10-08): a round yellow stuffed toy with long pointed ears with
 * dark tips, red cheeks and a lightning-bolt tail. Hand-drawn SVG, not official artwork. The only
 * place a third-party character is named; see the go-public checklist in docs/launch.md.
 */
export function yellowPlush(): ReactNode {
  return (
    <>
      <Shape d="M 62 62 L 78 52 L 72 66 L 88 58 L 72 84 L 74 70 L 62 76 Z" fill={C.yellow} stroke={C.ink} sw={DETAIL} />
      <Shape d="M 24 36 L 14 8 L 40 26 Z" fill={C.yellow} />
      <Shape d="M 60 26 L 86 8 L 76 36 Z" fill={C.yellow} />
      <Shape d="M 14 8 L 17 19 L 24 14 Z" fill={C.ink} sw={1} />
      <Shape d="M 86 8 L 83 19 L 76 14 Z" fill={C.ink} sw={1} />
      <Disc x={44} y={58} r={32} fill={C.yellow} />
      <Disc x={34} y={50} r={3.4} fill={C.ink} sw={0} />
      <Disc x={54} y={50} r={3.4} fill={C.ink} sw={0} />
      <Disc x={33} y={49} r={1} fill={C.white} sw={0} />
      <Disc x={53} y={49} r={1} fill={C.white} sw={0} />
      <Disc x={22} y={62} r={6.5} fill={P.red2} sw={0} />
      <Disc x={66} y={62} r={6.5} fill={P.red2} sw={0} />
      <Shape d="M 38 64 Q 44 70 50 64" stroke={C.ink} sw={2} />
      <Disc x={44} y={57} r={1.6} fill={C.ink} sw={0} />
    </>
  )
}

