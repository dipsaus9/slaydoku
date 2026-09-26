import { TIERS } from '../../engine/generator/tiers/index.ts'
import { PACK_SIZES } from './build.ts'
import { puzzleFingerprint } from '../../game/fingerprint.ts'
import { boardKey, puzzleKey } from './gates.ts'
import { packFile } from './ids.ts'
import { indexEntryOf } from './format.ts'
import { PACK_FORMAT } from './types.ts'
import type { PackEntry, PackFile, PackIndex } from './types.ts'

/** Parses the text of a pack file; throws with the file name when the layout is wrong. */
export function parsePackFile(text: string, name: string): PackFile {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch (error) {
    throw new Error(`${name}: not JSON (${error instanceof Error ? error.message : String(error)})`)
  }
  const file = value as Partial<PackFile> | null
  if (!file || file.format !== PACK_FORMAT || typeof file.size !== 'number' || typeof file.tier !== 'string' || !Array.isArray(file.puzzles)) {
    throw new Error(`${name}: not a pack file of format ${PACK_FORMAT}`)
  }
  return file as PackFile
}

/** Parses the text of index.json. */
export function parseIndex(text: string): PackIndex {
  const index = JSON.parse(text) as Partial<PackIndex>
  if (index.format !== PACK_FORMAT || !Array.isArray(index.puzzles) || index.count !== index.puzzles.length) {
    throw new Error(`index.json: not an index of format ${PACK_FORMAT}, or count does not match`)
  }
  return index as PackIndex
}

/**
 * Cross-file checks of a whole pack: entries sit in the file of their size and
 * tier, ids are unique, no two puzzles share a board or a puzzle, and the index
 * lists exactly the entries of the files, in order. Returns the problems.
 */
export function packSetProblems(files: readonly PackFile[], index: PackIndex): string[] {
  const problems: string[] = []
  const ids = new Set<string>()
  const boards = new Map<string, string>()
  const puzzles = new Map<string, string>()
  const all: PackEntry[] = []
  for (const file of files) {
    for (const entry of file.puzzles) {
      all.push(entry)
      if (entry.size !== file.size || entry.tier !== file.tier) problems.push(`${entry.id}: sits in the ${packFile(file.size, file.tier)} file`)
      if (ids.has(entry.id)) problems.push(`${entry.id}: duplicate id`)
      ids.add(entry.id)
      const board = boardKey(entry.puzzle)
      const other = boards.get(board)
      if (other) problems.push(`${entry.id}: same board as ${other}`)
      boards.set(board, entry.id)
      const key = puzzleKey(entry.puzzle)
      const same = puzzles.get(key)
      if (same) problems.push(`${entry.id}: same puzzle as ${same}`)
      puzzles.set(key, entry.id)
    }
  }
  // The fingerprint per puzzle: the index must carry the one of the stored puzzle, or saves would match the wrong puzzle.
  const listed = new Map(index.puzzles.map((entry) => [entry.id, entry]))
  for (const entry of all) {
    const fp = puzzleFingerprint(entry.puzzle)
    const stated = listed.get(entry.id)?.fp
    if (stated !== fp) problems.push(`${entry.id}: index fp ${stated ?? '(missing)'} is not the fingerprint of the stored puzzle (${fp})`)
  }
  if (JSON.stringify(index.puzzles) !== JSON.stringify(all.map(indexEntryOf))) problems.push('index.json does not list exactly the entries of the pack files, in order')
  return problems
}

/** Pack files in index order: by size, then by tier from very-easy to expert. */
export function sortPackFiles(files: readonly PackFile[]): PackFile[] {
  const order = (f: PackFile) => PACK_SIZES.indexOf(f.size as (typeof PACK_SIZES)[number]) * 100 + TIERS.findIndex((t) => t.id === f.tier)
  return [...files].sort((a, b) => order(a) - order(b))
}
