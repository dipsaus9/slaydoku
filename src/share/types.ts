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

/** Pixel size of the share card: always square (it is drawn on 1080 units and scaled). */
export const CARD_SIZE = { width: 1200, height: 1200 } as const

/** The share meta of a scheduled day (its tier and board size). */
export const shareMetaOf = (day: { tier: TierId; size: number }, siteUrl?: string): ShareMeta => ({ tier: day.tier, size: day.size, ...(siteUrl ? { siteUrl } : {}) })
