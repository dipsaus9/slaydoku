/* oxlint-disable react/only-export-components -- draft art and a build script, not app components */
/**
 * Builds docs/themes/simpshouse/preview.html (SLAY-18.3). Run: `bun docs/themes/simpshouse/build-preview.tsx`.
 *
 * The page is static: every drawing and every sample level is inline SVG produced by the real code
 * (`generateScene`, `SceneView`, the engine and theme icons, plus the draft art in art.tsx), so the
 * owner opens the HTML file directly, no build or server needed. This script is only for whoever
 * changes the draft data.
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { isOccupiableType, type Cell, type PlacedObject, type Scene } from '../../../src/engine/model/index.ts'
import { generateScene } from '../../../src/engine/scenegen/index.ts'
import { IconDepthGroup, IconDepthScope, ObjectIconGlyph } from '../../../src/render/icons/ObjectIcon.tsx'
import { resolveVariant } from '../../../src/render/icons/resolve.ts'
import type { IconVariant } from '../../../src/render/icons/registry.tsx'
import { U } from '../../../src/render/icons/art/tokens.ts'
import { ThemeObjectIconGlyph } from '../../../src/render/icons/themes/ThemeObjectIcon.tsx'
import { THEME_ICON_DEFINITIONS } from '../../../src/render/icons/themes/registry.ts'
import type { ThemeIconId } from '../../../src/render/icons/themes/types.ts'
import { SceneView } from '../../../src/render/scene/index.ts'
import type { SceneGeometry } from '../../../src/render/scene/geometry.ts'
import { SIMPS_ICONS, type SimpsIconId } from './art.tsx'
import { NEW_ROOM_TYPES, OBJECT_NAMES_NL, SIMPSHOUSE_OBJECTS, SIMPSHOUSE_ROOMS, SIMPSHOUSE_THEME } from './theme.ts'
import type { ThemeObject } from '../../../src/content/themes/types.ts'

const here = dirname(fileURLToPath(import.meta.url))
const theme = SIMPSHOUSE_THEME

const isDraft = (o: ThemeObject): boolean => !!o.themeIcon && o.themeIcon in SIMPS_ICONS
const isOwnArt = (o: ThemeObject): boolean => !!o.themeIcon && !isDraft(o) && o.themeIcon in THEME_ICON_DEFINITIONS

function draftVariants(id: SimpsIconId): IconVariant[] {
  const def = SIMPS_ICONS[id]
  return def.sizes.map(([cols, rows]) => {
    const cells: Cell[] = []
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) cells.push({ row, col })
    return { id: `${cols}x${rows}`, cells, cols, rows, draw: () => def.draw(cols, rows) }
  })
}

/** The glyph of one theme object over `cells`: draft art, other themes' art, or the engine icon. */
function Glyph({ object, cells }: { object: Pick<ThemeObject, 'engineType' | 'themeIcon'>; cells: readonly Cell[] }) {
  const icon = object.themeIcon as string | undefined
  if (icon && icon in SIMPS_ICONS) {
    const resolved = resolveVariant(draftVariants(icon as SimpsIconId), cells)
    if (!resolved) return null
    const [a, b, c, d, e, f] = resolved.matrix
    return (
      <IconDepthGroup>
        <g data-theme-icon={icon} transform={`matrix(${a} ${b} ${c} ${d} ${e} ${f})`}>
          {resolved.variant.draw()}
        </g>
      </IconDepthGroup>
    )
  }
  if (icon) return <ThemeObjectIconGlyph object={{ engineType: object.engineType, themeIcon: icon as ThemeIconId }} cells={cells} />
  return <ObjectIconGlyph type={object.engineType} cells={cells} />
}

function objectOfPlaced(placed: PlacedObject): ThemeObject | undefined {
  const kind = placed.id.replace(/-\d+$/, '')
  return SIMPSHOUSE_OBJECTS.find((o) => o.kind === kind)
}

function objectsLayer(scene: Scene) {
  return (geometry: SceneGeometry) => (
    <IconDepthScope>
      {scene.objects.map((placed) => {
        const top = Math.min(...placed.cells.map((c) => c.row))
        const left = Math.min(...placed.cells.map((c) => c.col))
        const { x, y } = geometry.cellRect({ row: top, col: left })
        const themeObject = objectOfPlaced(placed)
        return (
          <g key={placed.id} data-object={placed.id} transform={`translate(${x} ${y}) scale(${geometry.cellSize / U})`}>
            <Glyph object={{ engineType: placed.type, themeIcon: themeObject?.themeIcon }} cells={placed.cells} />
          </g>
        )
      })}
    </IconDepthScope>
  )
}

/** Every inline SVG on the page needs its own id prefix, or floor patterns of one board leak into another. */
let renders = 0
const unique = () => ({ identifierPrefix: `r${renders++}-` })

/**
 * Floors for the new rooms: roomStyles.ts guesses a floor from the room name and falls back to a
 * cycle (which made the party rooms water). The theme story adds these names to NAME_HINTS there.
 */
const FLOORS: Record<string, 'carpet' | 'tiles' | 'stone'> = { 'Dance Floor': 'carpet', 'Photo Studio': 'carpet', 'Shot Bar': 'tiles', Balcony: 'stone' }

function renderScene(scene: Scene, lang: 'en' | 'nl', title: string): string {
  const shown: Scene = lang === 'en' ? scene : { ...scene, rooms: scene.rooms.map((r) => ({ ...r, name: SIMPSHOUSE_ROOMS.find((x) => x.name === r.name)?.nameNl ?? r.name })) }
  return renderToStaticMarkup(<SceneView scene={shown} title={title} objectsLayer={objectsLayer(scene)} showAxisLabels roomStyles={Object.fromEntries(scene.rooms.flatMap((r) => (FLOORS[r.name] ? [[r.id, FLOORS[r.name]] as const] : [])))} />, unique())
}

function footprintSvg(object: ThemeObject, cols: number, rows: number, cells: Cell[]): string {
  const w = cols * U
  const h = rows * U
  const px = Math.round(cols * 64)
  return renderToStaticMarkup(
    <svg viewBox={`-14 -14 ${w + 28} ${h + 28}`} width={px + 18} role="img" aria-label={`${object.name} ${cols}x${rows}`}>
      <rect x={0} y={0} width={w} height={h} fill="#f2d6ae" stroke="rgba(160,120,80,.35)" />
      <IconDepthScope>
        <Glyph object={object} cells={cells} />
      </IconDepthScope>
    </svg>,
    unique(),
  )
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const roomsFor = (o: ThemeObject): typeof SIMPSHOUSE_ROOMS => SIMPSHOUSE_ROOMS.filter((r) => r.roomTypes?.some((t) => o.allowedRoomTypes?.includes(t)))

/* ---- sample levels: pick, per size, the seed whose scene shows the most different fun objects ---- */
const FUN = new Set(SIMPSHOUSE_OBJECTS.filter((o) => isDraft(o) || ['beanbag', 'mannequin', 'clothesRack'].includes(o.kind)).map((o) => o.kind))
function funScore(scene: Scene): number {
  return new Set(scene.objects.map((o) => o.id.replace(/-\d+$/, '')).filter((k) => FUN.has(k))).size * 3 + scene.rooms.length + (scene.objects.some((o) => o.id.startsWith('rabbitHutch')) ? 6 : 0) + (scene.rooms.some((r) => r.name === 'Dance Floor') ? 4 : 0) + (scene.objects.some((o) => o.id.startsWith('yellowPlush')) ? 5 : 0) + (scene.rooms.some((r) => r.name === 'Card Room') ? 3 : 0)
}
function bestSeed(width: number, height: number, from: number): { seed: number; scene: Scene } {
  let best: { seed: number; scene: Scene; score: number } | undefined
  for (let seed = from; seed < from + 40; seed++) {
    const scene = generateScene({ width, height, theme, seed })
    const score = funScore(scene)
    if (!best || score > best.score) best = { seed, scene, score }
  }
  return best!
}
const LEVELS = [
  { label: 'Small, 6x6', ...bestSeed(6, 6, 100) },
  { label: 'Medium, 9x9', ...bestSeed(9, 9, 200) },
  { label: 'Large, 12x12', ...bestSeed(12, 12, 300) },
  { label: 'Large, 12x12 (second seed)', ...bestSeed(12, 12, 400) },
]

function levelHtml(level: (typeof LEVELS)[number]): string {
  const { scene } = level
  const counts = new Map<string, number>()
  for (const o of scene.objects) {
    const kind = o.id.replace(/-\d+$/, '')
    counts.set(kind, (counts.get(kind) ?? 0) + 1)
  }
  const chips = [...counts.entries()]
    .map(([kind, n]) => {
      const o = SIMPSHOUSE_OBJECTS.find((x) => x.kind === kind)!
      return `<span class="chip${isDraft(o) ? ' new' : ''}"><span data-l="en">${n} ${esc(o.name)}</span><span data-l="nl">${n} ${esc(OBJECT_NAMES_NL[kind] ?? o.name)}</span></span>`
    })
    .join(' ')
  const roomList = scene.rooms
    .map((r) => {
      const t = SIMPSHOUSE_ROOMS.find((x) => x.name === r.name)!
      return `<span data-l="en">${esc(t.name)}</span><span data-l="nl">${esc(t.nameNl)}</span>`
    })
    .join(', ')
  return `<section class="panel level">
  <div class="lh"><h3>${level.label}</h3><span class="tag">seed ${level.seed} · ${scene.rooms.length} rooms · ${scene.objects.length} objects</span></div>
  <div class="scene" data-l="en">${renderScene(scene, 'en', `${level.label} Simpshouse`)}</div>
  <div class="scene" data-l="nl">${renderScene(scene, 'nl', `${level.label} Simpshuis`)}</div>
  <p class="lead small">${roomList}</p>
  <p class="chips">${chips}</p>
</section>`
}

/* ---- rooms ---- */
const roomsHtml = SIMPSHOUSE_ROOMS.map((r) => {
  const fav = r.favours
    .map((k) => SIMPSHOUSE_OBJECTS.find((o) => o.kind === k)!)
    .map((o) => `<span class="chip${isDraft(o) ? ' new' : ''}"><span data-l="en">${esc(o.name)}</span><span data-l="nl">${esc(OBJECT_NAMES_NL[o.kind])}</span></span>`)
    .join(' ')
  return `<tr><td><b data-l="en">${esc(r.name)}</b><b data-l="nl">${esc(r.nameNl)}</b></td><td>${r.roomTypes!.join(', ')}</td><td class="chips">${fav}</td></tr>`
}).join('\n')

/* ---- objects ---- */
function objectHtml(o: ThemeObject): string {
  const tiles = o.footprints
    .map((f) => {
      const cols = Math.max(...f.cells.map((c) => c.col)) + 1
      const rows = Math.max(...f.cells.map((c) => c.row)) + 1
      return `<figure>${footprintSvg(o, cols, rows, f.cells)}<figcaption>${f.id}</figcaption></figure>`
    })
    .join('')
  const rooms = roomsFor(o)
    .map((r) => `<span data-l="en">${esc(r.name)}</span><span data-l="nl">${esc(r.nameNl)}</span>`)
    .join(', ')
  const art = isDraft(o) ? '<span class="chip new">new drawing</span>' : isOwnArt(o) ? '<span class="chip">art from another theme</span>' : '<span class="chip">engine icon</span>'
  const state = isOccupiableType(o.engineType) ? 'a person can stand on it' : 'blocks the square'
  return `<article class="obj${isDraft(o) ? ' isnew' : ''}">
  <div class="tiles">${tiles}</div>
  <div class="info">
    <h3><span data-l="en">${esc(o.name)}</span><span data-l="nl">${esc(OBJECT_NAMES_NL[o.kind])}</span></h3>
    <p class="lead small">${art} <code>${o.engineType}</code> · ${state}</p>
    <p class="small"><b data-l="en">Allowed in:</b><b data-l="nl">Mag in:</b> ${rooms}</p>
    <p class="lead small">${o.allowedRoomTypes!.join(', ')}</p>
  </div>
</article>`
}
const funObjects = SIMPSHOUSE_OBJECTS.filter((o) => isDraft(o))
const otherObjects = SIMPSHOUSE_OBJECTS.filter((o) => !isDraft(o))

const html = `<!doctype html>
<html lang="en" data-lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Simpshouse preview</title>
<meta name="robots" content="noindex">
<style>
:root { --bg: #f7f2e6; --fg: #2a2a36; --muted: #6b6a74; --surface: #fdf8ec; --line: #cbb994; --accent: #b3413e; --new: #c76aa6;
  --font: 'Avenir Next', 'Segoe UI', system-ui, sans-serif; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #1f1d24; --fg: #efe9dc; --muted: #a39f9a; --surface: #2a2730; --line: #4a4450; --accent: #e07b77; --new: #e08cc3; color-scheme: dark; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font-family: var(--font); padding: 28px 16px 64px; }
.wrap { max-width: 1040px; margin: 0 auto; display: grid; gap: 28px; } .wrap > * { min-width: 0; }
h1, h2, h3 { margin: 0; text-wrap: balance; }
h1 { font-size: clamp(1.7rem, 4vw, 2.3rem); line-height: 1.1; }
h2 { font-size: 1.3rem; } h3 { font-size: 1rem; }
p { margin: 0; line-height: 1.5; max-width: 70ch; }
.lead { color: var(--muted); } .small { font-size: .88rem; }
.tag { font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
.panel { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 16px; display: grid; gap: 12px; }
.bar { position: sticky; top: 0; z-index: 5; display: flex; gap: 8px; align-items: center; justify-content: space-between; background: var(--bg); padding: 8px 0; border-bottom: 1px solid var(--line); }
.bar nav { display: flex; gap: 14px; flex-wrap: wrap; font-size: .9rem; } .bar a { color: var(--fg); }
button.lang { font: inherit; font-weight: 600; padding: 8px 14px; border-radius: 8px; border: 0; background: var(--accent); color: #fff; cursor: pointer; min-height: 40px; }
button.lang:focus-visible, a:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
[data-lang="en"] [data-l="nl"], [data-lang="nl"] [data-l="en"] { display: none; }
table { width: 100%; border-collapse: collapse; font-size: .9rem; } td, th { text-align: left; padding: 8px 10px; border-top: 1px solid var(--line); vertical-align: top; }
th { font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); border-top: 0; }
.chip { display: inline-block; font-size: .78rem; padding: 2px 8px; border-radius: 99px; border: 1px solid var(--line); margin: 2px 2px 2px 0; }
.chip.new { border-color: var(--new); color: var(--new); font-weight: 600; }
.chips { line-height: 1.9; }
.objs { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
.obj { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 12px; display: grid; gap: 10px; align-content: start; }
.obj.isnew { border-color: var(--new); }
.tiles { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; } figure { margin: 0; text-align: center; } figcaption { font-size: .72rem; color: var(--muted); }
.info { display: grid; gap: 4px; }
.lh { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.scene { max-width: 760px; margin: 0 auto; width: 100%; } .scene svg { display: block; width: 100%; height: auto; }
.levels { display: grid; gap: 16px; }
code { font-size: .85em; }
ul.q { margin: 0; padding-left: 1.2em; line-height: 1.6; } ul.q li { max-width: 70ch; }
</style>
</head>
<body>
<div class="wrap">
  <div class="bar"><nav><a href="#rooms">Rooms</a><a href="#fun">New objects</a><a href="#objects">All objects</a><a href="#levels">Sample levels</a><a href="#ask">Questions</a></nav>
    <button class="lang" id="lang" type="button" aria-label="Switch language">NL</button></div>

  <header style="display:grid;gap:10px">
    <span class="tag">Preview, not shipped · SLAY-18.3 · Simpshouse day 2026-10-14</span>
    <h1><span data-l="en">Simpshouse: a glam, card-collecting friend-group house</span><span data-l="nl">Simpshuis: een glamoureus vriendenhuis vol ruilkaarten</span></h1>
    <p class="lead"><span data-l="en">${SIMPSHOUSE_ROOMS.length} rooms, ${SIMPSHOUSE_OBJECTS.length} objects (${funObjects.length} new drawings), and ${LEVELS.length} sample levels from the real scene generator on this draft theme. The language button switches the page and the room names on the boards between English and Dutch. Trading cards are generic: binders, a card table, no brand names or logos.</span><span data-l="nl">${SIMPSHOUSE_ROOMS.length} kamers, ${SIMPSHOUSE_OBJECTS.length} objecten (${funObjects.length} nieuwe tekeningen) en ${LEVELS.length} voorbeeldlevels uit de echte scenegenerator op dit conceptthema. De taalknop wisselt de pagina en de kamernamen op de borden tussen Engels en Nederlands. De ruilkaarten zijn algemeen: mappen, een kaartentafel, geen merknamen of logo's.</span></p>
  </header>

  <section id="rooms" class="panel"><h2><span data-l="en">Rooms</span><span data-l="nl">Kamers</span></h2>
    <p class="lead small"><span data-l="en">The room type is a hard rule (SLAY-17.1): an object only stands in rooms that share a type with its allowed list. The chips are what the room favours (a preference).</span><span data-l="nl">Het kamertype is een harde regel (SLAY-17.1): een object staat alleen in kamers die een type delen met zijn lijst. De labels zijn waar de kamer de voorkeur aan geeft.</span></p>
    <div style="overflow-x:auto"><table><thead><tr><th>Room</th><th>Type</th><th>Favours</th></tr></thead><tbody>
${roomsHtml}
    </tbody></table></div></section>

  <section id="fun" style="display:grid;gap:12px"><h2><span data-l="en">New objects (drawn for this theme)</span><span data-l="nl">Nieuwe objecten (getekend voor dit thema)</span></h2>
    <div class="objs">${funObjects.map(objectHtml).join('\n')}</div></section>

  <section id="objects" style="display:grid;gap:12px"><h2><span data-l="en">Other objects (existing art)</span><span data-l="nl">Overige objecten (bestaande tekeningen)</span></h2>
    <div class="objs">${otherObjects.map(objectHtml).join('\n')}</div></section>

  <section id="levels" style="display:grid;gap:12px"><h2><span data-l="en">Sample levels</span><span data-l="nl">Voorbeeldlevels</span></h2>
    <p class="lead small"><span data-l="en">Real output of <code>generateScene</code> (rooms, walls, doors, windows, objects with the depth look), with the draft theme. People and clues come from the unchanged puzzle stage and are not drawn here. Pink labels mark a new drawing.</span><span data-l="nl">Echte uitvoer van <code>generateScene</code> (kamers, muren, deuren, ramen, objecten met de dieptelook) met het conceptthema. Personen en aanwijzingen komen uit de ongewijzigde puzzelstap en staan hier niet. Roze labels zijn een nieuwe tekening.</span></p>
    <div class="levels">${LEVELS.map(levelHtml).join('\n')}</div></section>

  <section id="ask" class="panel"><h2><span data-l="en">What I need from you</span><span data-l="nl">Wat ik van je nodig heb</span></h2>
    <ul class="q">
      <li><span data-l="en">Approve the room list and the objects, or list changes (add, drop, rename).</span><span data-l="nl">Keur de kamerlijst en de objecten goed, of geef wijzigingen (erbij, eraf, andere naam).</span></li>
      <li><span data-l="en">Look at the new drawings at board size in the sample levels, not only the big tiles above.</span><span data-l="nl">Bekijk de nieuwe tekeningen op bordformaat in de voorbeeldlevels, niet alleen de grote tegels.</span></li>
      <li><span data-l="en">Clue wording: the clues name an object by its engine type, so the arcade cabinet reads as a "television", the disco ball and the mannequin as a "statue", the card table and bubble bath as a "table". That is how other themes work too. Fine, or should the new objects get their own words in clues (a bigger change)?</span><span data-l="nl">Aanwijzingen: ze noemen een object bij zijn motortype, dus de arcadekast leest als "televisie", de discobal en de paskop als "standbeeld", de kaartentafel en het bubbelbad als "tafel". Zo werken andere thema's ook. Goed zo, of moeten de nieuwe objecten eigen woorden krijgen (grotere ingreep)?</span></li>
      <li><span data-l="en">New room types: the draft needs <code>${NEW_ROOM_TYPES.join('</code> and <code>')}</code> added to <code>RoomType</code> (party rooms, and the balcony for the rabbit hutch). Draft only: the theme story adds them in src.</span><span data-l="nl">Nieuwe kamertypes: het concept heeft <code>${NEW_ROOM_TYPES.join('</code> en <code>')}</code> nodig in <code>RoomType</code> (feestkamers, en het balkon voor het konijnenhok). Alleen concept: de themastory voegt ze toe in src.</span></li>
    </ul></section>
</div>
<script>
(function () {
  var root = document.documentElement, btn = document.getElementById('lang');
  function set(l) { root.setAttribute('data-lang', l); root.lang = l; btn.textContent = l === 'en' ? 'NL' : 'EN'; }
  btn.addEventListener('click', function () { set(root.getAttribute('data-lang') === 'en' ? 'nl' : 'en'); });
  if (/[?&]lang=nl/.test(location.search)) set('nl');
})();
</script>
</body>
</html>
`

writeFileSync(join(here, 'preview.html'), html)
console.log('wrote preview.html', LEVELS.map((l) => `${l.label} seed ${l.seed}`).join('; '))

// The same checks src/content/themes/rooms.test.ts makes for every shipped theme, so the draft never drifts from the rules.
for (const o of SIMPSHOUSE_OBJECTS) {
  if (roomsFor(o).length === 0) throw new Error(`no room allows ${o.kind}`)
}
for (const r of SIMPSHOUSE_ROOMS) {
  for (const k of r.favours) {
    const o = SIMPSHOUSE_OBJECTS.find((x) => x.kind === k)
    if (!o) throw new Error(`${r.name} favours unknown ${k}`)
    if (!roomsFor(o).includes(r)) throw new Error(`${r.name} favours ${k}, which is not allowed there`)
  }
}
