import { isGender, isObjectType, SIDES } from '../model/index.ts'
import type { Person, Scene, Side } from '../model/index.ts'
import { lineIndex } from './geometry.ts'
import { checkRelationalClue } from './relational/check.ts'
import { isRelationalClue } from './relational/types.ts'
import { PART_CLUE_TYPES, STRUCTURAL_CLUE_TYPES } from './types.ts'
import type { StructuralClue } from './types.ts'

/** Loose shape of a stored clue (the model's `Clue` slot). */
export interface ClueLike {
  personId: string
  type: string
  args?: Record<string, unknown>
}

/** Whether a stored clue slot names a structural kind. Params are not checked; see `checkClue`. */
export function isStructuralClue(clue: ClueLike): clue is StructuralClue {
  return (STRUCTURAL_CLUE_TYPES as readonly string[]).includes(clue.type)
}

/**
 * Problems with a structural clue against a puzzle's scene and people: unknown
 * ids, object types or indexes, and a card holder of the wrong kind. Returns
 * human-readable messages; an empty list means the clue is well-formed.
 */
export function checkClue(
  clue: ClueLike,
  puzzle: { scene: Scene; people: Person[] },
): string[] {
  const { scene, people } = puzzle
  const issues: string[] = []
  if (isRelationalClue(clue)) return checkRelationalClue(clue, puzzle)
  if (!isStructuralClue(clue)) return [`Unknown clue type "${clue.type}".`]

  const holder = people.find((p) => p.id === clue.personId)
  if (!holder) issues.push(`Unknown person "${clue.personId}".`)
  const args: Record<string, unknown> = clue.args ?? {}
  if (clue.type === 'both') return [...issues, ...checkBoth(clue, args, puzzle)]

  const personArg = (key: string) => {
    if (typeof args[key] !== 'string' || !people.some((p) => p.id === args[key])) {
      issues.push(`Argument "${key}" must be a known person id.`)
    }
  }
  const roomArg = (key: string, optional = false) => {
    const value = args[key]
    if (value === undefined && optional) return
    if (typeof value !== 'string' || !scene.rooms.some((r) => r.id === value)) {
      issues.push(`Argument "${key}" must be a known room id.`)
    }
  }
  const objectArg = () => {
    if (!isObjectType(args.objectType)) issues.push('Argument "objectType" must be an object type.')
  }
  const indexArg = (size: number) => {
    const value = args.index
    if (!Number.isInteger(value) || (value as number) < 0 || (value as number) >= size) {
      issues.push(`Argument "index" must be an integer from 0 to ${size - 1}.`)
    }
  }

  switch (clue.type) {
    case 'onObject':
    case 'squareWithObject':
    case 'onlyOnObject':
      objectArg()
      break
    case 'besideObject':
      objectArg()
      if (args.exactlyOne !== undefined && typeof args.exactlyOne !== 'boolean') {
        issues.push('Argument "exactlyOne" must be a boolean.')
      }
      break
    case 'inRoom':
    case 'emptyRoom':
      roomArg('roomId')
      break
    case 'inRoomOr': {
      const ids = args.roomIds
      const known = (id: unknown) => scene.rooms.some((r) => r.id === id)
      if (!Array.isArray(ids) || ids.length !== 2 || !ids.every(known) || ids[0] === ids[1]) {
        issues.push('Argument "roomIds" must be two different known room ids.')
      }
      break
    }
    case 'inCorner':
    case 'alone':
      roomArg('roomId', true)
      break
    case 'besideFeature':
      if (args.feature !== 'window' && args.feature !== 'door') {
        issues.push('Argument "feature" must be "window" or "door".')
      }
      break
    case 'withPerson':
    case 'aloneWith':
      personArg('otherId')
      if (args.otherId === clue.personId) issues.push('A clue cannot refer to its own holder.')
      roomArg('roomId', true)
      break
    case 'roomHasGender':
    case 'aloneWithGender':
      if (holder && holder.kind === 'victim') issues.push(`"${clue.type}" cannot be on the victim card.`)
      if (!isGender(args.gender)) {
        issues.push('Argument "gender" must be "vrouw" or "man".')
      } else if (!people.some((p) => p.id !== clue.personId && p.gender === args.gender)) {
        issues.push(`Nobody else in the puzzle has gender "${args.gender}".`)
      }
      break
    case 'inRoomEdge':
      roomArg('roomId', true)
      if (!SIDES.includes(args.edge as Side)) issues.push('Argument "edge" must be "north", "south", "east" or "west".')
      break
    case 'inRow':
      indexArg(scene.height)
      break
    case 'inColumn':
      indexArg(scene.width)
      break
    case 'onLine': {
      if (args.axis !== 'row' && args.axis !== 'column') {
        issues.push('Argument "axis" must be "row" or "column".')
        break
      }
      const size = args.axis === 'row' ? scene.height : scene.width
      if (
        args.position !== 'first' &&
        args.position !== 'last' &&
        args.position !== 'middle'
      ) {
        issues.push('Argument "position" must be "first", "last" or "middle".')
      } else if (lineIndex(size, args.position) === null) {
        issues.push(`There is no middle ${args.axis} on a grid of ${size}.`)
      }
      break
    }
    case 'aloneWithMurderer':
      if (holder && holder.kind !== 'victim') {
        issues.push('"aloneWithMurderer" belongs on the victim card.')
      }
      break
    case 'inFrontOfDoor':
      break
  }
  return issues
}

/** Kinds that say nothing about the holder's own square: on a combined card they leave no subject for the sentence. */
const SUBJECTLESS_PARTS: readonly string[] = ['roomHasGender', 'squareWithObject']

/**
 * Problems with a combined card (`both`): two different parts, each a well-formed clue of the card's holder,
 * of a kind a part may have (no nesting, no relational kind, no `emptyRoom`), and not two parts that both
 * leave out the holder (the sentence would have no subject: use `onObject` for `squareWithObject`).
 */
function checkBoth(
  clue: ClueLike,
  args: Record<string, unknown>,
  puzzle: { scene: Scene; people: Person[] },
): string[] {
  const issues: string[] = []
  const part = (key: 'a' | 'b'): ClueLike | undefined => {
    const body = args[key]
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      issues.push(`Argument "${key}" must be a clue part with a type and args.`)
      return undefined
    }
    const { type, args: partArgs } = body as { type?: unknown; args?: unknown }
    if (typeof type !== 'string') {
      issues.push(`Part "${key}" must have a type.`)
      return undefined
    }
    if (type === 'both') {
      issues.push(`Part "${key}" cannot be a combined card itself.`)
      return undefined
    }
    if (!(PART_CLUE_TYPES as readonly string[]).includes(type)) {
      issues.push(`Part "${key}" has kind "${type}", which cannot be part of a combined card.`)
      return undefined
    }
    if (typeof partArgs !== 'object' || partArgs === null || Array.isArray(partArgs)) {
      issues.push(`Part "${key}" must have args.`)
      return undefined
    }
    return { personId: clue.personId, type, args: partArgs as Record<string, unknown> }
  }
  const a = part('a')
  const b = part('b')
  for (const [key, one] of [['a', a], ['b', b]] as const) {
    if (one) issues.push(...checkClue(one, puzzle).map((message) => `Part "${key}": ${message}`))
  }
  if (a && b) {
    if (a.type === b.type && JSON.stringify(sortedArgs(a.args)) === JSON.stringify(sortedArgs(b.args))) {
      issues.push('The two parts of a combined card must differ.')
    }
    if (SUBJECTLESS_PARTS.includes(a.type) && SUBJECTLESS_PARTS.includes(b.type)) {
      issues.push(`Parts "${a.type}" and "${b.type}" both leave out the holder: use "onObject" for "squareWithObject".`)
    }
  }
  return issues
}

const sortedArgs = (args: Record<string, unknown> | undefined): [string, unknown][] =>
  Object.entries(args ?? {}).sort(([x], [y]) => x.localeCompare(y))
