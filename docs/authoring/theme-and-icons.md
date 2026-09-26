# Add a theme, an object type or an icon

Three separate jobs, from small to large:

| Job | Touches |
|---|---|
| A. New **object kind in an existing theme** (a "hangmat" in the park) that reuses existing art | one theme file |
| B. New **theme-only icon** (own art for one theme's object, engine type unchanged) | `THEME_ICON_IDS`, art, registry, theme file |
| C. New **engine object type** (new catalog entry, art and Dutch noun; usable in house scenes and clues) | catalog, type list, Dutch noun, art, registry |
| D. New **scene theme** (a whole new set of rooms and objects for random boards) | new theme file, registry, tests, packs |

Look at what exists first. The contact sheet draws every icon in every footprint and rotation, and every theme object:

```sh
bun tools/icon-sheet.ts            # writes slaydoku-icon-sheet.html into the OS temp dir
bun tools/icon-sheet.ts /tmp/out.html   # or to a path you choose
```

```
Icon contact sheet written to /tmp/out.html
```

Open the printed file in a browser. Nothing generated lands in the repo unless you pick a path inside it.

## Preview a themed random scene

```sh
bun -e "
import { generateScene } from './src/engine/scenegen/index.ts'
import { checkScene } from './src/engine/model/index.ts'
const scene = generateScene({ width: 9, height: 9, theme: 'park', seed: 1 })
console.log(checkScene(scene))   // [] means valid
scene.cellRooms.forEach((row) => console.log(row.map((id) => id.padEnd(3)).join(' ')))
console.log(scene.rooms.map((r) => r.id + '=' + r.name).join(', '))
console.log(scene.objects.map((o) => o.type + '@' + o.cells.length).join(' '))
"
```

Size 6 to 16, theme one of `home`, `office`, `park`, `school`, `shop`. The same seed always gives the same scene.

## A. Add an object kind to a theme

Themes live in `src/content/themes/<theme>.ts` ([office.ts](../../src/content/themes/office.ts) is a compact example). An object is built
with `themeObject({...})`:

```ts
themeObject({ kind: 'bureaustoel', nameNl: 'bureaustoel', engineType: 'chair', themeIcon: 'officeChair',
              weight: 10, footprints: [rect(1, 1)], placement: 'anywhere' }),
```

| Field | Meaning |
|---|---|
| `kind` | Theme-local id, unique in the theme. Rooms refer to it in `favours`. |
| `nameNl` | Dutch display name. |
| `engineType` | The engine `ObjectType` it becomes in a scene. This decides occupiable or blocking (the flag is copied from the catalog, never typed by hand). |
| `themeIcon` | Optional own art ([job B](#b-add-a-theme-only-icon)). Without it the engine icon of `engineType` is drawn. |
| `weight` | Relative chance among objects of the same class (occupiable, blocking). |
| `footprints` | Shapes it may take: `rect(cols, rows, weight?)`, `lShape(arm, weight?)`. The generator rotates and mirrors them. |
| `placement` | `'wall'`, `'corner'`, `'centre'` or `'anywhere'`. |
| `maxPerRoom` | Optional cap per room. |

Every footprint must be drawable: the icon of `engineType` (or of your `themeIcon`) must have a variant with that shape in some
rotation, and the cell count must be inside the catalog range for the type (`OBJECT_CATALOG[type].footprint`).
Add the new `kind` to the `favours` list of at least one room, so it appears.

Test: `bunx vitest run src/content/themes/themes.test.ts`. It checks per theme, among others: at least 6 occupiable and 6 blocking
kinds, unique kinds, occupiable flag from the catalog, positive weights, connected footprints in the catalog size range,
"has an icon for every object at every footprint", `favours` only naming own kinds, at most 3 unfavoured kinds, and that one
object of every kind builds a valid scene.

## B. Add a theme-only icon

1. Add the id to `THEME_ICON_IDS` in `src/render/icons/themes/types.ts`.
2. Draw it in `src/render/icons/themes/art.tsx`: a function returning SVG, in the coordinates below.
3. Register its footprints in `src/render/icons/themes/registry.ts`:
   `myIcon: define('myIcon', [[1, 1], [2, 1]], art.myIcon)` (sizes are `[cols, rows]`; the function receives `cols` and `rows`).
4. Point a theme object at it with `themeIcon: 'myIcon'` (job A).

Tests: `bunx vitest run src/render/icons/themes/themes.test.tsx` requires every id to be defined with at least one footprint and no
duplicate variants, every variant to draw something and stay inside its own cells (stroke included), and every footprint to
resolve under every rotation and mirror.

## C. Add an engine object type

Use this when the object should exist in house scenes, in clues ("naast een fiets") and everywhere. Steps 1 to 4 are all needed;
`bun run typecheck` fails until every record is complete (`OBJECT_CATALOG`, `OBJECTS_NL` and `ICON_DEFINITIONS` are typed
`Record<ObjectType, ...>`).

1. `src/engine/model/types.ts`: add the name to the `ObjectType` union (English camelCase, like `bicycle`; only the noun in step 3 is Dutch).
2. `src/engine/model/catalog.ts`: add to `OBJECT_CATALOG`: `{ occupiable: true|false, footprint: cells(min, max) }`. Occupiable means a person may stand on it (chair, rug,
   bed, sofa, car, oil slick, painting); everything else blocks. Do not change the flag of an existing type: the
   committed puzzles depend on it.
3. `src/engine/clues/nl.ts`: add to `OBJECTS_NL` (for `bicycle`): `{ noun: 'fiets', on: 'op een fiets', verb: 'stond' }`. `on` is the
   phrase after "stond" ("in een auto", "op een bed"), `verb` is `stond`, `zat` or `lag`. This is the only file with Dutch clue text.
4. Art in `src/render/icons/art/house.tsx`, `living.tsx` or `outdoor.tsx`, and its footprints in `src/render/icons/registry.tsx`:

   ```ts
   bicycle: { type: 'bicycle', variants: rects([[2, 1]], house.bicycle) },
   ```

   `rects(sizes, draw)` makes one variant per `[cols, rows]`; use `lShape(arm)` for L shapes. Only list one orientation
   (facing south): rotations and mirrors are derived.
5. If the catalog gives a footprint range, every drawn variant must have a cell count inside it (tested).

Then run `bunx vitest run src/engine/model/catalog.test.ts src/render/icons/icons.test.tsx src/engine/clues/nl.test.ts` and `bun run typecheck`.
The tests check that the catalog, the icon registry and the Dutch nouns cover the same type list (the object lists come from the
catalog), that a type has an icon with at least one footprint, that variants stay inside their cells, and that every type renders
in `onObject` and `besideObject` sentences.

Old committed puzzles keep working: adding a type changes nothing for existing scenes. If you add the type to a theme, packs need
regenerating ([regenerate-packs.md](regenerate-packs.md)).

### Drawing conventions

- One grid cell is 100 x 100 units (`U` in `src/render/icons/art/tokens.ts`). A footprint of `cols x rows` cells is drawn in a
  `cols*100` by `rows*100` box, facing south (the front of the object is at the bottom).
- Everything, stroke included, stays inside the cells of the footprint. Leave `M` (6 units) to the cell edge. For an L shape
  or other non-rectangular footprints, stay inside the occupied cells only. A test measures this.
- Use the primitives from `art/shapes.tsx`: `Box`, `Disc`, `Oval`, `Stroke`, `Shape` (`Shape` takes absolute path data using
  `M L H V C Q Z` only; the bounds test reads it).
- Use the flat palette `C` and the widths `SW` (outline) and `DETAIL` (inner lines) from `tokens.ts`. Theme-only icons may add
  colours in the local `T` palette of `themes/art.tsx`. Own art only: never trace official Murdoku artwork.
- Art never shows whether an object is occupiable; the legend groups by the catalog flag.

## D. Add a scene theme

1. `src/content/themes/types.ts`: add the id to the `ThemeId` union.
2. New file `src/content/themes/<id>.ts` exporting a `SceneTheme` (`id`, `nameNl` shown in pack titles, `rooms`, `objects`); copy
   [office.ts](../../src/content/themes/office.ts). Requirements, all tested by
   [themes.test.ts](../../src/content/themes/themes.test.ts):
   - at least 16 unique Dutch room names (a 16x16 board uses up to that many); each room lists the object kinds it `favours`;
   - at least 6 occupiable and 6 blocking object kinds;
   - the rules of job A for every object.
3. Register it in `src/content/themes/index.ts` (`SCENE_THEMES`, and the export list).
4. `src/content/themes/themes.test.ts`: the list `REQUIRED` and the test name "defines the five required themes" name all themes exactly;
   add yours.
5. Room names are stored with an article in packs ("de Keuken", "het Toilet"). Every noun is "de" unless it is in `HET_ROOMS`
   or ends in "lokaal" (`src/content/packs/articles.ts`). Add your neuter room names to `HET_ROOMS`. A name that reads badly after
   "in" goes in `RENAMED`. The pack test checks every theme room name gets an article
   ([packs.test.ts](../../src/content/packs/packs.test.ts)).
6. Preview scenes with the snippet at the top of this page, then regenerate the packs. `packs.test.ts` requires every theme in every
   (size, tier) file ("covers every theme in every (size, tier)"), so a new theme fails the tests until the packs are rebuilt:
   [regenerate-packs.md](regenerate-packs.md). Check the folder size stays under 4 MiB.
7. `bun run lint`, `typecheck` and `test`.
