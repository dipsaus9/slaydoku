import { VICTIM_TEXT } from '../../engine/clues/index.ts'
import type { TierId } from '../../engine/generator/tiers/index.ts'
import type { ThemeId } from '../themes/index.ts'

/** Label of the victim: "the victim". Lower case; clue text capitalises it at sentence start. */
export const VICTIM_LABEL: string = VICTIM_TEXT.noun

/** Stable puzzle id: `9-easy-home-101`. */
export const packId = (size: number, tier: TierId, theme: ThemeId, seed: number): string => `${size}-${tier}-${theme}-${seed}`

/** Pack file of a (size, tier), relative to the packs folder. */
export const packFile = (size: number, tier: TierId): string => `${size}-${tier}.json`
