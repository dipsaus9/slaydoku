/** One grid cell is U units wide and tall in every icon's coordinate space. */
export const U = 100
/** Outline width. Bold, as in the official sheets. */
export const SW = 5
/** Thinner line for details inside a shape. */
export const DETAIL = 3
/** Clear space between a shape's edge and the cell edge; keeps stroke inside the cell. */
export const M = 6

/**
 * Flat colour set, kept warm and light like the official sheets. Own choices.
 * SLAY-4.3: calmed down from the original, more saturated set — every hue's chroma is pulled
 * back (~30%) and lightened a touch so the board reads quieter, less busy. Same key names, same
 * relative hue/lightness relationships (so shapes stay distinguishable from one another and every
 * icon that imports these keys inherits the calmer look automatically, no icon file touched).
 */
export const C = {
  ink: '#29211d',
  white: '#fbfbf8',
  cream: '#f2e9d4',
  creamLight: '#fef7e7',
  paper: '#ede2c6',
  wood: '#a2795a',
  woodLight: '#be9f7d',
  woodDark: '#78553d',
  gold: '#cea657',
  yellow: '#e1ca73',
  purple: '#ad9bc4',
  purpleDark: '#907ca8',
  sofa: '#c6a485',
  sofaDark: '#aa8567',
  red: '#c6706d',
  redDark: '#a8514f',
  terracotta: '#ae644a',
  green: '#629b62',
  greenLight: '#8dba82',
  greenDark: '#4a7c51',
  sky: '#d1e5eb',
  skyLight: '#e3eff2',
  steel: '#c4c9d1',
  steelDark: '#8d94a0',
  slate: '#4c4f5b',
  stone: '#d2d4da',
  pink: '#e4aab8',
  lilac: '#c1b0da',
  slick: '#3b354f',
  // SLAY-16.2: detail-pass colours (additive; no value above changed).
  creamDark: '#d8c9a6',
  woodDeep: '#5b3f2b',
  goldDark: '#a98438',
  yellowLight: '#ecdc9a',
  terraDark: '#8a4a36',
  soil: '#5a3a2b',
} as const

/** Round to one decimal so path data stays short and stable. */
export function n(value: number): number {
  return Math.round(value * 10) / 10
}
