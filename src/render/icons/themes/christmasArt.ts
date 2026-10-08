import { ball, box, C, cyl, disc, model, onFront, onTop, shiftY, type Prim, type SolidModel } from '../../looks/models.ts'

/**
 * Block models of the Christmas theme (SLAY-18.8), built from the owner-approved draft art of SLAY-18.5 (docs/themes/seasonal/art.tsx) in
 * the A2 look (docs/design/looks.md, "How to draw a new object"): 100 units per cell, x right, y toward the viewer, z up, drawn facing
 * south. Each kind is its own drawing; only the colours below are shared. Registered in christmasIcons.ts.
 *
 * A .ts file, not .tsx: the generator worker reaches the icon sets through the content types and may import no .tsx module
 * (src/ui/lab/worker.test.ts); a block model needs no JSX.
 */
const X = {
  red: '#b83a36',
  redDeep: '#8e2a28',
  fir: '#2f6b45',
  firDark: '#24553a',
  firLight: '#4f8a5e',
  snow: '#f6fafc',
  snowShade: '#dbe7ef',
  ginger: '#b9794a',
  gingerDark: '#8f5530',
  copper: '#b8733e',
  cocoa: '#5a3424',
  hay: '#e3c777',
  hayDark: '#c4a550',
  flame: '#e8743b',
  flameLight: '#f2c04a',
  carrot: '#e8893b',
} as const

/** Christmas tree: a red tub, three green cone tiers hung with baubles and a gold star on top. */
export function christmasTree(): SolidModel {
  return model(1, 1, [
    cyl(50, 54, 17, 0, 14, X.red, 19),
    cyl(50, 54, 19, 14, 3, C.gold),
    cyl(50, 54, 5, 17, 6, C.woodDark),
    cyl(50, 54, 40, 22, 24, C.green, 24),
    cyl(50, 54, 32, 42, 22, C.green, 16),
    cyl(50, 54, 23, 60, 22, C.greenLight, 5),
    ball(50, 54, 87, 7, C.yellow),
    ball(30, 76, 30, 5, X.red),
    ball(62, 84, 32, 5, C.gold),
    ball(78, 62, 34, 5, C.blueDark),
    ball(40, 74, 50, 4.5, C.gold),
    ball(66, 70, 52, 4.5, X.red),
    ball(48, 70, 68, 4, C.blueDark),
    ball(60, 62, 70, 3.5, X.red),
  ])
}

/** Snowy fir tree outside: a trunk on a patch of snow and three dark cone tiers, each with a white cap of snow. No baubles, no star. */
export function firTree(): SolidModel {
  return model(1, 1, [
    cyl(50, 54, 44, 0, 2, X.snow),
    cyl(50, 54, 7, 2, 14, C.woodDark),
    cyl(50, 54, 42, 14, 20, X.firDark, 27),
    cyl(50, 54, 27, 34, 5, X.snow, 21),
    cyl(50, 54, 33, 38, 18, X.fir, 19),
    cyl(50, 54, 19, 56, 5, X.snow, 13),
    cyl(50, 54, 24, 60, 18, X.fir, 8),
    cyl(50, 54, 8, 78, 10, X.snow, 0.5),
  ])
}

/** Wrapped present: a red box with a gold ribbon both ways and a gold bow on top. */
export function present(): SolidModel {
  return model(1, 1, [
    box(18, 22, 64, 60, 0, 40, X.red),
    onFront(45, 82, 10, 0, 40, C.gold),
    box(80.5, 47, 1.5, 10, 0, 40, C.gold, 0),
    onTop(45, 22, 10, 60, 40, C.gold),
    onTop(18, 47, 64, 10, 40, C.gold),
    ball(40, 52, 46, 7, C.gold),
    ball(60, 52, 46, 7, C.gold),
    ball(50, 52, 46, 5, C.goldDark),
  ])
}

/** Snowman: three snowballs on a patch of snow, a black hat, a red scarf, an orange carrot nose pointing south and twig arms. */
export function snowman(): SolidModel {
  return model(1, 1, [
    cyl(50, 56, 36, 0, 2, X.snowShade),
    ball(50, 56, 22, 21, X.snow),
    ball(50, 56, 50, 15, X.snow),
    cyl(50, 56, 12, 59, 5, X.red),
    box(56, 64, 7, 18, 46, 4, X.red, 1.5),
    ball(50, 56, 74, 11, X.snow),
    box(48, 64, 4, 10, 72, 3, X.carrot, 1.5),
    ball(45, 64, 78, 1.8, C.ink),
    ball(55, 64, 78, 1.8, C.ink),
    ball(50, 70, 48, 2.2, C.ink),
    ball(50, 71, 40, 2.2, C.ink),
    cyl(50, 56, 12, 83, 2, C.ink),
    cyl(50, 56, 8, 85, 10, C.ink),
    box(10, 55, 26, 3, 50, 3, C.woodDark, 1.5),
    box(64, 55, 26, 3, 50, 3, C.woodDark, 1.5),
  ])
}

/** Reindeer standing, head to the south: four legs, a brown body, a pale chest, antlers and a shiny red nose. */
export function reindeer(): SolidModel {
  const prims: Prim[] = [
    box(34, 26, 7, 7, 0, 30, C.woodDeep),
    box(59, 26, 7, 7, 0, 30, C.woodDeep),
    box(34, 62, 7, 7, 0, 30, C.woodDeep),
    box(59, 62, 7, 7, 0, 30, C.woodDeep),
    box(32, 22, 36, 52, 30, 22, C.wood),
    ball(50, 22, 46, 4, C.white),
    box(42, 64, 16, 14, 46, 18, C.wood),
    onFront(43, 78, 14, 34, 18, C.cream),
    box(40, 70, 20, 22, 60, 14, C.woodLight),
    ball(50, 93, 66, 4.5, X.red),
    ball(44, 84, 72, 1.8, C.ink),
    ball(56, 84, 72, 1.8, C.ink),
    box(36, 72, 4, 6, 70, 5, C.wood),
    box(60, 72, 4, 6, 70, 5, C.wood),
  ]
  for (const side of [-1, 1]) {
    const x = side < 0 ? 42 : 55
    prims.push(box(x, 74, 3, 3, 74, 16, C.woodDeep), box(side < 0 ? x - 8 : x, 74, 11, 3, 84, 3, C.woodDeep), box(side < 0 ? x - 8 : x + 8, 74, 3, 3, 87, 6, C.woodDeep))
  }
  return model(1, 1, prims)
}

/** Gingerbread house on a white plate: brown walls, a stepped white icing roof with sweets, a chimney, a door and lit windows. */
export function gingerbreadHouse(): SolidModel {
  return model(1, 1, [
    cyl(50, 54, 44, 0, 3, C.white),
    box(22, 32, 56, 46, 3, 30, X.ginger),
    onFront(43, 78, 14, 3, 18, X.gingerDark),
    onFront(42, 78.2, 16, 21, 2, C.white),
    onFront(27, 78, 10, 15, 10, C.yellow),
    onFront(63, 78, 10, 15, 10, C.yellow),
    box(77.5, 44, 1, 10, 15, 10, C.yellow, 0),
    box(18, 28, 64, 54, 33, 5, X.gingerDark),
    box(23, 33, 54, 44, 38, 7, C.white),
    box(29, 39, 42, 32, 45, 7, X.ginger),
    box(34, 44, 32, 22, 52, 6, C.white),
    box(60, 34, 9, 9, 38, 26, X.gingerDark),
    ball(28, 80, 41, 3.5, X.red),
    ball(50, 80, 41, 3.5, C.greenLight),
    ball(72, 80, 41, 3.5, X.red),
    ball(42, 66, 54, 3, C.greenLight),
    ball(58, 66, 54, 3, X.red),
    ball(50, 55, 60, 3.5, C.yellow),
  ])
}

/** Christmas fireplace against the wall: red brick with a dark firebox, flames on a log, a wooden mantel with a garland and three stockings. */
export function stockingFireplace(): SolidModel {
  const prims: Prim[] = [
    box(8, 0, 84, 50, 0, 4, C.stoneDark),
    box(10, 6, 80, 12, 4, 58, X.redDeep),
    box(10, 6, 18, 42, 4, 58, C.redDark),
    box(72, 6, 18, 42, 4, 58, C.redDark),
    box(28, 6, 44, 42, 44, 18, C.redDark),
    box(28, 18, 44, 30, 4, 0.8, C.ink, 0),
    box(34, 30, 32, 8, 4, 6, C.woodDeep),
    ball(44, 34, 16, 7, X.flame),
    ball(56, 34, 18, 8, X.flame),
    ball(50, 36, 22, 6, X.flameLight),
    box(4, 2, 92, 52, 62, 6, C.woodDark),
  ]
  for (let k = 0; k < 7; k++) prims.push(ball(12 + k * 12.6, 12, 71, 4.5, k % 2 ? X.fir : X.firLight))
  for (const x of [16, 31, 52]) prims.push(box(x, 54, 9, 1.5, 40, 22, X.red, 0), box(x - 1, 54.2, 11, 1.5, 56, 6, C.white, 0), box(x + 6, 54, 6, 1.5, 40, 6, X.red, 0))
  prims.push(ball(84, 12, 76, 3, X.red))
  return model(1, 1, shiftY(prims, 26))
}

/** Toymaker's workbench against the wall: a thick wooden top on legs, a pegboard with tools, a vice and a half-built red toy train. */
export function workbench(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [
    box(10, 14, 10, 10, 0, 44, C.woodDeep),
    box(W - 20, 14, 10, 10, 0, 44, C.woodDeep),
    box(10, 74, 10, 10, 0, 44, C.woodDeep),
    box(W - 20, 74, 10, 10, 0, 44, C.woodDeep),
    box(14, 20, W - 28, 60, 12, 4, C.wood),
    box(6, 10, W - 12, 78, 44, 8, C.woodLight),
    box(8, 6, W - 16, 6, 52, 40, C.woodDark),
    onFront(18, 12, 4, 60, 26, C.steelDark),
    onFront(14, 12.2, 12, 80, 6, X.red),
    onFront(34, 12, 18, 64, 20, C.steel),
    onFront(W - 30, 12, 3, 62, 26, C.woodDeep),
    box(14, 60, 18, 16, 52, 12, C.steelDark),
    box(18, 76, 10, 6, 56, 3, C.steel, 1.5),
  ]
  const tx = W / 2 - 20
  prims.push(box(tx, 40, 30, 22, 52, 14, X.red), box(tx + 30, 40, 16, 22, 52, 22, X.red), box(tx + 31, 40, 14, 22, 74, 3, C.ink), cyl(tx + 8, 50, 4, 66, 10, C.ink))
  for (const x of [tx + 8, tx + 22, tx + 38]) prims.push(disc('xz', x, 62.5, 56, 5, C.ink), disc('xz', x, 63, 56, 2, C.gold))
  prims.push(box(W - 40, 30, 20, 14, 52, 8, C.gold), box(W - 38, 52, 14, 14, 52, 10, C.greenLight))
  return model(cols, 1, prims)
}

/** Toy shelf: an open shelf in Christmas red with toys on it (a teddy, coloured blocks, a ball, a toy soldier) and a toy drum on top. */
export function toyShelf(cols: number): SolidModel {
  const W = cols * 100
  const D = 48
  const prims: Prim[] = [
    box(6, 0, W - 12, 5, 0, 70, X.redDeep),
    box(6, 0, 8, D, 0, 70, X.red),
    box(W - 14, 0, 8, D, 0, 70, X.red),
    box(6, 0, W - 12, D, 0, 6, X.red),
    box(6, 0, W - 12, D, 32, 5, X.red),
    box(6, 0, W - 12, D, 64, 6, X.red),
  ]
  for (let c = 0; c < cols; c++) {
    const o = c * 100
    prims.push(
      ball(o + 34, 24, 15, 9, C.woodLight),
      ball(o + 34, 26, 28, 6, C.woodLight),
      ball(o + 29, 24, 33, 2.5, C.woodDark),
      ball(o + 39, 24, 33, 2.5, C.woodDark),
      box(o + 54, 14, 12, 12, 6, 12, C.blueDark),
      box(o + 68, 18, 12, 12, 6, 12, C.yellow),
      box(o + 60, 16, 12, 12, 18, 12, X.red),
      ball(o + 34, 26, 46, 9, C.greenLight),
      cyl(o + 66, 24, 6, 37, 16, X.red),
      cyl(o + 66, 24, 5, 53, 3, C.white),
      cyl(o + 66, 24, 4, 56, 7, C.ink),
    )
  }
  prims.push(cyl(W / 2, 24, 13, 70, 12, C.white), cyl(W / 2, 24, 13, 70, 3, X.red), cyl(W / 2, 24, 13, 79, 3, X.red), box(W / 2 - 14, 22, 28, 3, 83, 2, C.woodDark, 1.5))
  return model(cols, 1, shiftY(prims, 26))
}

/** Hot chocolate counter: a wooden counter with candy-stripe front panels, a copper pot of cocoa and a row of mugs with whipped cream. */
export function cocoaCounter(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [box(6, 14, W - 12, 72, 0, 56, C.woodLight), box(4, 12, W - 8, 76, 56, 6, C.woodDeep)]
  for (let x = 12; x < W - 14; x += 16) prims.push(onFront(x, 86, 8, 8, 42, x % 32 === 12 ? X.red : C.white))
  const potX = 30
  prims.push(cyl(potX, 44, 20, 62, 20, X.copper, 18), cyl(potX, 44, 17, 82, 0.8, X.cocoa), cyl(potX, 44, 21, 80, 3, X.copper), box(potX - 3, 18, 6, 6, 82, 8, C.woodDark))
  for (let x = 62; x <= W - 20; x += 22) {
    prims.push(cyl(x, 64, 7, 62, 12, (x / 22) % 2 < 1 ? X.red : C.white), cyl(x, 64, 6, 74, 0.8, X.cocoa), ball(x, 64, 77, 5, C.white))
  }
  prims.push(box(W - 30, 22, 16, 22, 62, 10, X.ginger), onTop(W - 28, 24, 12, 18, 72, X.gingerDark))
  return model(cols, 1, prims)
}

/** Christmas market stall: a wooden counter with gingerbread hearts and baubles, four posts and a red and white striped awning over the back. */
export function marketStall(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [
    box(8, 40, W - 16, 48, 0, 40, C.wood),
    box(6, 38, W - 12, 52, 40, 5, C.woodDark),
    onFront(14, 88, W - 28, 6, 28, C.woodLight),
    box(8, 8, 6, 6, 0, 86, C.woodDeep),
    box(W - 14, 8, 6, 6, 0, 86, C.woodDeep),
    box(8, 82, 6, 6, 0, 45, C.woodDeep),
    box(W - 14, 82, 6, 6, 0, 45, C.woodDeep),
  ]
  const stripes = Math.round(W / 14)
  const sw = (W - 8) / stripes
  for (let k = 0; k < stripes; k++) prims.push(box(4 + k * sw, 4, sw, 46, 86, 6, k % 2 ? C.white : X.red, k === 0 || k === stripes - 1 ? undefined : 0))
  for (let k = 0; k < stripes; k++) prims.push(onFront(4 + k * sw, 50, sw, 78, 8, k % 2 ? C.white : X.red))
  for (let x = 20; x < W - 20; x += 22) prims.push(box(x, 56, 12, 10, 45, 3, X.ginger, 1.5), onTop(x + 2, 58, 8, 2, 48, C.white))
  for (let x = 28; x < W - 16; x += 26) prims.push(ball(x, 76, 50, 5, (x / 26) % 2 < 1 ? C.gold : X.red))
  return model(cols, 1, prims)
}

/** Poinsettia: a pot in gold foil, green leaves and a star of red bracts with a yellow heart. */
export function poinsettia(): SolidModel {
  const prims: Prim[] = [
    cyl(50, 54, 17, 0, 26, C.gold, 21),
    cyl(50, 54, 20, 26, 2, C.goldDark),
    cyl(50, 54, 19, 28, 0.8, C.soil),
    box(18, 44, 64, 20, 30, 5, X.firLight),
    box(40, 22, 20, 64, 30, 5, X.firLight),
    box(24, 49, 52, 10, 35, 5, X.red),
    box(45, 28, 10, 52, 35, 5, X.red),
    box(30, 32, 14, 14, 36, 5, X.red),
    box(56, 32, 14, 14, 36, 5, X.red),
    box(30, 62, 14, 14, 36, 5, X.red),
    box(56, 62, 14, 14, 36, 5, X.red),
    box(38, 42, 24, 24, 40, 4, X.redDeep),
    ball(46, 52, 46, 2.6, C.yellow),
    ball(54, 52, 46, 2.6, C.yellow),
    ball(50, 58, 46, 2.6, C.yellow),
  ]
  return model(1, 1, prims)
}

/** Holly bush on a patch of snow: dark glossy leaves in a round clump with bunches of red berries. */
export function holly(): SolidModel {
  return model(1, 1, [
    cyl(50, 54, 42, 0, 2, X.snow),
    ball(34, 56, 26, 20, X.firDark),
    ball(66, 54, 28, 20, X.fir),
    ball(50, 66, 24, 20, X.fir),
    ball(50, 46, 44, 18, X.firDark),
    ball(50, 60, 50, 14, X.fir),
    ball(40, 74, 38, 4, X.red),
    ball(46, 78, 34, 4, X.red),
    ball(42, 80, 28, 4, X.red),
    ball(70, 68, 40, 4, X.red),
    ball(76, 64, 34, 4, X.red),
    ball(54, 66, 62, 4, X.red),
    ball(60, 64, 58, 3.5, X.red),
  ])
}

/** Rocking horse facing south: red rockers curling up at both ends, a white body with a red saddle, a dark mane and tail. */
export function rockingHorse(): SolidModel {
  const prims: Prim[] = []
  for (const x of [22, 72]) prims.push(box(x, 12, 6, 76, 0, 5, X.red), box(x, 6, 6, 8, 3, 10, X.red), box(x, 86, 6, 8, 3, 10, X.red))
  prims.push(
    box(22, 28, 56, 5, 5, 4, C.woodDark),
    box(22, 66, 56, 5, 5, 4, C.woodDark),
    box(32, 28, 7, 7, 5, 26, C.cream),
    box(61, 28, 7, 7, 5, 26, C.cream),
    box(32, 64, 7, 7, 5, 26, C.cream),
    box(61, 64, 7, 7, 5, 26, C.cream),
    box(30, 22, 40, 54, 31, 18, C.white),
    box(36, 34, 28, 24, 49, 3, X.red),
    box(42, 70, 16, 12, 44, 22, C.white),
    box(40, 72, 20, 22, 62, 12, C.white),
    box(45, 66, 10, 10, 50, 22, C.woodDeep),
    box(42, 72, 4, 4, 74, 6, C.woodDeep),
    box(54, 72, 4, 4, 74, 6, C.woodDeep),
    ball(44, 94, 68, 1.6, C.ink),
    ball(56, 94, 68, 1.6, C.ink),
    box(46, 14, 8, 10, 34, 18, C.woodDeep),
  )
  return model(1, 1, prims)
}

/** Sheepskin rug: a fluffy cream fleece with an uneven edge, flat on the floor. */
export function furRug(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  const prims: Prim[] = [box(14, 18, W - 28, H - 36, 0, 3, C.creamLight), box(8, 30, W - 16, H - 60, 0, 3, C.creamLight), box(24, 10, W - 48, H - 20, 0, 3, C.creamLight)]
  for (let y = 22; y < H - 18; y += 12) {
    for (let x = 18 + ((y / 12) % 2) * 6; x < W - 16; x += 12) prims.push(ball(x, y, 3, 2.8, (x + y) % 3 ? C.white : C.cream))
  }
  return model(cols, rows, prims)
}

/** Hay bale for the reindeer: a straw block with bands of darker straw and two ropes; on two cells one long bale. */
export function stableHay(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [box(10, 20, W - 20, 62, 0, 34, X.hay)]
  for (let y = 26; y < 78; y += 10) prims.push(onTop(14, y, W - 28, 2, 34, X.hayDark))
  for (let z = 6; z < 32; z += 8) prims.push(onFront(14, 82, W - 28, z, 2, X.hayDark))
  const ropes = cols === 1 ? [46] : [W * 0.3, W * 0.7]
  for (const x of ropes) prims.push(onTop(x - 2, 20, 4, 62, 34.6, C.woodDark), onFront(x - 2, 82.2, 4, 0, 34, C.woodDark))
  prims.push(ball(W - 22, 86, 2, 2.5, X.hay), ball(22, 88, 2, 2.5, X.hay))
  return model(cols, 1, prims)
}

/** Santa's sleigh, one cell wide and two long, front to the south: gold runners curling up at the front, a red body, a cream seat, a tall back and a sack of presents. */
export function sleigh(): SolidModel {
  const prims: Prim[] = []
  for (const x of [14, 80]) {
    prims.push(box(x, 14, 6, 172, 0, 5, C.gold), box(x, 180, 6, 8, 5, 22, C.gold), box(x, 172, 6, 10, 24, 5, C.gold))
    for (const y of [40, 100, 156]) prims.push(box(x, y, 6, 6, 5, 10, C.goldDark))
  }
  prims.push(
    box(16, 20, 68, 154, 15, 26, X.red),
    box(16, 20, 68, 16, 41, 34, X.redDeep),
    onTop(16, 20, 68, 16, 75, C.gold),
    box(22, 36, 56, 44, 41, 10, C.cream),
    box(16, 150, 68, 24, 41, 18, X.red),
    onTop(16, 150, 68, 4, 59, C.gold),
    onFront(24, 174, 52, 22, 12, C.gold),
    ball(50, 112, 56, 18, C.woodLight),
    cyl(50, 112, 6, 72, 6, C.woodDark),
    box(30, 88, 16, 16, 41, 18, C.greenLight),
    box(58, 120, 16, 14, 41, 14, C.blueDark),
    onTop(36, 88, 4, 16, 59, C.gold),
  )
  return model(1, 2, prims)
}
