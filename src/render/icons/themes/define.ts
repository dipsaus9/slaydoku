import type { Cell } from '../../../engine/model/index.ts'
import type { ModelBuilder } from '../../looks/models.ts'
import type { IconVariant } from '../registry.tsx'

/**
 * Per-theme icon modules (SLAY-18.11). A theme's own drawings live in two files of its own, `src/render/icons/themes/<id>Art.tsx` (the
 * block models, functions `(cols, rows) => SolidModel`, see docs/design/looks.md "How to draw a new object") and `<id>Icons.ts`, which
 * registers them with `defineThemeIcons`:
 *
 *     export const FALL_ICONS = defineThemeIcons({
 *       pumpkin: { sizes: [[1, 1]], model: () => pumpkin() },
 *       hayBale: { sizes: [[1, 1], [2, 1]], model: (c, r) => hayBale(c, r) },
 *     })
 *     export type FallIconId = IconIdOf<typeof FALL_ICONS>
 *
 * The shared registries (`types.ts`, `registry.ts`, `looks/registry.ts`) merge the four seasonal sets, so a theme story edits neither
 * them nor `ThemeIconId`: the id union and the id list grow with the set.
 */

/** Footprints (canonical orientation, facing south) of one theme icon. */
export interface ThemeIconDefinition<K extends string = string> {
  id: K
  variants: IconVariant[]
}

/** One footprint size as `[cols, rows]`. */
export type ThemeIconSize = readonly [cols: number, rows: number]

/** What a theme says about one of its own drawings: the footprints it is drawn at and the block model that draws it. */
export interface ThemeIconSpec {
  sizes: readonly ThemeIconSize[]
  model: ModelBuilder
}

/** The icons of one theme, ready for the shared registries: ids, footprint definitions and model builders, all keyed alike. */
export interface ThemeIconSet<K extends string = string> {
  ids: readonly K[]
  definitions: Record<K, ThemeIconDefinition<K>>
  models: Record<K, ModelBuilder>
}

/** The id union of a set built with `defineThemeIcons` (`never` for a stub without icons). */
export type IconIdOf<S> = S extends ThemeIconSet<infer K> ? K : never

function rectCells(cols: number, rows: number): Cell[] {
  const cells: Cell[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) cells.push({ row, col })
  }
  return cells
}

/** The footprint definition of one icon id at the given sizes. */
export function defineThemeIcon<K extends string>(id: K, sizes: readonly ThemeIconSize[]): ThemeIconDefinition<K> {
  return {
    id,
    variants: sizes.map(([cols, rows]) => ({ id: `${cols}x${rows}`, cells: rectCells(cols, rows), cols, rows })),
  }
}

/** Build a theme's icon set from `{ id: { sizes, model } }`; an empty object is a stub that registers nothing. */
export function defineThemeIcons<K extends string>(specs: Record<K, ThemeIconSpec>): ThemeIconSet<K> {
  const ids = Object.keys(specs) as K[]
  const definitions = {} as Record<K, ThemeIconDefinition<K>>
  const models = {} as Record<K, ModelBuilder>
  for (const id of ids) {
    definitions[id] = defineThemeIcon(id, specs[id].sizes)
    models[id] = specs[id].model
  }
  return { ids, definitions, models }
}
