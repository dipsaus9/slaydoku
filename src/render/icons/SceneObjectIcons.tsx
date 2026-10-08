import type { PlacedObject } from '../../engine/model/index.ts'
import type { Look } from '../looks/look.ts'
import { solidOf } from '../looks/solid.ts'
import type { SceneGeometry } from '../scene/geometry.ts'
import { IconDepthScope, ObjectIconGlyph } from './ObjectIcon.tsx'
import { ThemeObjectIconGlyph } from './themes/ThemeObjectIcon.tsx'
import type { ThemeIconId } from './themes/types.ts'
import { U } from './art/tokens.ts'
import type { IconObjectType } from './types.ts'

export interface SceneObjectIconsProps {
  objects: readonly (Omit<PlacedObject, 'type'> & { type: IconObjectType })[]
  geometry: SceneGeometry
  /**
   * Own theme art per object id (a park `hammock`, an office `printer`). The engine Scene has no
   * kind field, so the caller derives this from the object id prefix. Objects not listed here
   * draw the engine icon of their type.
   */
  themeIcons?: Readonly<Record<string, ThemeIconId>>
  /** SLAY-17.8: in 'a2' and 'a3' the objects that have a block form are drawn by SceneSolids instead; the rest stay flat here. */
  look?: Look
}

/**
 * Draws icons for placed objects in scene coordinates, for SceneView's
 * `objectsLayer`. Each icon is scaled from art units to the cell size and
 * moved to the top-left cell of its footprint. Objects whose footprint has
 * no icon are skipped (check with `hasIcon` when validating content).
 */
export function SceneObjectIcons({ objects, geometry, themeIcons, look = 'now' }: SceneObjectIconsProps) {
  return (
    <IconDepthScope>
      {objects.map((object) => {
        if (object.cells.length === 0) return null
        if (look !== 'now' && solidOf(object, themeIcons)) return null
        const top = Math.min(...object.cells.map((c) => c.row))
        const left = Math.min(...object.cells.map((c) => c.col))
        const { x, y } = geometry.cellRect({ row: top, col: left })
        const themeIcon = themeIcons?.[object.id]
        return (
          <g
            key={object.id}
            data-object={object.id}
            transform={`translate(${x} ${y}) scale(${geometry.cellSize / U})`}
          >
            {themeIcon ? (
              <ThemeObjectIconGlyph object={{ engineType: object.type, themeIcon }} cells={object.cells} />
            ) : (
              <ObjectIconGlyph type={object.type} cells={object.cells} />
            )}
          </g>
        )
      })}
    </IconDepthScope>
  )
}
