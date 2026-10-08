# 3D object look (SLAY-17.3, spike)

Question: can the board objects look more 3D than "flat 2D art with a bevel and a shadow" (SLAY-16, `docs/design/depth.md`)? The prototype is `docs/design/looks-prototype.html` (open it in a browser, no build). Screenshots of the current state are in `docs/design/looks-shots/`.

Common to every variant: the effect is drawn in screen space, outside the orientation transform (same rule as `IconDepthGroup`), so light stays top-left and depth points bottom-right in all 8 orientations (4 rotations, plain and mirrored). Art stays original, nothing is baked in.

## Round 1 (owner feedback: A is the right direction, B and C are out)

| | A. Block | B. Steps (rejected) | C. Relief (rejected) |
|---|---|---|---|
| Idea | The 2D drawing, from above, extruded as a darker block toward bottom-right | Each part with its own height and side wall | Lit shapes: diffuse and specular lighting on a bump map |
| Why it lost | Kept: the only one that gives volume without redrawing | Still flat-from-above, tall walls hid parts below (sofa cushions, chair seat) | Busy at small sizes, costliest filter |

Owner: all three still feel like "flat 2D with shadows". They want a real viewing angle, built on A (a blocky volume).

## Round 2: A2 and A3, blocks with a real viewing angle

Both use the same 3D model per object: axis-aligned blocks (and cylinders for plant and lamp), 100 units per cell, z up. The model is rotated and mirrored in 3D first and projected afterwards, so a chair turned 180 degrees shows the back of its backrest, light stays top-left (top face brightest, front face 80 percent, right face 62 percent) and the ground shadow falls bottom-right. The camera is at the +x, +y, +z corner for both; objects are drawn back to front (a topological sort on the blocks, and on the objects), a rug (flat) is always drawn first.

| | A (Block, round 1) | A2. Oblique | A3. Isometric |
|---|---|---|---|
| View | From above, extrusion drawn by a filter | Fixed oblique view from the front and above: `screen = (x - 0.22 z, y - 0.7 z)`. Top, front and right side visible; the floor stays a grid of square cells | 30 degree isometric: `screen = ((x - y) 0.69, ((x + y) 0.5 - z) 0.8)`. Cells become diamonds |
| Looks 3D | Slightly, "thick cardboard" | Clearly: legs, seat and backrest stand up, the bookshelf shows its front with books, the bed has a headboard | Strongest, reads as a small diorama |
| Data per object | One number (`H`) | Blocks with heights, see below | Same blocks as A2 |
| Board geometry | Unchanged (margin 12 to 14) | Cells stay square. Tall parts rise over the cell behind: chair back about 55 units, sofa 45, bookshelf 59, bed head 42. The top row needs about 60 units of extra margin on top | The whole board changes: diamond cells, width of a 12x12 board 1.4 times larger, the vertical resolution drops to 0.8 |
| Hit areas | Footprint cells | Keep the footprint cells (the tap target is the cell, not the raised art) | Diamond hit areas, own hit testing |
| Room labels and walls | Unchanged | Labels sit in the cell row above a tall object's silhouette: need a z-order above objects or a shift down, walls get a front face | Labels and walls along the diagonals: redo `labels.ts` and the wall layer |
| Legend swatch | 8 units of padding right and below (SLAY-16.10) | About 60 units of padding on top plus 8 on the right | A swatch is a diamond with its own bounding box |
| Draw order | None needed | Back to front per object (sort by row, then column); needed because tall parts overlap the row behind | Same, but the order is diagonal |
| Phone (40 px per cell) | Fine | Fine, the 8x5 furnished floor stays readable; a chair is about 40 x 55 px | Readable but small: diamond 55 x 32 px per cell, objects about 28 percent smaller on a fixed screen width |
| Cost | One filter | One SVG of polygons per object, about 8 blocks per object on average, the bookshelf row of books is generated | Same models as A2, 53 drawings to model (40 engine objects plus 13 theme drawings): about 400 block definitions. The projection and sort are shared code |
| Risk | Margin only | Tall objects hide cells behind them: any mark, hint or person marker on the cell above a tall object must be drawn above it. Needs a rule that objects up to about 60 units high are fine | Largest: the whole board renderer, hit testing, zoom and labels |

Block counts per object in the prototype: chair 7, rug 3, table 6, sofa 10, bed 5 (2x2: 6), bathtub 3, plant 4 cylinders, lamp 4 cylinders, bookshelf 3x1 about 64 (4 boards, 2 sides, back, 3 rows of generated books).

## Recommendation

A2. It gives the real viewing angle the owner asked for (visible top, front and side, objects that stand up) while the board stays a grid of square cells, so geometry, hit areas, labels and the legend change in size only. The costs are the extra top margin, back-to-front drawing and a model of blocks per object.

A3 is the strongest 3D candidate and uses the same models as A2, so it is the next step if A2 is still too flat: choosing A2 first does not lose the A3 work (the models carry over, only the projection and the board layout change). It is not the recommended first step because it rewrites the board renderer and shrinks objects on a phone.

Porting (a follow-up story, not part of this spike): add a block model per object to the icon registry, a `project(x, y, z)` function, and replace `ICON_DEPTH_FILTER` with a polygon renderer that keeps the orientation, sort and shadow rules above.

## Decision

Owner, 2026-10-08: "Zouden we hier niet voor kiezen om allebei uit te werken? Ik vind isometrisch heel mooi maar speelt misschien onhandig. Anders wordt schuin de optie."

- Both A2 (oblique, square grid) and A3 (isometric, diamond grid) go on to the in-app proof of concept SLAY-17.8, behind an Options switch. The final pick is made there.
- A (round 1, the block) is the base of both. B and C stay rejected.
- The owner finds isometric very beautiful but fears it plays awkwardly. A3 is therefore judged on playability: tap targets including corners, a 12x12 board on a phone, labels and walls, and overlap of tall objects. A2 is the fallback if A3 plays badly.
- The bathtub water must clearly read as water (owner remark; see the SLAY-17.4 and SLAY-17.8 criteria). In the prototype it is a flat pale-blue slab, which is not enough.

Chosen look: A2 and A3 carried to the PoC (SLAY-17.8); final pick there.

## In-app proof of concept (SLAY-17.8)

Branch `SLAY-17.8/preview-look-poc` (a Vercel preview, see the PR). Options has an entry **Look** (Now / A2 / A3, EN and NL), stored on the device in `slaydoku:look`, default Now. It shows only in dev, on `localhost` and on `*.vercel.app` preview hosts, never on `slaydoku.vercel.app` or `slaydoku.nl` (`lookSwitchAllowed` in `src/render/looks/look.ts`); on any other host the look is forced to Now even if a value is stored.

What is drawn in the new looks: chair, sofa (straight, 2x1 and 3x1), bed (1x2 and 2x2), bookshelf, table, rug and plant, from the prototype's block models (`src/render/looks/models.ts`, turned with the same orientation matrix as the flat art). Every other object, the L-shaped sofas and objects with their own theme art stay flat in all looks (in A3 the flat art lies skewed on the floor). There is no lamp and no bathtub object kind in the app, so neither is on the board; the bathtub model exists in `models.ts` with the water fixed (see below) for SLAY-17.4.

How it is built: A2 only adds headroom above the grid and draws the blocks at the footprint's top-left, the grid, hit squares, notes and people are untouched. A3 lays the existing flat layers (floor, grid, walls, doors and windows, X marks, hints, hit squares) onto a diamond with one SVG `matrix()` (`geometry.planeTransform`), and draws what must stand up straight (blocks, people, candidate letters, room labels, axis labels) on screen at the projected cell centres (`geometry.upright`). Hit testing is the unchanged `elementFromPoint` on the transformed squares. Room labels stay above marks and people with the halo (SLAY-17.5) in all three looks; the driver checks the DOM order on a crowded board.

### Tap target sizes (screen px, middle cell, headless Chrome at 2x; `docs/verification/looks.ts`)

| viewport | board | Now and A2 (square cell) | A3 (diamond: bounding box, biggest circle inside) |
|---|---|---|---|
| 360x640 | 9x9 | 35 x 35 | 35 x 20, circle 17 |
| 360x640 | 12x12 | 27 x 27 | 27 x 15, circle 13 |
| 390x844 | 9x9 | 38 x 38 | 38 x 22, circle 19 |
| 390x844 | 12x12 | 29 x 29 | 29 x 17, circle 14 |
| 768x1024 | 9x9 | 66 x 66 | 65 x 38, circle 33 |
| 768x1024 | 12x12 | 50 x 50 | 50 x 29, circle 25 |
| 1024x768 | 9x9 | 67 x 67 | 66 x 38, circle 33 |
| 1024x768 | 12x12 | 51 x 51 | 51 x 29, circle 25 |

(The board width is fixed by the screen, so a diamond cell has the same width as a square cell but 0.57 of the height: the area is 0.29 of a square cell in A3 against 1.0 in Now and A2.) A2 has exactly the Now numbers: the hit squares are untouched.

### Checks that pass (all three looks, 360, 390, 768, 1024)

- Every cell of a 9x9 and a 12x12 board resolves to itself from its centre, from a point just inside each corner and just inside each edge midpoint (7 probes per cell), A3 included. Corners are fine; the problem of A3 is size, not accuracy.
- Place (long press), notes (tap), X, undo, hints 1 to 3 (the ring shows on the right square), Options Look switch (redraws at once, stored), a complete wrong board, the solved board with the finish overlay.
- At 360 and 390 a pinch to 2x on the 12x12 board: a tap still writes its note on the square under the finger, in all looks.
- Room labels draw above 3 placed people, 23 crosses and 92 notes in all looks.

### Findings

A2
- Plays exactly like Now: same cells, same tap size, same notes layout. Blocks that stand up cover part of the row behind (chair back, sofa back, bookshelf, bed head) but never take a tap; notes or crosses on a covered cell are drawn on top of the block, so nothing is lost. The sofa on the top row needs the 44 units of headroom and then touches the C-labels.
- Costs nothing in screen space except the headroom (the board gets about 7 percent taller).

A3
- Looks the best by far, a small diorama; on 768 and 1024 wide it plays well (diamond 65 x 38 px).
- On a phone the board is small. A 9x9 board is 360 wide but only about 210 high, so the cells are 35 x 20 px (a circle of 17 px fits), 12x12 gives 27 x 15 (circle of 13 px) and half the screen below the board stays unused. Nobody taps a 15 px high diamond reliably with a thumb; without zoom it plays awkwardly at 360 and 390. With the existing pinch zoom (2x) it plays fine, and the hit testing stays right while zoomed. Candidate letters are cramped (nine people in a 66 x 46 box, letters of 14.6 drawing units, about 6 px on a phone before zoom): notes need zoom too.
- Tall objects hide the diamonds behind them (a chair or sofa in front of a cell hides its floor and its notes; a tall bookshelf hides two). Marks are drawn above the blocks as floor decals so they stay visible, letters are upright and drawn above.
- Room labels are laid out for a square room; on a diamond they are horizontal text over a diagonal room, so a narrow corridor label can run over its neighbour, and the font is scaled to 0.78. They stay readable thanks to the halo. Axis labels sit along the two lower and upper edges; a block on the edge can sit over a label (R8 at the bottom left, C7 on the top right).
- Walls are flat lines on the floor (no wall height); doors and windows are skewed with the floor. A real wall height would hide even more floor.
- Flat art that has no block form (desks, TVs, washing machines, cars, trees, ...) lies skewed on the floor. It reads, but next to the standing furniture it looks like a decal.
- Options to make A3 playable on a phone, if chosen: open at about 1.6x zoom, centred on the first card's squares; a bigger cell constant for A3; or A3 on tablets and desktop and A2 on phones (the Look then follows the screen width). These are follow-up decisions for the owner, not done here.

Bathtub water (owner remark): in the prototype the water was a pale slab on a white box. The model in `models.ts` is a hollow tub: four walls, the water a saturated blue block (`#3f9fd6`) standing below the rim so the inner wall shows above it, a light sheen strip and three foam bubbles on the surface. Checked in a contact render in A2 and A3 (blue clearly separated from the white tub and the beige floor). The app has no bathtub object kind yet, so this only lands on the board when SLAY-17.4 adds one.

Re-run: `bun run build && bunx vite preview --port 5441 &`, then `BASE=http://localhost:5441/ CDP_PORT=9541 OUT=/private/tmp/claude-501/w-17.8 bun docs/verification/looks.ts` (about 8 minutes for all looks and widths, screenshots in `$OUT/shots`).

## Owner pick (2026-10-08)

The owner tested the PoC and chose **A2** (oblique blocks on the unchanged square grid). A3 (isometric) is not carried forward; the SLAY-17.8 code stays in git history.

Feedback on the A2 PoC, to be solved in SLAY-17.4 (screenshot: `docs/design/looks-feedback/2026-10-08-a2-poc-overflow-and-flat-items.png`):

- Blocks run over other cells: the extra height of A2 paints over the wall into the neighbouring cell. An object must never paint outside its own room.
- Some items are not in the same style yet (toilet, washbasin, washing machine, dryer, kitchen counter, stairs). Expected, the PoC only draws chair, sofa, bed, bookshelf, table, rug and plant; SLAY-17.4 draws every kind.

## Delivered in SLAY-17.4: A2 is the only look

The Look switch (Options entry, the stored `slaydoku:look`, the preview-host logic), the isometric A3 code (`planeTransform`, diamond layout, `upright`, the A3 glue) and the flat 'Now' art are gone from `main`; they stay in git history (SLAY-17.8) and in this file. Everything on the board, in the Legend and on the contact sheet is a block model.

- **Code:** `src/render/looks/` (`models.ts` the model language, `modelsLiving.ts`, `modelsHouse.ts`, `modelsOutdoor.ts`, `modelsTheme.ts`, `modelsSimpshouse.ts` the drawings, `registry.ts` one builder per engine type and per theme icon, `Solids.tsx` the SVG, `roomClip.ts`, `project.ts` the projection). The board layer is `SceneObjectIcons` (`src/render/icons/`), the legend swatch and contact sheet tile is `SolidSvg`.
- **Footprint, facing:** a scene object has only its cells, no facing. Models are built facing south and turned in 3D with the footprint matrix, all 8 orientations draw and are tested. Where several turns fit, the board shows the readable one: front toward the viewer on a wide or square footprint, toward the right (east) on a tall one (`solidOf`).

- **Chairs face their table (owner feedback, render only):** `chairFacing` (`src/render/looks/facing.ts`) turns a single-cell chair toward a table, dining table, desk, kitchen counter or garden table that touches it (4 neighbours, first in the order south, east, north, west), else away from the nearest wall of its room, into the room (ties: north, west, south, east), else the default. It feeds the resolver's facing preference (`solidOf(..., facing)`), so the block model is turned with the normal orientation matrix; no puzzle data, generator or theme changes. Screenshot: `docs/design/looks-shots/slay-17.4/board-tables-and-chairs-2026-12-01.png`.

### How the wall overflow was solved

The owner's screenshot (`docs/design/looks-feedback/2026-10-08-a2-poc-overflow-and-flat-items.png`): a tall block rose over the wall into the room behind it. The first fix (SLAY-17.4, one clip per room, headroom above the grid) was not enough; the owner's review of the school board found: blocks sticking up above the outer top wall (the headroom), tops and shadows reaching round a wall corner into a square of the same room that sits behind the wall (the clip of a whole room is a union of squares, so a block next to the corner of an L-shaped room could show on the far side of the corner), and chairs and desks rising over wall lines.

Now: **every object gets its own clip, tight at the wall line** (`objectClip.ts`). An object may draw on its own squares and on a neighbouring square only when that square is in the same room (4 sides), and on a diagonal square only when both squares beside it are too, so nothing reaches round a wall corner. Outside the grid nothing is allowed: the headroom above the grid is gone (the board is 7 percent shorter again) and a block that reaches the outer wall is cut there like at any other wall. The art and the shadow (blur included) of an object sit inside that object's clip group (`data-clip-of`), and the walls are drawn above the objects, so the cut hides under the wall line. A block can still rise over free floor of its own room (a chair back over the squares above it in the same room); against a wall it is cut flat by the wall.

Why not shorten or inset the blocks: most objects stand against a wall and would turn into low slabs, which is the opposite of the look the owner picked; and walls with a front face above the objects hide floor that the player must tap.

Checked three ways: unit tests (`SceneObjectIcons.test.tsx`): the allowed squares of an object (no other room, no diagonal round a corner, nothing outside the grid), the clip of every kind in every orientation at spots against walls, corners and the grid edge in a board with L-shaped rooms, and the clip of every object of every day of the baked schedule; the browser driver (`docs/verification/looks.ts`, `wallsHold`) reads the clip paths from the page at four widths and compares their squares with the rooms of the puzzle; and rendered boards by eye (home, school, office, shop and Simpshouse days).

### Audit: confusable pairs and what was done

Contact sheet at phone size (36 px per cell), section "Easily mistaken for each other" (`CONFUSABLE_GROUPS` in `src/render/icons/contactSheetData.ts`, `bun tools/icon-sheet.ts`). Found and fixed:

| Pair | Problem | Fix |
|---|---|---|
| bookshelf, wardrobe, cabinet (all tall brown boxes) | Top face of a 90 high box is as big as its front; turned away, three look the same | Shallow depth (bookshelf 52, cabinet 56, wardrobe 64) centred in the cell; bookshelf has books and a plant on top (visible from every side) and open shelves with spines; cabinet is light wood with cream doors and a cream top; wardrobe is dark with a crown and two doors per cell |
| rug, table, bookshelf | Rug and table both a flat rectangle from above | Rug is 3 high with a coloured border, fringe and medallion and no legs; table stands on four legs with a thick gold top; bookshelf is tall with books (all three side by side on the sheet) |
| table, dining table, garden table, desk | Four tops on legs | Colour and one clear object each: gold inlay, pale top with fruit bowl and plates, green metal (round on one cell), desk with a monitor and a drawer pedestal |
| washing machine, dryer | Same box | Cool white body, blue porthole, dial and drawer vs warm cream body, amber porthole, vent slats, lint trap on top |
| toilet, sink, shower | Small white things | Cistern and round bowl vs vanity with a basin and tap vs tray with tiled half-walls, pole and head |
| rug, oil slick, framed painting, flowers | Four things that lie flat | Textile with fringe, dark puddle with sheen, gold frame with a picture, flower bed with tall blooms |
| plant, tree, flowers | Green round things | Pot with a leafy crown, trunk with a big crown, bed with bright blooms on stems |
| bubble bath, bathtub model | Water must read as water | Blue block under the rim, light sheen strip, foam balls (tested in `looks.test.tsx`) |

The app has **no bath object kind** (nothing was added): the bathtub model lives in `modelsHouse.ts` (`MODEL_ONLY` in the registry) and shows on the contact sheet; the Simpshouse `bubbleBath` is the only tub on a board and uses the same water.

Known limit of the view: a tall piece turned so that its long side runs north to south shows its top and a narrow right side (the oblique view skews by 0.22), so doors and shelves on that side are slivers; hence the things on top and the colours above.

## How to draw a new object

For the theme stories SLAY-18.6 to 18.9 and anything after. Do the steps in this order; the look-completeness test (`src/render/looks/completeness.test.tsx`) fails by kind name until step 3 is done.

1. **Footprints.** Add the id to `THEME_ICON_IDS` (`src/render/icons/themes/types.ts`) and its footprints to `THEME_ICON_DEFINITIONS` (`themes/registry.ts`), and the `ThemeObject` with `themeIcon` in the theme. An object with no own art uses the model of its `engineType`.
2. **Draw the model** in a `models*.ts` file as a function `(cols, rows) => SolidModel` and list it in `THEME_MODELS` (or `ENGINE_MODELS`): the type checker fails a missing id.
3. **Check the sheet:** `bun tools/icon-sheet.ts /tmp/sheet.html`, open it. Your kind must show in all 8 orientations (section per footprint), in its theme card and, if it can be mistaken for something, in the phone-size strip (add a group to `CONFUSABLE_GROUPS`).

The block model (`models.ts`):
- **Space:** 100 units per cell, x right, y toward the viewer (south), z up. Draw it facing south: the back, head, tank or headboard on the north side (small y). The renderer turns it in 3D for the other 7 orientations, so a chair turned half a turn shows the back of its backrest. Everything must stay inside `0..cols*100` by `0..rows*100`; `looks.test.tsx` checks it for all 8 orientations.
- **Primitives:** `box(x, y, w, d, z0, h, color)`, `cyl(x, y, r, z0, h, color, rTop?)` (a post, bowl, bucket or cone), `ball(x, y, z, r, color)`, `disc(plane, x, y, z, r, color, ring?)` (an upright round face: porthole, wheel; plane 'xz' faces south, 'yz' faces east), and the helpers `onTop`, `onFront` (thin sheets with no outline: a screen, a door, a pattern), `legs`, `shiftY` (centre a shallow piece in its cell).
- **Heights:** at most `MAX_Z` = 96 (tested). The projection is `screen = (x - 0.22 z, y - 0.7 z)`: the floor stays square, height moves up and a little left. Rough scale: chair seat 30, table 40 to 50, counter 58 to 64, bookshelf 74 plus what stands on it, wardrobe 96. Lying flat (rug, mat, carpet, floor tiles): at most 6, then the model is `flat`: drawn first, no shadow.
- **Depth:** a big tall box shows a big top. Give tall furniture a real depth (50 to 65) and `shiftY` it to the middle of the cell instead of filling the cell.
- **Colour:** use `COLORS` (`models.ts`); the top keeps the colour, the front is 80 percent and the right side 62 percent (light from the top left, `Solids.tsx`), and the shadow falls to the bottom right. A pale line is drawn inside the top edge of big blocks.
- **Details that must show from every side** go on the top or are made of boxes, not of a sheet on the front: from the right only a sliver of the east side is visible.
- **One drawing per kind.** Do not reuse another theme's art for a kind that has its own look; share only colours.

Where it lands and what you do not have to do:
- **Board margin / headroom:** there is none above the grid any more; an object is cut at the wall and at the outer edge, so its tallest parts show only over free floor of its own room. Nothing to do per object, but a model against a wall loses the part that would rise over the wall: keep what makes it recognisable in the lower and front parts, or on top where there is floor behind it.
- **Walls:** each object is clipped to its own squares plus the free floor of its room around them (see above); nothing to do per object, but do not draw anything that must show beyond that.
- **Legend swatch:** `SolidSvg` crops the svg to everything the model covers (blocks, outline, shadow), so a tall block or its shadow is never clipped. Padding is automatic; the legend row and the check in `docs/verification/looks.ts` fail a clipped swatch.
- **Orientations:** all 8 are generated; the board shows front-south on wide and square footprints, front-east on tall ones.
- **Tests that run for you:** model inside footprint and below `MAX_Z` in all 8 orientations (`looks.test.tsx`), the look-completeness test for every kind of every registered theme and every object of the baked schedule, the contact sheet lists every kind with no gaps.
