import { lighten } from './color.ts'
import { generateTraitsSet, traitsKey, type ProceduralTraits } from './traits.ts'

export interface GeneratedAvatar {
  /** The seed the avatar was generated from. */
  seed: string | number
  /** Position within the seed's set; earlier avatars never change when count grows. */
  index: number
  traits: ProceduralTraits
  /** Stable identity of the look; equal keys mean equal drawings. */
  key: string
  /** Polaroid backdrop, a pale tint of the clothes colour. */
  photo: string
  /** Clue bubble fill, a paler tint still. */
  bubble: string
}

function describe(seed: string | number, index: number, traits: ProceduralTraits): GeneratedAvatar {
  return {
    seed,
    index,
    traits,
    key: traitsKey(traits),
    photo: lighten(traits.clothesColor, 0.62),
    bubble: lighten(traits.clothesColor, 0.8),
  }
}

/**
 * `count` avatars from one seed, deterministic and pairwise different: any two
 * differ in at least three of skin, hair style, hair colour, clothes style,
 * clothes colour and accessory.
 */
export function generateAvatars(seed: string | number, count: number): GeneratedAvatar[] {
  return generateTraitsSet(seed, count).map((traits, index) => describe(seed, index, traits))
}

/**
 * The avatar at `index` (default 0) of a seed's set. Each one is distinct from
 * every lower index of the same seed, and the same call always returns the same look.
 */
export function generateAvatar(seed: string | number, index = 0): GeneratedAvatar {
  return generateAvatars(seed, index + 1)[index] as GeneratedAvatar
}
