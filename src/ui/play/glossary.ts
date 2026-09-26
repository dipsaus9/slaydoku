import { VICTIM_TEXT, renderClue } from '../../engine/clues/index.ts'
import type { CatalogClue, RenderContext } from '../../engine/clues/index.ts'

export type ClueKind = CatalogClue['type']

export interface GlossaryEntry {
  /** The keyword as printed on the clue cards. */
  keyword: string
  /** What it means for where somebody stood. */
  meaning: string
  /** Sample sentences, produced by the engine's clue text (`renderClue`), so they read exactly like the cards. */
  example: string
  /** The clue kinds (engine `type`) this entry explains. */
  kinds: readonly ClueKind[]
}

/**
 * The people and rooms the sample sentences are about: letters stand in for the names on the cards.
 * The scene has no objects, so an object is named by its engine noun ("a table").
 */
const SAMPLE: RenderContext = {
  scene: {
    rooms: [
      { id: 'kitchen', name: 'Kitchen' },
      { id: 'hall', name: 'Hall' },
      { id: 'living', name: 'Living Room' },
      { id: 'garage', name: 'Garage' },
    ],
  },
  people: [
    ...[...'ABCDEFG'].map((id) => ({ id, kind: 'suspect' as const, label: id })),
    { id: 'V', kind: 'victim' as const, label: VICTIM_TEXT.noun },
  ],
}

/** The card text of each sample clue, joined by " / ": what the engine would print on a card. */
const cards = (...clues: CatalogClue[]): string => clues.map((clue) => renderClue(clue, SAMPLE)).join(' / ')

/**
 * The keyword help of the play screen: every clue kind of the catalog is explained by exactly
 * one entry (glossary.test.ts keeps it complete). The keywords quote the cards, and the examples ARE cards:
 * they are rendered by the engine, so the glossary can never drift from the wording of the game.
 */
export const GLOSSARY: readonly GlossaryEntry[] = [
  {
    keyword: 'in the Kitchen (a room or area)',
    meaning: 'Any enclosed part of the map: a room, but also a garden or a terrace. Walls and colored floors show the borders.',
    example: cards({ personId: 'A', type: 'inRoom', args: { roomId: 'kitchen' } }),
    kinds: ['inRoom'],
  },
  {
    keyword: 'or (two areas)',
    meaning: 'The person was in one area or in the other.',
    example: cards({ personId: 'B', type: 'inRoomOr', args: { roomIds: ['hall', 'kitchen'] } }),
    kinds: ['inRoomOr'],
  },
  {
    keyword: 'on / in',
    meaning: 'On the same square as the object. Big objects such as a bed or a car cover several squares; the person stands on one of them.',
    example: cards({ personId: 'C', type: 'onObject', args: { objectType: 'bed' } }),
    kinds: ['onObject'],
  },
  {
    keyword: 'there was a … on the square',
    meaning: 'The same as "on", told from the object: the object is on the person\'s square.',
    example: cards({ personId: 'D', type: 'squareWithObject', args: { objectType: 'framedPainting' } }),
    kinds: ['squareWithObject'],
  },
  {
    keyword: 'the only person on / in',
    meaning: 'The person is on such an object and nobody else is on an object of that kind.',
    example: cards({ personId: 'E', type: 'onlyOnObject', args: { objectType: 'sofa' } }),
    kinds: ['onlyOnObject'],
  },
  {
    keyword: 'next to',
    meaning:
      'Left, right, above or below a square of the object (not diagonal), in the same area. For a big object (bed, staircase, sofa) every square of it counts; standing on it is not next to it. Next to several objects is fine, unless the card says "exactly one".',
    example: cards(
      { personId: 'A', type: 'besideObject', args: { objectType: 'table' } },
      { personId: 'B', type: 'besideObject', args: { objectType: 'plant', exactlyOne: true } },
    ),
    kinds: ['besideObject'],
  },
  {
    keyword: 'did not stand next to',
    meaning:
      'The person is not next to an object of that kind (next to = left, right, above or below one of its squares, in the same area). Next to a square of a big object counts as next to.',
    example: cards({ personId: 'F', type: 'notBesideObject', args: { objectType: 'plant' } }),
    kinds: ['notBesideObject'],
  },
  {
    keyword: 'on the square directly above / below / left of / right of',
    meaning:
      "Exactly on the square beside a square of the object, on that side (above is north, below is south), in the object's area. For a big object it may be beside any square of its edge. This is about the map: \"below\" is not under the object, and \"above\" is not an upper floor.",
    example: cards({ personId: 'G', type: 'directlyNextToObject', args: { side: 'north', objectType: 'table' } }),
    kinds: ['directlyNextToObject'],
  },
  {
    keyword: 'in a corner',
    meaning: 'Where two or three walls of an area meet. With an area named: a corner of that area.',
    example: cards(
      { personId: 'B', type: 'inCorner', args: {} },
      { personId: 'B', type: 'inCorner', args: { roomId: 'living' } },
    ),
    kinds: ['inCorner'],
  },
  {
    keyword: 'next to a window / next to a door',
    meaning: 'On a square that touches the window or the door. A window or door on the line between two squares counts for both sides.',
    example: cards({ personId: 'C', type: 'besideFeature', args: { feature: 'window' } }),
    kinds: ['besideFeature'],
  },
  {
    keyword: 'in front of a door',
    meaning: 'On a square that touches a door: right in front of the doorway.',
    example: cards({ personId: 'D', type: 'inFrontOfDoor', args: {} }),
    kinds: ['inFrontOfDoor'],
  },
  {
    keyword: 'alone',
    meaning: 'Nobody else in that area, the victim included.',
    example: cards({ personId: 'A', type: 'alone', args: { roomId: 'kitchen' } }),
    kinds: ['alone'],
  },
  {
    keyword: 'with',
    meaning: 'In the same area as that person (or the victim). Others may be there too.',
    example: cards(
      { personId: 'B', type: 'withPerson', args: { otherId: 'C' } },
      { personId: 'B', type: 'sameRoom', args: { otherId: 'C' } },
    ),
    kinds: ['withPerson', 'sameRoom'],
  },
  {
    keyword: 'alone with',
    meaning: 'Only these two people were in that area. One of them can be the victim.',
    example: cards({ personId: 'A', type: 'aloneWith', args: { otherId: 'B' } }),
    kinds: ['aloneWith'],
  },
  {
    keyword: 'at least one woman / man in the room',
    meaning: 'Besides the person, at least one woman (or man) was in the same area. Others may be there too. The person does not count.',
    example: cards({ personId: 'A', type: 'roomHasGender', args: { gender: 'woman' } }),
    kinds: ['roomHasGender'],
  },
  {
    keyword: 'alone with a woman / man',
    meaning: 'Exactly two people were in that area: this person and one woman (or man). Nobody else, the victim included.',
    example: cards({ personId: 'A', type: 'aloneWithGender', args: { gender: 'woman' } }),
    kinds: ['aloneWithGender'],
  },
  {
    keyword: 'not with / in a different room',
    meaning: 'Not in the same area as that person.',
    example: cards(
      { personId: 'C', type: 'notWith', args: { otherId: 'D' } },
      { personId: 'C', type: 'differentRoom', args: { otherId: 'D' } },
    ),
    kinds: ['notWith', 'differentRoom'],
  },
  {
    keyword: 'there was nobody in',
    meaning: 'Nobody was in that area, the victim included.',
    example: cards({ personId: 'A', type: 'emptyRoom', args: { roomId: 'garage' } }),
    kinds: ['emptyRoom'],
  },
  {
    keyword: 'row / column',
    meaning:
      'A row runs from left to right, a column from top to bottom. Row 3 is the third from the top, column 3 the third from the left. Every row and column holds exactly one person. The board shows R1, R2 (rows) on the left and C1, C2 (columns) above, counted from the top and from the left.',
    example: cards(
      { personId: 'A', type: 'inRow', args: { index: 2 } },
      { personId: 'B', type: 'inColumn', args: { index: 1 } },
    ),
    kinds: ['inRow', 'inColumn'],
  },
  {
    keyword: 'top / bottom / middle row, leftmost / rightmost / middle column',
    meaning: 'The outer or middle row or column of the whole board.',
    example: cards(
      { personId: 'C', type: 'onLine', args: { axis: 'row', position: 'first' } },
      { personId: 'D', type: 'onLine', args: { axis: 'column', position: 'last' } },
    ),
    kinds: ['onLine'],
  },
  {
    keyword: 'top row / rightmost column of the room',
    meaning:
      'The outer row or column of one area, not of the whole board. The top row of an area is the highest row in which that area has a square; for an odd shape (an L) that can be a single square. Without an area named, it is the area the person stands in.',
    example: cards(
      { personId: 'A', type: 'inRoomEdge', args: { roomId: 'kitchen', edge: 'north' } },
      { personId: 'B', type: 'inRoomEdge', args: { edge: 'east' } },
    ),
    kinds: ['inRoomEdge'],
  },
  {
    keyword: 'two parts joined by "and"',
    meaning:
      'One card with two facts about the same person. Both must be true: the card leaves only the squares where both parts hold. The name of the person is printed once.',
    example: cards({
      personId: 'A',
      type: 'both',
      args: { a: { type: 'besideObject', args: { objectType: 'table' } }, b: { type: 'roomHasGender', args: { gender: 'woman' } } },
    }),
    kinds: ['both'],
  },
  {
    keyword: 'further north / south / east / west than',
    meaning:
      'North is up, south is down, east is right, west is left. Strictly a row higher or lower (or a column to the right or left) than the other, in any area unless one is named. The same row or column does not count. For a big object the whole object counts: further north than a bed is above the whole bed (above its top row), further west than a staircase is left of the whole staircase. With several objects of that kind, one is enough.',
    example: cards(
      { personId: 'A', type: 'directionOf', args: { side: 'north', otherId: 'B' } },
      { personId: 'C', type: 'directionOfObject', args: { side: 'west', objectType: 'table' } },
      { personId: 'D', type: 'directionOfObject', args: { side: 'north', objectType: 'bed' } },
    ),
    kinds: ['directionOf', 'directionOfObject'],
  },
  {
    keyword: 'exactly N rows / columns',
    meaning:
      'Exactly that many rows above or below the other person, or exactly that many columns left or right of them. How far the person is in the other direction does not matter.',
    example: cards(
      { personId: 'A', type: 'exactDistance', args: { side: 'south', count: 2, otherId: 'B' } },
      { personId: 'C', type: 'exactDistance', args: { side: 'west', count: 3, otherId: 'D' } },
    ),
    kinds: ['exactDistance'],
  },
  {
    keyword: 'diagonal',
    meaning:
      'On a 45 degree line with the other person, at any distance. With a direction, only that way; with "exactly N squares", at exactly that distance.',
    example: cards(
      { personId: 'B', type: 'diagonal', args: { otherId: 'C' } },
      { personId: 'B', type: 'diagonal', args: { otherId: 'C', direction: 'northwest', steps: 1 } },
    ),
    kinds: ['diagonal'],
  },
  {
    keyword: 'somewhere to the northwest / northeast / southwest / southeast of',
    meaning: 'Somewhere up-left, up-right, down-left or down-right of the other person: in a row and column that strictly fit.',
    example: cards({ personId: 'D', type: 'quadrant', args: { direction: 'southeast', otherId: 'A' } }),
    kinds: ['quadrant'],
  },
  {
    keyword: 'The victim was alone with the murderer',
    meaning: "The victim's card. Exactly one suspect was alone with the victim in their area: that is the murderer you are looking for.",
    example: cards({ personId: 'V', type: 'aloneWithMurderer', args: {} }),
    kinds: ['aloneWithMurderer'],
  },
]

/** Words that show up in clues without being a clue kind of their own. */
export const EXTRA_TERMS: readonly { keyword: string; meaning: string }[] = [
  { keyword: 'suspect', meaning: 'Everybody except the victim.' },
  { keyword: 'the victim', meaning: 'The person the case is about: you look for the suspect who was alone with the victim.' },
  { keyword: 'somebody / a person', meaning: 'The victim counts too. Think about where everybody stood.' },
  { keyword: 'the cards are always right', meaning: 'Every clue is true and there is exactly one solution without guessing. Portraits are only decoration.' },
]
