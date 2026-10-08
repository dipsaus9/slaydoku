import type { ObjectType, PlacedObject } from '../../engine/model/index.ts'
import type { Locale } from '../../locale/types.ts'
import { SCENE_THEMES } from './index.ts'
import type { ThemeObject } from './types.ts'

/**
 * What the board draws for a scene object, as far as a clue can name it.
 *
 * An engine Scene has no kind field: the random scene generator ids an object `<kind>-<n>`
 * (`gardenChair-2`), which is how the UI finds its theme art too (`themeIconsFor`). Hand-made
 * house scenes use other ids and draw the plain engine icon of their type.
 */

/** Theme objects by kind. A kind name is shared across themes only with the same words and art (tested). */
const BY_KIND: ReadonlyMap<string, ThemeObject> = new Map(
  [...SCENE_THEMES].reverse().flatMap((t) => t.objects.map((o) => [o.kind, o] as const)),
)

/** The theme object a scene object was made from; undefined for an object that is not one (house levels). */
export function themeObjectOf(object: Pick<PlacedObject, 'id' | 'type'>): ThemeObject | undefined {
  const found = BY_KIND.get(object.id.replace(/-\d+$/, ''))
  return found?.engineType === object.type ? found : undefined
}

/** The singular English noun clue text uses for a theme object. */
export const kindNoun = (o: Pick<ThemeObject, 'name' | 'clueNoun'>): string => o.clueNoun ?? o.name

/** The singular Dutch noun clue text uses for a theme object (SLAY-17.4): `nameNl` is always singular, so there is no Dutch `clueNoun`. */
export const kindNounNl = (o: Pick<ThemeObject, 'nameNl'>): string => o.nameNl

/** The noun of a theme object in `locale`. */
export const kindNounIn = (o: Pick<ThemeObject, 'name' | 'clueNoun' | 'nameNl'>, locale: Locale): string =>
  locale === 'nl' ? kindNounNl(o) : kindNoun(o)

/** The `icon` of a group drawn with the engine catalog icon of its type (no theme art). */
export const ENGINE_ICON = 'engine'

/**
 * All objects of one engine type that the board draws with the same icon. A player can tell
 * two groups apart, never two kinds inside one group.
 */
export interface DrawnKind {
  /** The theme icon id, or "engine" for the engine catalog icon. */
  icon: string
  /** English nouns of the theme kinds in this group, without repeats. */
  nouns: string[]
  /** Dutch nouns of the theme kinds in this group, without repeats (same kinds as `nouns`, not always the same count: two kinds may share one Dutch word). */
  nounsNl: string[]
  /** Some member is a plain engine object (a house level), not a theme kind. */
  plain: boolean
  /** How many scene objects draw this. */
  count: number
}

/** The drawn kinds among `objects` of engine type `type`, in order of first appearance. */
export function drawnKinds(objects: readonly Pick<PlacedObject, 'id' | 'type'>[], type: ObjectType): DrawnKind[] {
  const groups = new Map<string, DrawnKind>()
  for (const object of objects) {
    if (object.type !== type) continue
    const theme = themeObjectOf(object)
    const icon = theme?.themeIcon ?? ENGINE_ICON
    const group = groups.get(icon) ?? { icon, nouns: [], nounsNl: [], plain: false, count: 0 }
    groups.set(icon, group)
    group.count += 1
    if (!theme) group.plain = true
    else {
      if (!group.nouns.includes(kindNoun(theme))) group.nouns.push(kindNoun(theme))
      if (!group.nounsNl.includes(kindNounNl(theme))) group.nounsNl.push(kindNounNl(theme))
    }
  }
  return [...groups.values()]
}

/** The nouns of a drawn group in `locale`. */
export const groupNouns = (group: DrawnKind, locale: Locale): string[] => (locale === 'nl' ? group.nounsNl : group.nouns)

/**
 * The one noun that names this group exactly in `locale`, or undefined when it has none: a group
 * that holds several kinds (garden chair and school chair both draw the plain chair) or a plain
 * engine object is only named by the engine type's own noun. A group may have one Dutch noun and
 * two English ones, or the other way round: each language decides for itself.
 */
export function specificNoun(group: DrawnKind, locale: Locale = 'en'): string | undefined {
  const nouns = groupNouns(group, locale)
  return !group.plain && nouns.length === 1 ? nouns[0] : undefined
}
