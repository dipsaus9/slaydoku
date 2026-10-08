# 3D object look (SLAY-17.3, spike)

Question: can the board objects look more 3D than "flat 2D art with a bevel and a shadow" (SLAY-16, `docs/design/depth.md`)? The prototype is `docs/design/looks-prototype.html` (open it in a browser, no build). It draws nine original objects (chair, rug, table, bookshelf, plant, sofa, bed, lamp, bathtub) in three variants next to the current depth look, in all 8 orientations (4 rotations, plain and mirrored), on a furnished floor, with a "how high" slider.

Common to all variants: the effect is drawn in screen space, outside the orientation transform (same rule as `IconDepthGroup`), so light stays top-left and depth points bottom-right in all 8 orientations. No light or shadow is baked into the art. Art stays original.

## Variants

| | A. Block | B. Steps | C. Relief |
|---|---|---|---|
| Idea | Whole silhouette extruded as a darker block toward bottom-right | Each part has its own height and its own side wall (seat low, backrest high, books under the shelf frame) | No side wall; lit shapes: diffuse and specular lighting on a luminance bump map, seams become grooves |
| How | One SVG filter (4 offset copies of a darkened source, ground shadow, rim light). Per object only a thickness `H` | Per-part `z` in the art; walls are darkened copies of the part, drawn in screen space; ground shadow and rim light as filter | One SVG filter (`feDiffuseLighting`, `feSpecularLighting`) plus ground shadow |
| Reads as 3D | Clearly, uniformly, like thick cardboard | Most, real stacking, the sofa and chair read as furniture | Soft, like glazed clay; weakest on flat things (rug, table top) |
| Extra art work | None | A `z` for every part of every object (about 4 to 12 values per icon, 40 objects plus the 13 theme drawings) | None |
| Recognisability | Same as now | Same or better, but tall walls can hide parts below (sofa cushions, chair seat) unless `z` is tuned per object | Strong contrast between ink and fill can make small icons busy (bookshelf) |
| Cost | Light, like the current filter plus a few offsets | Light to render (plain SVG), more elements per icon (walls) | Heaviest: lighting filters are the slowest SVG filters, on 41 objects while zooming |
| Risk | Extrusion reaches beyond the footprint cell (about 10 units down, 5 right): needs more board margin (now 12 against about 7) and legend swatch padding | Same overhang, plus per-object tuning | Legibility on the smallest cells; filter cost on low-end phones |

Trade-off that applies to A and B: the thickness spills into the cell below and to the right, so on a dense 12x12 board an object can touch the neighbouring cell's art. Keep `H` at 8 to 10 units or less on the board.

## Recommendation

B at a reduced scale (walls at about 45 percent of the listed `z`, the prototype's default), with A's single-filter approach as the fallback for objects that need no per-part heights (rug, bathtub, plant). Reasons: it is the only variant that shows what an object is made of (seat versus back, frame versus books), which is the point of "recognisable objects" (SLAY-17), and it costs plain SVG instead of a lighting filter. If the owner wants the least risk and no extra art work, take A. C is the one to skip: it is the most expensive and the least readable at the sizes the board uses.

The prototype draws only the nine objects above; porting means adding `z` (B) or `H` (A) to the icon registry and replacing `ICON_DEPTH_FILTER` in `src/render/icons/ObjectIcon.tsx`. That is a follow-up story, not part of this spike.

## Owner choice

Not yet chosen. The owner looks at the prototype together with Claude and the choice is written here (only the owner ticks acceptance criterion 3 of SLAY-17.3).

Chosen look: _pending_
