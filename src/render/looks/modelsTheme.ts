import { ball, box, C, cyl, model, onFront, onTop, type Prim, type SolidModel } from './models.ts'

const T = {
  blue: '#5b8fd6',
  blueDark: '#3f6fb0',
  board: '#33604c',
  boardLight: '#4d7d66',
  water: '#8fd0e6',
} as const

/** Picnic blanket: a flat gingham cloth, red with a white check, tassels at the corners. */
export function picnicBlanket(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  const prims: Prim[] = [box(8, 10, W - 16, H - 20, 0, 2.5, C.red)]
  for (let x = 24; x < W - 20; x += 22) prims.push(onTop(x, 10, 9, H - 20, 2.5, C.white, 0.7))
  for (let y = 26; y < H - 20; y += 22) prims.push(onTop(8, y, W - 16, 9, 3.2, C.white, 0.7))
  for (const [x, y] of [[8, 10], [W - 18, 10], [8, H - 20], [W - 18, H - 20]] as const) prims.push(box(x, y, 10, 10, 0, 3.5, C.cream, 0))
  return model(cols, rows, prims)
}

/** Hammock: two posts and a slung green cloth between them, with a pillow at the head (north). */
export function hammock(): SolidModel {
  return model(1, 2, [
    cyl(50, 14, 6, 0, 74, C.woodDark),
    cyl(50, 186, 6, 0, 74, C.woodDark),
    box(30, 28, 40, 4, 40, 28, C.greenDark, 1.5),
    box(30, 168, 40, 4, 40, 28, C.greenDark, 1.5),
    box(22, 34, 56, 132, 26, 8, C.greenLight),
    box(28, 40, 44, 120, 34, 3, C.green),
    box(30, 40, 40, 22, 37, 7, C.creamLight),
    box(24, 90, 52, 3, 34, 3, C.white, 0),
    box(24, 120, 52, 3, 34, 3, C.white, 0),
  ])
}

/** Sandpit: a wooden frame, sand, a red bucket and a spade. */
export function sandbox(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  return model(cols, rows, [
    box(8, 10, W - 16, H - 20, 0, 16, C.wood),
    box(18, 20, W - 36, H - 40, 10, 6.5, C.sand),
    onTop(26, 30, W - 70, 5, 16.5, C.sandDark, 0.8),
    cyl(W - 44, H - 48, 14, 16, 16, C.red, 11),
    cyl(W - 44, H - 48, 9, 31, 0.8, C.redDark),
    box(30, H - 50, 5, 30, 16, 3, C.woodDark, 1.5),
    box(26, H - 70, 14, 22, 16, 3, C.yellow, 1.5),
  ])
}

/** Gym mat: a blue slab folded in panels, with grab straps at both ends. */
export function gymMat(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  const prims: Prim[] = [box(8, 10, W - 16, H - 20, 0, 6, T.blue), onTop(14, 16, W - 28, H - 32, 6, T.blueDark, 0.6)]
  prims.push(onTop(18, 20, W - 36, H - 40, 6.6, T.blue, 0.4))
  for (let c = 1; c < cols; c++) prims.push(onTop(c * 100 - 1, 12, 2, H - 24, 6.6, T.blueDark, 0.4))
  prims.push(box(W - 24, H / 2 - 12, 14, 24, 0, 10, C.yellow, 2), box(10, H / 2 - 12, 14, 24, 0, 10, C.yellow, 2))
  return model(cols, rows, prims)
}

/** Fountain: a round stone basin with water, a pillar, an upper bowl and a jet. A bigger basin gets a little more height, not twice. */
export function fountain(cols: number, rows: number): SolidModel {
  const cx = (cols * 100) / 2
  const cy = (rows * 100) / 2
  const R = Math.min(cols, rows) * 50 - 8
  const s = R / 42
  const z = cols === 1 ? 1 : 1.1
  return model(cols, rows, [
    cyl(cx, cy, R, 0, 18 * z, C.stone, R - 2),
    cyl(cx, cy, R - 8, 14 * z, 0.8, T.water),
    cyl(cx, cy, R * 0.55, 14.8 * z, 0.8, C.skyLight),
    cyl(cx, cy, 8 * s, 14 * z, 38 * z, C.steel),
    cyl(cx, cy, 20 * Math.sqrt(s) * 1.2, 48 * z, 8 * z, C.stone, 24 * Math.sqrt(s) * 1.2),
    cyl(cx, cy, 16 * Math.sqrt(s) * 1.2, 56 * z, 0.8, T.water),
    cyl(cx, cy, 3 * Math.sqrt(s), 56 * z, 18 * z, C.skyLight),
    ball(cx, cy, 78 * z, 6 * Math.sqrt(s), C.white),
  ])
}

/** Blackboard on legs: a wooden frame, a dark green board with chalk, a chalk tray and two splayed legs. */
export function blackboard(cols: number): SolidModel {
  const W = cols * 100
  return model(cols, 1, [
    box(14, 40, 8, 8, 0, 36, C.woodDark),
    box(W - 22, 40, 8, 8, 0, 36, C.woodDark),
    box(14, 66, 8, 8, 0, 36, C.woodDark),
    box(W - 22, 66, 8, 8, 0, 36, C.woodDark),
    box(10, 52, 6, 6, 30, 6, C.woodDark),
    box(8, 54, W - 16, 6, 34, 58, C.wood),
    onFront(14, 60, W - 28, 42, 46, T.board),
    onFront(22, 60.2, 24, 78, 3, C.white),
    onFront(22, 60.2, 14, 68, 3, C.white),
    onFront(W - 46, 60.2, 20, 76, 3, C.yellow),
    box(8, 60, W - 16, 8, 40, 4, C.woodLight),
    box(18, 61, 14, 4, 44, 3, C.white, 1),
  ])
}

/** Office printer: a grey body, a lid with a paper stack, a screen and buttons on the front, a paper tray. */
export function printer(): SolidModel {
  return model(1, 1, [
    box(10, 22, 80, 66, 0, 34, C.steel),
    box(14, 26, 72, 58, 34, 8, C.white),
    box(24, 14, 52, 10, 40, 14, C.white, 2),
    onFront(14, 88, 28, 12, 18, C.sky),
    onFront(20, 88.2, 16, 16, 3, C.white),
    box(66, 87, 6, 2, 22, 6, C.green, 1),
    box(76, 87, 6, 2, 22, 6, C.red, 1),
    box(24, 82, 52, 16, 6, 3, C.white, 1.5),
    box(26, 86, 48, 3, 9, 8, C.cream, 1),
  ])
}

/** Vending machine: a tall red body with a glass front showing rows of cans, a keypad and a delivery slot. */
export function vendingMachine(): SolidModel {
  const prims: Prim[] = [box(12, 10, 76, 82, 0, 92, C.red), onFront(18, 92, 48, 22, 62, C.skyLight)]
  const colours = [C.yellow, C.greenLight, C.pink, C.sky]
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) prims.push(onFront(21 + c * 11.5, 92.4, 8, 26 + r * 19, 14, colours[(r + c) % 4]!))
  prims.push(
    onFront(71, 92, 12, 60, 28, C.slate),
    onFront(73.5, 92.4, 7, 82, 3, C.greenLight),
    onFront(71, 92, 12, 42, 14, C.steel),
    onFront(18, 92, 64, 10, 8, C.redDark),
    onFront(24, 92.4, 52, 12, 4, C.slate),
  )
  return model(1, 1, prims)
}

/** Clothes rail: two end frames, a rail between them and garments in several colours hanging from it. */
export function clothesRack(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [
    box(8, 40, 8, 20, 0, 6, C.slate),
    box(W - 16, 40, 8, 20, 0, 6, C.slate),
    box(10, 46, 4, 8, 6, 84, C.steelDark),
    box(W - 14, 46, 4, 8, 6, 84, C.steelDark),
    box(10, 47, W - 20, 6, 82, 4, C.steel),
  ]
  const colours = [C.pink, C.sky, C.yellow, C.greenLight, C.lilac, C.red]
  const count = cols * 3
  const step = (W - 40) / count
  for (let i = 0; i < count; i++) prims.push(box(20 + i * step, 42, step - 4, 14, 36 - (i % 2) * 6, 46 + (i % 2) * 6, colours[i % colours.length]!, 2))
  return model(cols, 1, prims)
}

/** Shop mannequin: a round plinth, a pole, a pink torso and a pale head. */
export function mannequin(): SolidModel {
  return model(1, 1, [
    cyl(50, 52, 34, 0, 5, C.stone),
    cyl(50, 52, 4, 5, 22, C.steelDark),
    cyl(50, 52, 22, 24, 38, C.pink, 17),
    cyl(50, 52, 11, 62, 8, C.paper, 5),
    ball(50, 52, 78, 12, C.paper),
  ])
}

/** Checkout counter: a wooden counter with a conveyor belt along it, a till with a screen at the east end and a card reader. */
export function checkoutCounter(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [box(6, 14, W - 12, 74, 0, 52, C.woodLight), box(2, 10, W - 4, 82, 52, 5, C.wood)]
  prims.push(box(14, 22, W - 88, 58, 57, 3, C.slate))
  for (let x = 24; x < W - 80; x += 16) prims.push(onTop(x, 24, 3, 54, 60, C.steel, 0.6))
  prims.push(box(W - 62, 20, 50, 62, 57, 14, C.steel), box(W - 58, 22, 30, 4, 71, 24, C.slate), onFront(W - 56, 26, 26, 76, 16, C.sky), box(W - 56, 52, 24, 18, 71, 3, C.steelDark, 1.5))
  for (let k = 0; k < 3; k++) prims.push(box(W - 54 + k * 9, 58, 5, 5, 74, 1.5, C.white, 0))
  return model(cols, 1, prims)
}
