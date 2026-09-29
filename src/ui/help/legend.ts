import { cellKey, cellsBesideFeature, isOccupiableType, OBJECT_TYPES } from '../../engine/model/index.ts'
import type { Cell, EdgeFeatureKind, ObjectType, PlacedObject, Scene } from '../../engine/model/index.ts'
import { OBJECT_WORDS } from '../../engine/clues/en.ts'
import { OBJECT_WORDS_NL } from '../../engine/clues/nl.ts'
import { drawnKinds, specificNoun, themeObjectOf } from '../../content/themes/drawn.ts'
import type { DrawnKind } from '../../content/themes/drawn.ts'
import type { ThemeIconId } from '../../render/icons/themes/types.ts'
import type { Locale } from '../../locale/index.ts'

/**
 * The rows of the Legend card (CAD-10.9), built from the scene of the level that is open and
 * from nothing else: an object kind that is not on the board has no row, one that is has exactly one.
 *
 * A "kind" is what the board draws (drawn.ts): the engine type plus the icon, so a poof and a
 * garden chair are two rows even though both are engine type chair, and two kinds that look alike
 * (a garden chair and a school chair both draw the plain chair) are one row a player cannot tell apart.
 * The noun is the one the clue cards use (`objectNouns`); whether a person can stand on it is the
 * engine catalog's flag, never repeated here.
 */
export interface LegendObjectRow {
  /** Unique within the legend: `<engine type>:<icon id | engine>`. */
  key: string
  type: ObjectType
  /** Own theme art of this kind; undefined draws the engine icon of the type. */
  themeIcon: ThemeIconId | undefined
  /** The noun the clues use for it. */
  noun: string
  /** Other nouns of kinds drawn exactly like this one (a garden chair also stands for a school chair). */
  alsoNouns: string[]
  /** A person can stand on it (engine catalog). */
  occupiable: boolean
  /** One object of the kind: its footprint is what the row draws. */
  sample: PlacedObject
  /** Every square with an object of this kind on it, in reading order. */
  cells: Cell[]
}

export interface LegendEdgeRow {
  kind: EdgeFeatureKind
  /** The squares beside a feature of this kind, in reading order. */
  cells: Cell[]
}

export interface Legend {
  /** Objects on the board: those a person can stand on first, then the blocking ones; catalog order within. */
  objects: LegendObjectRow[]
  /** Doors and windows that occur, doors first. */
  edges: LegendEdgeRow[]
}

const reading = (a: Cell, b: Cell) => a.row - b.row || a.col - b.col

function uniqueCells(cells: readonly Cell[]): Cell[] {
  const seen = new Map<string, Cell>()
  for (const cell of cells) seen.set(cellKey(cell), cell)
  return [...seen.values()].sort(reading)
}

/**
 * The noun (and, for English, the "also" siblings) the Legend shows for one drawn group of a
 * type. English distinguishes the specific theme kind a room drew ("garden chair" vs "poof")
 * because every theme kind's own name is real English (`specificNoun`); Dutch never does — no
 * theme kind has a Dutch name yet (see `nl.ts`'s file header, SLAY-6.2) — so a Dutch row always
 * uses the type's one generic Dutch noun, and there is nothing left to list as "also".
 */
function objectRowWords(locale: Locale, type: ObjectType, group: DrawnKind): { noun: string; alsoNouns: string[] } {
  if (locale === 'nl') return { noun: OBJECT_WORDS_NL[type].noun, alsoNouns: [] }
  const noun = specificNoun(group) ?? OBJECT_WORDS[type].noun
  return { noun, alsoNouns: group.nouns.filter((n) => n !== noun) }
}

/** What the legend says about this scene, in `locale`'s nouns (no hardcoded English word table). */
export function legendOf(scene: Scene, locale: Locale): Legend {
  const rows: LegendObjectRow[] = []
  for (const type of OBJECT_TYPES) {
    for (const group of drawnKinds(scene.objects, type)) {
      const members = scene.objects.filter(
        (o) => o.type === type && (themeObjectOf(o)?.themeIcon ?? 'engine') === group.icon,
      )
      const { noun, alsoNouns } = objectRowWords(locale, type, group)
      rows.push({
        key: `${type}:${group.icon}`,
        type,
        themeIcon: group.icon === 'engine' ? undefined : (group.icon as ThemeIconId),
        noun,
        alsoNouns,
        occupiable: isOccupiableType(type),
        sample: members[0]!,
        cells: uniqueCells(members.flatMap((o) => o.cells)),
      })
    }
  }
  const objects = [...rows.filter((r) => r.occupiable), ...rows.filter((r) => !r.occupiable)]

  const edges: LegendEdgeRow[] = []
  for (const kind of ['door', 'window'] as const) {
    if (!scene.edgeFeatures.some((f) => f.kind === kind)) continue
    edges.push({ kind, cells: uniqueCells(cellsBesideFeature(scene, kind)) })
  }
  return { objects, edges }
}
