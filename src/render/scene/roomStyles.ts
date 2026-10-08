import type { Scene } from '../../engine/model/index.ts'
import { roomFloorOf } from '../../content/themes/index.ts'

export type FloorPattern = 'wood' | 'tiles' | 'grass' | 'water' | 'stone' | 'carpet'

export interface FloorStyle {
  /** Base floor colour. */
  fill: string
  /** Pattern line / accent colour. */
  ink: string
}

export interface RoomStyle {
  id: FloorPattern
  /**
   * The tones a room of this floor kind can get: its classic tone first, then the shared tints
   * (TINTS) that are clearly another colour than the classic, nearest first (SLAY-20).
   */
  variants: readonly FloorStyle[]
}

/**
 * Strength of every floor colour (SLAY-20): the chroma (colourfulness in CIE L*a*b*) of the classic tones
 * and the shared tints is multiplied by this. 1 is the full-strength look of the first rounds; after
 * "te veel kleur verschil", "iets te fel", "mag wat subtieler" and "nog zachter" the owner tried strengths
 * live and picked 0.4 ("Tint 0.4 is de sweet spot"). One knob: lower is greyer and calmer, higher is more
 * colourful. The distances below scale with it; roomStyles.test.ts checks the strength in use.
 */
export const TINT_CHROMA_SCALE = 0.4

/** The classic tone of each floor kind at full strength (the look before SLAY-20): what a room gets when no neighbour is in the way. */
const CLASSIC_BASE: Record<FloorPattern, string> = {
  wood: '#f1d9a6',
  tiles: '#f6efe0',
  grass: '#cdebd0',
  water: '#bfe3f2',
  stone: '#cbc3cf',
  carpet: '#e2d7f1',
}

/**
 * Shared soft tints (SLAY-20): six hues 60 degrees apart on a light ring in CIE L*a*b* (chroma 21 at full
 * strength, L* alternating 90 and 86 so neighbouring hues also differ in lightness). Round 2 also had a
 * darker, stronger ring and a grey; the owner found that too much, so only this light ring is left.
 */
const TINT_HUES: readonly [name: string, hue: number, lightness: number][] = [
  ['peach', 45, 90],
  ['straw', 105, 86],
  ['mint', 165, 90],
  ['ice', 225, 86],
  ['periwinkle', 285, 90],
  ['blush', 345, 86],
]
const TINT_CHROMA = 21

/** A fill and its pattern ink (12 L* darker, a little more colour) from a CIE L*a*b* colour. */
function toneOf(L: number, a: number, b: number): FloorStyle {
  return { fill: labToHex(L, a, b), ink: labToHex(L - 12, a * 1.15, b * 1.15) }
}

/** Everything that depends on the strength: the tones per floor kind and the distances the colouring uses. */
export interface Palette {
  scale: number
  /** The classic tone of each kind first, then the shared tints that are clearly another colour, nearest first. */
  styles: Record<FloorPattern, RoomStyle>
  tints: readonly (FloorStyle & { name: string })[]
  /** Rooms that touch differ by at least this much (CIE76 delta E); roomStyles.test.ts checks it on every scheduled day. */
  minNeighbourDistance: number
  /** A tint closer than this to a kind's classic tone is left out of that kind (it would read as the classic). */
  minTintFromClassic: number
  /** Tones at least this far from every neighbour all count as far enough; then the kind's own look decides. */
  farEnough: number
}

const palettes = new Map<number, Palette>()

/** The palette at a strength (memoised). */
export function paletteFor(scale: number = TINT_CHROMA_SCALE): Palette {
  const known = palettes.get(scale)
  if (known) return known
  const classic = Object.fromEntries(
    Object.entries(CLASSIC_BASE).map(([kind, hex]) => {
      const [L, a, b] = lab(hex)
      return [kind, toneOf(L, a * scale, b * scale)]
    }),
  ) as Record<FloorPattern, FloorStyle>
  const tints = TINT_HUES.map(([name, hue, L]) => {
    const c = TINT_CHROMA * scale
    return { name, ...toneOf(L, c * Math.cos((hue * Math.PI) / 180), c * Math.sin((hue * Math.PI) / 180)) }
  })
  const minTintFromClassic = 15 * scale
  const variantsOf = (kind: FloorPattern): FloorStyle[] => [
    classic[kind],
    ...tints
      .filter((t) => colourDistance(t.fill, classic[kind].fill) >= minTintFromClassic)
      .map(({ fill, ink }) => ({ fill, ink, d: colourDistance(fill, classic[kind].fill) }))
      .sort((x, y) => x.d - y.d)
      .map(({ fill, ink }) => ({ fill, ink })),
  ]
  const styles = Object.fromEntries(
    (Object.keys(CLASSIC_BASE) as FloorPattern[]).map((id) => [id, { id, variants: variantsOf(id) }]),
  ) as unknown as Record<FloorPattern, RoomStyle>
  // 20 x scale (8.0 at 0.4) is what the colouring reaches on every scheduled day at the chosen strength; the
  // closest touching pair is 8.02 (tested). Another strength may need another factor: the test prints the closest pair.
  const palette = { scale, styles, tints, minNeighbourDistance: 20 * scale, minTintFromClassic, farEnough: 25 * scale }
  palettes.set(scale, palette)
  return palette
}

/** The default palette's tones per floor kind. */
export const ROOM_STYLES: Record<FloorPattern, RoomStyle> = paletteFor().styles
/** The default palette's shared tints. */
export const TINTS = paletteFor().tints
/** The default palette's minimum difference between touching rooms. */
export const MIN_NEIGHBOUR_DISTANCE = paletteFor().minNeighbourDistance
/** The default palette's minimum distance of a tint from a kind's classic tone. */
export const MIN_TINT_FROM_CLASSIC = paletteFor().minTintFromClassic

const CYCLE: FloorPattern[] = ['wood', 'carpet', 'tiles', 'grass', 'stone', 'water']

/** Name keywords that hint at a floor kind. First match wins. */
const NAME_HINTS: [FloorPattern, RegExp][] = [
  ['stone', /^balcony$/i],
  ['carpet', /^(dance floor|photo studio)$/i],
  ['tiles', /^shot bar$/i],
  ['water', /pond|pool|lake|water|fountain/i],
  ['grass', /garden|backyard|yard|lawn|park|golf|meadow|field|grove|orchard|forest|playground|zoo/i],
  ['stone', /terrace|patio|garage|driveway|courtyard|shed|path|street|parking/i],
  ['tiles', /kitchen|bathroom|toilet|wc\b|hall|corridor|lobby|entrance|foyer|laundry|utility/i],
  ['carpet', /bedroom|lounge|sunroom|conservatory|nursery|waiting|kindergarten/i],
  ['wood', /living|study|office|library|gallery|dining|room/i],
]

export function styleForName(name: string): FloorPattern | undefined {
  return roomFloorOf(name) ?? NAME_HINTS.find(([, re]) => re.test(name))?.[0]
}

export interface ResolvedRoomStyle {
  pattern: FloorPattern
  /** Which tone of the pattern's palette (ROOM_STYLES[pattern].variants). */
  variant: number
  fill: string
  ink: string
}

/** CIE L*a*b* of a #rrggbb colour (D65). */
function lab(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [number, number, number]
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const x = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047)
  const y = f(r * 0.2126 + g * 0.7152 + b * 0.0722)
  const z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

/** #rrggbb of a CIE L*a*b* colour (D65), clipped to sRGB. */
function labToHex(L: number, a: number, b: number): string {
  const fy = (L + 16) / 116
  const inv = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787)
  const X = inv(fy + a / 500) * 0.95047
  const Y = inv(fy)
  const Z = inv(fy - b / 200) * 1.08883
  const linear = [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.204 * Y + 1.057 * Z]
  return (
    '#' +
    linear
      .map((v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055))
      .map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0'))
      .join('')
  )
}

/** CIE76 colour difference: about 2 is just noticeable, 10 and up reads as another colour at a glance. */
export function colourDistance(a: string, b: string): number {
  const [p, q] = [lab(a), lab(b)]
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
}

/** Rooms that touch: share a wall or a corner (a corner is where two floors meet too). */
export function roomNeighbours(scene: Pick<Scene, 'cellRooms'>): Map<string, Set<string>> {
  const next = new Map<string, Set<string>>()
  const link = (a: string | undefined, b: string | undefined) => {
    if (!a || !b || a === b) return
    if (!next.has(a)) next.set(a, new Set())
    if (!next.has(b)) next.set(b, new Set())
    next.get(a)!.add(b)
    next.get(b)!.add(a)
  }
  const rows = scene.cellRooms
  rows.forEach((row, r) =>
    row.forEach((room, c) => {
      link(room, row[c + 1])
      link(room, rows[r + 1]?.[c])
      link(room, rows[r + 1]?.[c + 1])
      link(room, rows[r + 1]?.[c - 1])
    }),
  )
  return next
}


/**
 * One floor style per room: an explicit override wins, then the floor a theme gave the room
 * name, then a name hint (kitchen -> tiles, garden -> grass ...), then a cycle through the kinds.
 *
 * The tone is a colouring of the room map (SLAY-20, owner: "the colours of the rooms should differ
 * per room"): rooms that touch (a wall or a corner) get tones at least `minNeighbourDistance` apart.
 * Greedy, most constrained room first (most coloured neighbours, then most neighbours, then map order):
 * a room takes the tone of its kind with the largest distance to its coloured neighbours, where every
 * distance of `farEnough` or more counts the same, so a room keeps its classic tone (or the nearest tint
 * to it) whenever its neighbours allow. Deterministic: it reads only the scene.
 */
export function resolveRoomStyles(
  scene: Pick<Scene, 'rooms'> & Partial<Pick<Scene, 'cellRooms'>>,
  overrides: Partial<Record<string, FloorPattern>> = {},
  scale: number = TINT_CHROMA_SCALE,
): Record<string, ResolvedRoomStyle> {
  const { styles, farEnough } = paletteFor(scale)
  const neighbours = scene.cellRooms ? roomNeighbours({ cellRooms: scene.cellRooms }) : new Map<string, Set<string>>()
  const patternOf = new Map(
    scene.rooms.map((room, index) => [
      room.id,
      overrides[room.id] ?? styleForName(room.name) ?? (CYCLE[index % CYCLE.length] as FloorPattern),
    ]),
  )
  const next = (id: string) => [...(neighbours.get(id) ?? [])]
  const result: Record<string, ResolvedRoomStyle> = {}
  const left = scene.rooms.map((room, index) => ({ id: room.id, index }))
  while (left.length > 0) {
    const coloured = (id: string) => next(id).filter((n) => result[n]).length
    left.sort((a, b) => coloured(b.id) - coloured(a.id) || next(b.id).length - next(a.id).length || a.index - b.index)
    const { id } = left.shift()!
    const pattern = patternOf.get(id)!
    const near = next(id).flatMap((n) => (result[n] ? [result[n].fill] : []))
    let best = { variant: 0, score: -1 }
    styles[pattern].variants.forEach((tone, variant) => {
      const score = near.includes(tone.fill) ? 0 : Math.min(farEnough, ...near.map((fill) => colourDistance(fill, tone.fill)))
      if (score > best.score) best = { variant, score }
    })
    result[id] = { pattern, variant: best.variant, ...styles[pattern].variants[best.variant]! }
  }
  return result
}
