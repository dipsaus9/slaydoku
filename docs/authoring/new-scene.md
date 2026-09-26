# Add a new scene (floor plan)

A scene is one hand-made floor plan on a grid (the demo scene is 9x9): rooms, furniture, doors and windows. It is a TypeScript file, for
example in `src/content/<name>/scene.ts`. The model is defined in `src/engine/model/types.ts`. The demo scene
[demo/scene.ts](../../src/content/demo/scene.ts) is the template. Read the rules first: [rules.md](rules.md).

Steps: draw the plan, write the scene file, validate it, write a test, wire it into the generator tools. Then continue with
[generate-verify-register.md](generate-verify-register.md).

## 1. Draw the plan on the grid

Snap the plan to squares. On a square grid of N x N the game has N people (N-1 suspects plus the gift), so N = 9 means 8 suspects. Decide
before you type:

- **Rooms.** Every wall between two rooms is a thick wall. Rooms can be L-shaped but must be connected. Outdoor areas (garden) are rooms too.
- **The gift room.** The gift (victim) must be alone with exactly one suspect, the murderer. So the room that holds the gift needs two free cells
  that share neither a row nor a column, and the room must not span so many rows that it always holds more people. A big open room fails:
  wall the bed or sofa area off into a small room. Rule 8 in [rules.md](rules.md).
- **Every row and column needs an occupiable cell**, or nobody can stand in that line (rule 3).
- **Gift cells.** Choose the cells where the gift may lie, always occupiable ones (bed, sofa, floor next to the bed). The demo scene puts it on the sofa.

## 2. Write the scene file

Pattern, from `demo/scene.ts`:

```ts
import type { FloorPattern } from '../../render/scene/index.ts'
import type { Cell, Scene } from '../../engine/model/index.ts'

// One letter per cell, row 0 on top. Map each letter to a room id.
const LAYOUT = [
  'KKKGGG',
  'KKKGGG',
  'KKKGGG',
  'SSSSGG',
  'SSSSHH',
  'SSSSHH',
]
const ROOM_IDS: Record<string, string> = { K: 'keuken', G: 'gang', S: 'slaapkamer', H: 'hal' }

const at = (row: number, col: number): Cell => ({ row, col })

export const myScene: Scene = {
  width: 6,
  height: 6,
  // Names carry their article: "de Keuken", "het Toilet". Clues read them as stored.
  rooms: [
    { id: 'keuken', name: 'de Keuken' },
    { id: 'gang', name: 'de Gang' },
    { id: 'slaapkamer', name: 'de Slaapkamer' },
    { id: 'hal', name: 'de Hal' },
  ],
  cellRooms: LAYOUT.map((line) => [...line].map((ch) => ROOM_IDS[ch]!)),
  objects: [
    { id: 'counter', type: 'kitchenCounter', cells: [at(0, 0), at(0, 1)] },
    { id: 'bed', type: 'bed', cells: [at(3, 0), at(4, 0)] },
    { id: 'plant', type: 'plant', cells: [at(5, 3)] },
  ],
  edgeFeatures: [
    { kind: 'door', cell: at(2, 2), side: 'east' },   // on the line between (2,2) and (2,3)
    { kind: 'window', cell: at(0, 3), side: 'north' },
  ],
}

/** Where the gift may lie. */
export const MY_SCENE_GIFT_CELLS: readonly Cell[] = myScene.objects.find((o) => o.id === 'bed')?.cells ?? []

/** Floor look per room: 'wood' | 'tiles' | 'grass' | 'water' | 'stone' | 'carpet'. */
export const myRoomStyles: Record<string, FloorPattern> = {
  keuken: 'tiles',
  gang: 'stone',
  slaapkamer: 'carpet',
  hal: 'tiles',
}
```

Rules for the pieces:

- **Room boundary = wall.** There is no "open" boundary between two rooms. An opening (a doorway) is a `door` on that grid line. A door or window
  names one cell and one `side`; on an inner line either neighbour may carry it, both mean the same line. Windows on outer walls are one feature
  per cell (a 3-wide window is three features).
- **Room names** must match `^(de|het) [A-Z]`. Use "het" for neuter nouns. Avoid names that read badly after "in de/het" in a sentence.
- **Objects** cover connected cells inside one room and never overlap. `type` is one of the engine object types (`OBJECT_TYPES` in
  `src/engine/model/catalog.ts`). The type decides everything about standing on it: occupiable types (chair, rug, bed, sofa, car, oilSlick,
  framedPainting) hold a person, all others block. Do not fake a piece of furniture with the wrong type; add a type instead
  ([theme-and-icons.md](theme-and-icons.md)).
- **Footprint must have art.** Each object's cell shape must match an icon footprint of its type (in any rotation or mirror), or it will not be
  drawn. Check with `hasIcon(type, cells)`, and see the allowed shapes per type on the contact sheet (`bun tools/icon-sheet.ts`). Catalog
  footprint ranges are in `OBJECT_CATALOG`: for example a `cabinet` covers 1 to 3 cells, `desk` 2 to 3, a `bed` 2 or 4. No scene uses `stairs`:
  nobody can stand on them and they made confusing clues.
- **Keep furniture from starving a line.** Every row and column must keep a free cell (rule 3); large blocking objects (counters) are what breaks this.
- **Explain deviations in the header comment**, like the demo scene does.

## 3. Validate

Structural check (empty array = valid) plus the admissibility check that proves the scene can host a legal placement and lists the rooms that can
hold the gift:

```sh
bun -e "
import { checkScene } from './src/engine/model/index.ts'
import { checkAdmissible } from './src/engine/scenegen/index.ts'
import { demoScene } from './src/content/demo/scene.ts'
console.log(checkScene(demoScene))
const a = checkAdmissible(demoScene)
console.log(a.ok, a.victimRooms)
"
```

Swap in your own import. `checkScene` messages name the JSON path (`scene.objects[3].cells`, ...). Your gift room must appear in `victimRooms`,
otherwise no puzzle can put the gift there.

## 4. Write a scene test

Prove, for your scene: it is valid and survives a JSON round trip (`checkScene`, `parseScene`, `serializeScene`); objects are classified
occupiable or blocking as intended (`isOccupiableType`); `hasIcon(type, cells)` is true for every object; every room has a floor style; the gift
cells are occupiable; every row and column keeps an occupiable cell, and a valid placement exists for each gift cell. Run it alone with
`bunx vitest run src/content/<name>/scene.test.ts`.

## 5. Wire it into the tools

`bun run generate`, the tier generator and the ladder tools only know scenes by name from a `builtins` map. Add your scene to all of them:

- `tools/generate.ts`
- `tools/ladder.ts` and `tools/screen-level.ts` (the ladder generator)
- `src/engine/generator/tiers/main.ts`

```ts
import { myScene } from '../src/content/my-scene/scene.ts'   // tools/ path; use ../../../content/... in tiers/main.ts
const builtins: Record<string, Scene> = {
  demo: demoScene,
  'my-scene': myScene,
}
```

Also update the usage strings (`GENERATE_USAGE` in `src/engine/generator/cli.ts`, `TIER_USAGE` in `src/engine/generator/tiers/cli.ts`, `LADDER_USAGE`
in `src/engine/generator/ladder/cli.ts`).

Without touching those files you can still try a scene as a JSON file: write it out with `serializeScene` and pass the path to `--scene`; the tools
accept a JSON path or a puzzle file (its scene is used).

```sh
bun -e "
import { serializeScene } from './src/engine/model/index.ts'
import { demoScene } from './src/content/demo/scene.ts'
await Bun.write('/tmp/scene.json', serializeScene(demoScene))
"
bun run generate --scene /tmp/scene.json --seed 2 --victim 9,7 --out /tmp/puzzle.json
```

Next: [generate-verify-register.md](generate-verify-register.md).

## After the scene is in a shipped level

The puzzle JSON embeds a copy of the scene. Editing a scene later (moving a plant, renaming a room) therefore means regenerating and re-picking the
puzzle for that level. Do all scene changes before you screen seeds.
