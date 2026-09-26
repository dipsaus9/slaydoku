import { ENGINE_ICON, drawnKinds, specificNoun } from '../../content/themes/drawn.ts'
import type { DrawnKind } from '../../content/themes/drawn.ts'
import type { ObjectType, Puzzle, Scene } from '../model/index.ts'
import { OBJECTS_NL, objectNouns } from './nl.ts'

/**
 * Audit of the object nouns in clue text. A clue about an object type (beside a chair) is true
 * for every object of that engine type, but the board draws some types as several different
 * things: a beanbag, a garden chair and a school chair are all engine type chair. A player who counts what
 * they see needs a noun that names exactly one drawn kind, and a clue that covers a type names
 * every kind of it. Wording lives in nl.ts (`objectNouns`); this only checks it.
 *
 * Problems are plain English strings, like `auditClues`, so a pack gate can list them.
 */

/** The nouns a clue about `type` uses on `scene`. The audit checks these; the default is the real wording. */
export type NounsFor = (scene: Pick<Scene, 'objects'>, type: ObjectType) => string[]

export const currentNouns: NounsFor = (scene, type) => objectNouns(scene.objects, type)

/** The pre-CAD-8.1 wording: one engine noun per type, whatever is drawn. Kept to measure what it got wrong. */
export const legacyNouns: NounsFor = (_scene, type) => [OBJECTS_NL[type].noun]

/** A drawn kind, described for a message: "tuinstoel", "schoolstoel/zitzak" (look alike). */
const describe = (group: DrawnKind, type: ObjectType): string =>
  group.plain ? [OBJECTS_NL[type].noun, ...group.nouns].join('/') : group.nouns.join('/')

/**
 * Whether `noun` names this drawn kind: its own noun, or the engine noun when the group is drawn
 * with the plain engine icon (a beanbag is not a chair: it looks like a beanbag). The engine noun
 * names every such group of the type, so with two of them it matches several.
 */
function names(noun: string, group: DrawnKind, type: ObjectType): boolean {
  return noun === specificNoun(group) || (noun === OBJECTS_NL[type].noun && group.icon === ENGINE_ICON)
}

/** The object type a clue talks about, if any (every clue kind that carries `objectType`). */
function objectTypeOf(clue: Puzzle['clues'][number]): ObjectType | undefined {
  const type = (clue.args as Record<string, unknown> | undefined)?.objectType
  return typeof type === 'string' ? (type as ObjectType) : undefined
}

/**
 * Problems in how a puzzle's clues name objects. For each clue with an object type, on this
 * puzzle's scene:
 *  - the type has no object on the board (the noun matches no drawn kind);
 *  - a noun matches several drawn kinds (the plain chair noun when a beanbag and a garden chair stand there) or
 *    none (a noun that names something else);
 *  - a drawn kind of the type is left out of the nouns, so the clue reads narrower than it is
 *    (only the beanbag while a garden chair counts too).
 * `nounsFor` is the wording to audit (default: the wording the cards show).
 */
export function auditObjectNames(puzzle: Pick<Puzzle, 'scene' | 'clues'>, nounsFor: NounsFor = currentNouns): string[] {
  const problems: string[] = []
  puzzle.clues.forEach((clue, i) => {
    const type = objectTypeOf(clue)
    if (type === undefined) return
    const at = (msg: string) => problems.push(`card ${i + 1}: ${msg}`)
    const groups = drawnKinds(puzzle.scene.objects, type)
    if (groups.length === 0) return at(`names a ${OBJECTS_NL[type].noun}, which matches none of the drawn objects: the board has none`)
    const seen = new Set<DrawnKind>()
    let clean = true
    for (const noun of nounsFor(puzzle.scene, type)) {
      const matches = groups.filter((g) => names(noun, g, type))
      if (matches.length !== 1) clean = false
      if (matches.length === 0) at(`"${noun}" matches none of the drawn kinds (${groups.map((g) => describe(g, type)).join(', ')})`)
      else if (matches.length > 1) at(`"${noun}" matches ${matches.length} drawn kinds: ${matches.map((g) => describe(g, type)).join(', ')}`)
      else seen.add(matches[0]!)
    }
    const left = groups.filter((g) => !seen.has(g))
    if (clean && left.length > 0) at(`leaves out ${left.map((g) => describe(g, type)).join(', ')}, which the clue counts too`)
  })
  return problems
}
