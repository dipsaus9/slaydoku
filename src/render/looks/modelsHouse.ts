import { ball, box, C, cyl, disc, model, onFront, onTop, shiftY, type Prim, type SolidModel } from './models.ts'

/** The body both laundry machines share: a boxy cabinet 70 deep, a control strip along the top front and a big porthole in the middle of the front. */
function laundryBody(body: string, strip: string, rim: string, glass: string): Prim[] {
  return [
    box(10, 0, 80, 70, 0, 4, C.slate),
    box(10, 0, 80, 70, 4, 76, body),
    box(10, 52, 80, 18, 78, 6, strip),
    onFront(14, 70, 72, 62, 14, strip),
    disc('xz', 50, 70.8, 36, 27, rim),
    disc('xz', 50, 71.6, 36, 22, C.steelDark),
    disc('xz', 50, 72.4, 36, 18, glass),
  ]
}

/** Washing machine: a cool white body, a blue porthole, a dial and a detergent drawer. */
export function washingMachine(): SolidModel {
  return model(1, 1, shiftY([
    ...laundryBody(C.skyLight, C.steel, C.white, C.blue),
    disc('xz', 78, 71.6, 70, 5, C.steelDark),
    onFront(18, 71.6, 22, 66, 5, C.white),
    disc('xz', 44, 74, 40, 7, C.white),
  ], 15))
}

/** Dryer: a warm cream body, an amber porthole, vent slats under it, two dials and a lint trap on top. */
export function dryer(): SolidModel {
  return model(1, 1, shiftY([
    ...laundryBody(C.cream, C.gold, C.creamLight, C.yellow),
    onFront(34, 71.6, 32, 8, 2.5, C.goldDark),
    onFront(34, 71.6, 32, 4, 2.5, C.goldDark),
    disc('xz', 20, 71.6, 70, 5, C.goldDark),
    disc('xz', 36, 71.6, 70, 5, C.goldDark),
    disc('xz', 44, 74, 40, 7, C.creamLight),
    box(60, 14, 22, 12, 84, 3, C.goldDark, 1.5),
  ], 15))
}

/** Staircase: `rows` is the run. Treads rise toward the north, each one a block, with a side rail and posts. */
export function stairs(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  const steps = rows * 3
  const run = (H - 16) / steps
  const prims: Prim[] = []
  for (let i = 0; i < steps; i++) {
    const y = H - 8 - (i + 1) * run
    const top = 8 + ((i + 1) * 50) / steps
    prims.push(box(8, y, W - 16, run, 0, top, i % 2 === 0 ? C.creamLight : C.cream))
  }
  prims.push(box(8, 8, 8, H - 16, 0, 66, C.woodDark), box(W - 16, 8, 8, H - 16, 0, 66, C.woodDark))
  return model(cols, rows, prims)
}

/** Toilet: a cistern on the north side with a flush button, a pedestal, a bowl, a seat and a lid. */
export function toilet(): SolidModel {
  return model(1, 1, [
    box(22, 8, 56, 24, 8, 62, C.white),
    box(18, 6, 64, 8, 70, 4, C.stone),
    cyl(50, 10, 5, 74, 3, C.steelDark),
    cyl(50, 56, 20, 0, 34, C.white, 24),
    cyl(50, 58, 31, 30, 14, C.white),
    cyl(50, 58, 25, 44, 2.5, C.creamLight),
    cyl(50, 60, 19, 46.5, 0.8, C.blue),
  ])
}

/** Washbasin: a vanity unit with doors, a white top, a round basin and a tap on the north side. */
export function sink(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [box(10, 24, W - 20, 66, 0, 58, C.wood), box(6, 20, W - 12, 74, 58, 8, C.white)]
  for (let i = 0; i < cols; i++) {
    const cx = i * 100 + 50
    prims.push(
      onFront(i * 100 + 18, 90, 64, 8, 42, C.woodLight),
      box(i * 100 + 74, 89, 6, 3, 36, 8, C.gold, 1.5),
      cyl(cx, 58, 22, 66, 0.8, C.stoneDark),
      cyl(cx, 58, 17, 66.8, 0.8, C.blue),
      cyl(cx, 32, 4, 66, 22, C.steelDark),
      box(cx - 3, 32, 6, 22, 82, 5, C.steel),
    )
  }
  return model(cols, 1, prims)
}

/** Shower: a tray with a drain, tiled half-walls on the north and west sides, a pole and a big shower head. */
export function shower(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  return model(cols, rows, [
    box(6, 6, W - 12, H - 12, 0, 5, C.white),
    box(6, 6, W - 12, 8, 5, 62, C.sky),
    box(6, 14, 8, H - 20, 5, 62, C.sky),
    cyl(W / 2 + 6, H / 2 + 6, 11, 5, 0.8, C.steelDark),
    onTop(W / 2 - 3, H / 2 + 4, 18, 1.5, 5.8, C.steel, 0.5),
    box(26, 24, 6, 6, 5, 80, C.steelDark),
    box(26, 24, 30, 6, 82, 5, C.steelDark),
    cyl(50, 27, 12, 78, 4, C.ink, 15),
    cyl(50, 27, 9, 74, 4, C.steel),
  ])
}

/** Kitchen counter: base cabinets with doors under a stone worktop. One cell is a hob, wider ones a hob per cell, and three cells end in a sink. */
export function kitchenCounter(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  const prims: Prim[] = [box(6, 14, W - 12, H - 22, 0, 58, C.cream), box(2, 10, W - 4, H - 14, 58, 6, C.stone)]
  for (let i = 0; i < cols; i++) {
    const cx = i * 100 + 50
    prims.push(onFront(i * 100 + 14, H - 8, 72, 8, 40, C.white), box(i * 100 + 76, H - 9, 6, 3, 36, 6, C.steelDark, 1.5))
    if (cols === 3 && i === 2) {
      prims.push(box(cx - 34, 30, 68, H - 56, 63, 0.8, C.steel), box(cx - 28, 36, 56, H - 68, 63.8, 0.8, C.blue), cyl(cx, 28, 3.5, 64, 16, C.steelDark), box(cx - 3, 28, 6, 14, 80, 4, C.steel))
    } else if (cols === 1) {
      for (const [x, y] of [[32, 38], [68, 38], [32, 72], [68, 72]] as const) prims.push(cyl(x, y, 13, 64, 1.6, C.slate), cyl(x, y, 6, 65.6, 0.8, C.steelDark))
    } else {
      prims.push(cyl(cx, H / 2 + 6, 24, 64, 1.6, C.slate), cyl(cx, H / 2 + 6, 15, 65.6, 0.8, C.steelDark), cyl(cx, H / 2 + 6, 6, 66.4, 0.8, C.slate))
    }
  }
  return model(cols, rows, prims)
}

/** Bicycle, side on along the width: two big wheels, a frame, a saddle, handlebars and pedals. The wheels stand on both faces so a turned bike still shows them. */
export function bicycle(): SolidModel {
  const prims: Prim[] = []
  for (const cx of [38, 162]) {
    prims.push(disc('xz', cx, 50, 34, 32, C.ink, 6))
    prims.push(cyl(cx, 50, 4, 30, 8, C.steelDark))
  }
  prims.push(
    box(36, 46, 66, 8, 32, 5, C.red),
    box(60, 46, 6, 8, 34, 38, C.red),
    box(98, 46, 6, 8, 32, 36, C.red),
    box(100, 46, 62, 8, 32, 4, C.red),
    box(96, 46, 8, 8, 64, 6, C.red),
    box(150, 46, 6, 8, 36, 32, C.red),
    box(54, 43, 28, 14, 70, 6, C.ink, 2),
    box(140, 36, 28, 28, 70, 5, C.steelDark, 2),
    box(92, 62, 16, 8, 24, 4, C.ink, 1.5),
  )
  return model(2, 1, prims)
}

/**
 * A bathtub: not an object kind of the app yet (no bath kind), only a model for the day one arrives. The water must read as water, so the tub is
 * hollow: four walls around a basin, the water a saturated blue block that stands lower than the rim (the inner wall shows above it), with a
 * light surface sheen and foam bubbles on top.
 */
export function bathtub(cols = 2, rows = 1): SolidModel {
  const W = cols * 100
  const H = rows * 100
  const wall = 14
  const rim = 36
  return model(cols, rows, [
    box(6, 8, W - 12, H - 16, 0, 6, C.white),
    box(6, 8, W - 12, wall, 0, rim, C.white),
    box(6, H - 8 - wall, W - 12, wall, 0, rim, C.white),
    box(6, 8, wall, H - 16, 0, rim, C.white),
    box(W - 6 - wall, 8, wall, H - 16, 0, rim, C.white),
    box(6 + wall, 8 + wall, W - 12 - 2 * wall, H - 16 - 2 * wall, 6, 20, C.water),
    box(6 + wall + 8, 8 + wall + 8, W - 12 - 2 * wall - 16, 7, 26, 0.8, C.waterLight, 0),
    box(6 + wall + 24, 8 + wall + 26, 30, 4, 26, 0.8, C.waterLight, 0),
    ball(W * 0.4, H * 0.55, 28, 6, C.white),
    ball(W * 0.4 + 14, H * 0.5, 28, 4.5, C.white),
    ball(W * 0.4 - 12, H * 0.68, 27.5, 4, C.white),
    box(W - 6 - wall - 2, H / 2 - 10, 16, 20, rim, 12, C.gold),
  ])
}
