import { PORTRAIT_DESIGNS, castFor, traitsOf, type PortraitLook } from '../../../content/cast/index.ts'
import { SKIN_TONES, HAIR_COLORS, CLOTHES_COLORS, ACCENT_COLORS } from './traits.ts'
import { buildCastFromCast, cardLookOf } from './cast.tsx'

const VARIANTS = 6

/** Colour variant `i` of a design: a walk through the palettes that gives six different skin, hair and shirt combinations. */
const variant = (design: string, i: number): PortraitLook => ({
  design,
  skin: SKIN_TONES[(i * 3 + 1) % SKIN_TONES.length]!,
  hairColor: HAIR_COLORS[(i * 3 + 2) % HAIR_COLORS.length]!,
  clothesColor: CLOTHES_COLORS[(i * 3 + 4) % CLOTHES_COLORS.length]!,
  accentColor: ACCENT_COLORS[i % ACCENT_COLORS.length]!,
})

function Tile({ look, label }: { look: PortraitLook; label?: string }) {
  const card = cardLookOf(look, traitsOf(look).hairStyle)
  return (
    <figure style={{ margin: 0, textAlign: 'center' }}>
      <div style={{ width: 120, height: 120, background: card.photo, borderRadius: 8, overflow: 'hidden' }}>{card.portrait}</div>
      {label ? <figcaption style={{ font: '12px system-ui', marginTop: 4 }}>{label}</figcaption> : null}
    </figure>
  )
}

function DesignRows() {
  return (
    <>
      {PORTRAIT_DESIGNS.map((d) => (
        <section key={d.id}>
          <h3>{d.id} ({d.gender}): {d.hairStyle} hair, {d.clothesStyle}, {d.accessory}</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Array.from({ length: VARIANTS }, (_, i) => <Tile key={i} look={variant(d.id, i)} />)}
          </div>
        </section>
      ))}
    </>
  )
}

function CastRow({ size, seed }: { size: number; seed: string }) {
  const cast = castFor(size, seed)
  const built = buildCastFromCast(cast, seed)
  return (
    <section>
      <h3>castFor({size}, "{seed}"): {cast.names.join(', ')}</h3>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {built.entries.map((e) => (
          <figure key={e.name} style={{ margin: 0, textAlign: 'center' }}>
            <div style={{ width: 100, height: 100, background: e.look.photo, borderRadius: '50%', overflow: 'hidden' }}>{e.look.portrait}</div>
            <figcaption style={{ font: '13px system-ui' }}>{e.name} ({e.gender === 'woman' ? 'w' : 'm'})</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

/** Not used by the app: the contact sheet the portrait designs are judged on (`bun tools/portrait-sheet.ts`). */
export function PortraitSheetView() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Slaydoku portrait sheet</title>
      </head>
      <body style={{ font: '14px system-ui', margin: 16, background: '#fff', color: '#222' }}>
        <h1>Portrait designs ({PORTRAIT_DESIGNS.length}), six colour variants each</h1>
        <DesignRows />
        <h1>Sample casts (names from the pool, portraits by gender slot)</h1>
        <CastRow size={6} seed="sheet-a" />
        <CastRow size={9} seed="sheet-b" />
        <CastRow size={12} seed="sheet-c" />
        <CastRow size={16} seed="sheet-d" />
      </body>
    </html>
  )
}


