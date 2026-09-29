import { VICTIM_TEXT, renderClue } from '../../engine/clues/index.ts'
import type { CatalogClue, RenderContext } from '../../engine/clues/index.ts'
import type { Locale } from '../../locale/index.ts'

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
 * The scene has no objects, so an object is named by its engine noun ("a table"). Room names are the
 * real English theme names (`src/content/themes/home.ts`) so the Dutch renderer can look up their
 * Dutch equivalents ("Keuken", "Hal", "Woonkamer", "Garage") via `roomNameNlOf` — the same context
 * works for both locales, only the `locale` argument to `renderClue` changes.
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

/** The card text of each sample clue in one locale, joined by " / ": what the engine would print on a card. */
const cardsFor =
  (locale: Locale) =>
  (...clues: CatalogClue[]): string =>
    clues.map((clue) => renderClue(clue, SAMPLE, locale)).join(' / ')

/** The card text of each sample clue, joined by " / ": what the engine would print on a card. */
const cards = cardsFor('en')
const cardsNl = cardsFor('nl')

/**
 * The keyword help of the play screen: every clue kind of the catalog is explained by exactly
 * one entry (glossary.test.ts keeps it complete). The keywords quote the cards, and the examples ARE cards:
 * they are rendered by the engine, so the glossary can never drift from the wording of the game.
 */
export const GLOSSARY_EN: readonly GlossaryEntry[] = [
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

/**
 * Dutch translation of `GLOSSARY_EN` (SLAY-9.7). Keyword and meaning are hand-written, matching the
 * vocabulary the engine already uses for the same clue kind (`src/engine/clues/nl.ts`): "naast",
 * "alleen (met)", "in een hoek", "diagonaal", "verder naar het noorden/zuiden/oosten/westen dan",
 * "rij"/"kolom", "kamer". The example sentences are never hand-translated: `cardsNl` renders the
 * exact same sample clues through the engine with `locale: 'nl'`, so an example can never drift
 * from the wording a real Dutch card shows.
 */
export const GLOSSARY_NL: readonly GlossaryEntry[] = [
  {
    keyword: 'in de Keuken (een kamer of ruimte)',
    meaning: 'Elk afgesloten deel van de plattegrond: een kamer, maar ook een tuin of een terras. Muren en gekleurde vloeren tonen de grenzen.',
    example: cardsNl({ personId: 'A', type: 'inRoom', args: { roomId: 'kitchen' } }),
    kinds: ['inRoom'],
  },
  {
    keyword: 'of (twee ruimtes)',
    meaning: 'De persoon was in de ene ruimte of in de andere.',
    example: cardsNl({ personId: 'B', type: 'inRoomOr', args: { roomIds: ['hall', 'kitchen'] } }),
    kinds: ['inRoomOr'],
  },
  {
    keyword: 'op / in',
    meaning: 'Op hetzelfde vakje als het object. Grote objecten zoals een bed of een auto bedekken meerdere vakjes; de persoon staat op een daarvan.',
    example: cardsNl({ personId: 'C', type: 'onObject', args: { objectType: 'bed' } }),
    kinds: ['onObject'],
  },
  {
    keyword: 'er lag een … op het vakje',
    meaning: 'Hetzelfde als "op", maar vanuit het object verteld: het object staat op het vakje van de persoon.',
    example: cardsNl({ personId: 'D', type: 'squareWithObject', args: { objectType: 'framedPainting' } }),
    kinds: ['squareWithObject'],
  },
  {
    keyword: 'de enige persoon op / in',
    meaning: "De persoon staat op zo'n object en niemand anders staat op een object van dat soort.",
    example: cardsNl({ personId: 'E', type: 'onlyOnObject', args: { objectType: 'sofa' } }),
    kinds: ['onlyOnObject'],
  },
  {
    keyword: 'naast',
    meaning:
      'Links, rechts, boven of onder een vakje van het object (niet diagonaal), in dezelfde ruimte. Bij een groot object (bed, trap, bank) telt elk vakje ervan; erop staan is niet naast staan. Naast meerdere objecten staan mag, tenzij het kaartje "precies één" zegt.',
    example: cardsNl(
      { personId: 'A', type: 'besideObject', args: { objectType: 'table' } },
      { personId: 'B', type: 'besideObject', args: { objectType: 'plant', exactlyOne: true } },
    ),
    kinds: ['besideObject'],
  },
  {
    keyword: 'stond niet naast',
    meaning:
      'De persoon staat niet naast een object van dat soort (naast = links, rechts, boven of onder een van de vakjes ervan, in dezelfde ruimte). Naast een vakje van een groot object telt ook als naast.',
    example: cardsNl({ personId: 'F', type: 'notBesideObject', args: { objectType: 'plant' } }),
    kinds: ['notBesideObject'],
  },
  {
    keyword: 'op het vakje direct boven / onder / links van / rechts van',
    meaning:
      'Precies op het vakje naast een vakje van het object, aan die kant (boven is noord, onder is zuid), in de ruimte van het object. Bij een groot object mag het naast elk vakje van de rand liggen. Dit gaat over de plattegrond: "onder" is niet ónder het object, en "boven" is geen verdieping erboven.',
    example: cardsNl({ personId: 'G', type: 'directlyNextToObject', args: { side: 'north', objectType: 'table' } }),
    kinds: ['directlyNextToObject'],
  },
  {
    keyword: 'in een hoek',
    meaning: 'Waar twee of drie muren van een ruimte samenkomen. Met een ruimte genoemd: een hoek van die ruimte.',
    example: cardsNl(
      { personId: 'B', type: 'inCorner', args: {} },
      { personId: 'B', type: 'inCorner', args: { roomId: 'living' } },
    ),
    kinds: ['inCorner'],
  },
  {
    keyword: 'naast een raam / naast een deur',
    meaning: 'Op een vakje dat het raam of de deur raakt. Een raam of deur op de lijn tussen twee vakjes telt voor beide kanten.',
    example: cardsNl({ personId: 'C', type: 'besideFeature', args: { feature: 'window' } }),
    kinds: ['besideFeature'],
  },
  {
    keyword: 'voor een deur',
    meaning: 'Op een vakje dat een deur raakt: precies voor de deuropening.',
    example: cardsNl({ personId: 'D', type: 'inFrontOfDoor', args: {} }),
    kinds: ['inFrontOfDoor'],
  },
  {
    keyword: 'alleen',
    meaning: 'Niemand anders in die ruimte, het slachtoffer inbegrepen.',
    example: cardsNl({ personId: 'A', type: 'alone', args: { roomId: 'kitchen' } }),
    kinds: ['alone'],
  },
  {
    keyword: 'samen met',
    meaning: 'In dezelfde ruimte als die persoon (of het slachtoffer). Anderen mogen er ook zijn.',
    example: cardsNl(
      { personId: 'B', type: 'withPerson', args: { otherId: 'C' } },
      { personId: 'B', type: 'sameRoom', args: { otherId: 'C' } },
    ),
    kinds: ['withPerson', 'sameRoom'],
  },
  {
    keyword: 'alleen met',
    meaning: 'Alleen deze twee mensen waren in die ruimte. Een van hen kan het slachtoffer zijn.',
    example: cardsNl({ personId: 'A', type: 'aloneWith', args: { otherId: 'B' } }),
    kinds: ['aloneWith'],
  },
  {
    keyword: 'minstens één vrouw / man in de kamer',
    meaning: 'Naast de persoon was er minstens één vrouw (of man) in dezelfde ruimte. Anderen mogen er ook zijn. De persoon zelf telt niet mee.',
    example: cardsNl({ personId: 'A', type: 'roomHasGender', args: { gender: 'woman' } }),
    kinds: ['roomHasGender'],
  },
  {
    keyword: 'alleen met een vrouw / man',
    meaning: 'Precies twee mensen waren in die ruimte: deze persoon en één vrouw (of man). Niemand anders, het slachtoffer inbegrepen.',
    example: cardsNl({ personId: 'A', type: 'aloneWithGender', args: { gender: 'woman' } }),
    kinds: ['aloneWithGender'],
  },
  {
    keyword: 'niet samen met / in een andere kamer',
    meaning: 'Niet in dezelfde ruimte als die persoon.',
    example: cardsNl(
      { personId: 'C', type: 'notWith', args: { otherId: 'D' } },
      { personId: 'C', type: 'differentRoom', args: { otherId: 'D' } },
    ),
    kinds: ['notWith', 'differentRoom'],
  },
  {
    keyword: 'er was niemand in',
    meaning: 'Niemand was in die ruimte, het slachtoffer inbegrepen.',
    example: cardsNl({ personId: 'A', type: 'emptyRoom', args: { roomId: 'garage' } }),
    kinds: ['emptyRoom'],
  },
  {
    keyword: 'rij / kolom',
    meaning:
      'Een rij loopt van links naar rechts, een kolom van boven naar onder. Rij 3 is de derde vanaf boven, kolom 3 de derde vanaf links. Elke rij en kolom heeft precies één persoon. De plattegrond toont R1, R2 (rijen) links en C1, C2 (kolommen) erboven, geteld vanaf boven en vanaf links.',
    example: cardsNl(
      { personId: 'A', type: 'inRow', args: { index: 2 } },
      { personId: 'B', type: 'inColumn', args: { index: 1 } },
    ),
    kinds: ['inRow', 'inColumn'],
  },
  {
    keyword: 'bovenste / onderste / middelste rij, meest linkse / meest rechtse / middelste kolom',
    meaning: 'De buitenste of middelste rij of kolom van de hele plattegrond.',
    example: cardsNl(
      { personId: 'C', type: 'onLine', args: { axis: 'row', position: 'first' } },
      { personId: 'D', type: 'onLine', args: { axis: 'column', position: 'last' } },
    ),
    kinds: ['onLine'],
  },
  {
    keyword: 'bovenste rij / meest rechtse kolom van de kamer',
    meaning:
      'De buitenste rij of kolom van één ruimte, niet van de hele plattegrond. De bovenste rij van een ruimte is de hoogste rij waarin die ruimte een vakje heeft; bij een onregelmatige vorm (een L) kan dat een enkel vakje zijn. Zonder genoemde ruimte is het de ruimte waarin de persoon staat.',
    example: cardsNl(
      { personId: 'A', type: 'inRoomEdge', args: { roomId: 'kitchen', edge: 'north' } },
      { personId: 'B', type: 'inRoomEdge', args: { edge: 'east' } },
    ),
    kinds: ['inRoomEdge'],
  },
  {
    keyword: 'twee delen verbonden door "en"',
    meaning:
      'Één kaartje met twee feiten over dezelfde persoon. Beide moeten waar zijn: het kaartje laat alleen de vakjes over waar beide delen kloppen. De naam van de persoon staat er één keer op.',
    example: cardsNl({
      personId: 'A',
      type: 'both',
      args: { a: { type: 'besideObject', args: { objectType: 'table' } }, b: { type: 'roomHasGender', args: { gender: 'woman' } } },
    }),
    kinds: ['both'],
  },
  {
    keyword: 'verder naar het noorden / zuiden / oosten / westen dan',
    meaning:
      'Noord is boven, zuid is onder, oost is rechts, west is links. Strikt een rij hoger of lager (of een kolom rechts of links) dan de ander, in elke ruimte tenzij er een genoemd is. Dezelfde rij of kolom telt niet. Bij een groot object telt het hele object: verder naar het noorden dan een bed is boven het hele bed (boven de bovenste rij ervan), verder naar het westen dan een trap is links van de hele trap. Bij meerdere objecten van dat soort is één genoeg.',
    example: cardsNl(
      { personId: 'A', type: 'directionOf', args: { side: 'north', otherId: 'B' } },
      { personId: 'C', type: 'directionOfObject', args: { side: 'west', objectType: 'table' } },
      { personId: 'D', type: 'directionOfObject', args: { side: 'north', objectType: 'bed' } },
    ),
    kinds: ['directionOf', 'directionOfObject'],
  },
  {
    keyword: 'precies N rijen / kolommen',
    meaning:
      'Precies zoveel rijen boven of onder de andere persoon, of precies zoveel kolommen rechts of links van hen. Hoe ver de persoon in de andere richting is, maakt niet uit.',
    example: cardsNl(
      { personId: 'A', type: 'exactDistance', args: { side: 'south', count: 2, otherId: 'B' } },
      { personId: 'C', type: 'exactDistance', args: { side: 'west', count: 3, otherId: 'D' } },
    ),
    kinds: ['exactDistance'],
  },
  {
    keyword: 'diagonaal',
    meaning:
      'Op een lijn van 45 graden met de andere persoon, op elke afstand. Met een richting, alleen die kant; met "precies N vakjes", op precies die afstand.',
    example: cardsNl(
      { personId: 'B', type: 'diagonal', args: { otherId: 'C' } },
      { personId: 'B', type: 'diagonal', args: { otherId: 'C', direction: 'northwest', steps: 1 } },
    ),
    kinds: ['diagonal'],
  },
  {
    keyword: 'ergens ten noordwesten / noordoosten / zuidwesten / zuidoosten van',
    meaning: 'Ergens linksboven, rechtsboven, linksonder of rechtsonder van de andere persoon: in een rij en kolom die daar precies bij passen.',
    example: cardsNl({ personId: 'D', type: 'quadrant', args: { direction: 'southeast', otherId: 'A' } }),
    kinds: ['quadrant'],
  },
  {
    keyword: 'Het slachtoffer was alleen met de moordenaar',
    meaning: 'Het kaartje van het slachtoffer. Precies één verdachte was alleen met het slachtoffer in hun ruimte: dat is de moordenaar die je zoekt.',
    example: cardsNl({ personId: 'V', type: 'aloneWithMurderer', args: {} }),
    kinds: ['aloneWithMurderer'],
  },
]

/** Both languages of the clue-keyword glossary, keyed by `Locale`. Read through `useLocale()`. */
export const GLOSSARY_CONTENT: Record<Locale, readonly GlossaryEntry[]> = { en: GLOSSARY_EN, nl: GLOSSARY_NL }

/**
 * The English glossary, kept as a plain export: `glossary.test.ts` pins its English wording
 * verbatim, out of SLAY-9.7's References. New reads should go through `GLOSSARY_CONTENT` and
 * `useLocale()` instead, as `Glossary.tsx` now does.
 */
export const GLOSSARY: readonly GlossaryEntry[] = GLOSSARY_EN

/** Words that show up in clues without being a clue kind of their own. */
export const EXTRA_TERMS_EN: readonly { keyword: string; meaning: string }[] = [
  { keyword: 'suspect', meaning: 'Everybody except the victim.' },
  { keyword: 'the victim', meaning: 'The person the case is about: you look for the suspect who was alone with the victim.' },
  { keyword: 'somebody / a person', meaning: 'The victim counts too. Think about where everybody stood.' },
  { keyword: 'the cards are always right', meaning: 'Every clue is true and there is exactly one solution without guessing. Portraits are only decoration.' },
]

/** Dutch translation of `EXTRA_TERMS_EN` (SLAY-9.7), matching `PLAY_NL`'s "verdachte(n)" and "aanwijzingen". */
export const EXTRA_TERMS_NL: readonly { keyword: string; meaning: string }[] = [
  { keyword: 'verdachte', meaning: 'Iedereen behalve het slachtoffer.' },
  { keyword: 'het slachtoffer', meaning: 'De persoon om wie de zaak draait: je zoekt de verdachte die alleen was met het slachtoffer.' },
  { keyword: 'iemand / een persoon', meaning: 'Het slachtoffer telt ook mee. Denk aan waar iedereen stond.' },
  { keyword: 'de kaartjes hebben altijd gelijk', meaning: 'Elke aanwijzing is waar en er is precies één oplossing zonder te raden. Portretten zijn puur decoratie.' },
]

/** Both languages of the extra-terms list, keyed by `Locale`. Read through `useLocale()`. */
export const EXTRA_TERMS_CONTENT: Record<Locale, readonly { keyword: string; meaning: string }[]> = { en: EXTRA_TERMS_EN, nl: EXTRA_TERMS_NL }

/** The English extra-terms list, kept as a plain export for the same reason as `GLOSSARY` above. */
export const EXTRA_TERMS: readonly { keyword: string; meaning: string }[] = EXTRA_TERMS_EN
