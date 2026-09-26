/** One grid cell is U units wide and tall in every icon's coordinate space. */
export const U = 100
/** Outline width. Bold, as in the official sheets. */
export const SW = 5
/** Thinner line for details inside a shape. */
export const DETAIL = 3
/** Clear space between a shape's edge and the cell edge; keeps stroke inside the cell. */
export const M = 6

/** Flat colour set, kept warm and light like the official sheets. Own choices. */
export const C = {
  ink: '#2a211c',
  white: '#fbfbf8',
  cream: '#f4ead2',
  creamLight: '#fff8e6',
  paper: '#efe3c4',
  wood: '#a86f45',
  woodLight: '#c99863',
  woodDark: '#7b4c2b',
  gold: '#e9a92d',
  yellow: '#fad64a',
  purple: '#a487c9',
  purpleDark: '#8768ad',
  sofa: '#d29b6a',
  sofaDark: '#b57c4d',
  red: '#d8514b',
  redDark: '#b13a36',
  terracotta: '#b9532f',
  green: '#4f9e50',
  greenLight: '#7cc36a',
  greenDark: '#3a7d43',
  sky: '#bfe3ee',
  skyLight: '#e3f3f7',
  steel: '#c3c9d2',
  steelDark: '#8c94a1',
  slate: '#4b4e5c',
  stone: '#d2d4da',
  pink: '#f08fa6',
  lilac: '#b79ae0',
  slick: '#3a3450',
} as const

/** Round to one decimal so path data stays short and stable. */
export function n(value: number): number {
  return Math.round(value * 10) / 10
}
