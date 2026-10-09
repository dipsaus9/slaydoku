import type { Gender } from '../../engine/model/index.ts'
import { createRng, shuffled } from '../../render/cards/procedural/rng.ts'
import { CAST_LETTERS, MAX_CAST_SIZE, initialOf, namesFor, poolEntry } from './pool.ts'
import { portraitsFor, type PortraitLook } from './portraits.ts'
import { MONKEY_FUR, SIMPSHOUSE_ALWAYS, SIMPSHOUSE_PORTRAIT_DESIGNS, SIMPSHOUSE_POOL } from './simpshouse.ts'
import type { CastName } from './pool.ts'

/** A theme's own cast pool and the names every cast of it holds. */
interface ThemePool {
  pool: readonly CastName[]
  always: readonly string[]
}

/** Themes with a cast pool of their own (the others draw from the regular pool). Joint pools choose letters and genders together. */
const THEME_POOLS: Readonly<Record<string, ThemePool>> = { simpshouse: { pool: SIMPSHOUSE_POOL, always: SIMPSHOUSE_ALWAYS } }

/** Whether a theme draws its cast from a pool of its own: such a day stays out of the nominal cast chain (see `schedule/cast.ts`). */
export const hasOwnCastPool = (theme: string): boolean => theme in THEME_POOLS

/** Look of a name bound to a portrait (Simpshouse only), built on the slot look it replaces; undefined for every other name. */
export function boundPortrait(name: string, slot: PortraitLook): PortraitLook | undefined {
  const design = SIMPSHOUSE_PORTRAIT_DESIGNS[name]
  return design === undefined ? undefined : { ...slot, design, skin: MONKEY_FUR }
}

/**
 * A cast from a theme's own pool: `size - 1` names with distinct first letters, always holding the theme's `always` names (Simpshouse:
 * Romy and Dennis, SLAY-24), whose letters are then taken; the other letters and their genders are chosen together (most letters hold one
 * gender), counts of women and men differ by at most one, and the seed decides everything else. Names of `previousCast` are avoided when
 * another name of the letter exists (an `always` name is kept whatever the day before had).
 */
function themedCast({ pool, always }: ThemePool, size: number, seed: string | number, previousCast: readonly string[]): Cast {
  const letters = [...new Set(pool.map((n) => initialOf(n.name)))]
  const fixed = always.map((name) => {
    const entry = pool.find((n) => n.name === name)
    if (entry === undefined) throw new Error(`"${name}" is not in the theme's pool`)
    return { letter: initialOf(name), gender: entry.gender, name }
  })
  const minSize = Math.max(1, fixed.length + 1)
  if (!Number.isInteger(size) || size < minSize || size > letters.length + 1) {
    throw new RangeError(`size must be an integer from ${minSize} to ${letters.length + 1}, got ${size}`)
  }
  const count = size - 1
  const rng = createRng(`cast:${seed}`)
  const previous = new Set(previousCast.map((n) => n.trim().toLowerCase()))
  const fixedLetters = new Set(fixed.map((f) => f.letter))
  const open = letters.filter((l) => !fixedLetters.has(l))
  const gendersOf = (letter: string) => new Set(pool.filter((n) => initialOf(n.name) === letter).map((n) => n.gender))
  const fixedWomen = fixed.filter((f) => f.gender === 'woman').length
  const fixedMen = fixed.length - fixedWomen
  const preferred = Math.floor(count / 2) + (count % 2 === 1 && rng.next() < 0.5 ? 1 : 0)
  for (let attempt = 0; attempt < 1000; attempt++) {
    const chosen = shuffled(open, rng).slice(0, count - fixed.length)
    const onlyWomen = chosen.filter((l) => !gendersOf(l).has('man'))
    const onlyMen = chosen.filter((l) => !gendersOf(l).has('woman'))
    // The seed's count of women, or the other balanced count when the letters cannot give it (an odd count has two balanced splits).
    const fits = (w: number) => fixedWomen + onlyWomen.length <= w && fixedMen + onlyMen.length <= count - w
    const women = [preferred, count - preferred].find(fits)
    if (women === undefined) continue
    const both = chosen.filter((l) => gendersOf(l).size === 2)
    const wantWomen = women - fixedWomen - onlyWomen.length
    const asWoman = new Set([...onlyWomen, ...both.slice(0, wantWomen)])
    let blocked = false
    const drawn = chosen.map((letter) => {
      const gender: Gender = asWoman.has(letter) ? 'woman' : 'man'
      const all = pool.filter((n) => initialOf(n.name) === letter && n.gender === gender).map((n) => n.name)
      const free = all.filter((n) => !previous.has(n.toLowerCase()))
      if (free.length === 0) blocked = true
      return { letter, gender, name: rng.pick(free.length > 0 ? free : all) }
    })
    // A letter whose only name of that gender is a previous name: draw again (for a while), so neighbours share no name when possible.
    if (blocked && attempt < 500) continue
    const picked = [...fixed, ...drawn].sort((a, b) => a.letter.localeCompare(b.letter))
    const genders = picked.map((p) => p.gender)
    const portraits = portraitsFor(genders, seed).map((slot, i) => boundPortrait(picked[i]!.name, slot) ?? slot)
    return { names: picked.map((p) => p.name), genders, portraits }
  }
  throw new RangeError(`no cast of ${count} suspects fits the pool with balanced genders`)
}

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
 * as there are other letters, so consecutive days do not repeat the set. Portraits: see `portraitsFor`. A `theme` with a pool of its own
 * (Simpshouse) draws from that pool instead (see `themedCast`); the regular draw is untouched by it.
 */
export function castFor(size: number, seed: string | number, previousCast: readonly string[] = [], theme?: string): Cast {
  const own = theme === undefined ? undefined : THEME_POOLS[theme]
  if (own !== undefined) return themedCast(own, size, seed, previousCast)
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

