import type { ThemeId } from '../../content/themes/index.ts'
import type { PlacedObject } from '../model/index.ts'
import { FAMILY_OF, OBJECT_FAMILIES, type ObjectFamily } from './families.ts'

/*
 * The board as a whole (SLAY-22, owner 2026-10-09: "the puzzle must not get cluttered, and every puzzle must look like a real situation:
 * a board of only chairs and lamps is odd"). Three board-level rules, checked by `generateScene` on every try (a board that breaks one is
 * drawn again), on top of the per-room cap in objects.ts:
 * - density: objects per square may not exceed `densityCap(side)`, which falls as the board grows, so a 12x12 looks sparser per square than a 6x6;
 * - variety: at least `minBoardKinds(side)` distinct kinds, and no kind on more than `maxKindCount(objects)` objects;
 * - mix: per theme a target share per object family (`THEME_MIX`); a family may not exceed its target by more than `MIX_TOLERANCE` (plus
 *   one object of slack on a small board), and the board has at least `minBoardFamilies(side)` families. A theme without a mix (the
 *   seasonal ones) only gets `DEFAULT_MAX_FAMILY_SHARE`.
 */

/** Most objects per square on a board of `side` x `side`: 0.28 on 6x6, 0.25 on 9x9, 0.22 on 12x12. */
export const densityCap = (side: number): number => 0.34 - 0.01 * side

/** Most objects on a `width` x `height` board. */
export const maxBoardObjects = (width: number, height: number): number => Math.floor(width * height * densityCap(Math.sqrt(width * height)))

/** Fewest distinct kinds on a board of `side` x `side`: 5 on 6x6, 8 on 9x9, 11 on 12x12. */
export const minBoardKinds = (side: number): number => Math.round(side) - 1

/** Most objects of one kind on a board of `objects` objects: a quarter, and 3 always allowed. */
export const maxKindCount = (objects: number): number => Math.max(3, Math.ceil(objects * 0.25))

/** How far a family's share may rise above its theme target. */
export const MIX_TOLERANCE = 0.2

/** A family's share without a theme mix. */
export const DEFAULT_MAX_FAMILY_SHARE = 0.5

/** Fewest object families on a board of `side` x `side`: 4 on 6x6, 5 from 7x7 (a park has no storage or fixtures, so not more). */
export const minBoardFamilies = (side: number): number => (side <= 6 ? 4 : 5)

/**
 * Target share per family and theme (families missing here have target 0: they may appear, up to `MIX_TOLERANCE`). Measured on 1000
 * generated boards per theme (sizes 6, 7, 8, 9, 12) and rounded to 0.05; they read like the places: a home has seating, tables, storage,
 * fixtures (kitchen, bathroom) and decor; a park is mostly greenery with benches; a shop is mostly shelving.
 */
export const THEME_MIX: Partial<Record<ThemeId, Partial<Record<ObjectFamily, number>>>> = {
  home: { seating: 0.15, tables: 0.1, storage: 0.15, beds: 0.05, lighting: 0.1, greenery: 0.05, rugs: 0.1, fixtures: 0.15, decor: 0.15 },
  office: { seating: 0.15, tables: 0.15, storage: 0.2, lighting: 0.05, greenery: 0.15, rugs: 0.1, fixtures: 0.1, decor: 0.1 },
  school: { seating: 0.15, tables: 0.15, storage: 0.2, greenery: 0.1, rugs: 0.1, fixtures: 0.15, decor: 0.15 },
  park: { seating: 0.2, tables: 0.1, lighting: 0.05, greenery: 0.35, rugs: 0.05, vehicles: 0.05, decor: 0.1, activity: 0.1 },
  shop: { seating: 0.2, tables: 0.1, storage: 0.3, greenery: 0.05, rugs: 0.1, fixtures: 0.1, vehicles: 0.05, decor: 0.1 },
}

const kindOf = (id: string): string => id.replace(/-\d+$/, '')

/** The board-level problems of a set of placed objects on a `width` x `height` board of `theme` (empty when the board is fine). */
export function boardMixProblems(objects: readonly PlacedObject[], width: number, height: number, theme: string): string[] {
  const problems: string[] = []
  const n = objects.length
  const side = Math.sqrt(width * height)
  if (n > maxBoardObjects(width, height)) problems.push(`${n} objects, at most ${maxBoardObjects(width, height)}`)
  const kinds = new Map<string, number>()
  const families = new Map<ObjectFamily, number>()
  for (const o of objects) {
    kinds.set(kindOf(o.id), (kinds.get(kindOf(o.id)) ?? 0) + 1)
    const family = FAMILY_OF[o.type]
    families.set(family, (families.get(family) ?? 0) + 1)
  }
  if (kinds.size < minBoardKinds(side)) problems.push(`${kinds.size} kinds, at least ${minBoardKinds(side)}`)
  for (const [kind, count] of kinds) if (count > maxKindCount(n)) problems.push(`${count}x ${kind}, at most ${maxKindCount(n)}`)
  const mix = THEME_MIX[theme as ThemeId]
  for (const family of OBJECT_FAMILIES) {
    const count = families.get(family) ?? 0
    const target = mix?.[family] ?? 0
    const max = mix ? target + MIX_TOLERANCE : DEFAULT_MAX_FAMILY_SHARE
    if (count > Math.floor(n * max) + 1) problems.push(`${count} of ${n} objects are ${family}, at most ${Math.floor(n * max) + 1}`)
  }
  if (families.size < minBoardFamilies(side)) problems.push(`${families.size} families, at least ${minBoardFamilies(side)}`)
  return problems
}
