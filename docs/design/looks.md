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
