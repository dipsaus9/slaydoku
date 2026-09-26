import type { Cell, ObjectType } from '../../../engine/model/index.ts'
import { resolveIcon, resolveVariant } from '../resolve.ts'
import type { OrientationPreference, ResolvedIcon } from '../resolve.ts'
import { THEME_ICON_DEFINITIONS } from './registry.ts'
import type { ThemeIconId } from './types.ts'

/** What picks the art of a theme object: its own icon, else its engine type's. */
export interface ThemeIconRef {
  engineType: ObjectType
  themeIcon?: ThemeIconId
}

/** Footprints (canonical orientation) the art of `ref` is drawn at. */
export function themeIconFootprints(ref: ThemeIconRef) {
  return ref.themeIcon ? THEME_ICON_DEFINITIONS[ref.themeIcon].variants : undefined
}

/** Resolve the art for an object covering `cells`; undefined when none is drawn for that shape. */
export function resolveThemeObjectIcon(
  ref: ThemeIconRef,
  cells: readonly Cell[],
  prefer: OrientationPreference = {},
): ResolvedIcon | undefined {
  return ref.themeIcon
    ? resolveVariant(THEME_ICON_DEFINITIONS[ref.themeIcon].variants, cells, prefer)
    : resolveIcon(ref.engineType, cells, prefer)
}

