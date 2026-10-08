import { ball, box, C, cyl, legs, model, onFront, onTop, shiftY, type Prim, type SolidModel } from '../../looks/models.ts'

/**
 * Block models of the Halloween theme (SLAY-18.9), built from the owner-approved draft art of SLAY-18.5 (docs/themes/seasonal/art.tsx) in
 * the A2 block look (docs/design/looks.md, "How to draw a new object"). Playful, never gory: friendly ghosts, sweets, carved pumpkins.
 * Every model faces south (backs on the north side), stays inside its footprint and below `MAX_Z`; only the colours below are shared.
 */
const H = {
  orange: '#e29a4d',
  orangeDark: '#c47a33',
  orangeLight: '#f0b878',
  glow: '#f6d75e',
  night: '#3b354f',
  nightLight: '#5a5275',
  witch: '#5d4a7a',
  witchDark: '#463760',
  slime: '#8fd16b',
  slimeLight: '#c8efae',
  slimeDark: '#5fa847',
  tomb: '#b9bbc4',
  tombDark: '#9a9ca8',
  candy: '#e86aa0',
  mint: '#9fdcc4',
  straw: '#ead28a',
  strawDark: '#c4a550',
  sheet: '#fbfbf8',
  bark: '#6b5a52',
  thorn: '#3f5a3c',
  berry: '#c0394a',
} as const

/** Jack-o'-lantern: a ribbed orange pumpkin with a green stem and a glowing carved face (two triangle eyes, a toothy grin) on the front. */
export function jackOLantern(): SolidModel {
  return model(1, 1, [
    ball(30, 54, 26, 20, H.orangeDark),
    ball(70, 54, 26, 20, H.orangeDark),
    ball(50, 54, 28, 26, H.orange),
    cyl(50, 52, 4, 50, 12, C.greenDark),
    box(54, 46, 12, 6, 56, 2, C.green, 1.5),
    // the face, lit from inside
    box(36, 78, 9, 3, 34, 7, H.glow, 1),
    box(55, 78, 9, 3, 34, 7, H.glow, 1),
    box(38, 79, 24, 3, 20, 6, H.glow, 1),
    box(42, 81, 4, 2, 24, 3, H.orangeDark, 0),
    box(54, 81, 4, 2, 24, 3, H.orangeDark, 0),
  ])
}

/** Witch's cauldron: a black pot on three stubby legs over two crossed logs and a small flame, full of bubbling green brew with a ladle. */
export function cauldron(): SolidModel {
  const prims: Prim[] = [
    box(16, 46, 68, 10, 0, 8, C.woodDark),
    box(45, 18, 10, 66, 0, 8, C.wood),
    ball(50, 52, 10, 8, H.glow),
    box(24, 46, 7, 7, 0, 16, C.slate),
    box(69, 46, 7, 7, 0, 16, C.slate),
    box(46, 74, 7, 7, 0, 16, C.slate),
    cyl(50, 52, 30, 12, 26, C.slate, 36),
    cyl(50, 52, 37, 38, 5, C.ink, 35),
    cyl(50, 52, 30, 43, 0.8, H.slime, undefined, 0),
    ball(40, 46, 46, 6, H.slimeLight),
    ball(60, 42, 45, 4, H.slimeLight),
    ball(56, 62, 46, 5, H.slimeLight),
    box(62, 50, 5, 5, 40, 30, C.woodDark),
    box(56, 48, 16, 9, 70, 4, C.wood),
  ]
  return model(1, 1, prims)
}

/** Friendly ghost: a white sheet with a round head, a wavy hem of little bumps, stubby arms, big dark eyes and a small round "boo" mouth. */
export function ghost(): SolidModel {
  const prims: Prim[] = [cyl(50, 54, 28, 0, 44, H.sheet, 21), ball(50, 54, 52, 24, H.sheet)]
  for (let k = 0; k < 8; k++) {
    const a = (Math.PI * 2 * k) / 8
    prims.push(ball(50 + 26 * Math.cos(a), 54 + 26 * Math.sin(a), 5, 6, H.sheet))
  }
  prims.push(ball(26, 56, 38, 7, H.sheet), ball(74, 56, 38, 7, H.sheet))
  prims.push(ball(41, 70, 66, 4.5, C.ink), ball(59, 70, 66, 4.5, C.ink), ball(50, 76, 56, 4, C.ink), ball(34, 72, 60, 3, C.pink), ball(66, 72, 60, 3, C.pink))
  return model(1, 1, prims)
}

/** Tombstone: a grey stepped-arch slab on a stone base with a carved cross on the front, moss at its foot and a little orange flower. */
export function tombstone(): SolidModel {
  return model(1, 1, [
    box(14, 44, 72, 40, 0, 6, H.tombDark),
    box(22, 46, 56, 18, 6, 44, H.tomb),
    box(26, 46, 48, 18, 50, 7, H.tomb),
    box(34, 46, 32, 18, 57, 6, H.tomb),
    box(42, 46, 16, 18, 63, 4, H.tomb),
    onFront(47, 64, 6, 22, 30, C.steelDark),
    onFront(39, 64, 22, 40, 6, C.steelDark),
    ball(26, 72, 8, 7, C.green),
    ball(36, 76, 7, 5, C.greenLight),
    ball(70, 74, 8, 6, C.greenDark),
    cyl(64, 76, 1.5, 6, 10, C.greenDark),
    ball(64, 76, 18, 5, H.orange),
  ])
}

/** Coffin, one cell wide and two long: a dark wooden box wider at the shoulders, a lid with a gold cross and gold handles on the side. */
export function coffin(): SolidModel {
  const parts: [number, number, number, number][] = [
    [28, 8, 44, 26],
    [14, 34, 72, 76],
    [22, 110, 56, 50],
    [28, 160, 44, 32],
  ]
  const prims: Prim[] = []
  for (const [x, y, w, d] of parts) prims.push(box(x, y, w, d, 0, 24, C.woodDeep, 2))
  for (const [x, y, w, d] of parts) prims.push(box(x + 4, y + (y === 8 ? 4 : 0), w - 8, d - (y === 160 ? 4 : 0), 24, 5, C.woodDark, 0))
  prims.push(onTop(46, 48, 8, 74, 29, C.gold), onTop(32, 66, 36, 8, 29, C.gold))
  prims.push(box(86, 60, 3, 12, 10, 4, C.gold, 1), box(86, 90, 3, 12, 10, 4, C.gold, 1), box(11, 60, 3, 12, 10, 4, C.gold, 1), box(11, 90, 3, 12, 10, 4, C.gold, 1))
  return model(1, 2, prims)
}

/** Cobweb rug: a dark night-blue cloth with a purple border, a square white web of spokes and rings, and one small friendly spider. */
export function cobwebRug(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const D = rows * 100
  const m = 8
  const prims: Prim[] = [box(m, m, W - 2 * m, D - 2 * m, 0, 3, H.witch), onTop(m + 6, m + 6, W - 2 * m - 12, D - 2 * m - 12, 3, H.night)]
  const cx = W / 2
  const cy = D / 2
  const rx = W / 2 - m - 10
  const ry = D / 2 - m - 10
  const t = 2.4
  // spokes: across, down and two diagonals of dots
  prims.push(onTop(cx - rx, cy - t / 2, 2 * rx, t, 3.8, C.white), onTop(cx - t / 2, cy - ry, t, 2 * ry, 3.8, C.white))
  for (let k = 1; k <= 9; k++) {
    const f = k / 10
    for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) prims.push(onTop(cx + sx * f * rx - 1.6, cy + sy * f * ry - 1.6, 3.2, 3.2, 3.8, C.white))
  }
  // rings
  for (const f of [0.35, 0.65, 0.95]) {
    const ax = rx * f
    const ay = ry * f
    prims.push(
      onTop(cx - ax, cy - ay, 2 * ax, t, 4.4, C.white),
      onTop(cx - ax, cy + ay - t, 2 * ax, t, 4.4, C.white),
      onTop(cx - ax, cy - ay, t, 2 * ay, 4.4, C.white),
      onTop(cx + ax - t, cy - ay, t, 2 * ay, 4.4, C.white),
    )
  }
  // the spider: a small dark body with four leg strips
  const px = cx + rx * 0.5
  const py = cy + ry * 0.2
  prims.push(onTop(px - 10, py - 4, 20, 1.6, 4.6, C.ink), onTop(px - 10, py + 3, 20, 1.6, 4.6, C.ink), cyl(px, py, 5, 4.6, 1.2, C.ink, undefined, 0), cyl(px, py - 1, 1.2, 5.8, 0.2, C.red, undefined, 0))
  return model(cols, rows, prims)
}

/** Witch's broom, two cells long, resting on two little stands: a wooden handle, a red binding, a straw brush and a pointed witch's hat on it. */
export function broomstick(): SolidModel {
  return model(2, 1, [
    box(24, 38, 8, 26, 0, 16, C.woodDark),
    box(112, 38, 8, 26, 0, 16, C.woodDark),
    box(10, 46, 120, 10, 16, 9, C.wood),
    box(128, 40, 10, 22, 13, 15, C.red),
    box(138, 36, 22, 30, 12, 18, H.straw),
    box(160, 30, 30, 42, 10, 22, H.straw),
    onTop(166, 40, 22, 2, 32, H.strawDark),
    onTop(166, 50, 22, 2, 32, H.strawDark),
    onTop(166, 60, 22, 2, 32, H.strawDark),
    cyl(70, 50, 22, 25, 3, H.witchDark),
    cyl(70, 50, 12, 28, 26, H.witch, 2),
    cyl(70, 50, 12.5, 28, 4, H.orange, 11),
  ])
}

/** Bowl of sweets: a purple bowl on a short foot, heaped with round sweets and two wrapped candies in bright colours. */
export function candyBowl(): SolidModel {
  const prims: Prim[] = [cyl(50, 52, 16, 0, 8, H.witchDark, 12), cyl(50, 52, 24, 8, 20, C.purple, 38), cyl(50, 52, 38, 28, 3, C.purpleDark, 38)]
  const sweets: [number, number, number, string][] = [
    [36, 42, 34, H.candy],
    [60, 38, 34, C.yellow],
    [64, 60, 34, H.mint],
    [42, 64, 34, C.red],
    [50, 52, 40, H.orange],
    [28, 54, 33, H.mint],
    [52, 34, 33, C.lilac],
  ]
  for (const [x, y, z, color] of sweets) prims.push(ball(x, y, z, 7, color))
  prims.push(box(40, 70, 6, 6, 37, 4, H.candy, 1), box(58, 70, 6, 6, 37, 4, H.candy, 1), ball(52, 73, 39, 6, H.candy))
  return model(1, 1, prims)
}

/** Bare tree: a grey-brown crooked trunk with stubby bare branches, one left orange leaf and a round hollow knot on the front. */
export function deadTree(): SolidModel {
  return model(1, 1, [
    cyl(50, 56, 22, 0, 6, H.bark, 14),
    cyl(50, 56, 12, 0, 54, H.bark, 8),
    box(18, 50, 30, 8, 46, 8, H.bark),
    box(16, 50, 8, 8, 54, 18, H.bark),
    box(52, 54, 30, 8, 58, 8, H.bark),
    box(76, 54, 8, 8, 66, 16, H.bark),
    box(44, 52, 10, 8, 54, 28, H.bark),
    box(50, 52, 16, 6, 78, 6, H.bark),
    ball(80, 58, 84, 5, H.orange),
    ball(50, 67, 30, 4.5, C.ink),
  ])
}

/** Spell shelf: a dark purple shelf with rows of spell books (purple, green, orange), and on top a lit candle, a potion bottle and a book. */
export function spellShelf(cols: number): SolidModel {
  const W = cols * 100
  const D = 50
  const prims: Prim[] = [
    box(6, 0, W - 12, 5, 0, 72, H.witchDark),
    box(6, 0, 8, D, 0, 72, H.witch),
    box(W - 14, 0, 8, D, 0, 72, H.witch),
    box(6, 0, W - 12, D, 0, 6, H.witch),
    box(6, 0, W - 12, D, 34, 5, H.witch),
    box(6, 0, W - 12, D, 66, 6, H.witch),
  ]
  const colours = [H.witch, C.greenDark, H.orange, C.purple, H.slimeDark, C.redDark]
  const count = cols * 5
  const step = (W - 32) / count
  for (const z of [6, 39]) {
    for (let i = 0; i < count; i++) {
      const tall = (i + (z > 6 ? 1 : 0)) % 3 === 0 ? 26 : 22
      prims.push(box(16 + i * step, 8, step - 2, D - 14, z, tall, colours[(i + (z > 6 ? 3 : 0)) % colours.length]!, 1.5), onFront(16 + i * step + 1, D - 6, step - 4, z + 10, 3, C.gold))
    }
  }
  prims.push(cyl(24, 26, 6, 72, 4, C.gold), cyl(24, 26, 3.5, 76, 12, C.cream), ball(24, 26, 91, 3.5, H.glow))
  prims.push(cyl(W - 28, 26, 8, 72, 10, H.slime), cyl(W - 28, 26, 3, 82, 6, H.slimeDark), box(W - 66, 12, 26, 28, 72, 6, H.orange, 1.5))
  return model(cols, 1, shiftY(prims, 26))
}

/** Potion cabinet: a tall dark-green cupboard, open upper shelves with coloured potion bottles, closed panelled doors below, bottles on top. */
export function potionCabinet(cols: number): SolidModel {
  const W = cols * 100
  const D = 40
  const prims: Prim[] = [box(8, 0, W - 16, D, 0, 6, C.ink), box(8, 0, W - 16, D, 6, 40, H.thorn), box(8, 0, W - 16, 8, 46, 34, H.thorn), box(8, 0, 8, D, 46, 34, H.thorn), box(W - 16, 0, 8, D, 46, 34, H.thorn), box(8, 0, W - 16, D, 80, 5, H.thorn)]
  const potions = [H.slime, C.purple, H.candy, H.orange, C.blue, H.glow]
  for (let c = 0; c < cols; c++) {
    const x0 = c * 100
    prims.push(onFront(x0 + 16, D, 32, 12, 28, C.greenDark), onFront(x0 + 52, D, 32, 12, 28, C.greenDark), cyl(x0 + 47, D + 0.6, 2, 24, 4, C.gold), cyl(x0 + 53, D + 0.6, 2, 24, 4, C.gold))
    for (let k = 0; k < 3; k++) {
      const color = potions[(c * 3 + k) % potions.length]!
      const x = x0 + 30 + k * 20
      prims.push(cyl(x, 22, 6, 46, 14, color), cyl(x, 22, 2.5, 60, 6, C.woodDark))
    }
  }
  for (let c = 0; c < cols; c++) prims.push(cyl(c * 100 + 34, 20, 7, 85, 6, H.slime, 4), ball(c * 100 + 34, 20, 94, 2, H.slimeLight), cyl(c * 100 + 64, 22, 5, 85, 10, C.purple))
  return model(cols, 1, shiftY(prims, 30))
}

/** Alchemy desk: a dark wooden table on legs with an open spell book, a round flask of glowing brew on a stand, test tubes and a candle. */
export function alchemyDesk(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [...legs(W, 88, 38, C.woodDeep, 9, 12), box(6, 12, W - 12, 76, 38, 6, C.woodDark)]
  prims.push(box(20, 40, 24, 30, 44, 3, C.cream, 1.5), box(44, 40, 24, 30, 44, 3, C.paper, 1.5), onTop(24, 48, 16, 2, 47, C.woodDark), onTop(48, 52, 16, 2, 47, C.woodDark))
  const fx = W - 50
  prims.push(cyl(fx, 44, 12, 44, 4, C.slate), cyl(fx, 44, 2, 48, 14, C.slate), ball(fx, 44, 74, 13, H.slime), cyl(fx, 44, 4, 85, 10, C.glass))
  prims.push(box(fx - 40, 22, 26, 8, 44, 6, C.woodLight), cyl(fx - 34, 26, 3, 50, 14, H.candy), cyl(fx - 26, 26, 3, 50, 14, C.blue), cyl(fx - 18, 26, 3, 50, 14, H.orange))
  prims.push(cyl(W - 18, 72, 5, 44, 3, C.gold), cyl(W - 18, 72, 3, 47, 12, C.cream), ball(W - 18, 72, 62, 3, H.glow))
  return model(cols, 1, prims)
}

/** Thorny shrub: a mound of earth with a dark green bush, sharp thorn spikes all round and red berries. No pot. */
export function thornyPlant(): SolidModel {
  const prims: Prim[] = [cyl(50, 54, 34, 0, 6, C.soil, 30), ball(36, 56, 30, 20, H.thorn), ball(64, 54, 30, 20, C.greenDark), ball(50, 58, 46, 22, H.thorn), ball(50, 46, 56, 14, C.greenDark)]
  const spikes: [number, number, number][] = [[16, 56, 30], [84, 54, 30], [50, 84, 40], [28, 74, 46], [72, 74, 44], [50, 30, 62], [36, 40, 58], [66, 40, 56]]
  for (const [x, y, z] of spikes) prims.push(cyl(x, y, 3, z, 10, C.creamDark, 0.4, 1))
  prims.push(ball(40, 76, 44, 4, H.berry), ball(60, 78, 40, 4, H.berry), ball(56, 64, 66, 4, H.berry), ball(30, 50, 50, 4, H.berry))
  return model(1, 1, prims)
}

/** Candy counter: a shop counter with pink and white stripes on the front, a cream top and big glass jars of coloured sweets. */
export function candyCounter(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [box(6, 14, W - 12, 64, 0, 4, C.ink), box(6, 14, W - 12, 64, 4, 50, C.pink), box(2, 10, W - 4, 72, 54, 5, C.creamLight)]
  const stripes = Math.round((W - 12) / 18)
  for (let i = 0; i < stripes; i += 2) prims.push(onFront(6 + i * ((W - 12) / stripes), 78, (W - 12) / stripes, 4, 50, C.white))
  const fills = [H.candy, H.mint, C.yellow, H.orange, C.lilac, C.red]
  const jars = cols * 2
  for (let k = 0; k < jars; k++) {
    const x = (W / jars) * (k + 0.5)
    const fill = fills[k % fills.length]!
    prims.push(cyl(x, 40, 15, 59, 20, C.glass), cyl(x, 40, 13, 59, 15, fill), cyl(x, 40, 9, 79, 6, C.redDark))
  }
  prims.push(box(W / 2 - 14, 60, 28, 16, 59, 3, C.white, 1.5), ball(W / 2 - 6, 68, 65, 4, H.candy), ball(W / 2 + 6, 66, 65, 4, H.mint))
  return model(cols, 1, prims)
}

/** Feast table: a long table under an orange cloth with a black runner, a pumpkin pie, cupcakes with pink icing and two candles. */
export function feastTable(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const D = rows * 100
  const prims: Prim[] = [
    box(14, 16, 10, 10, 0, 20, C.woodDeep),
    box(W - 24, 16, 10, 10, 0, 20, C.woodDeep),
    box(14, D - 26, 10, 10, 0, 20, C.woodDeep),
    box(W - 24, D - 26, 10, 10, 0, 20, C.woodDeep),
    box(8, 10, W - 16, D - 20, 20, 24, H.orange),
    onTop(W / 2 - 14, 12, 28, D - 24, 44, C.ink),
  ]
  const cx = W / 2
  const cy = D / 2
  prims.push(cyl(cx, cy, 18, 44.8, 6, C.sand), cyl(cx, cy, 15, 50.8, 0.8, H.orangeDark))
  const cakes: [number, number][] = [
    [26, 30],
    [W - 26, D - 30],
    [26, D - 30],
    [W - 26, 30],
  ]
  for (const [x, y] of cakes) prims.push(cyl(x, y, 7, 44, 7, C.woodLight, 8), ball(x, y, 54, 7, C.pink))
  prims.push(cyl(cx - 34, cy, 4, 44, 3, C.gold), cyl(cx - 34, cy, 2.5, 47, 18, H.witch), ball(cx - 34, cy, 68, 2.8, H.glow))
  prims.push(cyl(cx + 34, cy, 4, 44, 3, C.gold), cyl(cx + 34, cy, 2.5, 47, 18, H.witch), ball(cx + 34, cy, 68, 2.8, H.glow))
  return model(cols, rows, prims)
}

/** Slime puddle: a flat glossy green puddle with a pale sheen and two little bubbles, lying on the floor. */
export function slimePuddle(): SolidModel {
  return model(1, 1, [
    cyl(48, 52, 34, 0, 1.6, H.slimeDark, undefined, 2),
    cyl(72, 70, 16, 0, 1.6, H.slimeDark, undefined, 2),
    cyl(28, 74, 12, 0, 1.6, H.slimeDark, undefined, 2),
    cyl(48, 52, 28, 1.6, 0.8, H.slime, undefined, 0),
    cyl(40, 42, 10, 2.4, 0.8, H.slimeLight, undefined, 0),
    cyl(62, 58, 5, 2.4, 2.4, H.slimeLight, undefined, 1),
    cyl(70, 70, 4, 1.6, 2.2, H.slimeLight, undefined, 1),
  ])
}

/** Ghost portrait, lying flat: an ornate dark frame with gold corners around a night sky with a moon and a smiling white ghost. */
export function ghostPortrait(): SolidModel {
  return model(1, 1, [
    box(10, 8, 80, 84, 0, 4, C.woodDeep),
    box(10, 8, 12, 12, 4, 1.2, C.gold, 0),
    box(78, 8, 12, 12, 4, 1.2, C.gold, 0),
    box(10, 80, 12, 12, 4, 1.2, C.gold, 0),
    box(78, 80, 12, 12, 4, 1.2, C.gold, 0),
    onTop(20, 18, 60, 64, 4, H.night, 0.6),
    onTop(60, 24, 12, 12, 4.6, H.glow, 0.6),
    onTop(34, 36, 28, 36, 4.6, H.sheet, 0.6),
    onTop(30, 66, 8, 8, 4.6, H.sheet, 0.6),
    onTop(58, 66, 8, 8, 4.6, H.sheet, 0.6),
    onTop(40, 44, 5, 6, 5.2, C.ink, 0.6),
    onTop(51, 44, 5, 6, 5.2, C.ink, 0.6),
    onTop(44, 56, 8, 3, 5.2, C.ink, 0.6),
  ])
}
