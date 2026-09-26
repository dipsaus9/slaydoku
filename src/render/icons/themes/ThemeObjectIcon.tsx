import type { Cell } from '../../../engine/model/index.ts'
import type { Rotation } from '../orientation.ts'
import { ObjectIconGlyph } from '../ObjectIcon.tsx'
import { resolveThemeObjectIcon } from './resolve.ts'
import type { ThemeIconRef } from './resolve.ts'

export interface ThemeObjectIconProps {
  object: ThemeIconRef
  cells: readonly Cell[]
  rotation?: Rotation
  mirror?: boolean
}

/**
 * The icon of a theme object as an SVG group, 100 units per cell like
 * ObjectIconGlyph. Objects without own art render exactly the engine icon.
 */
export function ThemeObjectIconGlyph({ object, cells, rotation, mirror }: ThemeObjectIconProps) {
  if (!object.themeIcon) return <ObjectIconGlyph type={object.engineType} cells={cells} rotation={rotation} mirror={mirror} />
  const icon = resolveThemeObjectIcon(object, cells, { rotation, mirror })
  if (!icon) return null
  const [a, b, c, d, e, f] = icon.matrix
  return (
    <g
      data-theme-icon={object.themeIcon}
      data-variant={icon.variant.id}
      transform={`matrix(${a} ${b} ${c} ${d} ${e} ${f})`}
    >
      {icon.variant.draw()}
    </g>
  )
}
