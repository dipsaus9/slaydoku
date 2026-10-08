import { OBJECT_CATALOG } from '../../engine/model/index.ts'
import { MODEL_ONLY } from '../looks/registry.ts'
import { SolidSvg } from '../looks/Solids.tsx'
import { solidFor } from '../looks/solid.ts'
import type { Solid } from '../looks/solid.ts'
import { EdgeFeatureIcon } from './EdgeFeatureIcon.tsx'
import { BOARD_CELL, CONFUSABLE_GROUPS, PHONE_CELL, orientedSolid } from './contactSheetData.ts'
import { ORIENTATIONS, boundingSize, orientCells } from './orientation.ts'
import type { Orientation } from './orientation.ts'
import type { IconVariant } from './registry.tsx'
import { iconFootprints } from './resolve.ts'
import { ThemeIconSheet } from './themes/ThemeIconSheet.tsx'
import { iconLegendGroups } from './types.ts'
import type { IconObjectType } from './types.ts'
import type { ThemeIconId } from './themes/types.ts'

const orientationLabel = (o: Orientation) => `${o.rotation}${o.mirror ? ' mirrored' : ''}`

/** All 8 orientations of a footprint (a single cell shows four: it has the same footprint turned, but the art turns with it). */
export function OrientationTiles({ type, themeIcon, variant, px }: { type: IconObjectType; themeIcon?: ThemeIconId; variant: IconVariant; px: number }) {
  return (
    <div className="tiles">
      {ORIENTATIONS.map((o) => {
        const solid = orientedSolid(type, themeIcon, variant, o)
        const size = boundingSize(orientCells(variant.cells, variant.cols, variant.rows, o))
        return (
          <figure className="tile" key={orientationLabel(o)} data-orientation={orientationLabel(o)} data-size={`${size.cols}x${size.rows}`}>
            {solid ? <SolidSvg solid={solid} pxPerCell={px} showCells title={`${themeIcon ?? type} ${variant.id} ${orientationLabel(o)}`} /> : <div className="missing">no art</div>}
            <figcaption>{orientationLabel(o)}</figcaption>
          </figure>
        )
      })}
    </div>
  )
}

function VariantRow({ type, variant }: { type: IconObjectType; variant: IconVariant }) {
  return (
    <div className="variant" data-type={type} data-variant={variant.id}>
      <div className="variant-label">
        {variant.id} <span>({variant.cells.length} {variant.cells.length === 1 ? 'cell' : 'cells'})</span>
      </div>
      <OrientationTiles type={type} variant={variant} px={BOARD_CELL} />
    </div>
  )
}

function ObjectCard({ type }: { type: IconObjectType }) {
  return (
    <section className="card" data-type={type}>
      <h3>{type}</h3>
      {iconFootprints(type).map((variant) => (
        <VariantRow key={variant.id} type={type} variant={variant} />
      ))}
    </section>
  )
}

function ConfusableStrip({ group, px }: { group: (typeof CONFUSABLE_GROUPS)[number]; px: number }) {
  return (
    <section className="card" data-confusable={group.title}>
      <h3>{group.title}</h3>
      <div className="tiles">
        {group.items.map((item) => {
          const variant = iconFootprints(item.type).find((v) => v.id === item.variant)
          const solid = variant ? solidFor(item.type, item.themeIcon, variant.cells) : null
          return (
            <figure className="tile" key={`${item.type}-${item.variant}`}>
              {solid ? <SolidSvg solid={solid} pxPerCell={px} title={item.type} /> : <div className="missing">no art</div>}
              <figcaption>{item.type}</figcaption>
            </figure>
          )
        })}
      </div>
    </section>
  )
}

/** The water of the bathtub model: not an object kind of the app, drawn here so its water can be checked. */
function ModelOnlyCards() {
  return (
    <div className="grid">
      {Object.entries(MODEL_ONLY).map(([name, build]) => {
        const model = build()
        const cells = Array.from({ length: model.cols * model.rows }, (_, i) => ({ row: Math.floor(i / model.cols), col: i % model.cols }))
        const solid: Solid = { key: name as never, themeIcon: undefined, prims: model.prims, flat: model.flat, cells, width: model.cols * 100, height: model.rows * 100 }
        return (
          <section className="card" key={name} data-model-only={name}>
            <h3>{name} (model only, no object kind)</h3>
            <div className="tiles">
              {[BOARD_CELL, PHONE_CELL].map((px) => (
                <figure className="tile" key={px}>
                  <SolidSvg solid={solid} pxPerCell={px} showCells title={name} />
                  <figcaption>{px} px per cell</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

const STYLE = `
:root { color-scheme: light; font: 15px/1.4 system-ui, 'Segoe UI', Roboto, sans-serif; color: #2a211c; }
body { margin: 0; padding: 24px; background: #f5f3ef; }
h1 { margin: 0 0 4px; font-size: 24px; }
h2 { margin: 28px 0 12px; padding: 10px 14px; border-radius: 10px; font-size: 20px; }
h2.occupiable { background: #dcefc8; border: 2px solid #9bc971; }
h2.blocking { background: #f7d6d6; border: 2px solid #e19a9a; }
h2.edges { background: #dbeaf7; border: 2px solid #9fc3e2; }
h3 { margin: 0 0 8px; font-size: 16px; }
p.note { margin: 0; color: #6b6259; }
.grid { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-start; }
.card { background: #fff; border: 1px solid #ddd6c8; border-radius: 10px; padding: 12px 14px; }
.variant, .theme-variant { margin-bottom: 10px; }
.variant-label { font-weight: 600; margin-bottom: 4px; }
.variant-label span { font-weight: 400; color: #6b6259; }
.tiles { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; }
.tile { margin: 0; }
.tile svg { display: block; }
.tile figcaption { font-size: 12px; color: #6b6259; text-align: center; }
.missing { padding: 8px; background: #f7d6d6; border: 2px solid #c0392b; font-weight: 700; }
.edge { display: flex; align-items: center; gap: 10px; margin: 6px 0; }
`

/** The contact sheet document, for `renderToStaticMarkup`. */
export function ContactSheetView() {
  const { occupiable, blocking } = iconLegendGroups()
  const footprintCount = [...occupiable, ...blocking].reduce((sum, t) => sum + iconFootprints(t).length, 0)
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Slaydoku object contact sheet</title>
        <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      </head>
      <body>
        <h1>Slaydoku objects</h1>
        <p className="note">
          Every kind in the oblique block look, all 8 orientations (four turns, then mirrored), {BOARD_CELL} px per cell like the board at full width. Dashed
          cells mark each footprint. Models face south (back, head or tank on the north side) and are turned in 3D, so a turned object shows its back.
          Sections follow the object catalog.
        </p>
        <h2 className="edges">Easily mistaken for each other, at phone size ({PHONE_CELL} px per cell)</h2>
        <div className="grid">
          {CONFUSABLE_GROUPS.map((group) => (
            <ConfusableStrip key={group.title} group={group} px={PHONE_CELL} />
          ))}
        </div>
        <h2 className="occupiable">Can be occupied ({occupiable.length})</h2>
        <div className="grid">
          {occupiable.map((type) => (
            <ObjectCard key={type} type={type} />
          ))}
        </div>
        <h2 className="blocking">Cannot be occupied ({blocking.length})</h2>
        <div className="grid">
          {blocking.map((type) => (
            <ObjectCard key={type} type={type} />
          ))}
        </div>
        <h2 className="edges">On the grid line: window and door</h2>
        <div className="card">
          {(['window', 'door'] as const).map((kind) => (
            <div className="edge" key={kind}>
              <EdgeFeatureIcon kind={kind} side="north" cellSize={100} />
              <EdgeFeatureIcon kind={kind} side="east" cellSize={100} />
              <span>{kind}</span>
            </div>
          ))}
        </div>
        <h2 className="edges">Models without an object kind in the app</h2>
        <ModelOnlyCards />
        <ThemeIconSheet />
        <p className="note">
          {Object.keys(OBJECT_CATALOG).length} object types, {footprintCount} footprints.
        </p>
      </body>
    </html>
  )
}
