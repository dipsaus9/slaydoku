import type { PlacedObject } from '../../engine/model/index.ts'
import type { ThemeIconId } from '../../render/icons/themes/types.ts'
import { getTheme } from './index.ts'
import type { ThemeId } from './index.ts'

/**
 * Own theme art per object id of a generated puzzle. The scene has no object kind field: the kind is
 * the id prefix (`printer-2` is an office `printer`), which the theme knows.
 */
export function themeIconsFor(theme: ThemeId, objects: readonly Pick<PlacedObject, 'id'>[]): Record<string, ThemeIconId> {
  const icons = new Map(getTheme(theme).objects.flatMap((o) => (o.themeIcon ? [[o.kind, o.themeIcon] as const] : [])))
  const out: Record<string, ThemeIconId> = {}
  for (const object of objects) {
    const icon = icons.get(object.id.replace(/-\d+$/, ''))
    if (icon) out[object.id] = icon
  }
  return out
}
