import type { Gender } from '../../engine/model/index.ts'
import { createRng, shuffled } from '../../render/cards/procedural/rng.ts'
import { CAST_LETTERS, MAX_CAST_SIZE, initialOf, namesFor, poolEntry } from './pool.ts'
import { portraitsFor, type PortraitLook } from './portraits.ts'

/** The people of one puzzle, decided once (when the schedule is generated) and baked into it. */
export interface Cast {
  /** Suspect names in seat order, alphabetical by first letter. */
  names: string[]
  /** Genders in the same order. */
  genders: Gender[]
  /** Portraits in the same order, picked by gender slot and colour (not by name). */
  portraits: PortraitLook[]
}

/**
 * The cast for a puzzle of `size` people: `size - 1` suspects (the victim needs no name), each with a distinct first letter and one name
 * of the pool, genders balanced (the counts differ by at most one; with an odd number the seed decides which gender has one more).
 * Deterministic per `seed`. Names of `previousCast` (the day before) are never used again, and letters it used are left alone as long
 * as there are other letters, so consecutive days do not repeat the set. Portraits: see `portraitsFor`.
 */
export function castFor(size: number, seed: string | number, previousCast: readonly string[] = []): Cast {
  if (!Number.isInteger(size) || size < 1 || size > MAX_CAST_SIZE) {
    throw new RangeError(`size must be an integer from 1 to ${MAX_CAST_SIZE}, got ${size}`)
  }
  const count = size - 1
  const rng = createRng(`cast:${seed}`)
  const previous = new Set(previousCast.map((n) => n.trim().toLowerCase()))
  const previousLetters = new Set(previousCast.map(initialOf))

  const fresh = shuffled(CAST_LETTERS.filter((l) => !previousLetters.has(l)), rng)
  const stale = shuffled(CAST_LETTERS.filter((l) => previousLetters.has(l)), rng)
  const letters = [...fresh, ...stale].slice(0, count)

  const women = Math.floor(count / 2) + (count % 2 === 1 && rng.next() < 0.5 ? 1 : 0)
  const genders = shuffled<Gender>([...Array<Gender>(women).fill('woman'), ...Array<Gender>(count - women).fill('man')], rng)

  const picked = letters.map((letter, i) => {
    const gender = genders[i]!
    const all = namesFor(letter, gender)
    const free = all.filter((n) => !previous.has(n.toLowerCase()))
    return { letter, gender, name: rng.pick(free.length > 0 ? free : all) }
  })
  picked.sort((a, b) => a.letter.localeCompare(b.letter))
  const sorted = picked.map((p) => p.gender)
  return { names: picked.map((p) => p.name), genders: sorted, portraits: portraitsFor(sorted, seed) }
}

/**
 * What is wrong with a puzzle's cast, empty when it is fine: every name is in the pool, no two names share a first letter, the genders
 * (when given) are the ones the pool gives the names, and the counts of women and men differ by at most one. The schedule tool and the
 * pack gates run this on what is baked into a puzzle.
 */
export function castProblems(names: readonly string[], genders?: readonly (Gender | undefined)[]): string[] {
  const problems: string[] = []
  const unknown = names.filter((n) => poolEntry(n) === undefined)
  if (unknown.length > 0) problems.push(`names not in the cast pool: ${unknown.join(', ')}`)
  const seen = new Map<string, string>()
  for (const name of names) {
    const letter = initialOf(name)
    const other = seen.get(letter)
    if (other !== undefined) problems.push(`"${name}" and "${other}" share the first letter ${letter}`)
    else seen.set(letter, name)
  }
  if (genders !== undefined) {
    if (genders.length !== names.length) problems.push(`${names.length} names but ${genders.length} genders`)
    names.forEach((name, i) => {
      const entry = poolEntry(name)
      if (entry && genders[i] !== entry.gender) problems.push(`"${name}" is a ${entry.gender} in the pool, not ${genders[i] ?? 'without a gender'}`)
    })
  }
  const known = names.map((n) => poolEntry(n)?.gender).filter((g): g is Gender => g !== undefined)
  const women = known.filter((g) => g === 'woman').length
  if (Math.abs(women - (known.length - women)) > 1) problems.push(`genders not balanced: ${women} women, ${known.length - women} men`)
  return problems
}

/** The names two casts have in common (empty when consecutive days differ, as the schedule tool wants). Case-insensitive. */
export function sharedNames(a: readonly string[], b: readonly string[]): string[] {
  const other = new Set(b.map((n) => n.toLowerCase()))
  return a.filter((n) => other.has(n.toLowerCase()))
}

