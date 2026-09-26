import type { CatalogClue } from '../../engine/clues/index.ts'

export type ClueKind = CatalogClue['type']

export interface GlossaryEntry {
  /** The keyword as printed on the clue cards. */
  keyword: string
  /** What it means for where somebody stood. */
  meaning: string
  /** A sample sentence like the ones on the cards. */
  example: string
  /** The clue kinds (engine `type`) this entry explains. */
  kinds: readonly ClueKind[]
}

/**
 * The keyword help of the play screen: every clue kind of the catalog is explained by exactly
 * one entry (glossary.test.ts keeps it complete). Wording follows the official glossary,
 * translated to the words the Dutch cards use.
 */
export const GLOSSARY: readonly GlossaryEntry[] = [
  {
    keyword: 'gebied / kamer',
    meaning: 'Elk afgesloten stuk van de plattegrond: een kamer, maar ook de tuin of een terras. Muren en gekleurde vloeren tonen de grenzen.',
    example: 'A was in de Keuken.',
    kinds: ['inRoom'],
  },
  {
    keyword: 'of (twee gebieden)',
    meaning: 'De persoon stond in het ene gebied of in het andere.',
    example: 'B was in de Hal of in de Keuken.',
    kinds: ['inRoomOr'],
  },
  {
    keyword: 'op / in',
    meaning: 'Op hetzelfde vakje als het voorwerp. Grote voorwerpen zoals een bed of een auto beslaan meerdere vakjes; de persoon staat op een van die vakjes.',
    example: 'C lag op een bed.',
    kinds: ['onObject'],
  },
  {
    keyword: 'er stond een … op het vakje',
    meaning: 'Hetzelfde als "op", maar vanuit het voorwerp verteld: op het vakje van de persoon staat dat voorwerp.',
    example: 'Er stond een ingelijst schilderij op het vakje van D.',
    kinds: ['squareWithObject'],
  },
  {
    keyword: 'de enige op / in',
    meaning: 'De persoon staat op zo’n voorwerp en niemand anders staat op een voorwerp van dat soort.',
    example: 'E was de enige persoon op een bank.',
    kinds: ['onlyOnObject'],
  },
  {
    keyword: 'naast',
    meaning: 'Links, rechts, boven of onder een vakje van het voorwerp, dus niet schuin, en in hetzelfde gebied. Bij een groot voorwerp (bed, trap, bank) telt elk vakje van dat voorwerp; wie er zelf op staat, staat er niet naast. Naast meerdere voorwerpen mag, tenzij er "precies één" staat.',
    example: 'A stond naast een tafel. / B stond naast precies één plant.',
    kinds: ['besideObject'],
  },
  {
    keyword: 'niet naast',
    meaning: 'De persoon staat niet naast een voorwerp van dat soort (naast = links, rechts, boven of onder een vakje ervan, in hetzelfde gebied). Ook naast een vakje van een groot voorwerp telt als naast.',
    example: 'F stond niet naast een plant.',
    kinds: ['notBesideObject'],
  },
  {
    keyword: 'op het vakje direct links van / rechts van / boven / onder',
    meaning: 'Precies op het vakje naast een vakje van het voorwerp aan die kant (boven is noord, onder is zuid), in het gebied van het voorwerp. Bij een groot voorwerp mag dat naast elk vakje van de rand zijn. Het gaat om de plattegrond: "onder" is dus niet onder het voorwerp, "boven" niet een verdieping hoger.',
    example: 'G stond op het vakje direct boven een tafel.',
    kinds: ['directlyNextToObject'],
  },
  {
    keyword: 'in de hoek',
    meaning: 'Waar twee of drie muren van een gebied samenkomen. Bij een gebied genoemd: de hoek van dat gebied.',
    example: 'B stond in de hoek. / B stond in de hoek van de Woonkamer.',
    kinds: ['inCorner'],
  },
  {
    keyword: 'bij een raam / bij een deur',
    meaning: 'Op een vakje dat het raam of de deur aanraakt. Een raam of deur op de lijn tussen twee vakjes telt voor beide kanten.',
    example: 'C stond bij een raam.',
    kinds: ['besideFeature'],
  },
  {
    keyword: 'voor een deur',
    meaning: 'Op een vakje dat een deur aanraakt, dus direct voor de doorgang.',
    example: 'D stond voor een deur.',
    kinds: ['inFrontOfDoor'],
  },
  {
    keyword: 'alleen',
    meaning: 'Niemand anders in dat gebied, ook het cadeau niet.',
    example: 'A was alleen in de Keuken.',
    kinds: ['alone'],
  },
  {
    keyword: 'samen met',
    meaning: 'In hetzelfde gebied als die persoon (of het cadeau). Er mogen ook anderen zijn.',
    example: 'B was samen met C.',
    kinds: ['withPerson', 'sameRoom'],
  },
  {
    keyword: 'alleen met',
    meaning: 'Alleen deze twee personen waren in dat gebied. Een van de twee kan het cadeau zijn.',
    example: 'A was alleen met B.',
    kinds: ['aloneWith'],
  },
  {
    keyword: 'minstens één vrouw / man in de ruimte',
    meaning: 'Naast de persoon zelf stond er nog minstens één vrouw (of man) in hetzelfde gebied. Er mogen ook anderen zijn. De persoon zelf telt niet mee.',
    example: 'Er was minstens één vrouw in de ruimte van A.',
    kinds: ['roomHasGender'],
  },
  {
    keyword: 'alleen met een vrouw / man',
    meaning: 'In dat gebied stonden precies twee personen: deze persoon en één vrouw (of man). Verder niemand, ook het cadeau niet.',
    example: 'A was alleen met een vrouw.',
    kinds: ['aloneWithGender'],
  },
  {
    keyword: 'niet samen met / andere kamer',
    meaning: 'Niet in hetzelfde gebied als die persoon.',
    example: 'C was niet samen met D. / C was in een andere kamer dan D.',
    kinds: ['notWith', 'differentRoom'],
  },
  {
    keyword: 'er was niemand / leeg',
    meaning: 'In dat gebied was niemand, ook het cadeau niet.',
    example: 'Er was niemand in de Garage.',
    kinds: ['emptyRoom'],
  },
  {
    keyword: 'rij / kolom',
    meaning: 'Een rij loopt van links naar rechts, een kolom van boven naar beneden. De 3e rij is de derde van boven, de 3e kolom de derde van links. Elke rij en kolom heeft precies één persoon. Op het bord staan R1, R2 (rij) links en C1, C2 (kolom) boven, geteld van boven en van links.',
    example: 'A stond in de 3e rij. / B stond in de 2e kolom.',
    kinds: ['inRow', 'inColumn'],
  },
  {
    keyword: 'bovenste / onderste / middelste / linkse / rechtse',
    meaning: 'De buitenste of middelste rij of kolom van het hele bord.',
    example: 'C stond in de bovenste rij. / D stond in de meest rechtse kolom.',
    kinds: ['onLine'],
  },
  {
    keyword: 'bovenste rij / meest rechtse kolom van de ruimte',
    meaning: 'De buitenste rij of kolom van één gebied, niet van het hele bord. De bovenste rij van een gebied is de hoogste rij waarin dat gebied een vakje heeft; bij een gebied met een rare vorm (een L) kan dat één vakje zijn. Zonder gebied erbij gaat het om het gebied waar de persoon zelf staat.',
    example: 'A stond in de bovenste rij van de Keuken. / B stond in de meest rechtse kolom van de ruimte.',
    kinds: ['inRoomEdge'],
  },
  {
    keyword: 'twee delen met "en"',
    meaning: 'Eén kaart met twee feiten over dezelfde persoon. Beide moeten kloppen: de kaart laat alleen de vakjes over waar allebei de delen waar zijn. De naam van de persoon staat er maar één keer.',
    example: 'A stond naast een tafel en er was minstens één vrouw in dezelfde ruimte.',
    kinds: ['both'],
  },
  {
    keyword: "noordelijker / zuidelijker / oostelijker / westelijker",
    meaning: "Noord is boven, zuid is onder, oost is rechts, west is links. Strikt in een rij hoger of lager (of een kolom rechts of links) dan de ander, in welk gebied dan ook, tenzij er een gebied bij staat. Dezelfde rij of kolom telt dus niet. Bij een groot voorwerp telt het hele voorwerp: noordelijker dan een bed is boven het hele bed (boven zijn bovenste rij), westelijker dan een trap links van de hele trap. Bij meer voorwerpen van dat soort is één voorwerp genoeg.",
    example: "A stond noordelijker dan B. / C stond westelijker dan een tafel. / D stond noordelijker dan een bed (boven het hele bed).",
    kinds: ["directionOf", "directionOfObject"],
  },
  {
    keyword: 'precies N rijen / kolommen',
    meaning: 'Exact zoveel rijen boven of onder de ander, of exact zoveel kolommen links of rechts van de ander. Hoe ver de persoon in de andere richting staat, maakt niet uit.',
    example: 'A stond precies twee rijen onder B. / C stond precies drie kolommen links van D.',
    kinds: ['exactDistance'],
  },
  {
    keyword: 'diagonaal',
    meaning: 'Op een schuine lijn van 45 graden met de ander, hoe ver ook. Met een richting alleen die kant op, met "precies N vakjes" op die afstand.',
    example: 'B stond op dezelfde diagonaal als C. / precies één vakje diagonaal ten noordwesten van C.',
    kinds: ['diagonal'],
  },
  {
    keyword: 'ergens ten noordwesten / noordoosten / zuidwesten / zuidoosten',
    meaning: 'Ergens links-boven, rechts-boven, links-onder of rechts-onder van de ander: in een rij en kolom die daar strikt aan voldoen.',
    example: 'D stond ergens ten zuidoosten van A.',
    kinds: ['quadrant'],
  },
  {
    keyword: 'het cadeau was alleen met de dader',
    meaning: 'De kaart van het cadeau. Precies één verdachte was alleen met het cadeau in zijn gebied: dat is de dader die je zoekt.',
    example: 'Het cadeau was alleen met de dader.',
    kinds: ['aloneWithMurderer'],
  },
]

/** Words that show up in clues without being a clue kind of their own. */
export const EXTRA_TERMS: readonly { keyword: string; meaning: string }[] = [
  { keyword: 'verdachte', meaning: 'Iedereen behalve het cadeau.' },
  { keyword: 'het cadeau', meaning: 'De persoon (het slachtoffer) om wie het draait: je zoekt de verdachte die alleen met het cadeau was.' },
  { keyword: 'iemand / een persoon', meaning: 'Telt het cadeau ook mee. Denk aan waar iedereen stond.' },
  { keyword: 'de kaarten kloppen altijd', meaning: 'Elke aanwijzing is waar en er is precies één oplossing zonder gokken. Portretten zijn alleen versiering.' },
]
