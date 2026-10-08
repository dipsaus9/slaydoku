> **Superseded (SLAY-17.4):** the SVG depth filter described here is gone. Every object is now a block model with its own light, front and side faces and ground shadow (`docs/design/looks.md`). This file stays as the record of the SLAY-16 approval and its checks; `docs/verification/depth.ts` was removed with the flat art.

# Depth in the board objects (SLAY-16)

How the objects on the board get their solid look, so the private cadeauko project can port it (CAD-11.1).
The approved look is `docs/design/depth-prototype.html` (owner, 2026-10-03, depth 55/100).

## Where the filter lives

`src/render/icons/ObjectIcon.tsx`:

- `ICON_DEPTH_FILTER`: the constants below, one object, pinned by `icons.test.tsx`.
- `IconDepthFilter` (internal): the SVG `<filter>` chain, built from those constants.
- `IconDepthScope`: put once inside every SVG that draws object icons (board objects layer, legend swatch, contact-sheet tile). It defines the filter once and hands its id down by context. A glyph outside a scope draws flat.
- `IconDepthGroup`: wraps the art with `filter="url(#id)"`. `ObjectIconGlyph` (engine objects) and `ThemeObjectIcon` (the 13 theme drawings) both use it.

The filter group sits OUTSIDE the art's orientation transform, so it works in screen space: light stays top-left and the shadow falls bottom-right in all 8 orientations (4 rotations, with and without mirror).

## Depth constants (`ICON_DEPTH_FILTER`)

| Part | Value |
|---|---|
| bevel offset (how far the silhouette is shifted to cut the rims) | 2.9 |
| rim light (top-left) | `#ffffff`, opacity 0.48, blur 0.8 |
| inner shade (bottom-right) | `#2a1a10`, opacity 0.27, blur 1 |
| ground shadow | `#2a1a10`, opacity 0.29, blur 2.6, dx 2.4, dy 5.3 |
| filter region | x/y -25%, width 160%, height 175% of the object's bounding box |

Units are the icon's own space (100 per cell). On the board one cell is 64 viewBox units (`CELL_SIZE`), so the shadow reaches about (5.3 + 2 x 2.6) x 0.64 = 6.7 board units below and about 4.9 to the right of the art, inside the board's viewBox margin of 12 (`MARGIN` in `geometry.ts`).

Merge order: ground shadow, source graphic, rim light, inner shade.

## Drawing rules for every icon

- Only rotation-safe detail in the art (interior detail, four corner feet). No light or shadow baked into a drawing: it would rotate with the object.
- Feet at all four corners.
- Original drawings, never traced from the official Murdoku art.
- The silhouette stays inside its footprint cells and stays distinguishable from other objects of the same engine type (bounds and drawnKinds tests).
- Colour tokens in `src/render/icons/art/tokens.ts` (`C`); new colours are additive.

## Verification and screenshots

`docs/verification/depth.ts` (`bun docs/verification/depth.ts`, see its header) renders:

- orientation sheets: every object type, every footprint, all 8 orientations (`sheet-NN.png`, `sheet-themes.png`);
- the board of a 6x6, a 9x9 and a 12x12 day (41 objects) and the legend, in en and nl, at true 360x640, 390x844, 768x1024 and 1024x768 (`Emulation.setDeviceMetricsOverride`, mobile, device scale factor 2: headless Chrome has a minimum window width, so `--window-size` clips a 360px phone);
- the object versus room label overlap check, the shadow clipping check, the About page at 360 and 390 px and a performance trace of repeated zoom and pan (ctrl+wheel and wheel, the useBoardZoom code path).

Screenshots and `report.json` are not committed. They were written to `/private/tmp/claude-501/w-16.9/` (`shots/`, `report.json`) on 2026-10-03; run the driver with `OUT=<folder>` to regenerate them. Start the preview server on a port nobody else uses (the first run of this story hit another worker's dev server on 5231 and had to be redone).

## Findings of the check (2026-10-03)

Days used (schedule): 6x6 2026-10-09 (12 objects), 9x9 2026-12-18 (21), 12x12 2026-11-30 (41 objects, expert; objects touch the last column and the last row, 5 each). Chrome 2x, true widths via `Emulation.setDeviceMetricsOverride`.

1. Orientations: `sheet-01..04.png` show every object type, every footprint, all 8 orientations (4 rotations, plain and mirrored): outdoor and house icons included (sheet-02, sheet-03/04). Light stays top-left and shadow bottom-right in all of them. `sheet-themes.png` is the theme drawings.
2. Board and legend at 360x640, 390x844, 768x1024, 1024x768 in en and nl: no sideways scroll, nothing clipped at the true 360px width.
3. Shadow at the board edge: no clipping. Lifting the svg overflow changes 0 pixels on all three boards (390 and 768 wide), and the arithmetic agrees: the shadow reaches about 6.7 units down and 4.9 right, the viewBox margin is 12.
4. Shadow in the legend swatches: CLIPPED. `ObjectSwatch` in `src/ui/help/Legend.tsx` uses `viewBox="0 0 cols*100 rows*100"`, exactly the footprint, so the ground shadow of an object whose art reaches its footprint edge is cut flat at the swatch's bottom and right edge (clearly the garden chair and the picnic table, see `swatch-clipped-4x.png`; tree, car, flowers and statue lose less). Small fix, inside SLAY-16's intent: give the swatch viewBox about 14 units of room at the right and bottom (and keep the scale the same by growing the svg box in `play.css` `.play-legend__icon`). Fixed in SLAY-16.10: the viewBox has 8 units of room at the right and bottom (`SWATCH_SHADOW_PAD`) and the svg box grows by the same ratio and is shifted back to centre (`--swatch-grow-*`, `--swatch-shift-*` in `.play-legend__icon`), so the object keeps its size. `PARTS=swatch bun docs/verification/depth.ts` checks it geometrically for all 40 legend rows (24 multi-cell) in en and nl at the four viewports (art size within 0.01 px of main, row heights identical, no sideways scroll); the same check fails 72 times on the old code.
5. Room label overlap: no object overlaps a label in en at 360 and 390, nor on the 6x6 and 9x9 boards. Findings on the 12x12 day (2026-11-30, room r6, the toy department):
   - nl at all four sizes: the label "Speelgoedafdeling" (R9, centred on C11, font already scaled down) is wider than its room and covers the right part of the bookshelf at C10 and the left part of the checkout counter at C12 (about 18 x 13 px at 768 wide, 10 x 8 px at 390). The label is drawn above the objects. The cause is the label layout (`src/render/scene/labels.ts`, `layers/RoomLabels.tsx`) with a long Dutch room name in a one-row room, not the new art.
   - en at 768 and 1024: the label "Toy Department" grazes the bookshelf at C10 by 1.3 px (bounding boxes touching, visually just touching). 
   Small and clearly about wall labels, but not part of the depth art: left for the orchestrator to decide.
6. About page (SLAY-15.3 text) at true 360 and 390 px, en and nl: no element wider than the screen, no sideways scroll, the reminder paragraph wraps to 9 (en) and 10 (nl) lines at 360. The earlier clipped capture came from the headless minimum window width. Side observation: the PWA install notice (fixed, top) sits over the About heading at 360 (about 1 line of the page title); SLAY-15.4 limited it to the start screen "and never the play header", so this is probably intended, but it covers the About title until it is dismissed.
7. Performance (12x12, 41 objects, headless Chrome with software raster, which is pessimistic): two rounds of ctrl+wheel zoom to 3x, wheel pan and zoom out (the same `useBoardZoom` code path as a trackpad pinch; synthesised two-finger touches only zoomed on the first run). Tracing categories devtools.timeline, blink, cc, viz, gpu.
   - Longest task of any thread: 7 ms (390x844) and 9 ms (1024x768) with the filter; 7 and 8 ms without. No task over 100 ms in any of the 4 traces.
   - Total RasterTask time (all raster threads) over the run: 3213 ms with the filter against 1108 ms with `[data-depth]{filter:none}` at 390x844; 5206 ms against 2189 ms at 1024x768. So the filter makes rasterising about 2.4 to 2.9 times more expensive on software raster, spread over short tasks (694 and 1554 of them). No follow-up needed; if a real low-end phone ever shows jank while zooming, the cheap lever is to drop the filter while a pinch is in progress (`[data-depth]` is easy to switch off) or to cut the ground-shadow blur.

## verify:phone on this build (2026-10-03, viewports 360x640, 390x844, 768x1024, 1024x768)

- `legend` (113 to 117 checks per size), `screens` (110) and `zoom` (42): 0 failures.
- `drive` and `locale` crash on main for reasons unrelated to the art: `drive` fails at the result screen (`missing .play-result .play-btn--primary`, the known stale driver since SLAY-9.13/9.15) and `locale` cannot find the play header's More tool by its Dutch name (`missing tool Meer`). Both were failing before SLAY-16.9 touched anything; they need their own repair story. `stats`, `share` and `offline` were not run (they play whole days through the same stale flow).
