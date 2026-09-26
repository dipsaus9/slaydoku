import type { IndexEntry, PackEntry, PackFile, PackIndex } from './types.ts'
import { PACK_FORMAT } from './types.ts'
import { puzzleFingerprint } from '../../game/fingerprint.ts'
import { packFile } from './ids.ts'

/**
 * Pack file text: a small header, then one puzzle per line (compact JSON), so
 * a regenerated pack diffs by puzzle and stays small. Key order is fixed, so the
 * same puzzles always give the same bytes.
 */
export function serializePack(file: PackFile): string {
  const head = `{"format":${file.format},"size":${file.size},"tier":${JSON.stringify(file.tier)},"puzzles":[`
  const lines = file.puzzles.map((p) => JSON.stringify(p))
  return `${head}\n${lines.join(',\n')}\n]}\n`
}

export const indexEntryOf = (entry: PackEntry): IndexEntry => ({
  id: entry.id,
  size: entry.size,
  tier: entry.tier,
  theme: entry.theme,
  title: entry.title,
  clues: entry.clueCount,
  rating: entry.rating,
  file: packFile(entry.size, entry.tier),
  fp: puzzleFingerprint(entry.puzzle),
})

/** `index.json` text: one puzzle per line, in the order given (sizes, then tiers, then themes). */
export function serializeIndex(entries: readonly PackEntry[]): string {
  const index: PackIndex = { format: PACK_FORMAT, count: entries.length, puzzles: entries.map(indexEntryOf) }
  const lines = index.puzzles.map((p) => JSON.stringify(p))
  return `{"format":${index.format},"count":${index.count},"puzzles":[\n${lines.join(',\n')}\n]}\n`
}
