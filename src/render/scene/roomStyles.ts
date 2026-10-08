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

/** The classic tone of each floor kind (the look before SLAY-20): what a room gets when no neighbour is in the way. */
const CLASSIC: Record<FloorPattern, FloorStyle> = {
  wood: { fill: '#f1d9a6', ink: '#d7b978' },
  tiles: { fill: '#f6efe0', ink: '#e3d6bb' },
  grass: { fill: '#cdebd0', ink: '#8fc79a' },
  water: { fill: '#bfe3f2', ink: '#8cc6e0' },
  stone: { fill: '#cbc3cf', ink: '#a79eac' },
  carpet: { fill: '#e2d7f1', ink: '#c5b4e0' },
}

/**
 * Shared tints, a lattice in CIE L*a*b* (SLAY-20, owner: "the tints still look too much alike"): six hues
 * at L* 76 and chroma 30, six hues in between at L* 89 and chroma 21, and a grey at L* 82. Every two are at
 * least MIN_NEIGHBOUR_DISTANCE apart, with a real hue shift, and every one keeps the label ink at 7:1 or
 * better. The floor pattern drawn over it (planks, tiles, blades, waves ...) keeps the material readable.
 */
export const TINTS: readonly (FloorStyle & { name: string })[] = [
  { name: 'rose', fill: '#f3a7ae', ink: '#d68990' },
  { name: 'honey', fill: '#dcb586', ink: '#be9768' },
  { name: 'sage', fill: '#a2c593', ink: '#83a875' },
  { name: 'teal', fill: '#6acbc9', ink: '#42adab' },
  { name: 'sky', fill: '#85c2f0', ink: '#61a5d4' },
  { name: 'lilac', fill: '#d1b0e3', ink: '#b391c6' },
  { name: 'peach', fill: '#ffd5c4', ink: '#e8b6a5' },
  { name: 'straw', fill: '#e5e1b9', ink: '#c6c399' },
  { name: 'mint', fill: '#b9ead5', ink: '#99ccb6' },
  { name: 'ice', fill: '#ade9fb', ink: '#8bcbdd' },
  { name: 'periwinkle', fill: '#d6deff', ink: '#b7bfe8' },
  { name: 'blush', fill: '#ffd3ea', ink: '#e4b3cc' },
  { name: 'grey', fill: '#cccccc', ink: '#aeaeae' },
]

/** Rooms that touch differ by at least this much (CIE76 delta E): another colour at a glance, not a shade. */
export const MIN_NEIGHBOUR_DISTANCE = 18

function variantsOf(pattern: FloorPattern): FloorStyle[] {
  const classic = CLASSIC[pattern]
  const others = TINTS.filter((t) => colourDistance(t.fill, classic.fill) >= MIN_NEIGHBOUR_DISTANCE)
    .map(({ fill, ink }) => ({ fill, ink, d: colourDistance(fill, classic.fill) }))
    .sort((x, y) => x.d - y.d)
    .map(({ fill, ink }) => ({ fill, ink }))
  return [classic, ...others]
}

/** Own flat palette, in the spirit of the official sheets: soft fills, light pattern lines. */
export const ROOM_STYLES: Record<FloorPattern, RoomStyle> = Object.fromEntries(
  (Object.keys(CLASSIC) as FloorPattern[]).map((id) => [id, { id, variants: variantsOf(id) }]),
) as unknown as Record<FloorPattern, RoomStyle>

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

/** Tones at least this far from every neighbour all count as far enough; then the kind's own look decides. */
const FAR_ENOUGH = 26

/**
 * One floor style per room: an explicit override wins, then the floor a theme gave the room
 * name, then a name hint (kitchen -> tiles, garden -> grass ...), then a cycle through the kinds.
 *
 * The tone is a colouring of the room map (SLAY-20, owner: "the colours of the rooms should differ
 * per room"): rooms that touch (a wall or a corner) get tones at least MIN_NEIGHBOUR_DISTANCE apart.
 * Greedy, most constrained room first (most coloured neighbours, then most neighbours, then map order):
 * a room takes the tone of its kind with the largest distance to its coloured neighbours, where every
 * distance of FAR_ENOUGH or more counts the same, so a room keeps its classic tone (or the nearest tint
 * to it) whenever its neighbours allow. Deterministic: it reads only the scene.
 */
export function resolveRoomStyles(
  scene: Pick<Scene, 'rooms'> & Partial<Pick<Scene, 'cellRooms'>>,
  overrides: Partial<Record<string, FloorPattern>> = {},
): Record<string, ResolvedRoomStyle> {
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
    ROOM_STYLES[pattern].variants.forEach((tone, variant) => {
      const score = near.includes(tone.fill) ? 0 : Math.min(FAR_ENOUGH, ...near.map((fill) => colourDistance(fill, tone.fill)))
      if (score > best.score) best = { variant, score }
    })
    result[id] = { pattern, variant: best.variant, ...ROOM_STYLES[pattern].variants[best.variant]! }
  }
  return result
}
