import { ball, box, C, cyl, model, onFront, onTop, shiftY, type Prim, type SolidModel } from '../../looks/models.ts'

/**
 * Block models of the Carnaval theme (SLAY-18.7), Oeteldonk style: red, white and yellow, the frog, the kroeg, confetti and the optocht.
 * Each one is its own drawing in the A2 block look (docs/design/looks.md, "How to draw a new object"), facing south, registered in
 * `carnavalIcons.ts`. Built from the approved draft art (docs/themes/seasonal/art.tsx). No brand, no logo, no beer label anywhere.
 */
const K = {
  red: '#cf3b32',
  redDark: '#a82c25',
  yellow: '#f2c230',
  yellowDark: '#d4a21c',
  frog: '#6fb04e',
  frogDark: '#4d8a36',
  frogLight: '#8fca6a',
  beer: '#e8a92c',
  foam: '#fffaf0',
  bottle: '#7a4a1e',
  barWood: '#6b4127',
  barTop: '#4a2c1a',
  chrome: '#d8dde6',
  confettiBlue: '#5b8fd6',
  confettiGreen: '#7fbf5a',
  confettiPink: '#e88aa8',
} as const

/** The Oeteldonk colours in order. */
const OETELDONK = [K.red, C.white, K.yellow] as const

/** A small deterministic generator, so a model is the same on every render. */
function lcg(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

/** The Oeteldonk frog: a fat green frog sitting up with big white eyes and a scarf in the Oeteldonk colours: a white collar with a red and a yellow block at each side, so it reads red, white, yellow from every side (owner, PR #169). */
export function frog(): SolidModel {
  return model(1, 1, [
    cyl(50, 56, 34, 0, 4, C.stoneDark),
    ball(22, 64, 16, 14, K.frogDark),
    ball(78, 64, 16, 14, K.frogDark),
    cyl(50, 56, 30, 4, 30, K.frog, 23),
    ball(32, 84, 10, 9, K.frogDark),
    ball(68, 84, 10, 9, K.frogDark),
    onFront(36, 80.5, 28, 14, 12, K.frogLight),
    cyl(50, 56, 26, 32, 11, C.white, undefined, 1.5),
    box(22, 68, 15, 13, 32, 11, K.red, 1.5),
    box(63, 68, 15, 13, 32, 11, K.yellow, 1.5),
    box(22, 31, 15, 13, 32, 11, K.yellow, 1.5),
    box(63, 31, 15, 13, 32, 11, K.red, 1.5),
    ball(50, 56, 66, 22, K.frog),
    ball(37, 60, 82, 9, C.white),
    ball(63, 60, 82, 9, C.white),
    ball(37, 65, 84, 4, C.ink),
    ball(63, 65, 84, 4, C.ink),
  ])
}

/** Beer barrel: an oak barrel standing up, bulging in the middle, three dark iron hoops, a lid with a bung and a brass tap at the front. */
export function beerBarrel(): SolidModel {
  return model(1, 1, [
    cyl(50, 52, 31, 0, 22, C.wood, 37),
    cyl(50, 52, 37, 22, 22, C.wood, 31),
    cyl(50, 52, 32, 3, 4, C.woodDeep, 32),
    cyl(50, 52, 37.5, 20, 4, C.woodDeep, 37.5),
    cyl(50, 52, 32, 37, 4, C.woodDeep, 31.5),
    cyl(50, 52, 28, 44, 2, C.woodLight),
    cyl(50, 52, 5, 46, 3, C.woodDeep),
    box(46, 84, 8, 10, 26, 6, C.gold, 1.5),
    box(47.5, 90, 5, 4, 32, 8, C.goldDark, 1),
  ])
}

/** Carnival drum: a red snare drum on a low stand, yellow rims, white head, with two sticks lying on top. */
export function drum(): SolidModel {
  const prims: Prim[] = [box(22, 26, 6, 6, 0, 22, C.slate, 1.5), box(72, 26, 6, 6, 0, 22, C.slate, 1.5), box(47, 80, 6, 6, 0, 22, C.slate, 1.5)]
  prims.push(cyl(50, 54, 36, 22, 4, K.yellow), cyl(50, 54, 35, 26, 18, K.red), cyl(50, 54, 36, 44, 4, K.yellow), cyl(50, 54, 32, 48, 0.8, C.white, undefined, 0))
  for (let k = 0; k < 5; k++) prims.push(onFront(26 + k * 12, 89.3, 3, 27, 16, C.white))
  prims.push(box(26, 42, 48, 4, 49, 4, C.woodLight, 1.5), box(26, 60, 48, 4, 49, 4, C.woodLight, 1.5), ball(76, 44, 51, 3.5, C.wood), ball(76, 62, 51, 3.5, C.wood))
  return model(1, 1, prims)
}

/** Confetti drift: a low loose heap of paper bits in red, white and yellow with some blue, green and pink, and a few curled streamers. Flat. */
export function confettiPile(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  const rnd = lcg(cols * 31 + rows * 7)
  const prims: Prim[] = [box(10, 10, W - 20, H - 20, 0, 1.5, '#efe6cf', 1.5), box(22, 22, W - 44, H - 44, 1.5, 1.5, '#f6efdc', 0)]
  const colours = [K.red, C.white, K.yellow, K.red, K.yellow, K.confettiBlue, K.confettiGreen, K.confettiPink]
  const bits = 16 * cols * rows
  for (let k = 0; k < bits; k++) {
    const wide = rnd() < 0.5
    const x = 14 + rnd() * (W - 36)
    const y = 14 + rnd() * (H - 36)
    prims.push(onTop(x, y, wide ? 8 : 5, wide ? 5 : 8, 3, colours[k % colours.length]!, 1))
  }
  for (let k = 0; k < cols * rows; k++) {
    const x = 24 + rnd() * (W - 70)
    const y = 24 + rnd() * (H - 50)
    const color = OETELDONK[k % 3] === C.white ? K.confettiBlue : OETELDONK[k % 3]!
    prims.push(onTop(x, y, 26, 2.5, 4, color, 1), onTop(x + 24, y, 2.5, 14, 4, color, 1), onTop(x + 8, y + 12, 18, 2.5, 4, color, 1))
  }
  return model(cols, rows, prims)
}

/** Parade float (praalwagen): a wagon on four wheels with a red, white and yellow skirt, bunting poles at the corners and a big green Oeteldonk frog in its red, white and yellow scarf on the deck. One cell wide, two long. */
export function floatCart(): SolidModel {
  const prims: Prim[] = []
  for (const [x, y] of [[6, 22], [80, 22], [6, 150], [80, 150]] as const) prims.push(box(x, y, 14, 28, 0, 22, C.slate, 2))
  prims.push(box(46, 186, 8, 12, 10, 5, C.slate, 1.5))
  prims.push(box(10, 8, 80, 60, 10, 22, K.red), box(10, 68, 80, 64, 10, 22, C.white), box(10, 132, 80, 60, 10, 22, K.yellow))
  prims.push(box(6, 4, 88, 192, 32, 5, C.woodLight))
  for (const [x, y, k] of [[12, 10, 0], [88, 10, 2], [12, 190, 2], [88, 190, 0]] as const) prims.push(cyl(x, y, 2.5, 37, 46, C.woodDeep), ball(x, y, 85, 5, OETELDONK[k]))
  for (const y of [10, 190]) for (let k = 0; k < 5; k++) prims.push(box(18 + k * 14, y - 1, 8, 2, 70, 9, OETELDONK[k % 3]!, 1))
  prims.push(ball(28, 112, 46, 12, K.frogDark), ball(72, 112, 46, 12, K.frogDark))
  prims.push(cyl(50, 104, 26, 37, 18, K.frog, 20), cyl(50, 104, 21, 55, 8, C.white, undefined, 1.5), box(31, 114, 12, 11, 55, 8, K.red, 1.5), box(57, 114, 12, 11, 55, 8, K.yellow, 1.5), box(31, 83, 12, 11, 55, 8, K.yellow, 1.5), box(57, 83, 12, 11, 55, 8, K.red, 1.5))
  prims.push(ball(50, 104, 79, 16, K.frog), ball(41, 110, 89, 6, C.white), ball(59, 110, 89, 6, C.white), ball(41, 114, 90, 2.5, C.ink), ball(59, 114, 90, 2.5, C.ink))
  for (const [x, y, k] of [[22, 40, 0], [70, 52, 2], [30, 160, 1], [66, 172, 0], [50, 146, 2]] as const) prims.push(onTop(x, y, 6, 4, 37, k === 1 ? K.confettiBlue : OETELDONK[k], 0.8))
  return model(1, 2, prims)
}

/** Beer crate: a red plastic crate with hand grips, full of brown bottles with gold caps. No brand, no label. */
export function beerCrate(): SolidModel {
  const prims: Prim[] = [box(14, 0, 72, 56, 0, 34, K.red), onTop(18, 4, 64, 48, 34, K.redDark, 0.5)]
  prims.push(onFront(36, 56, 28, 24, 6, C.ink), onFront(22, 56, 56, 4, 2, K.redDark))
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      const x = 24 + i * 17
      const y = 12 + j * 16
      prims.push(cyl(x, y, 6, 30, 8, K.bottle), cyl(x, y, 3, 38, 8, K.bottle, 2.5), cyl(x, y, 3.2, 46, 2, C.gold))
    }
  }
  return model(1, 1, shiftY(prims, 22))
}

/** Bar counter of the kroeg: a dark wood bar with a panelled front and a brass foot rail, a chrome beer tap with red, white and yellow handles, a drip tray and glasses of beer. */
export function barCounter(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [box(6, 30, W - 12, 56, 0, 58, K.barWood), box(2, 26, W - 4, 64, 58, 5, K.barTop), box(8, 90, W - 16, 4, 8, 3, C.gold, 1.5)]
  for (let k = 0; k < cols * 2; k++) prims.push(onFront(14 + k * ((W - 28) / (cols * 2)), 86, (W - 28) / (cols * 2) - 8, 14, 36, C.woodDark))
  const tx = 40
  prims.push(box(tx - 22, 50, 44, 22, 63, 2, C.steelDark, 1), cyl(tx, 42, 6, 63, 22, K.chrome), box(tx - 20, 38, 40, 8, 80, 6, K.chrome, 1.5))
  for (let k = 0; k < 3; k++) prims.push(box(tx - 16 + k * 14, 40, 4, 4, 86, 9, OETELDONK[k]!, 1))
  for (let k = 0; k < cols * 2 - 1; k++) {
    const x = 80 + k * 44
    if (x > W - 18) break
    prims.push(cyl(x, 58, 7, 63, 16, K.beer, 8), cyl(x, 58, 8, 79, 4, K.foam))
  }
  return model(cols, 1, prims)
}
