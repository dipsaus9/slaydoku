/**
 * The words that give away text left over from the Dutch prototype this project started from. One
 * list, two users:
 *
 * - the hint audit (`hints.ts`) rejects a hint text that holds one of them;
 * - `dutch.test.ts` scans the string literals of the game code for them.
 *
 * Only words that are not English (and not names, room or object nouns) belong here: "was" and "van"
 * are English words too, so they are left out. Whole words only, case-insensitive.
 * This file is data about Dutch, so the scan skips it.
 */
export const DUTCH_WORDS: readonly string[] = [
  'de', 'het', 'een', 'stond', 'naast', 'vakje', 'vakjes', 'kamer', 'kamers', 'cadeau', 'rij', 'rijen', 'kolom', 'kolommen',
  'niet', 'geen', 'wordt', 'staat', 'staan', 'alleen', 'iedereen', 'iemand', 'niemand', 'dader', 'vrouw', 'kaart', 'kaarten',
  'persoon', 'mensen', 'ruimte', 'dus', 'maar', 'kan', 'kunnen', 'ook', 'naar', 'kijk', 'zet', 'lees', 'daar', 'hier',
  'gemarkeerd', 'gemarkeerde', 'notitie', 'kruisje', 'bord', 'zijn', 'voor', 'hoek', 'hij', 'zij', 'haar', 'hem',
]

/** Builds a case-insensitive whole-word matcher; a hyphen or apostrophe next to a word does not end it. */
export const wordMatcher = (words: readonly string[]): RegExp =>
  new RegExp(`(?<![\\p{L}\\d'-])(?:${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\p{L}\\d'-])`, 'iu')

/** Matches the first Dutch word of a text. */
export const DUTCH_RE: RegExp = wordMatcher(DUTCH_WORDS)
