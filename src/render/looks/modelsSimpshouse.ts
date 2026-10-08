import { ball, box, C, cyl, model, onFront, onTop, shiftY, type Prim, type SolidModel } from './models.ts'

/**
 * The Simpshouse fun objects (SLAY-18.4) as blocks (SLAY-17.4). Each one is its own drawing; only the colours below are shared.
 */
const G = {
  felt: '#4f8a6a',
  feltDark: '#3a6b50',
  mirror: '#cfe6f0',
  bulb: '#f7e28a',
  magenta: '#c76aa6',
  magentaDark: '#a04b86',
  cardBlue: '#5b7fc4',
  orange: '#e9893b',
  orangeLight: '#f4b068',
  liquorice: '#2a2326',
  silver: '#d8dde6',
  sparkle: '#ffffff',
} as const

/** Shelf of trading-card binders: a low shelf unit with two rows of thick coloured binders, a white label on each spine and a stack of binders on top. */
export function cardBinderShelf(cols: number): SolidModel {
  const W = cols * 100
  const D = 52
  const prims: Prim[] = [box(6, 0, W - 12, 5, 0, 66, C.woodDeep), box(6, 0, 8, D, 0, 66, C.wood), box(W - 14, 0, 8, D, 0, 66, C.wood), box(6, 0, W - 12, D, 0, 6, C.wood), box(6, 0, W - 12, D, 30, 5, C.wood), box(6, 0, W - 12, D, 60, 6, C.wood)]
  const colours = [C.red, G.cardBlue, C.yellow, C.greenLight, G.magenta, C.sky]
  const count = cols * 4
  const step = (W - 36) / count
  for (const z of [6, 35]) {
    for (let i = 0; i < count; i++) {
      const x = 18 + i * step
      prims.push(box(x, 8, step - 3, D - 12, z, 24, colours[(i + (z > 6 ? 2 : 0)) % colours.length]!, 2), onFront(x + 1.5, D - 4, step - 6, z + 8, 9, C.white))
    }
  }
  prims.push(box(16, 8, 26, 34, 66, 7, G.cardBlue, 1.5), box(18, 10, 26, 34, 73, 7, C.red, 1.5), box(W - 44, 10, 26, 34, 66, 9, C.yellow, 1.5))
  return model(cols, 1, shiftY(prims, 24))
}

/** Card-trading table: a wooden table with a green felt inset, a fan of cards and two piles of cards. */
export function cardTable(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  const cx = W / 2
  const cy = H / 2
  const prims: Prim[] = [...legs4(W, H, 40), box(8, 10, W - 16, H - 20, 40, 8, C.woodDark), box(18, 20, W - 36, H - 40, 48, 1.4, G.felt), onTop(22, 24, W - 44, H - 48, 49.4, G.feltDark, 0.4)]
  const cards = [C.white, C.red, G.cardBlue, C.yellow]
  for (let k = 0; k < 4; k++) prims.push(box(cx - 26 + k * 12, cy - 12, 12, 20, 49.4 + k * 0.5, 0.8, cards[k]!, 1))
  prims.push(box(cx + 30, cy - 18, 16, 22, 49.4, 5, G.cardBlue, 1.5), box(cx - 50, cy - 8, 16, 22, 49.4, 4, C.red, 1.5))
  return model(cols, rows, prims)
}

function legs4(W: number, H: number, z: number): Prim[] {
  return [box(10, 10, 11, 11, 0, z, C.woodDeep), box(W - 21, 10, 11, 11, 0, z, C.woodDeep), box(10, H - 21, 11, 11, 0, z, C.woodDeep), box(W - 21, H - 21, 11, 11, 0, z, C.woodDeep)]
}

/** Glam vanity: a low dressing table with a tall mirror ringed by bulbs, perfume and lipstick on top. */
export function vanity(cols: number): SolidModel {
  const W = cols * 100
  const mx = W / 2
  const prims: Prim[] = [...legs4(W, 100, 32), box(6, 12, W - 12, 76, 32, 8, C.pink), box(mx - 38, 14, 76, 6, 40, 56, G.magentaDark), onFront(mx - 33, 20, 66, 46, 44, G.mirror), onFront(mx - 29, 20.2, 12, 78, 3, C.white)]
  for (let k = 0; k < 6; k++) prims.push(ball(mx - 36 + k * 14.4, 16, 92, 3.6, G.bulb))
  for (const z of [56, 70, 82]) prims.push(ball(mx - 38, 16, z, 3.6, G.bulb), ball(mx + 38, 16, z, 3.6, G.bulb))
  prims.push(cyl(24, 56, 7, 40, 12, C.skyLight, 6), cyl(W - 26, 54, 4, 40, 10, C.red), cyl(W - 40, 64, 5, 40, 8, C.lilac, 4), box(mx - 12, 60, 24, 14, 40, 2, C.white, 1.5))
  return model(cols, 1, prims)
}

/** Disco ball: a round base, a pole and a silver mirror ball with coloured facets. */
export function discoBall(): SolidModel {
  return model(1, 1, [
    cyl(50, 52, 28, 0, 6, C.slate, 24),
    cyl(50, 52, 4, 6, 26, C.steelDark),
    ball(50, 52, 58, 26, G.silver),
    ball(40, 70, 66, 6, C.pink),
    ball(58, 74, 56, 6, C.sky),
    ball(48, 76, 74, 5, G.bulb),
    ball(66, 70, 68, 5, C.lilac),
    ball(36, 72, 52, 5, C.greenLight),
    ball(72, 40, 82, 3, G.sparkle),
  ])
}

/** Karaoke stage: a magenta platform with gold trim, a mic stand in the middle and two spotlights on posts at the back. */
export function karaokeStage(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  return model(cols, rows, [
    box(6, 10, W - 12, H - 20, 0, 14, G.magenta),
    box(6, H - 14, W - 12, 4, 0, 14, C.gold),
    box(4, 8, W - 8, 4, 14, 2.5, C.gold, 1.5),
    box(4, H - 12, W - 8, 4, 14, 2.5, C.gold, 1.5),
    cyl(W / 2, H / 2 + 6, 10, 14, 3, C.slate),
    cyl(W / 2, H / 2 + 6, 2.5, 17, 52, C.steelDark),
    ball(W / 2, H / 2 + 6, 74, 5.5, C.ink),
    cyl(18, 24, 3, 14, 52, C.slate),
    cyl(W - 18, 24, 3, 14, 52, C.slate),
    cyl(18, 28, 9, 66, 14, C.ink, 7),
    cyl(W - 18, 28, 9, 66, 14, C.ink, 7),
    cyl(18, 28, 6, 80, 0.8, G.bulb),
    cyl(W - 18, 28, 6, 80, 0.8, G.bulb),
  ])
}

/** Arcade cabinet: a dark upright with a bright screen, a control panel with a joystick and buttons, and a lit marquee on top. */
export function arcadeCabinet(): SolidModel {
  return model(1, 1, [
    box(14, 14, 72, 74, 0, 48, C.slate),
    box(20, 14, 60, 56, 48, 40, C.ink),
    box(14, 14, 72, 18, 88, 8, G.magenta),
    onFront(24, 88, 52, 52, 30, C.sky),
    onFront(30, 88.2, 18, 70, 8, G.magenta),
    onFront(52, 88.2, 18, 58, 8, G.bulb),
    box(10, 62, 80, 30, 44, 6, C.slate),
    cyl(32, 76, 3, 50, 12, C.steelDark),
    ball(32, 76, 64, 6, C.red),
    cyl(56, 72, 4.5, 50, 3, C.yellow),
    cyl(68, 78, 4.5, 50, 3, C.greenLight),
    cyl(78, 70, 4.5, 50, 3, C.sky),
    onFront(24, 92, 52, 16, 10, G.magentaDark),
  ])
}

/** Bubble bath: a white tub with clear blue water, a heap of foam bubbles and two taps at one end. */
export function bubbleBath(cols: number): SolidModel {
  const W = cols * 100
  const wall = 14
  const rim = 38
  const prims: Prim[] = [
    box(6, 12, W - 12, 76, 0, 6, C.white),
    box(6, 12, W - 12, wall, 0, rim, C.white),
    box(6, 88 - wall, W - 12, wall, 0, rim, C.white),
    box(6, 12, wall, 76, 0, rim, C.white),
    box(W - 6 - wall, 12, wall, 76, 0, rim, C.white),
    box(6 + wall, 12 + wall, W - 12 - 2 * wall, 76 - 2 * wall, 6, 22, C.water),
    box(6 + wall + 6, 12 + wall + 6, W - 12 - 2 * wall - 12, 8, 28, 0.8, C.waterLight, 0),
  ]
  const spots: [number, number, number, number][] = [[0.28, 0.5, 34, 11], [0.38, 0.4, 36, 9], [0.46, 0.58, 35, 12], [0.56, 0.45, 38, 9], [0.64, 0.55, 34, 10], [0.5, 0.5, 42, 8], [0.34, 0.62, 33, 7], [0.72, 0.42, 33, 7]]
  for (const [fx, fy, z, r] of spots) prims.push(ball(6 + wall + fx * (W - 12 - 2 * wall), 12 + wall + fy * (76 - 2 * wall), z, r, C.white))
  prims.push(cyl(W - 24, 44, 3.5, rim, 10, C.gold), cyl(W - 24, 56, 3.5, rim, 10, C.gold), box(W - 28, 46, 8, 8, rim + 8, 4, C.gold, 1.5))
  return model(cols, 1, prims)
}

/** Rabbit hutch: a wooden house on legs with a pitched roof and a mesh door. With a second cell, a low wire run with a rabbit and a carrot. */
export function rabbitHutch(cols: number): SolidModel {
  const prims: Prim[] = [
    box(10, 18, 11, 11, 0, 26, C.woodDeep),
    box(79, 18, 11, 11, 0, 26, C.woodDeep),
    box(10, 70, 11, 11, 0, 26, C.woodDeep),
    box(79, 70, 11, 11, 0, 26, C.woodDeep),
    box(8, 14, 84, 72, 26, 34, C.wood),
    box(2, 10, 96, 80, 60, 8, C.woodDark),
    box(14, 14, 72, 66, 68, 8, C.terraDark),
    onFront(18, 86, 36, 32, 22, C.ink),
    onFront(60, 86, 24, 32, 22, C.woodLight),
  ]
  for (let k = 0; k < 5; k++) prims.push(onFront(21 + k * 7, 86.4, 1.2, 32, 22, C.steelDark))
  if (cols === 2) {
    for (const [x, y] of [[112, 18], [188, 18], [112, 82], [188, 82]] as const) prims.push(box(x - 2, y - 2, 4, 4, 0, 34, C.steelDark, 1.5))
    prims.push(box(110, 16, 80, 2, 32, 2, C.steelDark, 1), box(110, 80, 80, 2, 32, 2, C.steelDark, 1), box(110, 16, 2, 66, 32, 2, C.steelDark, 1), box(188, 16, 2, 66, 32, 2, C.steelDark, 1))
    prims.push(ball(140, 54, 12, 12, C.white), ball(150, 54, 28, 8, C.white), box(147, 50, 3, 3, 33, 12, C.white, 1.5), box(152, 50, 3, 3, 33, 12, C.pink, 1.5), cyl(170, 66, 4, 0, 14, G.orange, 1.5), cyl(170, 66, 2, 14, 4, C.greenLight))
  }
  return model(cols, 1, prims)
}

/** Red carpet: a flat red runner with gold borders and four gold posts joined by a velvet rope along both long sides. */
export function redCarpet(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [box(10, 28, W - 20, 44, 0, 2.5, C.redDark), onTop(14, 32, W - 28, 36, 2.5, C.red, 0.8), onTop(14, 32, W - 28, 3, 3.3, C.gold, 0.5), onTop(14, 65, W - 28, 3, 3.3, C.gold, 0.5)]
  for (const x of [14, W - 14]) {
    for (const y of [22, 78]) prims.push(cyl(x, y, 6, 0, 36, C.gold, 3.5), cyl(x, y, 8, 0, 4, C.goldDark), ball(x, y, 40, 5, C.gold))
  }
  prims.push(box(14, 21, W - 28, 2, 28, 3, C.redDark, 1.5), box(14, 77, W - 28, 2, 28, 3, C.redDark, 1.5))
  return model(cols, 1, prims)
}

/** Champagne tower: a gold tray and tiers of glasses on stems, getting smaller, with a bottle on top. */
export function champagneTower(): SolidModel {
  const stem = (z: number, h: number): Prim => cyl(50, 52, 4, z, h, C.skyLight)
  return model(1, 1, [
    cyl(50, 52, 40, 0, 5, C.gold, 38),
    stem(5, 10),
    cyl(50, 52, 34, 15, 6, C.white, 36),
    stem(21, 8),
    cyl(50, 52, 25, 29, 6, C.skyLight, 27),
    stem(35, 8),
    cyl(50, 52, 16, 43, 6, C.white, 18),
    cyl(50, 52, 5.5, 49, 28, '#2f5a3c'),
    cyl(50, 52, 2.5, 77, 8, '#2f5a3c', 2),
    cyl(50, 52, 3, 85, 3, C.gold),
  ])
}

/** Big gold mirror: a carved gold frame around a pale glass with two glints, standing on small feet. */
export function goldMirror(cols: number): SolidModel {
  const W = cols * 100
  return model(cols, 1, [
    box(14, 16, 10, 10, 0, 8, C.goldDark),
    box(W - 24, 16, 10, 10, 0, 8, C.goldDark),
    box(8, 16, W - 16, 8, 6, 88, C.gold),
    onFront(18, 24, W - 36, 16, 70, G.mirror),
    onFront(24, 24.2, 6, 66, 24, C.white),
    onFront(34, 24.2, 3, 80, 10, C.white),
    box(4, 14, W - 8, 4, 90, 6, C.goldDark, 2),
  ])
}

/** Glitter shoe wall: three open shelves against a pink back panel, with pairs of party shoes in pink, gold, red and blue. Shallow, centred in its cell. */
export function shoeWall(cols: number): SolidModel {
  const W = cols * 100
  const D = 48
  const prims: Prim[] = [box(6, 0, W - 12, 5, 0, 84, G.magentaDark), box(6, 0, 6, D, 0, 84, C.woodDark), box(W - 12, 0, 6, D, 0, 84, C.woodDark)]
  const colours = [C.pink, C.gold, C.red, C.blueDark, C.lilac]
  for (let s = 0; s < 3; s++) {
    const z = s * 26
    prims.push(box(6, 0, W - 12, D, z, 5, C.woodDark))
    const pairs = cols * 2
    for (let k = 0; k < pairs; k++) {
      const x = 16 + k * ((W - 40) / pairs)
      const color = colours[(k + s) % colours.length]!
      prims.push(box(x, 8, 12, 30, z + 5, 7, color, 2), box(x, 30, 12, 8, z + 12, 5, color, 2), box(x, 8, 12, 8, z + 5, 12, C.ink, 2), box(x + 15, 8, 12, 30, z + 5, 7, color, 2))
    }
  }
  prims.push(box(6, 0, W - 12, D, 78, 6, C.woodDark), box(14, 8, 10, 10, 84, 10, C.pink, 1.5), box(28, 8, 10, 10, 84, 6, C.gold, 1.5))
  return model(cols, 1, shiftY(prims, 26))
}

/** Photo wall: a freestanding cork board on two feet pinned with big photos and hearts, with a string of fairy lights along the top. */
export function photoWall(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [box(14, 38, 12, 20, 0, 6, C.woodDark), box(W - 26, 38, 12, 20, 0, 6, C.woodDark), box(6, 44, W - 12, 8, 6, 86, C.wood), onFront(10, 52, W - 20, 12, 76, C.woodLight)]
  const frames = [C.sky, C.pink, C.yellow, C.greenLight, C.lilac, C.red]
  const n = cols * 2
  const step = (W - 30) / n
  for (let k = 0; k < n; k++) {
    const x = 14 + k * step
    prims.push(onFront(x, 52.3, step - 6, 18 + (k % 2) * 14, 34, C.white), onFront(x + 3, 52.6, step - 12, 24 + (k % 2) * 14, 22, frames[k % frames.length]!))
  }
  prims.push(ball(W / 2, 54, 32, 5.5, C.red))
  for (let k = 0; k < 6 * cols; k++) prims.push(ball(12 + k * ((W - 24) / (6 * cols - 1)), 54, 92 - (k % 2) * 3, 3, G.bulb))
  return model(cols, 1, prims)
}

/** DJ booth: a dark desk with a turntable at each end and a mixer with sliders between them. */
export function djBooth(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [box(6, 16, W - 12, 74, 0, 50, C.slick), box(2, 12, W - 4, 82, 50, 5, C.slate)]
  for (const x of [34, W - 34]) {
    prims.push(box(x - 26, 24, 52, 56, 55, 4, C.steelDark, 2), cyl(x, 54, 21, 59, 2.5, C.ink), cyl(x, 54, 7, 61.5, 0.8, C.red), box(x + 14, 28, 4, 24, 61.5, 3, G.silver, 1))
  }
  prims.push(box(W / 2 - 22, 28, 44, 48, 55, 8, C.slate, 2))
  for (let k = 0; k < 4; k++) prims.push(box(W / 2 - 16 + k * 10, 36, 4, 22, 63, 2, [C.pink, C.sky, G.bulb, C.greenLight][k]!, 1))
  prims.push(box(W / 2 - 14, 62, 28, 6, 63, 2, C.ink, 1))
  return model(cols, 1, prims)
}

/** Dance floor: a lit checkerboard of pink, sky, yellow and lilac tiles in a dark frame. Flat. */
export function danceFloor(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  const prims: Prim[] = [box(6, 6, W - 12, H - 12, 0, 3, C.ink)]
  const tile = 22
  const colours = [C.pink, C.sky, C.yellow, C.lilac]
  const nx = Math.floor((W - 24) / tile)
  const ny = Math.floor((H - 24) / tile)
  const ox = (W - nx * tile) / 2
  const oy = (H - ny * tile) / 2
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) prims.push(box(ox + i * tile + 1, oy + j * tile + 1, tile - 2, tile - 2, 3, 0.8, colours[(i + 2 * j) % 4]!, 0))
  return model(cols, rows, prims)
}

/** Confetti cannon: a round base, a striped cone and a burst of confetti above it. */
export function confettiCannon(): SolidModel {
  const prims: Prim[] = [cyl(50, 54, 28, 0, 8, C.slate), cyl(50, 54, 24, 8, 16, G.magenta, 20), cyl(50, 54, 20, 24, 12, G.bulb, 17), cyl(50, 54, 17, 36, 12, G.magenta, 14), cyl(50, 54, 14, 48, 3, C.gold)]
  const bits: [number, number, number, string][] = [[34, 40, 70, C.pink], [60, 36, 76, C.sky], [48, 60, 84, G.bulb], [70, 56, 72, C.greenLight], [38, 62, 78, C.lilac], [54, 46, 90, C.red]]
  for (const [x, y, z, color] of bits) prims.push(ball(x, y, z, 4, color))
  return model(1, 1, prims)
}

/** Balloons: a weight with three balloons on strings, red, blue and yellow. */
export function balloons(): SolidModel {
  return model(1, 1, [
    cyl(50, 56, 14, 0, 6, C.slate),
    cyl(40, 54, 0.9, 6, 44, C.steelDark),
    cyl(50, 56, 0.9, 6, 50, C.steelDark),
    cyl(62, 54, 0.9, 6, 42, C.steelDark),
    ball(34, 52, 66, 15, C.red),
    ball(66, 52, 62, 15, C.blueDark),
    ball(50, 60, 72, 16, C.yellow),
  ])
}

/** Snack table: a table under a white cloth with bowls of crisps, a cake on a plate and paper cups. */
export function snackTable(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [box(8, 14, W - 16, 74, 0, 46, C.white), box(4, 10, W - 8, 82, 46, 5, C.creamLight), onFront(8, 88, W - 16, 4, 6, C.pink)]
  prims.push(cyl(32, 50, 13, 51, 6, C.red, 15), cyl(32, 50, 11, 57, 3, C.yellow), cyl(W / 2, 50, 16, 51, 2, C.white), cyl(W / 2, 50, 11, 53, 12, C.pink, 10), ball(W / 2, 50, 69, 3.5, C.red))
  for (let k = 0; k < cols; k++) prims.push(cyl(W - 28 - k * 14, 60, 5, 51, 9, C.skyLight, 6.5))
  if (cols === 3) prims.push(cyl(86, 66, 12, 51, 5, C.green, 14), ball(86, 66, 60, 7, C.greenLight))
  return model(cols, 1, prims)
}

/** Cocktail bar: a dark counter with a gold rail and pink drinks on it, and a back bar with bottles on a shelf behind. */
export function cocktailBar(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [box(6, 48, W - 12, 44, 0, 56, C.slick), box(2, 44, W - 4, 52, 56, 5, C.slate), box(6, 92, W - 12, 3, 38, 3, C.gold, 1.5)]
  prims.push(box(6, 10, W - 12, 22, 0, 40, C.slick), box(6, 10, W - 12, 8, 40, 50, C.slate), box(6, 10, W - 12, 24, 62, 3, C.woodDark))
  const bottles = [C.green, C.red, C.gold, C.blueDark, C.pink]
  for (let k = 0; k < cols * 4; k++) prims.push(cyl(16 + k * ((W - 32) / (cols * 4 - 1)), 22, 4.5, 65, 18 + (k % 3) * 4, bottles[k % bottles.length]!, 3.5))
  for (let k = 0; k < cols; k++) prims.push(cyl(k * 100 + 36, 70, 7, 61, 12, C.skyLight, 9), cyl(k * 100 + 36, 70, 6, 72, 0.8, C.pink), ball(k * 100 + 36, 70, 74, 3, C.red))
  return model(cols, 1, prims)
}

/** Photo booth: a dark cabinet with a magenta curtain over the front, a row of bulbs on top and a stool seen under the curtain. */
export function photoBooth(): SolidModel {
  const prims: Prim[] = [box(10, 12, 80, 78, 0, 86, C.slate), box(6, 8, 88, 86, 80, 8, C.slick), onFront(16, 90, 68, 8, 66, G.magenta), onFront(16, 90.2, 12, 8, 66, G.magentaDark), onFront(60, 90.2, 12, 8, 66, G.magentaDark), onFront(16, 90, 68, 74, 6, C.gold), box(20, 66, 60, 20, 0, 8, C.ink, 2)]
  for (let k = 0; k < 5; k++) prims.push(ball(18 + k * 16, 88, 90, 4.2, G.bulb))
  return model(1, 1, prims)
}

/** Lava lamp: a gold base and cap around a tall glowing orange body with blobs rising in it. */
export function lavaLamp(): SolidModel {
  return model(1, 1, [
    cyl(50, 52, 22, 0, 8, C.gold, 20),
    cyl(50, 52, 15, 8, 54, G.orange, 11),
    cyl(50, 52, 12, 14, 8, G.orangeLight, 10),
    ball(48, 52, 36, 7, G.bulb),
    ball(54, 54, 52, 5, G.bulb),
    cyl(50, 52, 12, 62, 8, C.gold, 7),
    ball(50, 52, 76, 4.5, C.gold),
  ])
}

/** Salmari bar: a low dark table with a dark tray, a tall dark liquorice-liqueur bottle without a label and a row of shot glasses. */
export function salmariBar(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [...legs4(W, 100, 42).map((p) => p), box(6, 14, W - 12, 72, 42, 6, C.slick), box(14, 24, W - 28, 52, 48, 2.5, C.slate)]
  prims.push(cyl(30, 40, 11, 50.5, 32, G.liquorice, 10), cyl(30, 40, 5, 82.5, 8, G.liquorice, 3.5), cyl(30, 40, 4, 90.5, 2, C.gold))
  for (let k = 0; k < cols * 3; k++) prims.push(cyl(58 + k * 13, 58, 4.5, 50.5, 9, G.silver, 5.5), cyl(58 + k * 13, 58, 4, 59.5, 0.8, G.liquorice))
  return model(cols, 1, prims)
}

/** Card display case: a wooden base under a glass lid (four posts and a rim), a fan of cards inside and a gold lock. */
export function cardDisplayCase(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [box(6, 12, W - 12, 78, 0, 36, C.wood), box(10, 16, W - 20, 70, 36, 3, C.woodDark), onFront(W / 2 - 7, 90, 14, 20, 9, C.gold)]
  const cards = [C.white, C.red, G.cardBlue, C.yellow, C.greenLight]
  const n = cols * 4
  for (let k = 0; k < n; k++) prims.push(box(18 + k * ((W - 52) / n), 30 + (k % 2) * 6, 14, 24, 39, 1.5 + (k % 3) * 0.6, cards[k % cards.length]!, 1))
  for (const x of [10, W - 16]) for (const y of [16, 80]) prims.push(box(x, y, 6, 6, 39, 30, C.skyLight, 2))
  prims.push(box(10, 16, W - 20, 6, 69, 3, C.skyLight, 2), box(10, 80, W - 20, 6, 69, 3, C.skyLight, 2), box(10, 16, 6, 70, 69, 3, C.skyLight, 2), box(W - 16, 16, 6, 70, 69, 3, C.skyLight, 2))
  return model(cols, 1, prims)
}

/** Reading corner: a soft rug with a cushion, an open book and a small lamp. A person can sit here. */
export function readingNook(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  const prims: Prim[] = [box(8, 10, W - 16, H - 20, 0, 3, C.lilac), onTop(16, 18, W - 32, H - 36, 3, C.purple, 0.8)]
  prims.push(box(24, 24, 40, 30, 3.8, 12, C.pink, 2), onTop(30, 30, 28, 18, 15.8, C.red, 0.8))
  prims.push(box(W - 62, H - 52, 20, 26, 3.8, 3, C.white, 1.5), box(W - 40, H - 52, 20, 26, 3.8, 3, C.creamLight, 1.5), onTop(W - 60, H - 46, 16, 1.2, 6.8, C.steelDark, 0.4))
  prims.push(cyl(W - 26, 28, 9, 3.8, 3, C.woodDark), cyl(W - 26, 28, 2.5, 6.8, 30, C.woodDeep), cyl(W - 26, 28, 13, 36, 14, G.bulb, 9))
  return model(cols, rows, prims)
}

/** Yellow plush toy: a round yellow body, a head with two black-tipped ears, red cheeks and a zig-zag tail. */
export function yellowPlush(): SolidModel {
  const Y = '#f2cc3c'
  return model(1, 1, [
    box(70, 56, 8, 8, 14, 8, C.woodDark, 1.5),
    box(74, 56, 8, 8, 22, 12, Y, 1.5),
    box(70, 56, 8, 8, 32, 12, Y, 1.5),
    ball(48, 56, 26, 22, Y),
    ball(48, 52, 56, 19, Y),
    box(32, 48, 7, 5, 66, 22, Y, 1.5),
    box(58, 48, 7, 5, 66, 22, Y, 1.5),
    box(32, 48, 7, 5, 84, 6, C.ink, 1.5),
    box(58, 48, 7, 5, 84, 6, C.ink, 1.5),
    ball(40, 68, 54, 2.8, C.ink),
    ball(56, 68, 54, 2.8, C.ink),
    ball(34, 70, 48, 4, C.red),
    ball(62, 70, 48, 4, C.red),
    ball(48, 70, 48, 1.8, C.ink),
  ])
}
