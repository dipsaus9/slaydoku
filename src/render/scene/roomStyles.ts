import type { Scene } from '../../engine/model/index.ts'

export type FloorPattern = 'wood' | 'tiles' | 'grass' | 'water' | 'stone' | 'carpet'

export interface FloorStyle {
  /** Base floor colour. */
  fill: string
  /** Pattern line / accent colour. */
  ink: string
}

export interface RoomStyle {
  id: FloorPattern
  /** Two tones so neighbouring rooms of one kind stay distinguishable. */
  variants: [FloorStyle, FloorStyle]
}

/** Own flat palette, in the spirit of the official sheets: soft fills, light pattern lines. */
export const ROOM_STYLES: Record<FloorPattern, RoomStyle> = {
  wood: {
    id: 'wood',
    variants: [
      { fill: '#f1d9a6', ink: '#d7b978' },
      { fill: '#eccb9a', ink: '#cfa974' },
    ],
  },
  tiles: {
    id: 'tiles',
    variants: [
      { fill: '#f6efe0', ink: '#e3d6bb' },
      { fill: '#e6f0ee', ink: '#c9dcd8' },
    ],
  },
  grass: {
    id: 'grass',
    variants: [
      { fill: '#cdebd0', ink: '#8fc79a' },
      { fill: '#c2e6c9', ink: '#7dbb8b' },
    ],
  },
  water: {
    id: 'water',
    variants: [
      { fill: '#bfe3f2', ink: '#8cc6e0' },
      { fill: '#b5dcef', ink: '#7dbcda' },
    ],
  },
  stone: {
    id: 'stone',
    variants: [
      { fill: '#cbc3cf', ink: '#a79eac' },
      { fill: '#d5c3bd', ink: '#b39f98' },
    ],
  },
  carpet: {
    id: 'carpet',
    variants: [
      { fill: '#e2d7f1', ink: '#c5b4e0' },
      { fill: '#f3d3da', ink: '#e2aebb' },
    ],
  },
}

const CYCLE: FloorPattern[] = ['wood', 'carpet', 'tiles', 'grass', 'stone', 'water']

/** Name keywords that hint at a floor kind. First match wins. */
const NAME_HINTS: [FloorPattern, RegExp][] = [
  ['water', /pond|pool|lake|water|fountain/i],
  ['grass', /garden|backyard|yard|lawn|park|golf|meadow|field|grove|orchard|forest|playground|zoo/i],
  ['stone', /terrace|patio|garage|driveway|courtyard|shed|path|street|parking/i],
  ['tiles', /kitchen|bathroom|toilet|wc\b|hall|corridor|lobby|entrance|foyer|laundry|utility/i],
  ['carpet', /bedroom|lounge|sunroom|conservatory|nursery|waiting|kindergarten/i],
  ['wood', /living|study|office|library|gallery|dining|room/i],
]

export function styleForName(name: string): FloorPattern | undefined {
  return NAME_HINTS.find(([, re]) => re.test(name))?.[0]
}

export interface ResolvedRoomStyle {
  pattern: FloorPattern
  /** 0 or 1: which tone of the pattern's palette. */
  variant: 0 | 1
  fill: string
  ink: string
}

/**
 * One floor style per room: an explicit override wins, then a name hint
 * (kitchen -> tiles, garden -> grass ...), then a cycle through the kinds.
 * A pattern used again switches tone, so neighbours stay distinguishable.
 */
export function resolveRoomStyles(
  scene: Pick<Scene, 'rooms'>,
  overrides: Partial<Record<string, FloorPattern>> = {},
): Record<string, ResolvedRoomStyle> {
  const used = new Map<FloorPattern, number>()
  const result: Record<string, ResolvedRoomStyle> = {}
  scene.rooms.forEach((room, index) => {
    const pattern =
      overrides[room.id] ?? styleForName(room.name) ?? (CYCLE[index % CYCLE.length] as FloorPattern)
    const count = used.get(pattern) ?? 0
    used.set(pattern, count + 1)
    const variant = (count % 2) as 0 | 1
    result[room.id] = { pattern, variant, ...ROOM_STYLES[pattern].variants[variant] }
  })
  return result
}
