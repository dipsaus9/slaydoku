import { ball, box, C, cyl, legs, model, onFront, onTop, shiftY, type Prim, type SolidModel } from './models.ts'

/** Armchair: four legs, a cushioned seat and a high back on the north side. */
export function chair(): SolidModel {
  return model(1, 1, [
    ...legs(100, 100, 30),
    box(14, 22, 72, 64, 30, 10, C.cream),
    box(18, 26, 56, 56, 40, 6, C.creamLight),
    box(10, 8, 80, 13, 34, 44, C.cream),
    box(10, 22, 12, 56, 40, 14, C.creamDark),
    box(78, 22, 12, 56, 40, 14, C.creamDark),
  ])
}

/** A rug is a flat textile: a coloured border, a lighter field, a medallion and fringe at the short ends. Nothing under it, nothing above 3. */
export function rug(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  const prims: Prim[] = [box(8, 14, W - 16, H - 28, 0, 3, C.rug), onTop(20, 26, W - 40, H - 52, 3, C.rugLight), onTop(28, 34, W - 56, H - 68, 3.8, C.rug, 0.6)]
  prims.push(onTop(W / 2 - 18, H / 2 - 12, 36, 24, 4.4, C.cream, 0.8))
  for (let x = 14; x < W - 16; x += 9) prims.push(box(x, 6, 4, 8, 0, 1.6, C.cream, 0), box(x, H - 14, 4, 8, 0, 1.6, C.cream, 0))
  return model(cols, rows, prims)
}

/** Head (headboard and pillows) on the north side. */
export function bed(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  const prims: Prim[] = [box(6, 4, W - 12, H - 8, 0, 16, C.woodDark), box(12, 10, W - 24, H - 20, 16, 14, C.white)]
  const blanketTop = 10 + (H - 20) * 0.36
  prims.push(box(12, blanketTop, W - 24, H - 10 - blanketTop, 30, 5, C.blue))
  const pw = (W - 24) / cols
  for (let i = 0; i < cols; i++) prims.push(box(12 + i * pw + 6, 16, pw - 12, 34, 30, 9, C.creamLight))
  prims.push(box(6, 4, W - 12, 10, 16, 44, C.wood))
  return model(cols, rows, prims)
}

/** Back on the north side, an arm at each end, one seat cushion per cell. */
export function sofa(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [...legs(W, 100, 8), box(6, 10, W - 12, 84, 8, 22, C.teal)]
  const seat = (W - 64) / cols
  for (let i = 0; i < cols; i++) prims.push(box(32 + i * seat + 1, 38, seat - 2, 54, 30, 10, C.tealLight))
  prims.push(box(6, 10, W - 12, 26, 30, 34, C.tealDark), box(6, 36, 26, 58, 30, 16, C.tealDark), box(W - 32, 36, 26, 58, 30, 16, C.tealDark))
  return model(cols, 1, prims)
}

/** Corner sofa: a row of `arm` cells on the north and a column of `arm` on the west, backs on both outer sides, an arm at each end. */
export function sofaL(arm: number): SolidModel {
  const S = arm * 100
  const prims: Prim[] = [
    box(10, 10, 11, 11, 0, 8, C.woodDeep),
    box(S - 21, 10, 11, 11, 0, 8, C.woodDeep),
    box(S - 21, 83, 11, 11, 0, 8, C.woodDeep),
    box(10, S - 21, 11, 11, 0, 8, C.woodDeep),
    box(83, S - 21, 11, 11, 0, 8, C.woodDeep),
    box(6, 10, S - 12, 84, 8, 22, C.teal),
    box(6, 94, 88, S - 100, 8, 22, C.teal),
  ]
  const sw = (S - 64) / arm
  for (let i = 0; i < arm; i++) prims.push(box(32 + i * sw + 1, 38, sw - 2, 54, 30, 10, C.tealLight))
  const sh = (S - 32 - 94) / (arm - 1)
  for (let j = 0; j < arm - 1; j++) prims.push(box(32, 94 + j * sh + 1, 56, sh - 2, 30, 10, C.tealLight))
  prims.push(box(6, 10, S - 12, 26, 30, 34, C.tealDark), box(6, 36, 26, S - 42, 30, 34, C.tealDark), box(S - 32, 36, 26, 58, 30, 16, C.tealDark), box(32, S - 32, 56, 26, 30, 16, C.tealDark))
  return model(arm, arm, prims)
}

/** A wooden table: four legs, an apron and a thick gold-wood top with an inlay. It stands on legs, a rug does not. */
export function table(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  return model(cols, rows, [
    ...legs(W, H, 40),
    box(14, 16, W - 28, H - 32, 34, 6, C.woodDark),
    box(8, 10, W - 16, H - 20, 40, 10, C.yellow),
    onTop(20, 22, W - 40, H - 44, 50, C.yellowLight, 1.4),
    onTop(W / 2 - 12, H / 2 - 10, 24, 20, 51.4, C.gold, 0.8),
  ])
}

/** Dining table: a pale top on sturdy legs with a raised edge, plank lines, a fruit bowl and a plate or two. */
export function diningTable(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  const prims: Prim[] = [...legs(W, H, 46, C.woodDark, 13, 8), box(6, 8, W - 12, H - 16, 46, 8, C.woodLight), box(14, 16, W - 28, H - 32, 54, 1.5, C.creamLight)]
  for (let y = 28; y < H - 20; y += 20) prims.push(onTop(18, y, W - 36, 1.5, 55.5, C.creamDark, 0.6))
  prims.push(cyl(W / 2, H / 2, 16, 55.5, 8, C.terracotta, 20), ball(W / 2 - 6, H / 2 - 2, 66, 6, C.red), ball(W / 2 + 6, H / 2 + 2, 66, 6, C.greenLight), ball(W / 2, H / 2 - 7, 67, 5.5, C.yellow))
  if (cols >= 2) prims.push(cyl(W / 2 - 40, H / 2, 9, 55.5, 1.4, C.white), cyl(W / 2 + 40, H / 2, 9, 55.5, 1.4, C.white))
  return model(cols, rows, prims)
}

/** Flat-screen television on a stand: the screen faces south, so a turned set shows its back. */
export function tv(): SolidModel {
  return model(1, 1, [
    box(20, 30, 60, 40, 0, 6, C.slate),
    box(44, 44, 12, 12, 6, 12, C.slate),
    box(8, 40, 84, 10, 18, 56, C.ink),
    onFront(12, 50, 76, 22, 48, C.tealLight),
    onFront(16, 50.2, 28, 56, 8, C.skyLight),
    onFront(70, 50.2, 4, 24, 3, C.green),
    onTop(30, 41, 40, 2, 74.2, C.slate),
  ])
}

/** Bookcase: a back, two sides, four boards and a row of books per shelf, with books and a plant on top; shallow like the real thing, centred in its cell. */
export function bookshelf(cols: number): SolidModel {
  const W = cols * 100
  const D = 52
  const prims: Prim[] = [box(6, 0, W - 12, 5, 0, 74, C.woodDeep), box(6, 0, 8, D, 0, 74, C.wood), box(W - 14, 0, 8, D, 0, 74, C.wood)]
  for (let s = 0; s < 4; s++) prims.push(box(6, 0, W - 12, D, s === 3 ? 68 : s * 23, 6, C.wood))
  const books = Math.floor((W - 32) / 13.5)
  const colors = [C.red, C.cream, C.green, C.gold, C.purple, C.sky, C.pink]
  for (let s = 0; s < 3; s++) {
    for (let k = 0; k < books; k++) prims.push(box(16 + k * 13.5, 8, 12, D - 12, 6 + s * 23, 10 + ((k * 2 + s) % 4) * 2.2, colors[(k + s * 3) % 7]!))
  }
  // Things on top show from every side, so a shelf turned away from the viewer still reads as a bookshelf.
  prims.push(box(12, 14, 8, 20, 74, 12, C.red, 1.5), box(21, 14, 7, 20, 74, 15, C.sky, 1.5), box(29, 14, 8, 20, 74, 10, C.gold, 1.5), cyl(W - 24, 26, 7, 74, 8, C.terracotta, 8), ball(W - 24, 26, 86, 8, C.green))
  return model(cols, 1, shiftY(prims, 24))
}

/** Treasure chest: a wooden body, a domed lid, two iron bands over body and lid and a gold lock on the front. */
export function chest(): SolidModel {
  return model(1, 1, [
    box(10, 22, 80, 62, 0, 34, C.wood),
    box(10, 22, 80, 62, 34, 10, C.woodDark),
    box(15, 27, 70, 52, 44, 6, C.woodDark),
    onFront(24, 84, 9, 0, 44, C.steelDark),
    onFront(67, 84, 9, 0, 44, C.steelDark),
    onTop(24, 27, 9, 52, 50, C.steelDark),
    onTop(67, 27, 9, 52, 50, C.steelDark),
    onFront(41, 84, 18, 26, 20, C.gold),
    onFront(47, 84.8, 6, 31, 9, C.ink),
  ])
}

/** Sideboard: one door per cell with a knob, a top slab and short legs. */
export function cabinet(cols: number): SolidModel {
  const W = cols * 100
  const D = 56
  const prims: Prim[] = [...legs(W, D, 10, C.woodDark, 10, 6), box(6, 4, W - 12, D - 8, 10, 52, C.woodLight), box(2, 0, W - 4, D, 62, 6, C.cream)]
  for (let i = 0; i < cols; i++) {
    prims.push(onFront(i * 100 + 14, D - 4, 72, 16, 40, C.cream), onFront(i * 100 + 20, D - 3.2, 60, 22, 28, C.creamLight), box(i * 100 + 74, D - 5, 6, 3, 38, 8, C.gold, 1.5))
  }
  return model(cols, 1, shiftY(prims, 22))
}

/** Wardrobe: a tall body with a crown on top, a pair of doors per cell with knobs, and feet. */
export function wardrobe(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const D = rows === 1 ? 64 : rows * 100 - 24
  const prims: Prim[] = [box(8, 4, W - 16, D - 8, 4, 86, C.wood), box(4, 0, W - 8, D, 90, 6, C.woodDark), box(10, D - 10, 12, 8, 0, 4, C.woodDeep), box(W - 22, D - 10, 12, 8, 0, 4, C.woodDeep)]
  for (let i = 0; i < cols; i++) {
    prims.push(onFront(i * 100 + 14, D - 4, 34, 14, 70, C.woodLight), onFront(i * 100 + 52, D - 4, 34, 14, 70, C.woodLight), box(i * 100 + 42, D - 5, 3, 3, 46, 12, C.gold, 1.2), box(i * 100 + 55, D - 5, 3, 3, 46, 12, C.gold, 1.2))
  }
  return model(cols, rows, shiftY(prims, (rows * 100 - D) / 2))
}

/** Desk: a top on a drawer pedestal and a side panel, with a monitor, a keyboard, a mouse and a mug. */
export function desk(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [
    box(8, 18, 40, 72, 0, 50, C.wood),
    onFront(12, 90, 32, 6, 14, C.woodLight),
    onFront(12, 90, 32, 24, 14, C.woodLight),
    onFront(12, 90, 32, 42, 4, C.woodLight),
    box(W - 18, 18, 10, 72, 0, 50, C.wood),
    box(4, 12, W - 8, 84, 50, 6, C.woodDark),
  ]
  const mx = W * 0.5
  prims.push(
    box(mx - 8, 26, 16, 10, 56, 8, C.slate),
    box(mx - 28, 24, 56, 6, 62, 30, C.ink),
    onFront(mx - 25, 30, 50, 66, 24, C.tealLight),
    box(mx - 22, 58, 44, 16, 56, 2.5, C.white, 2),
    box(mx + 28, 62, 8, 12, 56, 3, C.white, 2),
    cyl(W - 40, 40, 6, 56, 9, C.red),
  )
  return model(cols, 1, prims)
}

/** A framed picture lying on the floor like a mosaic: a gold frame, a canvas with a sky, a sun, hills and a cloud. Flat, a person can stand on it. */
export function framedPainting(): SolidModel {
  return model(1, 1, [
    box(8, 8, 84, 84, 0, 4, C.gold),
    box(14, 14, 72, 72, 4, 0.8, C.woodDark, 0),
    onTop(17, 17, 66, 66, 4.8, C.sky, 0.6),
    onTop(54, 24, 18, 18, 5.4, C.yellow, 0.6),
    onTop(17, 56, 66, 27, 5.4, C.greenLight, 0.6),
    onTop(17, 66, 44, 17, 6, C.green, 0.6),
    onTop(26, 28, 22, 8, 6, C.white, 0.6),
  ])
}
