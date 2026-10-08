import type { SceneTheme, ThemeObject } from '../../../content/themes/index.ts'
import { SCENE_THEMES } from '../../../content/themes/index.ts'
import { SolidSvg } from '../../looks/Solids.tsx'
import { solidFor } from '../../looks/solid.ts'
import { BOARD_CELL, PHONE_CELL } from '../contactSheetData.ts'
import { OrientationTiles } from '../ContactSheetView.tsx'
import { THEME_ICON_DEFINITIONS } from './registry.ts'
import type { ThemeIconId } from './types.ts'

function ThemeIconCard({ id }: { id: ThemeIconId }) {
  return (
    <section className="card" data-theme-icon-card={id}>
      <h3>{id}</h3>
      {THEME_ICON_DEFINITIONS[id].variants.map((variant) => (
        <div className="theme-variant" key={variant.id} data-variant={variant.id}>
          <div className="variant-label">{variant.id}</div>
          <OrientationTiles type="chair" themeIcon={id} variant={variant} px={BOARD_CELL} />
        </div>
      ))}
    </section>
  )
}

function ObjectTile({ object }: { object: ThemeObject }) {
  const footprint = object.footprints[0]!
  const solid = solidFor(object.engineType, object.themeIcon, footprint.cells)
  return (
    <figure className="tile" data-theme-object={object.kind}>
      {solid ? <SolidSvg solid={solid} pxPerCell={PHONE_CELL + 8} title={object.name} /> : <div className="missing">no art</div>}
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

/** Theme sections of the contact sheet: the theme-only drawings in all orientations, then each theme's objects as the board shows them. */
export function ThemeIconSheet() {
  return (
    <>
      <h2 className="edges">Theme drawings (own art, all orientations)</h2>
      <div className="grid">
        {(Object.keys(THEME_ICON_DEFINITIONS) as ThemeIconId[]).map((id) => (
          <ThemeIconCard key={id} id={id} />
        ))}
      </div>
      <h2 className="edges">Themes: every kind of every registered theme</h2>
      <div className="grid">
        {SCENE_THEMES.map((theme) => (
          <ThemeCard key={theme.id} theme={theme} />
        ))}
      </div>
    </>
  )
}
