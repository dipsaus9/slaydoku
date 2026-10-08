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
   * Tones of one floor kind, far enough apart (CIE76 delta E >= 8.5 within a kind) that two rooms of
   * the same kind side by side read as two rooms (SLAY-20). The first is the kind's classic tone.
   */
  variants: readonly FloorStyle[]
}

/** Own flat palette, in the spirit of the official sheets: soft fills, light pattern lines. */
export const ROOM_STYLES: Record<FloorPattern, RoomStyle> = {
  wood: {
    id: 'wood',
    variants: [
      { fill: '#f1d9a6', ink: '#d7b978' },
      { fill: '#dfb67e', ink: '#c1a06a' },
      { fill: '#f8ecd0', ink: '#d7ccb3' },
      { fill: '#efc0a0', ink: '#cfa588' },
      { fill: '#d8d4ae', ink: '#bab795' },
    ],
  },
  tiles: {
    id: 'tiles',
    variants: [
      { fill: '#f6efe0', ink: '#e3d6bb' },
      { fill: '#e6f0ee', ink: '#c9dcd8' },
      { fill: '#eee6f3', ink: '#cec7d3' },
      { fill: '#fbe6c8', ink: '#dac7ac' },
    ],
  },
  grass: {
    id: 'grass',
    variants: [
      { fill: '#cdebd0', ink: '#8fc79a' },
      { fill: '#b7dfae', ink: '#9dc195' },
      { fill: '#dcefc0', ink: '#becfa5' },
      { fill: '#bfe2da', ink: '#a4c3bc' },
    ],
  },
  water: {
    id: 'water',
    variants: [
      { fill: '#bfe3f2', ink: '#8cc6e0' },
      { fill: '#a7d0ea', ink: '#8eb3cb' },
      { fill: '#c9eae6', ink: '#adcbc7' },
      { fill: '#d3dcf5', ink: '#b6bed5' },
    ],
  },
  stone: {
    id: 'stone',
    variants: [
      { fill: '#cbc3cf', ink: '#a79eac' },
      { fill: '#d5c3bd', ink: '#b39f98' },
      { fill: '#bfc8bc', ink: '#a4aca1' },
      { fill: '#e3ddd3', ink: '#c4bfb6' },
    ],
  },
  carpet: {
    id: 'carpet',
    variants: [
      { fill: '#e2d7f1', ink: '#c5b4e0' },
      { fill: '#f3d3da', ink: '#e2aebb' },
      { fill: '#d4e1f2', ink: '#b7c3d2' },
      { fill: '#ecc6df', ink: '#ccaac1' },
    ],
  },
}

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
  /** Which tone of the pattern's palette (an index past the palette is a darker shade of the last tones). */
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

const darker = (hex: string, factor: number) =>
  '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * factor).toString(16).padStart(2, '0')).join('')

/** Tone `i` of a pattern; past the palette (a room with more same-kind neighbours than tones, never seen in practice) a darker shade. */
function toneOf(pattern: FloorPattern, i: number): FloorStyle {
  const tones = ROOM_STYLES[pattern].variants
  const base = tones[i % tones.length]!
  const round = Math.floor(i / tones.length)
  return round === 0 ? base : { fill: darker(base.fill, 1 - 0.06 * round), ink: darker(base.ink, 1 - 0.06 * round) }
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

/** Tones further apart than this all count as clearly different; then variety decides. */
const CLEAR = 12

/**
 * One floor style per room: an explicit override wins, then the floor a theme gave the room
 * name, then a name hint (kitchen -> tiles, garden -> grass ...), then a cycle through the kinds.
 *
 * The tone is a colouring of the room map (SLAY-20, owner: "the colours of the rooms should differ
 * per room"): rooms that touch never share a fill, and among the tones of its kind a room takes the
 * one furthest from its already-coloured neighbours (up to CLEAR), then the tone used least in the
 * scene. Rooms go most-neighbours first, so the crowded middle of the map picks before the edges.
 * Deterministic: it reads only the scene. Without `cellRooms` there is no map and only variety counts.
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
  const degree = (id: string) => neighbours.get(id)?.size ?? 0
  const order = scene.rooms
    .map((room, index) => ({ id: room.id, index }))
    .sort((a, b) => degree(b.id) - degree(a.id) || a.index - b.index)

  const used = new Map<string, number>()
  const result: Record<string, ResolvedRoomStyle> = {}
  for (const { id } of order) {
    const pattern = patternOf.get(id)!
    const near = [...(neighbours.get(id) ?? [])].flatMap((n) => (result[n] ? [result[n].fill] : []))
    let best: { variant: number; tone: FloorStyle; score: number; uses: number } | undefined
    for (let variant = 0; ; variant++) {
      const tone = toneOf(pattern, variant)
      const palette = variant < ROOM_STYLES[pattern].variants.length
      if (!near.includes(tone.fill)) {
        const score = Math.min(CLEAR, ...near.map((fill) => colourDistance(fill, tone.fill)))
        const uses = used.get(`${pattern}:${variant}`) ?? 0
        if (!best || score > best.score || (score === best.score && uses < best.uses)) best = { variant, tone, score, uses }
      }
      // Past the palette only as a last resort: the first free shade ends the search.
      if (!palette && best) break
      if (variant === ROOM_STYLES[pattern].variants.length - 1 && best) break
    }
    used.set(`${pattern}:${best.variant}`, best.uses + 1)
    result[id] = { pattern, variant: best.variant, ...best.tone }
  }
  return result
}
