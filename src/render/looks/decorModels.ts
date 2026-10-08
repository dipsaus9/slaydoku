import { ball, box, C, cyl, disc, model, onFront, onTop, type Prim, type SolidModel } from './models.ts'

/**
 * The decor objects of SLAY-19.1 (lamps, mirrors, a fridge, a piano and so on): block models in the A2 look, drawn facing south like every
 * other model (docs/design/looks.md, "How to draw a new object"). Each one stays inside its footprint and below MAX_Z, and the details that
 * tell it apart at phone size sit on top or are made of blocks, so a turned object still reads. The bathtub lives in modelsHouse.ts.
 */

/** Standing lamp: a round base, a slim post, a glowing yellow rim of light under a cream fabric shade (wider at the bottom) and a small cap on top. */
export function lamp(): SolidModel {
  return model(1, 1, [
    cyl(50, 52, 18, 0, 4, C.slate),
    cyl(50, 52, 3.5, 4, 54, C.steelDark),
    cyl(50, 52, 27, 56, 5, C.yellow, 27, 1.5),
    cyl(50, 52, 27, 61, 24, C.sand, 19),
    cyl(50, 52, 4, 85, 4, C.steelDark),
  ])
}

/** Standing mirror: a tall wooden frame on two feet, pale glass with a sheen on its front and a gold crown on top. From behind it is a board. */
export function mirror(): SolidModel {
  return model(1, 1, [
    box(14, 34, 12, 32, 0, 6, C.woodDark),
    box(74, 34, 12, 32, 0, 6, C.woodDark),
    box(16, 46, 68, 8, 6, 78, C.woodDark),
    onFront(21, 54, 58, 12, 66, C.sky),
    onFront(26, 54.4, 7, 18, 56, C.white),
    box(40, 44, 20, 12, 84, 6, C.gold, 1.5),
  ])
}

/** Coat rack: a post on a round base with hooks, a red and a blue coat hanging from it and a hat on top. */
export function coatRack(): SolidModel {
  return model(1, 1, [
    cyl(50, 50, 16, 0, 4, C.woodDark),
    cyl(50, 50, 4, 4, 86, C.woodDark),
    box(28, 47, 44, 6, 80, 4, C.wood, 1.5),
    box(47, 28, 6, 44, 80, 4, C.wood, 1.5),
    box(26, 40, 16, 20, 40, 40, C.red),
    box(58, 42, 16, 18, 46, 34, C.blueDark),
    ball(50, 50, 90, 6, C.ink),
  ])
}

/** Fridge: a tall white cabinet with a freezer door above a fridge door, a dark gap between them and two vertical steel handles. */
export function fridge(): SolidModel {
  return model(1, 1, [
    box(14, 14, 72, 66, 0, 92, C.white),
    onFront(14, 80, 72, 60, 2.5, C.steelDark),
    onFront(18, 80.2, 64, 66, 22, C.skyLight),
    onFront(18, 80.2, 64, 6, 50, C.skyLight),
    box(70, 79, 5, 3, 66, 18, C.steelDark, 1.5),
    box(70, 79, 5, 3, 22, 30, C.steelDark, 1.5),
  ])
}

/** Fireplace: a stone chimney breast with a wooden mantel and candles, a dark hearth opening with logs and flames, a hearth stone in front. */
export function fireplace(): SolidModel {
  return model(2, 1, [
    box(40, 62, 120, 30, 0, 4, C.stoneDark),
    // The breast is split at the mantel, so the mantel (wider) is painted between its lower and upper part.
    box(10, 8, 180, 46, 0, 60, C.stone),
    box(4, 4, 192, 56, 60, 6, C.woodDark),
    box(10, 8, 180, 46, 66, 22, C.stone),
    box(70, 12, 60, 38, 88, 8, C.stoneDark),
    cyl(30, 57, 4, 66, 14, C.creamLight),
    cyl(170, 57, 4, 66, 14, C.creamLight),
    ball(30, 57, 82, 3, C.yellow),
    ball(170, 57, 82, 3, C.yellow),
    box(50, 54, 100, 10, 6, 48, C.ink),
    box(66, 58, 68, 6, 6, 8, C.woodDeep, 1.5),
    ball(84, 61, 22, 10, C.yellow),
    ball(100, 61, 27, 12, C.red),
    ball(116, 61, 21, 9, C.yellow),
  ])
}

/** Upright piano: a dark lacquered body, a keyboard shelf with white and black keys, a music stand and three gold pedals. */
export function piano(): SolidModel {
  const prims: Prim[] = [
    box(8, 10, 184, 50, 0, 90, C.slate),
    box(14, 60, 172, 22, 50, 8, C.slate),
    onTop(18, 62, 164, 17, 58, C.white),
    box(70, 58, 60, 2, 78, 12, C.steelDark, 1.5),
    box(76, 84, 8, 8, 0, 4, C.gold, 1.5),
    box(96, 84, 8, 8, 0, 4, C.gold, 1.5),
    box(116, 84, 8, 8, 0, 4, C.gold, 1.5),
  ]
  for (let k = 0; k < 11; k++) {
    if (k % 7 === 2 || k % 7 === 6) continue
    prims.push(box(26 + k * 14, 62, 6, 9, 58.8, 1.4, C.ink, 0))
  }
  return model(2, 1, prims)
}

/** Aquarium: a tank of saturated water on a wooden stand, fish and plants seen through the front glass, gravel below and a light surface. */
export function aquarium(): SolidModel {
  const y0 = 30
  const d = 46
  const front = y0 + d
  return model(2, 1, [
    box(14, y0 + 2, 172, d - 4, 0, 40, C.woodDark),
    box(10, y0 - 2, 180, d + 4, 40, 4, C.ink),
    box(12, y0, 176, d, 44, 42, C.water),
    onTop(14, y0 + 2, 172, d - 4, 86, C.waterLight),
    // Four thin rim bars instead of a lid, so the light water surface stays the top face.
    box(10, y0 - 2, 180, 3, 86, 3, C.ink, 1),
    box(10, front - 1, 180, 3, 86, 3, C.ink, 1),
    box(10, y0 - 2, 3, d + 4, 86, 3, C.ink, 1),
    box(187, y0 - 2, 3, d + 4, 86, 3, C.ink, 1),
    onFront(12, front, 176, 44, 6, C.sand),
    onFront(140, front + 0.2, 7, 50, 30, C.greenDark),
    onFront(152, front + 0.2, 5, 50, 22, C.green),
    onFront(30, front + 0.2, 6, 50, 20, C.greenDark),
    disc('xz', 64, front + 0.6, 66, 7, C.gold),
    disc('xz', 55, front + 0.6, 66, 3.5, C.gold),
    disc('xz', 106, front + 0.6, 58, 6, C.red),
    disc('xz', 113, front + 0.6, 58, 3, C.red),
  ])
}

/** Exercise bike, saddle on the north side: two feet, a red frame, a flywheel in front with a tall post and a T-shaped handlebar, a saddle behind. */
export function exerciseBike(): SolidModel {
  return model(1, 2, [
    box(20, 20, 60, 10, 0, 6, C.slate),
    box(20, 170, 60, 10, 0, 6, C.slate),
    box(44, 25, 12, 150, 6, 8, C.slate),
    box(40, 60, 20, 96, 14, 14, C.red),
    disc('xz', 50, 156, 32, 24, C.ink),
    disc('xz', 50, 156.4, 32, 8, C.steelDark),
    disc('yz', 60, 110, 30, 10, C.steelDark, 3),
    box(46, 140, 8, 8, 28, 48, C.steelDark),
    box(12, 138, 76, 8, 76, 6, C.ink),
    box(46, 56, 8, 8, 28, 36, C.steelDark),
    box(32, 44, 36, 28, 64, 8, C.ink),
  ])
}

/** Bin: a grey bucket, wider at the top, with a darker swing lid and a knob. */
export function bin(): SolidModel {
  return model(1, 1, [
    cyl(50, 54, 19, 0, 46, C.steelDark, 24),
    cyl(50, 54, 26, 46, 4, C.slate),
    cyl(50, 54, 22, 50, 10, C.slate, 18),
    ball(50, 54, 64, 5, C.slate),
  ])
}

/** Water cooler: a white cabinet with a blue and a red tap, a light-blue water bottle upside down on top. */
export function waterCooler(): SolidModel {
  return model(1, 1, [
    box(26, 26, 48, 48, 0, 50, C.white),
    box(38, 74, 7, 4, 36, 7, C.blue, 1.5),
    box(55, 74, 7, 4, 36, 7, C.red, 1.5),
    cyl(50, 50, 18, 50, 30, C.waterLight),
    cyl(50, 50, 9, 80, 10, C.waterLight),
  ])
}

/** Server racks, one dark cabinet per cell: rows of server faces with green and red lights on the front and a vent grille on top. */
export function serverRack(cols: number): SolidModel {
  const prims: Prim[] = []
  for (let i = 0; i < cols; i++) {
    const x = i * 100
    prims.push(box(x + 12, 18, 76, 64, 0, 94, C.slate))
    for (let k = 0; k < 6; k++) {
      prims.push(onFront(x + 18, 82, 64, 8 + k * 14, 9, C.steelDark))
      prims.push(box(x + 22, 82.2, 6, 1, 11 + k * 14, 3.5, k % 2 ? C.red : C.green, 0))
      prims.push(box(x + 31, 82.2, 6, 1, 11 + k * 14, 3.5, C.green, 0))
      prims.push(box(x + 40, 82.2, 6, 1, 11 + k * 14, 3.5, k % 3 ? C.green : C.yellow, 0))
    }
    for (let s = 0; s < 4; s++) prims.push(onTop(x + 20, 26 + s * 12, 60, 4, 94, C.steelDark))
  }
  return model(cols, 1, prims)
}

/** Globe: a blue ball with green continents on a gold post and a round wooden base. */
export function globe(): SolidModel {
  return model(1, 1, [
    cyl(50, 52, 16, 0, 4, C.woodDark),
    cyl(50, 52, 4, 4, 32, C.gold),
    ball(50, 52, 60, 24, C.blue),
    ball(44, 60, 66, 10, C.green),
    ball(60, 62, 52, 7, C.greenLight),
    ball(40, 56, 48, 5, C.green),
    cyl(50, 52, 5, 84, 4, C.gold),
  ])
}

/** Vaulting box: a stack of four wooden sections, each narrower than the one below, with a leather pad on top. */
export function gymBox(): SolidModel {
  const prims: Prim[] = []
  for (let k = 0; k < 4; k++) prims.push(box(14 + k * 4, 14 + k * 4, 72 - 8 * k, 72 - 8 * k, k * 14, 14, k % 2 ? C.woodLight : C.wood))
  prims.push(box(28, 28, 44, 44, 56, 8, C.terraDark))
  return model(1, 1, prims)
}

/** Slide: a blue ladder up to a railed platform on the west, a yellow chute stepping down to the east. */
export function playEquipment(): SolidModel {
  const prims: Prim[] = [
    box(22, 36, 6, 6, 0, 58, C.blueDark),
    box(22, 58, 6, 6, 0, 58, C.blueDark),
    box(28, 30, 40, 40, 52, 6, C.blueDark),
    box(28, 28, 40, 4, 58, 20, C.red),
    box(28, 68, 40, 4, 58, 20, C.red),
    box(26, 28, 4, 44, 58, 20, C.red),
  ]
  for (let k = 1; k <= 4; k++) prims.push(box(22, 42, 6, 16, k * 11, 4, C.blueDark, 1.5))
  for (let k = 0; k < 10; k++) {
    const x = 68 + k * 12
    const z = 45 - k * 5
    prims.push(box(x, 36, 13, 28, z, 7, C.yellow), box(x, 34, 13, 3, z + 7, 5, C.red, 1), box(x, 63, 13, 3, z + 7, 5, C.red, 1))
  }
  return model(2, 1, prims)
}

/** Kettle barbecue: three thin legs, a black bowl wider at the top, a grate with sausages on it. */
export function barbecue(): SolidModel {
  return model(1, 1, [
    cyl(36, 66, 3, 0, 44, C.ink),
    cyl(64, 66, 3, 0, 44, C.ink),
    cyl(50, 36, 3, 0, 44, C.ink),
    cyl(50, 52, 16, 40, 20, C.ink, 27),
    cyl(50, 52, 27, 60, 1.5, C.steelDark),
    box(36, 46, 22, 6, 61.5, 5, C.terracotta, 1),
    box(42, 56, 22, 6, 61.5, 5, C.red, 1),
    ball(70, 60, 64, 5, C.yellowLight),
  ])
}

/**
 * Party tent: four poles under a red-and-white striped canopy with a peaked top and a pennant. (A cone or a ridge of canvas does not work in
 * this view: a 2x2 base of 200 units rises only 67 on screen, so it read as a floor disc or a stack of stripes.)
 */
export function tent(): SolidModel {
  const prims: Prim[] = []
  for (const x of [14, 186]) for (const y of [14, 186]) prims.push(cyl(x, y, 4, 0, 70, C.steelDark))
  prims.push(box(6, 6, 188, 188, 70, 8, C.white))
  for (let k = 0; k < 8; k += 2) prims.push(onTop(10 + k * 22.5, 10, 22.5, 180, 78, C.red))
  prims.push(box(56, 56, 88, 88, 78, 10, C.white))
  for (let k = 0; k < 4; k += 2) prims.push(onTop(60 + k * 20, 60, 20, 80, 88, C.red))
  prims.push(box(99, 99, 2, 2, 88, 5, C.ink, 0), box(101, 99, 12, 1.5, 90, 5, C.red, 0))
  return model(2, 2, prims)
}

/** Shopping cart: four small wheels, a steel wire basket with groceries showing over the rim and a red handle on the front. */
export function shoppingCart(): SolidModel {
  const prims: Prim[] = [
    disc('yz', 22, 32, 8, 8, C.ink),
    disc('yz', 78, 32, 8, 8, C.ink),
    disc('yz', 22, 72, 8, 8, C.ink),
    disc('yz', 78, 72, 8, 8, C.ink),
    box(18, 22, 64, 56, 16, 4, C.steelDark),
    box(22, 26, 56, 52, 20, 34, C.steel),
    box(20, 24, 60, 56, 54, 3, C.steelDark, 1.5),
    box(18, 80, 4, 4, 24, 36, C.steelDark, 1.5),
    box(78, 80, 4, 4, 24, 36, C.steelDark, 1.5),
    box(16, 79, 68, 5, 60, 5, C.red, 1.5),
    ball(40, 50, 58, 7, C.red),
    ball(58, 46, 58, 7, C.green),
  ]
  for (const x of [32, 44, 56, 68]) prims.push(onFront(x, 78.2, 2, 22, 32, C.steelDark, 0.5))
  return model(1, 1, prims)
}

/** Self-checkout kiosk: a steel column with a dark upright screen on top, a payment pad in front and a bagging shelf on the side. */
export function kiosk(): SolidModel {
  return model(1, 1, [
    box(28, 30, 44, 44, 0, 68, C.steel),
    box(26, 40, 48, 8, 68, 26, C.ink),
    onFront(30, 48, 40, 72, 18, C.tealLight),
    onFront(34, 48.4, 16, 80, 6, C.skyLight),
    box(58, 74, 12, 8, 56, 8, C.ink, 1.5),
    box(72, 40, 18, 30, 44, 4, C.steelDark),
    onTop(74, 42, 14, 26, 48, C.sand),
  ])
}
