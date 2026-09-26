import type { Puzzle } from '../../engine/model/index.ts'
import type { FloorPattern } from '../../render/scene/index.ts'

/**
 * One playable level.
 *
 * The level list, the unlock order and the play screen are all driven by the registry below,
 * so a content story only has to hand over `Level` objects and never touches the UI:
 *
 *   // src/content/levels.ts
 *   registerLevels([
 *     { id: 'first', title: 'First case', puzzle: firstPuzzle, roomStyles: { hall: 'stone' } },
 *     { id: 'second', title: 'Second case', puzzle: secondPuzzle },
 *   ])
 *
 * The order of registration is the order of play: level N + 1 stays locked until level N is
 * solved. Extra cases added later are simply registered after the existing ones.
 */
export interface Level {
  /**
   * Stable id. It is the save slot (`slaydoku:game:<id>`), the progress key and part of the
   * URL (`/level/<id>`), so never change it once a level has shipped. Use lowercase words.
   */
  id: string
  /** Name shown in the level list and above the puzzle. */
  title: string
  /** The puzzle as validated JSON (see engine/model). */
  puzzle: Puzzle
  /** Floor pattern per room id; the house levels bring their own. */
  roomStyles?: Partial<Record<string, FloorPattern>>
}

let registered: Level[] = []

/**
 * Adds levels to the end of the play order. Registering an id that already exists replaces that
 * level in place (keeps its position), so hot reloads and repeated calls are harmless.
 * Throws on an empty id or title, or an id with characters that do not survive a URL.
 */
export function registerLevels(levels: readonly Level[]): void {
  const next = [...registered]
  for (const level of levels) {
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(level.id)) {
      throw new Error(`Level id "${level.id}" is not valid: use letters, digits, "-" and "_".`)
    }
    if (level.title.trim() === '') throw new Error(`Level "${level.id}" needs a title.`)
    const at = next.findIndex((existing) => existing.id === level.id)
    if (at === -1) next.push(level)
    else next[at] = level
  }
  registered = next
}

/** The registered levels in play order. */
export function getLevels(): readonly Level[] {
  return registered
}

/** Empties the registry. For tests. */
export function resetLevels(): void {
  registered = []
}
