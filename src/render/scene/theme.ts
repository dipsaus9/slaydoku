export const THEME = {
  wall: '#2a2a36',
  // SLAY-4.3: was a literal rgba() of the near-black wall ink; now mixes the shared --color-ink
  // token toward transparent, so the grid line follows the app's design token instead of a
  // standalone literal. `color-mix()` falls back gracefully (fully transparent) in the rare
  // engine without support, which only softens the grid line further, never turns it opaque black.
  grid: 'color-mix(in srgb, var(--color-ink, #2a2a36) 22%, transparent)',
  shadow: 'rgba(42, 42, 54, 0.28)',
  paper: '#fbf8f0',
  // SLAY-4.3: the room-label pill and the grid lines read from the app's shared warm design
  // tokens (src/brand/tokens.css) instead of plain white/black, so they sit in the same palette
  // as the rest of the app. `var(--color-...)` resolves against the tokens once the SVG is in
  // the document; the room label pill's stroke/text stay in the wall's ink for outline contrast.
  labelFill: 'var(--color-paper, #fdf8ec)',
  labelInk: 'var(--color-ink, #2a2a36)',
  axisInk: '#4d5c66',
  windowGlass: '#bfe6f5',
  windowFrame: '#2a2a36',
  doorLeaf: '#a5703f',
  fontFamily: "'Trebuchet MS', 'Segoe UI', system-ui, sans-serif",
} as const
