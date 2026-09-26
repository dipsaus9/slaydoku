import type { Puzzle } from '../engine/model/index.ts'

/**
 * A short, deterministic fingerprint of a puzzle. Saved boards and solved records carry it, so a
 * puzzle that was regenerated under the same id (the house levels, most pack ids) never inherits
 * the old board or the old "solved".
 *
 * What counts: the scene (size, rooms, room per cell, objects, doors and windows), the people
 * (id, kind, label, gender), the clue cards and the solution. What does not count: the order of
 * keys inside any object. Arrays keep their order: another order of clue cards or rooms is another
 * puzzle as far as the saved board is concerned.
 */
export function puzzleFingerprint(puzzle: Puzzle): string {
  const { scene } = puzzle
  const canonical = {
    scene: {
      width: scene.width,
      height: scene.height,
      rooms: scene.rooms,
      cellRooms: scene.cellRooms,
      objects: scene.objects,
      edgeFeatures: scene.edgeFeatures,
    },
    people: puzzle.people.map((p) => ({ id: p.id, kind: p.kind, label: p.label, gender: p.gender })),
    clues: puzzle.clues,
    solution: puzzle.solution,
  }
  return fnv1a(canonicalJson(canonical))
}

/** JSON with object keys sorted at every depth; `undefined` fields are left out, like JSON.stringify does. */
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => (item === undefined ? 'null' : canonicalJson(item))).join(',')}]`
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>
    const parts: string[] = []
    for (const key of Object.keys(record).sort()) {
      if (record[key] !== undefined) parts.push(`${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    }
    return `{${parts.join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

/** FNV-1a, 32 bit, over the UTF-16 code units of the text; 8 lowercase hex digits. */
function fnv1a(text: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}
