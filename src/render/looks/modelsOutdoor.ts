import { ball, box, C, cyl, disc, model, onFront, onTop, type Prim, type SolidModel } from './models.ts'

/** Car, bonnet to the north, two cells long: a low body, a glass band around a dark roof, wheels and lights. */
export function car(): SolidModel {
  const prims: Prim[] = []
  for (const x of [8, 92]) for (const y of [48, 150]) prims.push(disc('yz', x, y, 14, 14, C.ink))
  prims.push(
    box(14, 8, 72, 184, 8, 26, C.red),
    box(20, 62, 60, 80, 34, 14, C.sky),
    box(26, 70, 48, 64, 48, 8, C.redDark),
    onTop(22, 14, 56, 40, 34, C.redDark, 0.8),
    onTop(22, 150, 56, 38, 34, C.redDark, 0.8),
    box(22, 8, 14, 3, 20, 8, C.yellow, 1.5),
    box(64, 8, 14, 3, 20, 8, C.yellow, 1.5),
    box(22, 189, 14, 3, 20, 8, C.redDark, 1.5),
    box(64, 189, 14, 3, 20, 8, C.redDark, 1.5),
  )
  return model(1, 2, prims)
}

/** Oil slick: a few dark flat puddles with pale rainbow sheens. Flat, a person can stand in it. */
export function oilSlick(): SolidModel {
  return model(1, 1, [
    cyl(46, 52, 36, 0, 1.6, C.slick, undefined, 2),
    cyl(70, 66, 20, 0, 1.6, C.slick, undefined, 2),
    cyl(30, 76, 16, 0, 1.6, C.slick, undefined, 2),
    cyl(42, 44, 14, 1.6, 0.8, C.purple, undefined, 0),
    cyl(60, 62, 10, 1.6, 0.8, C.skyLight, undefined, 0),
    cyl(34, 66, 7, 1.6, 0.8, C.green, undefined, 0),
  ])
}

/** Potted plant: a terracotta pot with soil and a leafy crown of balls. */
export function plant(): SolidModel {
  return model(1, 1, [
    cyl(50, 52, 22, 0, 30, C.terracotta, 27),
    cyl(50, 52, 24, 28, 4, C.terraDark, 28),
    cyl(50, 52, 24, 32, 0.8, C.soil),
    ball(36, 50, 52, 20, C.green),
    ball(64, 50, 52, 20, C.greenDark),
    ball(50, 60, 56, 22, C.greenLight),
    ball(50, 42, 68, 17, C.green),
  ])
}

/** Tree: a brown trunk and a crown of three balls. */
export function tree(): SolidModel {
  return model(1, 1, [
    cyl(50, 56, 11, 0, 38, C.woodDark, 8),
    ball(34, 52, 62, 24, C.greenDark),
    ball(66, 52, 62, 24, C.green),
    ball(50, 62, 56, 26, C.greenLight),
    ball(50, 44, 76, 20, C.green),
  ])
}

/** Flower bed: a low frame of soil with three tall blooms on green stems and leaves. */
export function flowers(): SolidModel {
  const prims: Prim[] = [box(8, 14, 84, 74, 0, 8, C.woodDark), box(14, 20, 72, 62, 8, 0.8, C.soil, 0), ball(24, 70, 14, 9, C.greenDark), ball(78, 34, 14, 9, C.greenDark), ball(50, 30, 14, 8, C.green)]
  const bloom = (x: number, y: number, h: number, color: string): Prim[] => [cyl(x, y, 2.5, 8, h, C.greenDark), ball(x, y, 8 + h + 8, 13, color), ball(x, y, 8 + h + 10, 5, C.yellowLight)]
  prims.push(...bloom(30, 44, 34, C.pink), ...bloom(68, 48, 42, C.red), ...bloom(48, 70, 26, C.yellow))
  return model(1, 1, prims)
}

/** Painter's easel: three posts, a cross bar, a ledge and a canvas with a little landscape. */
export function easel(): SolidModel {
  return model(1, 1, [
    box(14, 56, 6, 6, 0, 86, C.woodDark),
    box(80, 56, 6, 6, 0, 86, C.woodDark),
    box(47, 14, 6, 6, 0, 76, C.woodDark),
    box(14, 52, 72, 5, 30, 4, C.wood),
    box(24, 54, 52, 6, 42, 46, C.white),
    onFront(28, 60, 44, 50, 38, C.skyLight),
    onFront(52, 60.2, 14, 72, 10, C.yellow),
    onFront(28, 60.2, 44, 50, 14, C.greenLight),
  ])
}

/** Statue: a stone plinth with a bust: a body, a head and a little base ring. */
export function statue(): SolidModel {
  return model(1, 1, [
    box(18, 20, 64, 62, 0, 30, C.stone),
    box(12, 14, 76, 74, 0, 6, C.stoneDark),
    cyl(50, 50, 18, 30, 24, C.paper, 12),
    ball(50, 50, 66, 13, C.paper),
    cyl(50, 50, 8, 52, 6, C.paper),
  ])
}

/** Garden table: round on one cell, a slab on four legs on wider ones, in painted green metal with a parasol hole. */
export function gardenTable(cols: number, rows: number): SolidModel {
  if (cols === 1 && rows === 1) return model(1, 1, [cyl(50, 50, 20, 0, 4, C.greenDark), cyl(50, 50, 5, 4, 38, C.greenDark), cyl(50, 50, 40, 42, 5, C.greenLight), cyl(50, 50, 4, 47, 0.8, C.greenDark)])
  const W = cols * 100
  const H = rows * 100
  return model(cols, rows, [
    box(12, 14, 8, 8, 0, 42, C.greenDark),
    box(W - 20, 14, 8, 8, 0, 42, C.greenDark),
    box(12, H - 22, 8, 8, 0, 42, C.greenDark),
    box(W - 20, H - 22, 8, 8, 0, 42, C.greenDark),
    box(8, 10, W - 16, H - 20, 42, 5, C.greenLight),
    onTop(16, 18, W - 32, H - 36, 47, C.greenDark, 0.8),
    cyl(W / 2, H / 2, 4, 47, 0.8, C.ink),
  ])
}

/** Garden bench: a slatted seat and backrest on the north side, two end frames. */
export function bench(cols: number): SolidModel {
  const W = cols * 100
  const prims: Prim[] = [box(10, 24, 8, 62, 0, 30, C.woodDeep), box(W - 18, 24, 8, 62, 0, 30, C.woodDeep), box(10, 20, 8, 8, 30, 36, C.woodDeep), box(W - 18, 20, 8, 8, 30, 36, C.woodDeep)]
  for (let s = 0; s < 4; s++) prims.push(box(8, 28 + s * 15, W - 16, 11, 30, 5, C.woodLight))
  for (let s = 0; s < 3; s++) prims.push(box(8, 20, W - 16, 6, 40 + s * 11, 8, C.wood))
  return model(cols, 1, prims)
}
