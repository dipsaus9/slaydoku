import type { SceneTheme, ThemeObject } from '../../../content/themes/index.ts'
import { SCENE_THEMES } from '../../../content/themes/index.ts'
import { ORIENTATIONS, ROTATIONS, boundingSize, orientCells } from '../orientation.ts'
import type { Rotation } from '../orientation.ts'
import type { IconVariant } from '../registry.tsx'
import { THEME_ICON_DEFINITIONS } from './registry.ts'
import { ThemeObjectIconGlyph } from './ThemeObjectIcon.tsx'
import type { ThemeIconId } from './types.ts'

const CELL = 60

function Tile({ id, variant, rotation }: { id: ThemeIconId; variant: IconVariant; rotation: Rotation }) {
  const orientation = ORIENTATIONS.find((o) => o.rotation === rotation && !o.mirror)!
  const cells = orientCells(variant.cells, variant.cols, variant.rows, orientation)
  const size = boundingSize(cells)
  return (
    <figure className="tile">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size.cols * CELL}
        height={size.rows * CELL}
        viewBox={`0 0 ${size.cols * 100} ${size.rows * 100}`}
        role="img"
        aria-label={`${id} ${variant.id} rotated ${rotation}`}
      >
        {cells.map((c) => (
          <rect
            key={`${c.row}-${c.col}`}
            x={c.col * 100}
            y={c.row * 100}
            width={100}
            height={100}
            fill="#ffffff"
            stroke="#b9b2a0"
            strokeWidth={1.5}
            strokeDasharray="6 5"
          />
        ))}
        <ThemeObjectIconGlyph object={{ engineType: 'chair', themeIcon: id }} cells={cells} rotation={rotation} />
      </svg>
      <figcaption>{rotation}&deg;</figcaption>
    </figure>
  )
}

function ThemeIconCard({ id }: { id: ThemeIconId }) {
  return (
    <section className="card" data-theme-icon-card={id}>
      <h3>{id}</h3>
      {THEME_ICON_DEFINITIONS[id].variants.map((variant) => (
        <div className="theme-variant" key={variant.id}>
          <div className="variant-label">{variant.id}</div>
          <div className="tiles">
            {(variant.cells.length === 1 ? [0 as Rotation] : [...ROTATIONS]).map((rotation) => (
              <Tile key={rotation} id={id} variant={variant} rotation={rotation} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

function ObjectTile({ object }: { object: ThemeObject }) {
  const footprint = object.footprints[0]!
  const size = { cols: Math.max(...footprint.cells.map((c) => c.col)) + 1, rows: Math.max(...footprint.cells.map((c) => c.row)) + 1 }
  return (
    <figure className="tile" data-theme-object={object.kind}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size.cols * CELL}
        height={size.rows * CELL}
        viewBox={`0 0 ${size.cols * 100} ${size.rows * 100}`}
        role="img"
        aria-label={object.name}
      >
        <ThemeObjectIconGlyph object={object} cells={footprint.cells} />
      </svg>
      <figcaption>{object.name}</figcaption>
    </figure>
  )
}

function ThemeCard({ theme }: { theme: SceneTheme }) {
  const occupiable = theme.objects.filter((o) => o.occupiable)
  const blocking = theme.objects.filter((o) => !o.occupiable)
  return (
    <section className="card" data-theme={theme.id}>
      <h3>
        {theme.name} ({theme.id})
      </h3>
      <div className="variant-label">Can be occupied ({occupiable.length})</div>
      <div className="tiles">
        {occupiable.map((o) => (
          <ObjectTile key={o.kind} object={o} />
        ))}
      </div>
      <div className="variant-label">Cannot be occupied ({blocking.length})</div>
      <div className="tiles">
        {blocking.map((o) => (
          <ObjectTile key={o.kind} object={o} />
        ))}
      </div>
    </section>
  )
}

/** Theme sections of the contact sheet: the theme-only icons, then each theme's object set. */
export function ThemeIconSheet() {
  return (
    <>
      <h2 className="edges">Theme icons (own drawing)</h2>
      <div className="grid">
        {(Object.keys(THEME_ICON_DEFINITIONS) as ThemeIconId[]).map((id) => (
          <ThemeIconCard key={id} id={id} />
        ))}
      </div>
      <h2 className="edges">Themes: objects per scene</h2>
      <div className="grid">
        {SCENE_THEMES.map((theme) => (
          <ThemeCard key={theme.id} theme={theme} />
        ))}
      </div>
    </>
  )
}
