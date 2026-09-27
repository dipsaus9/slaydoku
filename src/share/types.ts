import type { TierId } from '../engine/generator/tiers/index.ts'

/**
 * What a share needs to know about the puzzle besides the result. Only labels and counts: never the solution, the names or the clues.
 * `tier` is here (and not read from the result) because results stored before the statistics existed have none.
 */
export interface ShareMeta {
  tier: TierId
  /** Board size: 9 means a 9x9 grid and nine suspects. */
  size: number
  /** Origin of the site printed in the text and on the card. Default: the deployed URL (`SITE_URL`). */
  siteUrl?: string
}

/** The two card formats. */
export type CardFormat = 'wide' | 'square'

/** Pixel sizes of the two formats (an OG-style wide card and a square one for feeds). */
export const CARD_SIZES: Record<CardFormat, { width: number; height: number }> = {
  wide: { width: 1200, height: 630 },
  square: { width: 1080, height: 1080 },
}

/** The share meta of a scheduled day (its tier and board size). */
export const shareMetaOf = (day: { tier: TierId; size: number }, siteUrl?: string): ShareMeta => ({ tier: day.tier, size: day.size, ...(siteUrl ? { siteUrl } : {}) })
