import type { TierId } from '../../engine/generator/tiers/index.ts'
import { SCENE_THEMES } from '../themes/index.ts'
import { buildEntry, seedBase } from './build.ts'
import type { PackEntry, PackFile } from './types.ts'
import { PACK_FORMAT } from './types.ts'

/** The first entry that passes every gate for one size, tier and theme, built on the spot (no committed pack data). */
export function sampleEntry(size: number, tier: TierId, theme: string, budgetMs = 30_000): PackEntry {
  for (let seed = seedBase(tier); seed < seedBase(tier) + 100; seed++) {
    const built = buildEntry(size, tier, theme as (typeof SCENE_THEMES)[number]['id'], seed, budgetMs)
    if (built.ok) return built.entry
  }
  throw new Error(`no ${size}-${tier}-${theme} entry passed the gates in 100 seeds`)
}

/** A small pack file of one size and tier, one entry per theme. Deterministic. */
export function sampleFile(size: number, tier: TierId): PackFile {
  return { format: PACK_FORMAT, size, tier, puzzles: SCENE_THEMES.map((theme) => sampleEntry(size, tier, theme.id)) }
}
