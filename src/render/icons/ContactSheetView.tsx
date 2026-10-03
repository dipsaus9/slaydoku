import { EdgeFeatureIcon } from './EdgeFeatureIcon.tsx'
import { IconDepthScope, ObjectIconGlyph } from './ObjectIcon.tsx'
import { ORIENTATIONS, ROTATIONS, boundingSize, orientCells } from './orientation.ts'
import type { Rotation } from './orientation.ts'
import type { IconVariant } from './registry.tsx'
import { iconFootprints } from './resolve.ts'
import { OBJECT_CATALOG } from '../../engine/model/index.ts'
import { iconLegendGroups } from './types.ts'
import type { IconObjectType } from './types.ts'
import { ThemeIconSheet } from './themes/ThemeIconSheet.tsx'

/** Pixel size of one cell on the sheet. */
const CELL = 60

/** One tile for a single cell, four (one per quarter turn) for anything bigger. */
function rotationsToShow(variant: IconVariant): Rotation[] {
  return variant.cells.length === 1 ? [0] : [...ROTATIONS]
}

function Tile({ type, variant, rotation }: { type: IconObjectType; variant: IconVariant; rotation: Rotation }) {
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
        aria-label={`${type} ${variant.id} rotated ${rotation}`}
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
        <IconDepthScope>
          <ObjectIconGlyph type={type} cells={cells} rotation={rotation} />
        </IconDepthScope>
      </svg>
      <figcaption>{rotation}&deg;</figcaption>
    </figure>
  )
}

function VariantRow({ type, variant }: { type: IconObjectType; variant: IconVariant }) {
  return (
    <div className="variant">
      <div className="variant-label">
        {variant.id}{' '}
        <span>
          ({variant.cells.length} {variant.cells.length === 1 ? 'cell' : 'cells'})
        </span>
      </div>
      <div className="tiles">
        {rotationsToShow(variant).map((rotation) => (
          <Tile key={rotation} type={type} variant={variant} rotation={rotation} />
        ))}
      </div>
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
.variant { margin-bottom: 10px; }
.variant-label { font-weight: 600; margin-bottom: 4px; }
.variant-label span { font-weight: 400; color: #6b6259; }
.tiles { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-start; }
.tile { margin: 0; }
.tile svg { display: block; }
.tile figcaption { font-size: 12px; color: #6b6259; text-align: center; }
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
        <title>Slaydoku icon contact sheet</title>
        <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      </head>
      <body>
        <h1>Slaydoku object icons</h1>
        <p className="note">
          Dashed cells mark each footprint. Art is drawn facing south (back or head on the north side) and
          turned by rotation. Sections follow the object catalog, as the official legend does: the icons
          themselves carry no occupiable/blocking colour.
        </p>
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
        <ThemeIconSheet />
        <p className="note">
          {Object.keys(OBJECT_CATALOG).length} object types, {footprintCount} footprints.
        </p>
      </body>
    </html>
  )
}
