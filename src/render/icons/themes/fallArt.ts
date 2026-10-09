import { ball, box, C, cyl, model, onFront, onTop, shiftY, type Prim, type SolidModel } from '../../looks/models.ts'

/**
 * Block models of the Fall theme (SLAY-18.6), drawn in the A2 look (docs/design/looks.md, "How to draw a new object") from the
 * owner-approved draft of SLAY-18.5 (docs/themes/seasonal/art.tsx). Each is a function `(cols, rows) => SolidModel`, facing south,
 * 100 units per cell, at most 96 high, registered in `fallIcons.ts`. Only the colours below are shared between them.
 */
const F = {
  orange: '#e29a4d',
  orangeDark: '#c47a33',
  orangeLight: '#f0b56e',
  maple: '#c9553f',
  mapleDark: '#a43f2e',
  mapleGold: '#e3b04b',
  hay: '#e3c777',
  hayDark: '#c4a550',
  hayLight: '#f0dc9a',
  leafBrown: '#9b5a2e',
  straw: '#ead28a',
  fire: '#e8743b',
  flame: '#f6c453',
  cap: '#cf4f48',
  capDark: '#a83b36',
  apple: '#c8403a',
  appleGold: '#d9b23e',
  burgundy: '#8e3446',
  denim: '#5d79a6',
  burlap: '#c9a777',
  plaid: '#b8483f',
} as const

/** Pumpkin: a round orange pumpkin of three lobes with a woody stem and a leaf, and a small yellow gourd beside it. */
export function pumpkin(): SolidModel {
  return model(1, 1, [
    ball(30, 54, 24, 20, F.orangeDark),
    ball(70, 54, 24, 20, F.orangeDark),
    ball(50, 50, 26, 25, F.orange),
    ball(50, 62, 22, 21, F.orangeLight),
    cyl(50, 50, 4.5, 46, 12, C.woodDark, 3.5),
    box(54, 38, 18, 10, 48, 2, C.greenLight),
    ball(82, 82, 9, 9, F.mapleGold),
    cyl(82, 82, 2, 17, 5, C.woodDark),
  ])
}

/** Maple tree: a trunk and a crown of red, orange and gold balls, with fallen leaves at its foot. */
export function mapleTree(): SolidModel {
  return model(1, 1, [
    onTop(12, 70, 14, 10, 0, F.maple),
    onTop(74, 78, 12, 9, 0, F.mapleGold),
    onTop(20, 14, 10, 12, 0, F.orange),
    cyl(50, 56, 11, 0, 40, C.woodDark, 8),
    ball(32, 50, 60, 24, F.maple),
    ball(68, 50, 60, 24, F.orange),
    ball(50, 64, 54, 25, F.mapleGold),
    ball(50, 42, 72, 23, F.mapleDark),
  ])
}

/** Apple tree: a trunk and a round green crown hung with red apples, two apples in the grass. */
export function appleTree(): SolidModel {
  return model(1, 1, [
    cyl(50, 56, 10, 0, 36, C.woodDark, 7),
    ball(34, 52, 60, 23, C.greenDark),
    ball(66, 52, 60, 23, C.green),
    ball(50, 62, 56, 24, C.greenLight),
    ball(50, 44, 74, 19, C.green),
    ball(36, 72, 58, 5.5, F.apple),
    ball(58, 80, 50, 5.5, F.apple),
    ball(70, 66, 66, 5.5, F.apple),
    ball(46, 60, 80, 5, F.apple),
    ball(28, 56, 72, 5, F.appleGold),
    ball(20, 84, 5, 5, F.apple),
    ball(80, 86, 5, 5, F.apple),
  ])
}

/** Toadstools: a big one with a red cap and white spots on a white stem, and a small brown one. */
export function mushroom(): SolidModel {
  return model(1, 1, [
    cyl(42, 46, 9, 0, 34, C.creamLight, 7),
    cyl(42, 46, 34, 34, 8, F.capDark, 30),
    cyl(42, 46, 30, 42, 10, F.cap, 14),
    ball(30, 40, 47, 5, C.white),
    ball(50, 34, 49, 4.5, C.white),
    ball(54, 54, 47, 5, C.white),
    ball(36, 58, 45, 4, C.white),
    ball(42, 46, 52, 4, C.white),
    cyl(80, 80, 4.5, 0, 14, C.creamLight, 4),
    cyl(80, 80, 13, 14, 5, C.woodDark, 10),
    cyl(80, 80, 10, 19, 4, C.wood, 4),
  ])
}

/** Chrysanthemum: a terracotta pot with a full dome of bronze, orange and burgundy blooms. */
export function chrysanthemum(): SolidModel {
  const prims: Prim[] = [cyl(50, 54, 22, 0, 28, C.terracotta, 26), cyl(50, 54, 27, 26, 5, C.terraDark, 27), ball(50, 54, 44, 24, C.greenDark)]
  const blooms: [number, number, number, string][] = [
    [34, 48, 50, F.orange],
    [50, 40, 58, F.burgundy],
    [66, 48, 50, F.orange],
    [40, 64, 50, F.burgundy],
    [60, 66, 50, F.mapleGold],
    [50, 54, 66, F.orangeLight],
    [36, 56, 60, F.mapleGold],
    [64, 56, 60, F.burgundy],
    [50, 70, 42, F.orange],
  ]
  for (const [x, y, z, color] of blooms) prims.push(ball(x, y, z, 9, color))
  return model(1, 1, prims)
}

/** Scarecrow: a post with a crossbar, a plaid shirt with straw cuffs, a burlap head and a wide straw hat with a red band. */
export function scarecrow(): SolidModel {
  return model(1, 1, [
    box(46, 48, 8, 8, 0, 56, C.woodDark),
    box(14, 48, 72, 7, 58, 7, C.woodDark),
    box(32, 42, 36, 18, 36, 30, F.plaid),
    onFront(48, 60, 4, 38, 26, F.mapleDark),
    box(14, 44, 18, 14, 56, 11, F.plaid),
    box(68, 44, 18, 14, 56, 11, F.plaid),
    box(8, 46, 8, 10, 54, 13, F.straw),
    box(84, 46, 8, 10, 54, 13, F.straw),
    box(36, 46, 28, 10, 28, 8, F.denim),
    ball(50, 51, 76, 11, F.burlap),
    cyl(50, 51, 24, 84, 2.5, F.straw, 24),
    cyl(50, 51, 11, 86, 9, F.hay, 9),
    cyl(50, 51, 11.5, 86, 2.5, C.red, 11.5),
  ])
}

/** Bonfire: a ring of grey stones, crossed logs and a cone of flames with a yellow heart. */
export function bonfire(): SolidModel {
  const prims: Prim[] = [cyl(50, 52, 30, 0, 2, C.slate)]
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10
    prims.push(ball(Math.round(50 + 38 * Math.cos(a)), Math.round(52 + 36 * Math.sin(a)), 7, 8, i % 2 ? C.stone : C.stoneDark))
  }
  prims.push(
    box(24, 46, 52, 10, 2, 9, C.woodDark),
    box(45, 26, 10, 52, 2, 9, C.wood),
    cyl(50, 52, 18, 10, 30, F.fire, 3),
    cyl(50, 54, 11, 10, 40, F.orange, 2),
    cyl(50, 56, 6, 10, 24, F.flame, 1),
  )
  return model(1, 1, prims)
}

/**
 * Fireplace (hearth): a brick chimney breast with a big dark firebox, a fire of logs and flames standing in it, a stone hearth slab and a
 * wooden mantel with a little pumpkin and a candle. The fire is made of blocks, so it shows from every side, not only from the front.
 */
export function hearth(): SolidModel {
  return model(
    1,
    1,
    shiftY(
      [
        box(4, 0, 18, 44, 0, 56, C.terracotta),
        box(78, 0, 18, 44, 0, 56, C.terracotta),
        box(22, 0, 56, 14, 0, 56, C.slate),
        box(22, 14, 56, 30, 0, 2, C.ink),
        box(22, 30, 56, 14, 44, 12, C.terracotta),
        box(14, 0, 72, 30, 56, 32, C.terraDark),
        box(0, 44, 100, 18, 0, 4, C.stoneDark),
        box(30, 26, 40, 8, 2, 7, C.woodDark),
        box(34, 18, 8, 22, 2, 7, C.wood),
        cyl(50, 28, 13, 9, 22, F.fire, 3),
        cyl(50, 30, 7, 9, 28, F.flame, 1),
        box(0, 30, 100, 18, 56, 6, C.woodDark),
        ball(20, 40, 68, 6, F.orange),
        cyl(80, 40, 3, 62, 14, C.creamLight),
        ball(80, 40, 78, 2.5, F.flame),
      ],
      14,
    ),
  )
}

/**
 * Hay bale: a block of straw per cell, tied with two dark twines, straw lines on top; on a 2x2 footprint a third bale lies across the back
 * pair, so the stack reads as hay and not as a mat.
 */
export function baleOfHay(cols: number, rows: number): SolidModel {
  const prims: Prim[] = []
  const bale = (x: number, y: number, w: number, d: number, z: number): void => {
    prims.push(box(x, y, w, d, z, 34, F.hay))
    for (let k = 1; k < 4; k++) prims.push(onTop(x + 6, y + (d * k) / 4 - 1, w - 12, 2, z + 34, F.hayDark))
    for (const f of [0.3, 0.7]) prims.push(onTop(x + w * f - 1.5, y, 3, d, z + 34.9, C.terraDark), onFront(x + w * f - 1.5, y + d + 0.2, 3, z, 34, C.terraDark))
    for (const zz of [9, 20]) prims.push(onFront(x + 4, y + d + 0.4, w - 8, z + zz, 1.6, F.hayDark))
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) bale(c * 100 + 8, r * 100 + 16, 84, 68, 0)
  if (cols >= 2 && rows >= 2) bale(30, 26, cols * 100 - 60, 60, 34)
  return model(cols, rows, prims)
}

/**
 * Leaf pile: a low heap of fallen leaves, any size. Each leaf is a thin flat square at its own height and colour (red, orange, gold, brown),
 * stacked into a mound, with a few loose leaves around it; no balls, so it never reads as fruit.
 */
export function leafPile(cols: number, rows: number): SolidModel {
  const prims: Prim[] = []
  const colors = [F.maple, F.orange, F.mapleGold, F.leafBrown, F.orangeDark, F.mapleDark]
  const W = cols * 100
  const H = rows * 100
  // One heap over the whole footprint: leaves on a jittered grid inside an ellipse, higher toward the middle.
  let i = 0
  for (let y = 10; y <= H - 24; y += 11) {
    for (let x = 10 + ((y / 11) % 2) * 6; x <= W - 24; x += 13) {
      const dx = (x + 7 - W / 2) / (W / 2 - 8)
      const dy = (y + 6 - H / 2) / (H / 2 - 8)
      const d = dx * dx + dy * dy
      if (d > 1) continue
      const layer = Math.floor((1 - d) * 4)
      const s = 13 + ((i * 7) % 5)
      prims.push(box(x, y, s, s * 0.75, layer * 3.5, 2.5, colors[(i * 7) % colors.length]!, 1))
      i++
    }
  }
  prims.push(onTop(4, H - 12, 9, 7, 0, F.maple), onTop(W - 13, 5, 8, 8, 0, F.mapleGold), onTop(W - 12, H - 12, 7, 7, 0, F.orange))
  return model(cols, rows, prims)
}

/** Apple crate: a slatted wooden crate on the floor, heaped with red and golden apples. */
export function harvestCrate(): SolidModel {
  const prims: Prim[] = [box(12, 20, 76, 58, 0, 38, C.woodLight)]
  for (const z of [8, 22]) prims.push(onFront(12, 78.2, 76, z, 4, C.wood))
  prims.push(box(12, 20, 6, 58, 0, 40, C.wood), box(82, 20, 6, 58, 0, 40, C.wood))
  const apples: [number, number, string][] = [
    [28, 34, F.apple],
    [44, 32, F.apple],
    [60, 34, F.appleGold],
    [74, 36, F.apple],
    [30, 52, F.appleGold],
    [46, 50, F.apple],
    [62, 52, F.apple],
    [72, 62, F.appleGold],
    [36, 66, F.apple],
    [54, 66, F.appleGold],
  ]
  for (const [x, y, color] of apples) prims.push(ball(x, y, 42, 8, color))
  return model(1, 1, shiftY(prims, 2))
}

/** Cider barrel: an oak barrel standing on end with dark iron hoops, a lid and a brass tap on the front. */
export function ciderBarrel(): SolidModel {
  // Stacked bands from the floor up (wood, hoop, wood, ...), so every hoop shows; the belly is widest in the middle.
  const bands: [number, number, number, number, string][] = [
    [0, 4, 27, 28, C.slate],
    [4, 14, 28, 31, C.woodLight],
    [18, 4, 31, 32, C.slate],
    [22, 18, 32, 32, C.woodLight],
    [40, 4, 32, 31, C.slate],
    [44, 14, 31, 28, C.woodLight],
    [58, 4, 28, 27, C.slate],
  ]
  return model(1, 1, [
    ...bands.map(([z, h, r0, r1, color]) => cyl(50, 50, r0, z, h, color, r1)),
    cyl(50, 50, 24, 62, 1.2, C.wood, 24, 1.5),
    cyl(50, 50, 6, 62, 3, C.woodDark),
    box(45, 81, 10, 9, 26, 6, C.gold),
    box(47, 88, 6, 5, 18, 10, C.goldDark),
  ])
}

/** Harvest table: a rough wooden trestle table laid with pumpkins, apples and a basket; a round crate-top table on one cell. */
export function harvestTable(cols: number, rows: number): SolidModel {
  const W = cols * 100
  const H = rows * 100
  const prims: Prim[] = [
    box(14, 16, 10, H - 32, 0, 38, C.woodDark),
    box(W - 24, 16, 10, H - 32, 0, 38, C.woodDark),
    box(14, H / 2 - 4, W - 28, 8, 14, 6, C.woodDark),
    box(6, 10, W - 12, H - 20, 38, 6, C.woodLight),
    onTop(6, H / 2 - 1, W - 12, 2, 44, C.wood),
  ]
  const top = 44
  const pumpkinAt = (x: number, y: number, r: number, color: string) => prims.push(ball(x, y, top + r + 0.5, r, color), cyl(x, y, 2.5, top + 2 * r - 1, 6, C.woodDark))
  const basketAt = (x: number, y: number) =>
    prims.push(cyl(x, y, 15, top, 12, C.woodLight, 18), ball(x - 7, y - 4, top + 14, 6, F.apple), ball(x + 6, y - 2, top + 14, 6, F.appleGold), ball(x, y + 6, top + 15, 6, F.apple))
  // Every cell of the top carries a pumpkin and a basket of apples, so a long table is laid all along.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ox = c * 100
      const oy = r * 100
      pumpkinAt(ox + 34, oy + 38, 15, (r + c) % 2 ? F.mapleGold : F.orange)
      basketAt(ox + 66, oy + 62)
    }
  }
  return model(cols, rows, prims)
}
