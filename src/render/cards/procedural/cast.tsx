import type { ReactNode } from 'react'
import type { Gender } from '../../../engine/model/index.ts'
import { CAST } from '../cast.ts'
import { generateAvatars } from './generate.ts'
import { GENDERED_NAMES, NAME_POOL } from './names.ts'
import type { GenderedName } from './names.ts'
import { ProceduralAvatar } from './ProceduralAvatar.tsx'
import { createRng, shuffled } from './rng.ts'

/** What a polaroid needs to show one person, whoever drew the portrait. */
export interface CardLook {
  portrait: ReactNode
  /** Backdrop behind the portrait. */
  photo: string
  /** Fill of the clue bubble. */
  bubble: string
}

export interface CastEntry {
  name: string
  /** True for the eight fixed cast members, false for generated extras. */
  drawn: boolean
  /** The fixed eight alternate woman/man; generated extras get one so that the cast is balanced (see `buildCast`). */
  gender: Gender
  look: CardLook
}

export interface BuiltCast {
  /** In seat order: the fixed eight first, then the extras. */
  entries: readonly CastEntry[]
  names: readonly string[]
  /** Genders in the same order as `names`: the gender clues need them (the puzzle's people carry them). */
  genders: readonly Gender[]
  /** Look for a person's label (case-insensitive), if the cast has that name. */
  lookFor(label: string): CardLook | undefined
}

/** Most suspects a cast can hold: the fixed eight plus one extra per pool name. */
export const MAX_SUSPECTS = CAST.length + NAME_POOL.length

/** A board of `size` x `size` has one suspect per row except the gift's: size - 1. */
export const suspectsForSize = (size: number) => size - 1

/**
 * The cast for a puzzle with `suspectCount` suspects. The fixed eight come
 * first (Alice, Ben, Chloe, Dan, Emma, Frank, Grace, Henry), so boards up to
 * 9x9 use only them. Larger boards add generated extras: names from
 * the pool, shuffled by `seed` without repeating and never reusing a fixed
 * name; avatars from `generateAvatars`, pairwise different. Same seed, same cast.
 *
 * Genders (CAD-9.4, for the gender clues): the fixed eight alternate woman/man (Alice woman, Ben man, Chloe woman, Dan man,
 * Emma woman, Frank man, Grace woman, Henry man: four each). Extras ALTERNATE so the whole cast stays
 * balanced: each extra takes the gender the cast has fewer of so far (woman on a tie) and the first unused name of that
 * gender in the seeded order. A name reads as one gender (`GENDERED_NAMES`), so a card never says "Daan" and "woman".
 */
export function buildCast(suspectCount: number, seed: string | number = 'slaydoku'): BuiltCast {
  if (!Number.isInteger(suspectCount) || suspectCount < 0 || suspectCount > MAX_SUSPECTS) {
    throw new RangeError(`suspectCount must be an integer from 0 to ${MAX_SUSPECTS}, got ${suspectCount}`)
  }
  const drawn: CastEntry[] = CAST.slice(0, suspectCount).map((m) => ({
    name: m.name,
    drawn: true,
    gender: m.gender,
    look: { portrait: <m.Avatar decorative />, photo: m.photo, bubble: m.bubble },
  }))
  const extraCount = suspectCount - drawn.length
  const names = pickExtraNames(drawn.map((d) => d.gender), extraCount, seed)
  const avatars = generateAvatars(seed, extraCount)
  const extras: CastEntry[] = names.map(({ name, gender }, i) => {
    const avatar = avatars[i]!
    return {
      name,
      gender,
      drawn: false,
      look: {
        portrait: <ProceduralAvatar traits={avatar.traits} title={name} decorative />,
        photo: avatar.photo,
        bubble: avatar.bubble,
      },
    }
  })
  const entries = [...drawn, ...extras]
  const byName = new Map(entries.map((e) => [e.name.toLowerCase(), e.look]))
  return {
    entries,
    names: entries.map((e) => e.name),
    genders: entries.map((e) => e.gender),
    lookFor: (label) => byName.get(label.trim().toLowerCase()),
  }
}

/** `count` extra names, alternating the genders so that, with `taken`, the cast is balanced; names in the seeded order. */
function pickExtraNames(taken: readonly Gender[], count: number, seed: string | number): GenderedName[] {
  const order = shuffled(GENDERED_NAMES, createRng(`names:${seed}`))
  const left = new Set(order)
  const balance = { woman: taken.filter((g) => g === 'woman').length, man: taken.filter((g) => g === 'man').length }
  const out: GenderedName[] = []
  for (let i = 0; i < count; i++) {
    const wanted: Gender = balance.man < balance.woman ? 'man' : 'woman'
    // The pool always holds both genders; the fallback only matters if one ran dry on a full-size cast.
    const next = order.find((n) => left.has(n) && n.gender === wanted) ?? order.find((n) => left.has(n)) as GenderedName
    left.delete(next)
    balance[next.gender]++
    out.push(next)
  }
  return out
}

/** Cast for a `size` x `size` board (`size` - 1 suspects). */
export const buildCastForBoard = (size: number, seed?: string | number) => buildCast(suspectsForSize(size), seed)
