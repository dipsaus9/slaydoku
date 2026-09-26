import { isObjectType } from '../../model/index.ts'
import type { Person, Scene } from '../../model/index.ts'
import type { ClueLike } from '../check.ts'
import type { RelationalClue } from './types.ts'

const SIDES = ['north', 'south', 'east', 'west']
const DIAGONALS = ['northwest', 'northeast', 'southwest', 'southeast']

/** Problems with a relational clue (unknown ids, bad enums, impossible counts). Empty list = well-formed. */
export function checkRelationalClue(
  clue: ClueLike & Pick<RelationalClue, 'type'>,
  puzzle: { scene: Scene; people: Person[] },
): string[] {
  const { scene, people } = puzzle
  const issues: string[] = []
  const args: Record<string, unknown> = clue.args ?? {}
  if (!people.some((p) => p.id === clue.personId)) issues.push(`Unknown person "${clue.personId}".`)

  const otherArg = () => {
    if (typeof args.otherId !== 'string' || !people.some((p) => p.id === args.otherId)) {
      issues.push('Argument "otherId" must be a known person id.')
    } else if (args.otherId === clue.personId) {
      issues.push('A clue cannot refer to its own holder.')
    }
  }
  const objectArg = () => {
    if (!isObjectType(args.objectType)) issues.push('Argument "objectType" must be an object type.')
  }
  const sideArg = () => {
    if (typeof args.side !== 'string' || !SIDES.includes(args.side)) {
      issues.push('Argument "side" must be north, south, east or west.')
    }
  }
  const directionArg = (optional: boolean) => {
    if (args.direction === undefined && optional) return
    if (typeof args.direction !== 'string' || !DIAGONALS.includes(args.direction)) {
      issues.push('Argument "direction" must be northwest, northeast, southwest or southeast.')
    }
  }
  const qualifiers = () => {
    if (args.roomId !== undefined && !scene.rooms.some((r) => r.id === args.roomId)) {
      issues.push('Argument "roomId" must be a known room id.')
    }
    if (args.alone !== undefined && typeof args.alone !== 'boolean') {
      issues.push('Argument "alone" must be a boolean.')
    }
  }
  /** A count from 1 to `max` (a larger one can never be true on this grid). */
  const countArg = (key: string, max: number) => {
    const value = args[key]
    if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > max) {
      issues.push(`Argument "${key}" must be an integer from 1 to ${max}.`)
    }
  }

  switch (clue.type) {
    case 'directionOf':
      sideArg()
      otherArg()
      qualifiers()
      break
    case 'directionOfObject':
      sideArg()
      objectArg()
      qualifiers()
      break
    case 'exactDistance': {
      sideArg()
      otherArg()
      qualifiers()
      const vertical = args.side === 'north' || args.side === 'south'
      countArg('count', (vertical ? scene.height : scene.width) - 1)
      break
    }
    case 'directlyNextToObject':
      sideArg()
      objectArg()
      break
    case 'diagonal':
      otherArg()
      directionArg(true)
      qualifiers()
      if (args.steps !== undefined) countArg('steps', Math.min(scene.width, scene.height) - 1)
      break
    case 'quadrant':
      directionArg(false)
      otherArg()
      qualifiers()
      break
    case 'sameRoom':
    case 'differentRoom':
    case 'notWith':
      otherArg()
      break
    case 'notBesideObject':
      objectArg()
      break
  }
  return issues
}
