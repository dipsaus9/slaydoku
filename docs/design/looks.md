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
