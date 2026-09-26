import type { Gender } from '../../engine/model/index.ts'
import { createRng, shuffled } from '../../render/cards/procedural/rng.ts'
import {
  ACCENT_COLORS, CLOTHES_COLORS, HAIR_COLORS, SKIN_TONES,
  type Accessory, type Brows, type ClothesStyle, type HairStyle, type Mouth, type ProceduralTraits,
} from '../../render/cards/procedural/traits.ts'

/** One generic portrait design: the shape of the hair, the outfit and the accessory. Colours come on top (see `PortraitLook`). */
export interface PortraitDesign {
  id: string
  /** Which side of the cast the design is drawn for; a portrait is picked by gender slot, never by name. */
  gender: Gender
  hairStyle: HairStyle
  clothesStyle: ClothesStyle
  accessory: Accessory
  mouth: Mouth
  brows: Brows
}

const d = (id: string, gender: Gender, hairStyle: HairStyle, clothesStyle: ClothesStyle, accessory: Accessory, mouth: Mouth, brows: Brows): PortraitDesign =>
  ({ id, gender, hairStyle, clothesStyle, accessory, mouth, brows })

/** Eight female-coded and eight male-coded designs: no two share hair and accessory, so two people of one puzzle never look alike. */
export const PORTRAIT_DESIGNS: readonly PortraitDesign[] = [
  d('f1', 'woman', 'long', 'vneck', 'none', 'smile', 'straight'),
  d('f2', 'woman', 'bob', 'crew', 'roundGlasses', 'smile', 'raised'),
  d('f3', 'woman', 'bun', 'hoodie', 'hoops', 'grin', 'straight'),
  d('f4', 'woman', 'ponytail', 'collar', 'headband', 'smile', 'raised'),
  d('f5', 'woman', 'curly', 'stripes', 'freckles', 'grin', 'straight'),
  d('f6', 'woman', 'long', 'crew', 'squareGlasses', 'neutral', 'raised'),
  d('f7', 'woman', 'short', 'vneck', 'hoops', 'smirk', 'straight'),
  d('f8', 'woman', 'bob', 'collar', 'headband', 'smile', 'raised'),
  d('m1', 'man', 'short', 'crew', 'roundGlasses', 'grin', 'thick'),
  d('m2', 'man', 'sidePart', 'collar', 'freckles', 'smirk', 'straight'),
  d('m3', 'man', 'buzz', 'crew', 'beard', 'smile', 'thick'),
  d('m4', 'man', 'curly', 'hoodie', 'moustache', 'smirk', 'raised'),
  d('m5', 'man', 'bald', 'vneck', 'squareGlasses', 'neutral', 'thick'),
  d('m6', 'man', 'short', 'hoodie', 'cap', 'grin', 'straight'),
  d('m7', 'man', 'sidePart', 'stripes', 'beard', 'smile', 'raised'),
  d('m8', 'man', 'buzz', 'collar', 'beanie', 'smirk', 'straight'),
]

/** A design with its colours: plain data, everything a portrait needs. Nothing in it comes from a name. */
export interface PortraitLook {
  design: string
  skin: string
  hairColor: string
  clothesColor: string
  /** Colour of a hat, headband or the frame of square glasses. */
  accentColor: string
}

const designById = new Map(PORTRAIT_DESIGNS.map((p) => [p.id, p]))

/** The drawing traits of a look. */
export function traitsOf(look: PortraitLook): ProceduralTraits {
  const design = designById.get(look.design)
  if (!design) throw new RangeError(`Unknown portrait design "${look.design}"`)
  return {
    skin: look.skin,
    hairStyle: design.hairStyle,
    hairColor: look.hairColor,
    clothesStyle: design.clothesStyle,
    clothesColor: look.clothesColor,
    accessory: design.accessory,
    accentColor: look.accentColor,
    mouth: design.mouth,
    brows: design.brows,
  }
}

/** The gender slot of each person: their own, or for a person without one alternating woman/man (by position). */
export const slotGenders = (genders: readonly (Gender | undefined)[]): Gender[] =>
  genders.map((g, i) => g ?? (i % 2 === 0 ? 'woman' : 'man'))

/**
 * The portraits for a list of people, by gender slot: the k-th woman gets the k-th female design of a seeded order, the k-th man the k-th male
 * design, so two people of one puzzle never share a design (up to eight of each gender). A person without a gender takes the next slot of an
 * alternating woman/man. Colours (skin, hair, shirt, accent) walk seeded orders too, so the first eight skin tones and the first ten shirt
 * colours are all different. Same genders and seed, same portraits; the names play no part.
 */
export function portraitsFor(genders: readonly (Gender | undefined)[], seed: string | number): PortraitLook[] {
  const rng = createRng(`portraits:${seed}`)
  const designs = {
    woman: shuffled(PORTRAIT_DESIGNS.filter((p) => p.gender === 'woman'), rng),
    man: shuffled(PORTRAIT_DESIGNS.filter((p) => p.gender === 'man'), rng),
  }
  const skins = shuffled(SKIN_TONES, rng)
  const hairs = shuffled(HAIR_COLORS, rng)
  const shirts = shuffled(CLOTHES_COLORS, rng)
  const accents = shuffled(ACCENT_COLORS, rng)
  const seen = { woman: 0, man: 0 }
  return slotGenders(genders).map((gender, i) => {
    const pool = designs[gender]
    const design = pool[seen[gender]++ % pool.length]!
    return {
      design: design.id,
      skin: skins[i % skins.length]!,
      hairColor: hairs[(i + Math.floor(i / hairs.length)) % hairs.length]!,
      clothesColor: shirts[i % shirts.length]!,
      accentColor: accents[i % accents.length]!,
    }
  })
}
