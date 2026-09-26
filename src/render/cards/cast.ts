import type { ComponentType } from 'react'
import { portraitsFor, traitsOf } from '../../content/cast/index.ts'
import type { Gender } from '../../engine/model/index.ts'
import { neutralAvatar } from './avatars/neutral.tsx'
import type { AvatarProps } from './avatars/parts.tsx'
import { lighten } from './procedural/color.ts'

/** What sets one portrait apart from the others; a test keeps every pair far enough apart. */
export interface AvatarTraits {
  skin: string
  hairColor: string
  hairStyle: string
  accessory: string
  clothes: string
}

export interface CastMember {
  /** Display name of the sample person. */
  name: string
  /** Gender of the person, for the gender clues (woman/man). */
  gender: Gender
  Avatar: ComponentType<AvatarProps>
  traits: AvatarTraits
  /** Backdrop behind the portrait on the polaroid. */
  photo: string
  /** Fill of the clue bubble under the polaroid. */
  bubble: string
}

/** Names of the sample people below: eight pool names with unique first letters, women and men alternating. */
const SAMPLE_NAMES = ['Alice', 'Ben', 'Chloe', 'Dan', 'Emma', 'Frank', 'Grace', 'Henry'] as const

const SAMPLE_GENDERS: readonly Gender[] = ['woman', 'man', 'woman', 'man', 'woman', 'man', 'woman', 'man']

const SAMPLE_LOOKS = portraitsFor(SAMPLE_GENDERS, 'sample')

/**
 * Eight sample people (the demo level's cast, the how-it-works host). Their portraits come from the gender slot like every
 * puzzle's, not from the name: any other name would get the same drawing in the same slot. Real puzzles take their people from `castFor`.
 */
export const CAST: readonly CastMember[] = SAMPLE_NAMES.map((name, i) => {
  const look = SAMPLE_LOOKS[i]!
  const traits = traitsOf(look)
  return {
    name,
    gender: SAMPLE_GENDERS[i]!,
    Avatar: neutralAvatar(name, traits),
    traits: { skin: traits.skin, hairColor: traits.hairColor, hairStyle: traits.hairStyle, accessory: traits.accessory, clothes: look.clothesColor },
    photo: lighten(look.clothesColor, 0.62),
    bubble: lighten(look.clothesColor, 0.8),
  }
})
