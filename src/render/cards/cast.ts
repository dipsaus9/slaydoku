import type { ComponentType } from 'react'
import type { Gender } from '../../engine/model/index.ts'
import { neutralAvatar } from './avatars/neutral.tsx'
import type { AvatarProps } from './avatars/parts.tsx'
import { lighten } from './procedural/color.ts'
import type { ProceduralTraits } from './procedural/traits.ts'

/** What sets one avatar apart from the others; a test keeps every pair far enough apart. */
export interface AvatarTraits {
  skin: string
  hairColor: string
  hairStyle: string
  accessory: string
  clothes: string
}

export interface CastMember {
  /** Display name; also how a person's label finds their avatar. */
  name: string
  /** Gender of the person, for the gender clues (vrouw/man). */
  gender: Gender
  Avatar: ComponentType<AvatarProps>
  traits: AvatarTraits
  /** Backdrop behind the portrait on the polaroid. */
  photo: string
  /** Fill of the clue bubble under the polaroid. */
  bubble: string
}

interface Seed {
  name: string
  gender: Gender
  clothesName: string
  look: ProceduralTraits
}

const SEEDS: readonly Seed[] = [
  {
    name: 'Alice',
    gender: 'vrouw',
    clothesName: 'teal',
    look: { skin: '#f6d2b4', hairStyle: 'long', hairColor: '#4a3222', clothesStyle: 'vneck', clothesColor: '#2fa39a', accessory: 'none', accentColor: '#c8423d', mouth: 'smile', brows: 'straight' },
  },
  {
    name: 'Ben',
    gender: 'man',
    clothesName: 'blue',
    look: { skin: '#e2ab80', hairStyle: 'short', hairColor: '#1f1a24', clothesStyle: 'crew', clothesColor: '#4a86c9', accessory: 'roundGlasses', accentColor: '#2f6db3', mouth: 'grin', brows: 'thick' },
  },
  {
    name: 'Chloe',
    gender: 'vrouw',
    clothesName: 'pink',
    look: { skin: '#8a5236', hairStyle: 'bun', hairColor: '#1f1a24', clothesStyle: 'hoodie', clothesColor: '#d96aa3', accessory: 'hoops', accentColor: '#e0a526', mouth: 'smile', brows: 'raised' },
  },
  {
    name: 'Dan',
    gender: 'man',
    clothesName: 'green',
    look: { skin: '#fadcc6', hairStyle: 'sidePart', hairColor: '#dd7a2a', clothesStyle: 'collar', clothesColor: '#5aa65a', accessory: 'freckles', accentColor: '#2f8f5b', mouth: 'smirk', brows: 'straight' },
  },
  {
    name: 'Emma',
    gender: 'vrouw',
    clothesName: 'violet',
    look: { skin: '#c98c5e', hairStyle: 'bob', hairColor: '#e6c46b', clothesStyle: 'stripes', clothesColor: '#a05bbf', accessory: 'squareGlasses', accentColor: '#7d4fb0', mouth: 'neutral', brows: 'raised' },
  },
  {
    name: 'Frank',
    gender: 'man',
    clothesName: 'orange',
    look: { skin: '#f0c29b', hairStyle: 'buzz', hairColor: '#9aa1ab', clothesStyle: 'crew', clothesColor: '#e8863a', accessory: 'beard', accentColor: '#3a3f4a', mouth: 'smile', brows: 'thick' },
  },
  {
    name: 'Grace',
    gender: 'vrouw',
    clothesName: 'yellow',
    look: { skin: '#6b3d2a', hairStyle: 'ponytail', hairColor: '#a3441f', clothesStyle: 'collar', clothesColor: '#e3b93c', accessory: 'headband', accentColor: '#c8423d', mouth: 'grin', brows: 'straight' },
  },
  {
    name: 'Henry',
    gender: 'man',
    clothesName: 'indigo',
    look: { skin: '#a86b45', hairStyle: 'curly', hairColor: '#ececf2', clothesStyle: 'hoodie', clothesColor: '#5b5fc0', accessory: 'moustache', accentColor: '#2f6db3', mouth: 'smirk', brows: 'raised' },
  },
]

/** The eight suspects of the placeholder cast, in seat order. Genders alternate vrouw/man. Portraits are procedural busts. */
export const CAST: readonly CastMember[] = SEEDS.map(({ name, gender, clothesName, look }) => ({
  name,
  gender,
  Avatar: neutralAvatar(name, look),
  traits: { skin: look.skin, hairColor: look.hairColor, hairStyle: look.hairStyle, accessory: look.accessory, clothes: clothesName },
  photo: lighten(look.clothesColor, 0.62),
  bubble: lighten(look.clothesColor, 0.8),
}))

/** The cast member whose name matches `label` (case-insensitive), if any. */
export function castMemberFor(label: string): CastMember | undefined {
  const wanted = label.trim().toLowerCase()
  return CAST.find((m) => m.name.toLowerCase() === wanted)
}
