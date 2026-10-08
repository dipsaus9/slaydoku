// Writes the four seasonal theme previews: `bun tools/seasonal-previews.tsx [--check]`.
// Output: docs/themes/seasonal/{fall,carnaval,christmas,halloween}.html, self-contained (open them in a browser, no build).
// Every sample level is made by the real generators (generateSceneDetailed + generateWithReport) on the draft theme data in
// docs/themes/seasonal/*.theme.ts. With --check it only runs the checks (room rules, every kind placeable, a seed sweep) and writes nothing.
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { generateWithReport } from '../src/engine/generator/index.ts'
import { isOccupiableType } from '../src/engine/model/index.ts'
import type { Cell, Placement, Scene } from '../src/engine/model/index.ts'
import { generateSceneDetailed } from '../src/engine/scenegen/generate.ts'
import { resolveVariant } from '../src/render/icons/resolve.ts'
import { SolidGlyph } from '../src/render/looks/Solids.tsx'
import { solidFor } from '../src/render/looks/solid.ts'
import type { ThemeIconId } from '../src/render/icons/themes/types.ts'
import { U } from '../src/render/icons/art/tokens.ts'
import { SceneView } from '../src/render/scene/index.ts'
import type { SceneGeometry } from '../src/render/scene/index.ts'
import type { FloorPattern } from '../src/render/scene/roomStyles.ts'
import { SEASONAL_ICONS, type SeasonalIconId } from '../docs/themes/seasonal/art.tsx'
import { CARNAVAL_THEME } from '../docs/themes/seasonal/carnaval.theme.ts'
import { CHRISTMAS_THEME } from '../docs/themes/seasonal/christmas.theme.ts'
import { OBJECT_NAMES_NL, toSceneTheme, type SeasonalObject, type SeasonalTheme } from '../docs/themes/seasonal/common.ts'
import { FALL_THEME } from '../docs/themes/seasonal/fall.theme.ts'
import { HALLOWEEN_THEME } from '../docs/themes/seasonal/halloween.theme.ts'

const OUT_DIR = resolve(import.meta.dirname, '../docs/themes/seasonal')

interface Look {
  file: string
  theme: SeasonalTheme
  accent: string
  accentSoft: string
  /** Sample levels: size and the seed to start searching from. */
  levels: { size: number; seed: number }[]
  notes: { en: string[]; nl: string[] }
}

const LOOKS: Look[] = [
  {
    file: 'fall',
    theme: FALL_THEME,
    accent: '#b8571f',
    accentSoft: '#fbeadb',
    levels: [{ size: 6, seed: 11 }, { size: 9, seed: 21 }, { size: 9, seed: 31 }, { size: 12, seed: 41 }],
    notes: {
      en: ['Runs 1-16 October and every November day except the 11th (the 11th is left out on purpose).', 'No vehicles at all: the farm has a bicycle and nothing else on wheels.', 'Hay bale and leaf pile are floor objects a person can stand on; pumpkins, trees and toadstools block.'],
      nl: ['Loopt van 1 tot en met 16 oktober en alle novemberdagen behalve de 11e.', 'Geen voertuigen: alleen een fiets.', 'Hooibaal en bladerhoop zijn vloerobjecten waar iemand op kan staan; pompoenen, bomen en paddenstoelen blokkeren.'],
    },
  },
  {
    file: 'carnaval',
    theme: CARNAVAL_THEME,
    accent: '#c8352f',
    accentSoft: '#fdf1c9',
    levels: [{ size: 6, seed: 12 }, { size: 9, seed: 22 }, { size: 9, seed: 32 }, { size: 12, seed: 42 }],
    notes: {
      en: ['Oeteldonk is the carnival name of Den Bosch: red, white and yellow, the frog, the kroeg, confetti, the optocht.', 'The frog wears a red, white and yellow scarf. No brand logos and no real beer labels anywhere.', 'The parade float counts as a vehicle: never in a sleeping room.', 'Dates are not decided here; the owner picks them.'],
      nl: ['Oeteldonk is de carnavalsnaam van Den Bosch: rood, wit en geel, de kikker, de kroeg, confetti, de optocht.', 'De kikker draagt een rood-wit-gele sjaal. Geen merklogo\'s en geen echte bieretiketten.', 'De praalwagen telt als voertuig: nooit in een slaapkamer.', 'De datums staan hier niet vast; die kiest de eigenaar.'],
    },
  },
  {
    file: 'christmas',
    theme: CHRISTMAS_THEME,
    accent: '#a82a2f',
    accentSoft: '#e3f1e6',
    levels: [{ size: 6, seed: 13 }, { size: 9, seed: 23 }, { size: 9, seed: 33 }, { size: 12, seed: 43 }],
    notes: {
      en: ['Runs all of December, so there are 18 rooms (the brief asked for at least 15): no board repeats the same rooms for long.', 'The sleigh is the one vehicle: never in a sleeping room.', 'Fireplace and hay bale are shared with the Fall draft (same art).'],
      nl: ['Loopt de hele december, dus 18 kamers (minimaal 15 gevraagd).', 'De slee is het enige voertuig: nooit in een slaapkamer.', 'Open haard en hooibaal delen hun tekening met het herfstconcept.'],
    },
  },
  {
    file: 'halloween',
    theme: HALLOWEEN_THEME,
    accent: '#d2691b',
    accentSoft: '#e6dff2',
    levels: [{ size: 6, seed: 14 }, { size: 9, seed: 24 }, { size: 9, seed: 34 }, { size: 12, seed: 44 }],
    notes: {
      en: ['Runs 17-31 October. Playful, not scary: friendly ghosts, candy, cobwebs, a cauldron; no blood, no weapons.', 'Coffins are beds, so they live only in sleeping rooms (the Vampire Bedroom and the Crypt).', 'Jack-o-lantern faces turn with the object, like all engine art.'],
      nl: ['Loopt van 17 tot en met 31 oktober. Speels, niet eng: vriendelijke spoken, snoep, spinnenwebben, een ketel; geen bloed, geen wapens.', 'Doodskisten zijn bedden, dus alleen in slaapkamers (Vampierenslaapkamer en Crypte).', 'De gezichten van de pompoenlantaarns draaien mee met het object.'],
    },
  },
]

let prefixCounter = 0
const nextPrefix = (): string => `p${++prefixCounter}-`

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const kindOf = (id: string): string => id.replace(/-\d+$/, '')

/* ---------------- checks ---------------- */

const SWEEP_SIZES = [6, 7, 9, 12]

interface Checked {
  scenes: number
  placements: number
  bad: string[]
}

function checkTheme(draft: SeasonalTheme): Checked {
  const bad: string[] = []
  const sceneTheme = toSceneTheme(draft)
  const rooms = new Map(draft.rooms.map((r) => [r.name, r]))
  const kinds = new Map(draft.objects.map((o) => [o.kind, o]))
  for (const o of draft.objects) {
    if (!OBJECT_NAMES_NL[o.kind]) bad.push(`no Dutch name for ${o.kind}`)
    if (!draft.rooms.some((r) => o.allowedRoomTypes.some((t) => r.roomTypes.includes(t)))) bad.push(`${o.kind} has no allowed room`)
    if (o.themeIcon && !(o.themeIcon in SEASONAL_ICONS) && !['clothesRack', 'mannequin'].includes(o.themeIcon)) bad.push(`${o.kind}: unknown icon ${o.themeIcon}`)
    for (const f of o.footprints) {
      if (!iconFor(o, f.cells)) bad.push(`${o.kind}: footprint ${f.id} has no art`)
    }
  }
  for (const r of draft.rooms) {
    for (const k of r.favours) {
      const o = kinds.get(k)
      if (!o) bad.push(`${r.name} favours unknown kind ${k}`)
      else if (!o.allowedRoomTypes.some((t) => r.roomTypes.includes(t))) bad.push(`${r.name} favours ${k} but does not allow it`)
    }
  }
  let scenes = 0
  let placements = 0
  for (const size of SWEEP_SIZES) {
    for (let seed = 1; seed <= 25; seed++) {
      let scene: Scene
      try {
        scene = generateSceneDetailed({ width: size, height: size, theme: sceneTheme, seed }).scene
      } catch (error) {
        bad.push(`${size}x${size} seed ${seed}: ${(error as Error).message}`)
        continue
      }
      scenes++
      for (const obj of scene.objects) {
        const o = kinds.get(kindOf(obj.id))
        const cell = obj.cells[0] as Cell
        const room = rooms.get(scene.rooms.find((r) => r.id === scene.cellRooms[cell.row]?.[cell.col])?.name ?? '')
        placements++
        if (!o || !room) bad.push(`${size}x${size} seed ${seed}: ${obj.id} unknown`)
        else if (!o.allowedRoomTypes.some((t) => room.roomTypes.includes(t))) bad.push(`${size}x${size} seed ${seed}: ${obj.id} in ${room.name}`)
        else if (o.excludeRoomTypes?.some((t) => room.roomTypes.includes(t))) bad.push(`${size}x${size} seed ${seed}: ${obj.id} excluded from ${room.name}`)
      }
    }
  }
  return { scenes, placements, bad }
}

/* ---------------- drawing ---------------- */

function iconFor(o: Pick<SeasonalObject, 'themeIcon' | 'engineType'>, cells: readonly Cell[]) {
  if (o.themeIcon && o.themeIcon in SEASONAL_ICONS) return resolveVariant(SEASONAL_ICONS[o.themeIcon as SeasonalIconId], cells)
  return true
}

/** One object's art for `cells`: draft art from this folder, else the engine's own icon. */
// oxlint-disable-next-line react/only-export-components -- a script, not an app module
function Glyph({ object, cells }: { object: Pick<SeasonalObject, 'themeIcon' | 'engineType'>; cells: readonly Cell[] }): ReactNode {
  if (object.themeIcon && object.themeIcon in SEASONAL_ICONS) {
    const icon = resolveVariant(SEASONAL_ICONS[object.themeIcon as SeasonalIconId], cells)
    if (!icon) return null
    const [a, b, c, d, e, f] = icon.matrix
    return (
      <g data-theme-icon={object.themeIcon} transform={`matrix(${a} ${b} ${c} ${d} ${e} ${f})`}>
        {(icon.variant as unknown as { draw: () => ReactNode }).draw()}
      </g>
    )
  }
  // Drafts above are still flat (SLAY-18.6 to 18.9 redraw them as blocks); everything registered is a block model.
  const solid = solidFor(object.engineType, object.themeIcon as ThemeIconId | undefined, cells)
  return solid ? <SolidGlyph solid={solid} /> : null
}

function footprintBox(cells: readonly Cell[]): { cols: number; rows: number } {
  return { cols: Math.max(...cells.map((c) => c.col)) + 1, rows: Math.max(...cells.map((c) => c.row)) + 1 }
}

function iconSvg(object: SeasonalObject, cells: readonly Cell[]): string {
  const { cols, rows } = footprintBox(cells)
  const svg = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`-8 -8 ${cols * U + 16} ${rows * U + 24}`} width={cols * 64 + 8} height={rows * 64 + 12} role="img" aria-label={object.name}>
      <rect x={0} y={0} width={cols * U} height={rows * U} rx={6} fill="#f7f0e0" stroke="#e3d6bb" strokeWidth={2} />
      <Glyph object={object} cells={cells} />
    </svg>
  )
  return renderToStaticMarkup(svg, { identifierPrefix: nextPrefix() })
}

const PERSON_COLOURS = ['#5b8fd6', '#d9822b', '#7c5cbf', '#2f9e7a', '#c2527a', '#8a7a2b', '#3d8fb5', '#b5543a', '#6a8f3a', '#9b6bb0', '#c28a2b']

function boardSvg(scene: Scene, draft: SeasonalTheme, solution: readonly Placement[], locale: 'en' | 'nl'): string {
  const byName = new Map(draft.rooms.map((r) => [r.name, r]))
  const byKind = new Map(draft.objects.map((o) => [o.kind, o]))
  const floors: Record<string, FloorPattern> = {}
  for (const room of scene.rooms) floors[room.id] = byName.get(room.name)?.floor ?? 'wood'
  // The engine looks Dutch room names up in the registered themes; drafts are not registered, so the Dutch board is the same scene with Dutch room names.
  const shown: Scene = locale === 'nl' ? { ...scene, rooms: scene.rooms.map((r) => ({ ...r, name: byName.get(r.name)?.nameNl ?? r.name })) } : scene
  const objectsLayer = (geometry: SceneGeometry): ReactNode => (
    <>
      {scene.objects.map((obj) => {
        const o = byKind.get(kindOf(obj.id))
        const top = Math.min(...obj.cells.map((c) => c.row))
        const left = Math.min(...obj.cells.map((c) => c.col))
        const { x, y } = geometry.cellRect({ row: top, col: left })
        return (
          <g key={obj.id} data-object={obj.id} transform={`translate(${x} ${y}) scale(${geometry.cellSize / U})`}>
            {o ? <Glyph object={o} cells={obj.cells} /> : null}
          </g>
        )
      })}
    </>
  )
  const peopleLayer = (geometry: SceneGeometry): ReactNode => (
    <g>
      {solution.map((p, i) => {
        const c = geometry.cellCenter(p.cell)
        const victim = p.personId === 'V'
        return (
          <g key={p.personId}>
            <circle cx={c.x} cy={c.y} r={geometry.cellSize * 0.3} fill={victim ? '#3a1d1d' : (PERSON_COLOURS[i % PERSON_COLOURS.length] as string)} stroke="#fff" strokeWidth={2.5} />
            <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central" fontFamily="system-ui, sans-serif" fontWeight={800} fontSize={geometry.cellSize * 0.3} fill="#fff">
              {victim ? '✕' : p.personId}
            </text>
          </g>
        )
      })}
    </g>
  )
  return renderToStaticMarkup(<SceneView scene={shown} roomStyles={floors} objectsLayer={objectsLayer} peopleLayer={peopleLayer} title={`${draft.name} ${scene.width}x${scene.height}`} />, { identifierPrefix: nextPrefix() })
}

interface Level {
  size: number
  seed: number
  rooms: number
  clues: number
  rating: string
  boards: { en: string; nl: string }
  used: string[]
}

function makeLevel(draft: SeasonalTheme, size: number, startSeed: number): Level {
  const theme = toSceneTheme(draft)
  for (let seed = startSeed; seed < startSeed + 60; seed++) {
    try {
      const { scene } = generateSceneDetailed({ width: size, height: size, theme, seed })
      // Wanted: a scene that shows several kinds of objects, so the owner sees the theme.
      const used = [...new Set(scene.objects.map((o) => kindOf(o.id)))]
      if (used.length < Math.min(draft.objects.length, size >= 9 ? 9 : 6)) continue
      const { puzzle, human } = generateWithReport(scene, { seed })
      return {
        size,
        seed,
        rooms: scene.rooms.length,
        clues: puzzle.clues.length,
        rating: human.rating?.label ?? 'unrated',
        boards: { en: boardSvg(scene, draft, puzzle.solution, 'en'), nl: boardSvg(scene, draft, puzzle.solution, 'nl') },
        used,
      }
    } catch {
      // Next seed: not every scene gives a puzzle.
    }
  }
  throw new Error(`no sample level for ${draft.id} ${size}x${size}`)
}

/* ---------------- page ---------------- */

const TYPE_LABEL: Record<string, string> = {
  sleeping: 'sleeping', wet: 'wet', utility: 'utility', garage: 'garage', kitchen: 'kitchen', living: 'living', dining: 'dining',
  study: 'study', fitness: 'fitness', storage: 'storage', circulation: 'hall', outdoor: 'outdoor', party: 'party', workshop: 'workshop',
  stable: 'stable', market: 'market', farm: 'farm', chapel: 'chapel', haunted: 'haunted', grave: 'grave',
}
const NEW_TYPES = ['outdoor', 'party', 'workshop', 'stable', 'market', 'farm', 'chapel', 'haunted', 'grave']

function page(look: Look, levels: Level[], checked: Checked): string {
  const { theme } = look
  const kinds = new Map(theme.objects.map((o) => [o.kind, o]))
  const roomsFor = (o: SeasonalObject) => theme.rooms.filter((r) => o.allowedRoomTypes.some((t) => r.roomTypes.includes(t)))
  const newIcons = new Set(theme.objects.flatMap((o) => (o.themeIcon && o.themeIcon in SEASONAL_ICONS ? [o.themeIcon] : [])))
  const usedTypes = new Set(theme.rooms.flatMap((r) => r.roomTypes).filter((t) => NEW_TYPES.includes(t)))
  const objectTotal = theme.objects.length

  const roomRows = theme.rooms
    .map(
      (r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.nameNl)}</td><td>${r.roomTypes.map((t) => `<span class="chip">${esc(TYPE_LABEL[t] ?? t)}</span>`).join(' ')}</td><td>${r.favours
        .map((k) => esc(kinds.get(k)?.name ?? k))
        .join(', ')}</td></tr>`,
    )
    .join('\n')

  const objectCards = theme.objects
    .map((o) => {
      const rooms = roomsFor(o)
      const art = o.footprints.map((f) => `<figure>${iconSvg(o, f.cells)}<figcaption>${esc(f.id)}</figcaption></figure>`).join('')
      const isNew = o.themeIcon && o.themeIcon in SEASONAL_ICONS
      return `<article class="obj">
  <header><h3>${esc(o.name)} <span class="nl">/ ${esc(OBJECT_NAMES_NL[o.kind] ?? '?')}</span></h3>
  <p class="meta">${isOccupiableType(o.engineType) ? 'a person can stand on it' : 'blocks, nobody stands on it'} &middot; ${esc(o.placement)}${o.maxPerRoom ? ` &middot; max ${o.maxPerRoom} per room` : ''} &middot; ${isNew ? '<b class="new">new drawing</b>' : o.themeIcon ? 'existing theme art' : 'existing engine art'}</p></header>
  <div class="art">${art}</div>
  <p class="rooms"><b>Allowed in:</b> ${rooms.map((r) => `<span class="t-en">${esc(r.name)}</span><span class="t-nl">${esc(r.nameNl)}</span>`).join(', ')}</p>
</article>`
    })
    .join('\n')

  const levelBlocks = levels
    .map(
      (lv, i) => `<section class="level">
  <h3>Level ${i + 1}: ${lv.size}x${lv.size} <span class="meta">${lv.rooms} rooms &middot; ${lv.clues} clues &middot; rated ${esc(lv.rating)} &middot; seed ${lv.seed}</span></h3>
  <div class="board t-en">${lv.boards.en}</div>
  <div class="board t-nl">${lv.boards.nl}</div>
  <p class="meta">Letters are the suspects, the cross is the victim: the puzzle's solution, shown here so you can see how the theme fills a board.</p>
</section>`,
    )
    .join('\n')

  const notes = (lang: 'en' | 'nl') => look.notes[lang].map((n) => `<li>${esc(n)}</li>`).join('')

  return `<!doctype html>
<html class="t-en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Slaydoku preview: ${esc(theme.name)}</title>
<style>
:root { color-scheme: light; --accent: ${look.accent}; --soft: ${look.accentSoft}; --ink: #2a211c; --paper: #fdf8ec; font: 15px/1.45 system-ui, 'Segoe UI', Roboto, sans-serif; color: var(--ink); background: var(--paper); }
body { margin: 0 auto; max-width: 1100px; padding: 16px 16px 64px; }
h1 { margin: 0 0 4px; font-size: 28px; color: var(--accent); }
h2 { margin: 36px 0 12px; padding: 8px 14px; border-radius: 10px; background: var(--soft); font-size: 20px; }
h3 { margin: 0; font-size: 16px; }
.nl, .meta { color: #6b5d52; font-weight: 400; font-size: 13px; }
.top { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; justify-content: space-between; }
.lang button { font: inherit; padding: 6px 14px; border: 2px solid var(--accent); background: #fff; color: var(--accent); cursor: pointer; }
.lang button:first-child { border-radius: 8px 0 0 8px; } .lang button:last-child { border-radius: 0 8px 8px 0; margin-left: -2px; }
.lang button[aria-pressed="true"] { background: var(--accent); color: #fff; }
.stats { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
.stats span { background: var(--soft); border-radius: 999px; padding: 4px 12px; font-weight: 600; }
.chip { display: inline-block; background: #efe6d2; border-radius: 6px; padding: 0 6px; font-size: 12px; }
table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; }
th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #eee3cc; vertical-align: top; }
th { background: #f3e8cf; }
.objs { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
.obj { background: #fff; border: 1px solid #eadfc6; border-radius: 12px; padding: 10px 12px; }
.obj p { margin: 4px 0; }
.art { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; padding: 6px 0; }
figure { margin: 0; text-align: center; font-size: 11px; color: #6b5d52; }
figure svg { display: block; }
.rooms { font-size: 13px; }
.new { color: var(--accent); }
.level { margin: 20px 0 32px; }
.board { background: #fff; border-radius: 12px; padding: 8px; max-width: 760px; margin-bottom: 8px; }
.board svg { display: block; }
.notes { background: #fff; border-left: 5px solid var(--accent); border-radius: 6px; padding: 8px 16px 8px 28px; }
.t-nl { display: none; }
body.nl .t-nl { display: revert; }
body.nl .t-en { display: none; }
.flag { margin-top: 12px; padding: 10px 14px; border: 2px dashed var(--accent); border-radius: 10px; }
</style>
</head>
<body>
<div class="top">
  <div><h1>${esc(theme.name)} <span class="nl">/ ${esc(theme.nameNl)}</span></h1>
  <div class="meta"><span class="t-en">Runs: ${esc(theme.season)}</span><span class="t-nl">Loopt: ${esc(theme.seasonNl)}</span></div></div>
  <div class="lang" role="group" aria-label="Language"><button type="button" aria-pressed="true" data-l="en">English</button><button type="button" aria-pressed="false" data-l="nl">Nederlands</button></div>
</div>
<p>${esc(theme.blurb)}</p>
<div class="stats"><span>${theme.rooms.length} rooms</span><span>${objectTotal} object kinds</span><span>${newIcons.size} new drawings</span><span>${levels.length} sample levels</span></div>
<ul class="notes"><span class="t-en">${notes('en')}</span><span class="t-nl">${notes('nl')}</span></ul>

<h2>Rooms</h2>
<table><thead><tr><th>Room (EN)</th><th>Kamer (NL)</th><th>Room types</th><th>Favoured objects</th></tr></thead><tbody>
${roomRows}
</tbody></table>

<h2>Objects and where they may stand</h2>
<p class="meta">Each card shows the art at every footprint the generator may use. "Allowed in" is the hard room rule (SLAY-17.1): the generator never breaks it.</p>
<div class="objs">
${objectCards}
</div>

<h2>Sample levels</h2>
<p class="meta">Made by the real scene generator and puzzle generator on the draft data in docs/themes/seasonal/${look.file}.theme.ts. The Dutch board only swaps the room labels.</p>
${levelBlocks}

<h2>Checks</h2>
<p>${checked.scenes} generated scenes (${SWEEP_SIZES.map((s) => `${s}x${s}`).join(', ')}, 25 seeds each) with ${checked.placements} placed objects: ${checked.bad.length === 0 ? '<b>0 placements outside the allow-lists</b>, every kind has a room, every favoured object is allowed in its room, every footprint has art.' : `<b>${checked.bad.length} problems</b>`}</p>
${usedTypes.size > 0 ? `<p class="meta">Promotion needs these new room types added to <code>RoomType</code>: ${[...usedTypes].map((t) => `<code>${esc(t)}</code>`).join(', ')}.</p>` : ''}
<div class="flag"><b>Owner check.</b> Approve or list changes for this theme. The story stays open until you do.</div>

<script>
document.querySelectorAll('.lang button').forEach(function (b) {
  b.addEventListener('click', function () {
    var nl = b.getAttribute('data-l') === 'nl';
    document.body.classList.toggle('nl', nl);
    document.documentElement.lang = nl ? 'nl' : 'en';
    document.querySelectorAll('.lang button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
  });
});
</script>
</body>
</html>
`
}

const checkOnly = process.argv.includes('--check')
let failed = false
for (const look of LOOKS) {
  const checked = checkTheme(look.theme)
  console.log(`${look.file}: ${look.theme.rooms.length} rooms, ${look.theme.objects.length} kinds, ${checked.scenes} scenes, ${checked.placements} placements, ${checked.bad.length} problems`)
  for (const b of checked.bad.slice(0, 20)) console.log(`  - ${b}`)
  if (checked.bad.length > 0) failed = true
  if (checkOnly) continue
  const levels = look.levels.map((l) => makeLevel(look.theme, l.size, l.seed))
  writeFileSync(resolve(OUT_DIR, `${look.file}.html`), page(look, levels, checked))
  console.log(`  wrote ${look.file}.html (levels: ${levels.map((l) => `${l.size}x${l.size} seed ${l.seed}`).join(', ')})`)
}
if (failed) process.exit(1)
