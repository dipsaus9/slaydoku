/** Skin tones, light to deep. */
export const SKIN_TONES = [
  '#fadcc6',
  '#f6d2b4',
  '#f0c29b',
  '#e2ab80',
  '#c98c5e',
  '#a86b45',
  '#8a5236',
  '#6b3d2a',
] as const

export const HAIR_COLORS = [
  '#1f1a24', // black
  '#4a3222', // dark brown
  '#7a4b2a', // brown
  '#a3441f', // auburn
  '#dd7a2a', // ginger
  '#e6c46b', // blonde
  '#9aa1ab', // grey
  '#ececf2', // white
] as const

export const CLOTHES_COLORS = [
  '#d94f4f', // red
  '#e8863a', // orange
  '#e3b93c', // yellow
  '#5aa65a', // green
  '#2fa39a', // teal
  '#4a86c9', // blue
  '#5b5fc0', // indigo
  '#a05bbf', // violet
  '#d96aa3', // pink
  '#6b7480', // slate
] as const

export const ACCENT_COLORS = ['#c8423d', '#2f6db3', '#2f8f5b', '#e0a526', '#7d4fb0', '#3a3f4a'] as const

export const HAIR_STYLES = ['bald', 'buzz', 'short', 'sidePart', 'curly', 'bob', 'long', 'bun', 'ponytail'] as const
export const CLOTHES_STYLES = ['crew', 'vneck', 'hoodie', 'collar', 'stripes'] as const
export const ACCESSORIES = [
  'none',
  'roundGlasses',
  'squareGlasses',
  'beard',
  'moustache',
  'freckles',
  'hoops',
  'headband',
  'beanie',
  'cap',
] as const
export const MOUTHS = ['smile', 'grin', 'neutral', 'smirk'] as const
export const BROWS = ['straight', 'raised', 'thick'] as const

export type HairStyle = (typeof HAIR_STYLES)[number]
export type ClothesStyle = (typeof CLOTHES_STYLES)[number]
export type Accessory = (typeof ACCESSORIES)[number]
export type Mouth = (typeof MOUTHS)[number]
export type Brows = (typeof BROWS)[number]

/** Everything the drawing needs; plain data, so it can be stored, compared and tested. */
export interface ProceduralTraits {
  skin: string
  hairStyle: HairStyle
  hairColor: string
  clothesStyle: ClothesStyle
  clothesColor: string
  accessory: Accessory
  /** Colour of a hat, headband or shirt collar accent. */
  accentColor: string
  mouth: Mouth
  brows: Brows
}

/** Features that set two faces apart at a glance; mouth and brows are too small to count. */
const VISIBLE: readonly (keyof ProceduralTraits)[] = [
  'skin',
  'hairStyle',
  'hairColor',
  'clothesStyle',
  'clothesColor',
  'accessory',
]

/** How many of the visible features differ between two avatars (0 to 6). */
export function traitDistance(a: ProceduralTraits, b: ProceduralTraits): number {
  return VISIBLE.filter((k) => a[k] !== b[k]).length
}

/** Stable identity of a set of traits. */
export function traitsKey(t: ProceduralTraits): string {
  return [
    t.skin,
    t.hairStyle,
    t.hairColor,
    t.clothesStyle,
    t.clothesColor,
    t.accessory,
    t.accentColor,
    t.mouth,
    t.brows,
  ].join('|')
}

