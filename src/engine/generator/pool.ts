import { checkClue, evaluate } from '../clues/index.ts'
import type { CatalogClue, ClueBody, Qualifiers } from '../clues/index.ts'
import { GENDERS, occupiableCells, roomIdAt } from '../model/index.ts'
import type { ObjectType, Person, Placement, Scene, Side } from '../model/index.ts'
import { PART_CLUE_TYPES } from '../clues/index.ts'
import { Rng } from './rng.ts'

const SIDES: Side[] = ['north', 'east', 'south', 'west']
const DIAGONALS = ['northwest', 'northeast', 'southwest', 'southeast'] as const

/** Clue kinds that describe the card holder themselves (everything but the holder-independent `emptyRoom`). */
export const SELF_CLUE_TYPES: ReadonlySet<string> = new Set([
  'onObject', 'squareWithObject', 'besideObject', 'onlyOnObject', 'inRoom', 'inRoomOr', 'inCorner',
  'besideFeature', 'inFrontOfDoor', 'alone', 'withPerson', 'aloneWith', 'inRow', 'inColumn', 'onLine',
  'directionOf', 'directionOfObject', 'exactDistance', 'directlyNextToObject', 'diagonal', 'quadrant',
  'sameRoom', 'differentRoom', 'notWith', 'notBesideObject',
  'inRoomEdge', 'roomHasGender', 'aloneWithGender', 'both',
])

export interface PoolOptions {
  /**
   * Also draw the kinds of CAD-9.1 to CAD-9.3: room-edge cards, gender cards (when people have genders) and combined
   * cards. Default false: the older generators (`generate`, the tier generator, the advanced generator behind hard and
   * expert) keep the pool they were calibrated on, so their committed fixtures and packs stay reproducible. The ladder
   * generator, which builds very easy to medium, turns it on.
   */
  newKinds?: boolean
  /**
   * Most combined cards (`both`) drawn per holder; 0 leaves them out. The pairs are a fixed pseudo-random
   * sample of the compatible pairs (the same solution always gives the same pool), so the pool does not
   * explode: n parts make n(n-1)/2 pairs. Default `COMBINED_PER_HOLDER`. Only with `newKinds`.
   */
  combinedPerHolder?: number
}

/** Combined cards kept per holder by default. */
export const COMBINED_PER_HOLDER = 24
/** Pairs looked at per wanted combined card, so a scene with few compatible pairs cannot loop for long. */
const PAIR_TRIES = 12

export interface ClueCandidate {
  clue: CatalogClue
  /** Index in the person list of the card holder. */
  holder: number
}

/** The victim's fixed card: alone with the murderer. It is always true and belongs to every puzzle. */
export function victimClue(victim: Person): CatalogClue {
  return { personId: victim.id, type: 'aloneWithMurderer', args: {} }
}

/** Part kinds whose truth depends on who else stands where: no square mask without the others. */
const PEOPLE_DEPENDENT: ReadonlySet<string> = new Set(['alone', 'withPerson', 'aloneWith', 'onlyOnObject', 'roomHasGender', 'aloneWithGender'])
const MASK_HOLDER = 'H'
const masks = new WeakMap<Scene, Map<string, Uint8Array>>()

/** Squares (1 per `row * width + col`) where a part is true for a holder standing alone; null when it depends on others. */
function partMask(scene: Scene, part: ClueBody): Uint8Array | null {
  if (PEOPLE_DEPENDENT.has(part.type)) return null
  let byKey = masks.get(scene)
  if (!byKey) masks.set(scene, (byKey = new Map()))
  const key = JSON.stringify(part)
  const known = byKey.get(key)
  if (known) return known
  const clue = { ...part, personId: MASK_HOLDER } as CatalogClue
  const mask = new Uint8Array(scene.width * scene.height)
  for (const cell of occupiableCells(scene)) {
    if (evaluate(clue, scene, [{ personId: MASK_HOLDER, cell }])) mask[cell.row * scene.width + cell.col] = 1
  }
  byKey.set(key, mask)
  return mask
}

/** Whether both parts say something the other does not (neither implies the other), judged where their squares are known. */
function independent(scene: Scene, a: ClueBody, b: ClueBody): boolean {
  const ma = partMask(scene, a)
  const mb = partMask(scene, b)
  if (!ma || !mb) return true
  let onlyA = false
  let onlyB = false
  for (let i = 0; i < ma.length && !(onlyA && onlyB); i++) {
    if (ma[i] === 1 && mb[i] === 0) onlyA = true
    if (mb[i] === 1 && ma[i] === 0) onlyB = true
  }
  return onlyA && onlyB
}

const bodyOf = (clue: CatalogClue): ClueBody => ({ type: clue.type, args: clue.args }) as ClueBody

/**
 * Every TRUE clue about a finished placement, from the full catalog (all
 * structural and relational kinds, with their optional room/alone qualifiers),
 * for every suspect. The victim only ever holds `aloneWithMurderer` (see
 * `victimClue`). Candidates are filtered through the catalog's own `evaluate`
 * and `checkClue`, so the generator can only ever use what the evaluator
 * supports. Order is deterministic (no randomness here).
 *
 * With `PoolOptions.newKinds` the pool also holds: gender cards (`roomHasGender`, `aloneWithGender`), only when
 * people have genders (CAD-9.1); room-edge cards (`inRoomEdge`) for the holder's own room and for every room (CAD-9.2);
 * and combined cards (`both`, CAD-9.3) from a capped sample of compatible pairs of the holder's other cards.
 */
export function enumerateTrueClues(
  scene: Scene,
  people: readonly Person[],
  solution: readonly Placement[],
  options: PoolOptions = {},
): ClueCandidate[] {
  const placements = [...solution]
  const puzzle = { scene, people: [...people] }
  const objectTypes: ObjectType[] = [...new Set(scene.objects.map((o) => o.type))].sort()
  const rooms = scene.rooms.map((r) => r.id)
  const seen = new Set<string>()
  const out: ClueCandidate[] = []
  const newKinds = options.newKinds ?? false
  const combinedCap = newKinds ? (options.combinedPerHolder ?? COMBINED_PER_HOLDER) : 0

  people.forEach((holder, index) => {
    if (holder.kind === 'victim') return
    const cell = placements.find((p) => p.personId === holder.id)?.cell
    if (!cell) return
    const room = roomIdAt(scene, cell)
    const others = people.filter((p) => p.id !== holder.id)
    /** The single-fact cards of this holder, the parts a combined card is made of. */
    const mine: CatalogClue[] = []
    const add = (type: string, args: Record<string, unknown>) => {
      const clue = { personId: holder.id, type, args } as CatalogClue
      const key = JSON.stringify(clue)
      if (seen.has(key)) return
      seen.add(key)
      if (!evaluate(clue, scene, placements, people) || checkClue(clue, puzzle).length > 0) return
      out.push({ clue, holder: index })
      mine.push(clue)
    }

    // Optional qualifiers a direction/distance/diagonal clue may carry.
    const qualified: Qualifiers[] = [{}, { roomId: room }, { alone: true }, { roomId: room, alone: true }]
    const withQualifiers = (type: string, base: Record<string, unknown>) => {
      for (const q of qualified) add(type, { ...base, ...q })
    }

    for (const objectType of objectTypes) {
      add('onObject', { objectType })
      add('squareWithObject', { objectType })
      add('besideObject', { objectType })
      add('besideObject', { objectType, exactlyOne: true })
      add('onlyOnObject', { objectType })
      add('notBesideObject', { objectType })
      for (const side of SIDES) {
        add('directlyNextToObject', { side, objectType })
        withQualifiers('directionOfObject', { side, objectType })
      }
    }
    for (const roomId of rooms) {
      add('inRoom', { roomId })
      add('emptyRoom', { roomId })
      for (const other of rooms) if (roomId < other) add('inRoomOr', { roomIds: [roomId, other] })
    }
    add('inCorner', {})
    add('inCorner', { roomId: room })
    if (newKinds) {
      for (const edge of SIDES) {
        add('inRoomEdge', { edge })
        for (const roomId of rooms) add('inRoomEdge', { roomId, edge })
      }
      for (const gender of GENDERS) {
        add('roomHasGender', { gender })
        add('aloneWithGender', { gender })
      }
    }
    add('besideFeature', { feature: 'window' })
    add('besideFeature', { feature: 'door' })
    add('inFrontOfDoor', {})
    add('alone', {})
    add('alone', { roomId: room })
    for (let i = 0; i < Math.max(scene.width, scene.height); i++) {
      add('inRow', { index: i })
      add('inColumn', { index: i })
    }
    for (const axis of ['row', 'column'] as const) {
      for (const position of ['first', 'last', 'middle'] as const) add('onLine', { axis, position })
    }
    for (const other of others) {
      const otherId = other.id
      for (const q of [{}, { roomId: room }]) {
        add('withPerson', { otherId, ...q })
        add('aloneWith', { otherId, ...q })
      }
      add('sameRoom', { otherId })
      add('differentRoom', { otherId })
      add('notWith', { otherId })
      for (const side of SIDES) {
        withQualifiers('directionOf', { side, otherId })
        for (let count = 1; count < Math.max(scene.width, scene.height); count++) {
          withQualifiers('exactDistance', { side, count, otherId })
        }
      }
      for (const direction of DIAGONALS) withQualifiers('quadrant', { direction, otherId })
      withQualifiers('diagonal', { otherId })
      for (const direction of DIAGONALS) {
        withQualifiers('diagonal', { otherId, direction })
        for (let steps = 1; steps < Math.min(scene.width, scene.height); steps++) {
          withQualifiers('diagonal', { otherId, direction, steps })
        }
      }
      for (let steps = 1; steps < Math.min(scene.width, scene.height); steps++) {
        withQualifiers('diagonal', { otherId, steps })
      }
    }

    // Combined cards: a fixed pseudo-random sample of the pairs of parts that each add something to the other.
    const parts = mine.filter((c) => (PART_CLUE_TYPES as readonly string[]).includes(c.type))
    if (combinedCap > 0 && parts.length > 1) {
      const pick = new Rng(index * 7919 + cell.row * 131 + cell.col + 1)
      let made = 0
      // Gender parts are few among the many structural ones: every other pair starts from one, so they get combined too.
      const gendered = parts.flatMap((c, at) => ((GENDERS as readonly string[]).includes(String((c.args as { gender?: unknown }).gender)) ? [at] : []))
      for (let tries = 0; tries < combinedCap * PAIR_TRIES && made < combinedCap; tries++) {
        const i = tries % 2 === 1 && gendered.length > 0 ? (gendered[pick.int(gendered.length)] as number) : pick.int(parts.length)
        const j = pick.int(parts.length)
        if (i === j) continue
        const [a, b] = [parts[Math.min(i, j)] as CatalogClue, parts[Math.max(i, j)] as CatalogClue]
        if (!independent(scene, bodyOf(a), bodyOf(b))) continue
        const before = out.length
        add('both', { a: bodyOf(a), b: bodyOf(b) })
        if (out.length > before) made++
      }
    }
  })
  return out
}
