import type { ReactNode } from 'react'
import { MONKEY_DESIGN, boundPortrait, castFor, traitsOf, portraitsFor, slotGenders, MAX_CAST_SIZE, poolEntry, type Cast, type PortraitLook } from '../../../content/cast/index.ts'
import type { Gender } from '../../../engine/model/index.ts'
import { lighten } from './color.ts'
import { MonkeyAvatar } from './MonkeyAvatar.tsx'
import { ProceduralAvatar } from './ProceduralAvatar.tsx'

/** What a polaroid needs to show one person. */
export interface CardLook {
  portrait: ReactNode
  /** Backdrop behind the portrait. */
  photo: string
  /** Fill of the clue bubble. */
  bubble: string
}

export interface CastEntry {
  name: string
  gender: Gender
  look: CardLook
}

export interface BuiltCast {
  /** In seat order. */
  entries: readonly CastEntry[]
  names: readonly string[]
  /** Genders in the same order as `names`: the gender clues need them (the puzzle's people carry them). */
  genders: readonly Gender[]
  /** Look for a person's label (case-insensitive), if the cast has that name. */
  lookFor(label: string): CardLook | undefined
}

/** Most suspects a cast can hold: one per first letter of the name pool. */
export const MAX_SUSPECTS = MAX_CAST_SIZE - 1

/** A board of `size` x `size` has one suspect per row except the gift's: size - 1. */
export const suspectsForSize = (size: number) => size - 1

/** The polaroid look of one portrait: the drawing, a pale tint of the shirt colour behind it and a paler one for the clue bubble. */
export function cardLookOf(look: PortraitLook, title?: string): CardLook {
  return {
    portrait:
      look.design === MONKEY_DESIGN
        ? <MonkeyAvatar fur={look.skin} clothes={look.clothesColor} title={title} decorative />
        : <ProceduralAvatar traits={traitsOf(look)} title={title} decorative />,
    photo: lighten(look.clothesColor, 0.62),
    bubble: lighten(look.clothesColor, 0.8),
  }
}

/**
 * Built cast for people who already have names (baked into the puzzle): portraits by gender slot and `seed`, never by name. A person
 * without a gender takes the pool's gender for the name, else the next slot of an alternating woman/man.
 */
export function buildCastFromPeople(people: readonly { name: string; gender?: Gender | undefined }[], seed: string | number = 'slaydoku'): BuiltCast {
  const genders = slotGenders(people.map((p) => p.gender ?? poolEntry(p.name)?.gender))
  // A name bound to a portrait (Biko, Simpshouse only) keeps it whatever the slot; every other name takes its slot portrait.
  const portraits = portraitsFor(genders, seed).map((slot, i) => boundPortrait(people[i]!.name, slot) ?? slot)
  const entries: CastEntry[] = people.map((p, i) => ({ name: p.name, gender: genders[i], look: cardLookOf(portraits[i]!, p.name) }))
  const byName = new Map(entries.map((e) => [e.name.toLowerCase(), e.look]))
  return {
    entries,
    names: entries.map((e) => e.name),
    genders,
    lookFor: (label) => byName.get(label.trim().toLowerCase()),
  }
}

/** The built cast of a `castFor` result. */
export const buildCastFromCast = (cast: Cast, seed: string | number = 'slaydoku'): BuiltCast =>
  buildCastFromPeople(cast.names.map((name, i) => ({ name, gender: cast.genders[i] })), seed)

/** Cast for a puzzle with `suspectCount` suspects: names from the pool (`castFor`), portraits by gender slot. Same seed, same cast. */
export function buildCast(suspectCount: number, seed: string | number = 'slaydoku'): BuiltCast {
  if (!Number.isInteger(suspectCount) || suspectCount < 0 || suspectCount > MAX_SUSPECTS) {
    throw new RangeError(`suspectCount must be an integer from 0 to ${MAX_SUSPECTS}, got ${suspectCount}`)
  }
  return buildCastFromCast(castFor(suspectCount + 1, seed), seed)
}

/** Cast for a `size` x `size` board (`size` - 1 suspects). */
export const buildCastForBoard = (size: number, seed?: string | number) => buildCast(suspectsForSize(size), seed)
