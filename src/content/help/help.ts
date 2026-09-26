/**
 * Everything the "Zo werkt het" card and the Uitleg panel say, in Dutch. This is the one file to edit
 * to change the wording; see README.md. `bun run test` guards the lengths.
 */

/** Which drawing a step gets (portraits from src/render/cards, with a toolbar icon where a button is meant). */
export type HelpIcon = 'pick' | 'note' | 'place' | 'hint'

export interface HelpStep {
  icon: HelpIcon
  title: string
  text: string
}

export interface HelpContent {
  /**
   * Raise this number after a real change of the rules or the wording: everyone gets the card
   * once more on the first visit of level 1 (what was seen is remembered per version).
   */
  version: number
  /** Heading of the card and the panel. */
  title: string
  /** The goal: at most 5 short sentences, shown in order. */
  goal: readonly string[]
  stepsTitle: string
  /** Three or four how-to steps. */
  steps: readonly HelpStep[]
  /** Small extra list behind a collapsed "more" line: [what, how]. */
  more: { title: string; items: readonly (readonly [string, string])[] }
  keywords: {
    /** The button that opens the glossary; the glossary is never shown by default. */
    button: string
    title: string
    otherTitle: string
    example: string
    back: string
  }
  /**
   * The Legenda card: what is drawn on THIS board. The rows about objects, doors and windows are built
   * from the level (src/ui/help/legend.ts); only the words around them live here.
   */
  legend: {
    /** The toolbar button and the button on the how-it-works card. */
    button: string
    title: string
    intro: string
    objectsTitle: string
    /** A person can stand on it / cannot (the flag of every object row). */
    canOccupy: string
    blocked: string
    /** Shown behind the noun of an object row that covers several kinds that look alike: "ook: ...". */
    also: string
    /** Tapping a row shows where it is on the board. */
    tapHint: string
    /** Text on the screen that shows the squares. */
    peek: string
    edgesTitle: string
    door: { noun: string; text: string }
    window: { noun: string; text: string }
    roomsTitle: string
    roomLabel: { noun: string; text: string }
    marksTitle: string
    note: { noun: string; text: string }
    cross: { noun: string; text: string }
    person: { noun: string; text: string }
    gift: { noun: string; text: string }
    ruleTitle: string
    rule: string
    /** Closes the card. */
    close: string
  }
  /** Closes the card. */
  close: string
  /** Small link on the level list that reopens the card. */
  link: string
}

export const help: HelpContent = {
  version: 1,
  title: 'Zo werkt het',
  goal: [
    'Iedereen staat ergens op het bord.',
    'In elke rij en in elke kolom staat precies één persoon.',
    'De kaarten vertellen waar iedereen stond.',
    'Het cadeau staat alleen in een kamer, met precies één persoon.',
    'Die persoon heeft het gevonden: de dader.',
  ],
  stepsTitle: 'Zo speel je',
  steps: [
    { icon: 'pick', title: 'Kies een persoon', text: 'Tik op een foto bij het bord.' },
    { icon: 'note', title: 'Tik voor een notitie', text: 'Tik op een vakje: hier kan deze persoon staan.' },
    { icon: 'place', title: 'Houd ingedrukt om te plaatsen', text: 'Houd een vakje ingedrukt: de persoon staat er nu echt.' },
    { icon: 'hint', title: 'Vast? Vraag een hint', text: 'Tik op Hint voor hulp in kleine stappen.' },
  ],
  more: {
    title: 'Meer over de knoppen',
    items: [
      ['Slepen', 'Sleep over vakjes om er meer tegelijk te vullen of te wissen.'],
      ['X', 'Sluit vakjes uit voor de gekozen persoon.'],
      ['Gum', 'Tik op een vakje om het te wissen. Houd de knop ingedrukt om alles te wissen.'],
      ['Terug en Vooruit', 'Maak je laatste actie ongedaan, of doe hem opnieuw.'],
    ],
  },
  keywords: {
    button: 'Kernwoorden',
    title: 'Kernwoorden op de kaarten',
    otherTitle: 'Ook goed om te weten',
    example: 'Voorbeeld',
    back: 'Terug naar de uitleg',
  },
  legend: {
    button: 'Legenda',
    title: 'Legenda',
    intro: 'Dit staat er op dit bord.',
    objectsTitle: 'Spullen',
    canOccupy: 'Kan bezet worden',
    blocked: 'Geblokkeerd',
    also: 'ook',
    tapHint: 'Tik op een regel om te zien waar het staat.',
    peek: 'Tik om terug te gaan naar de legenda',
    edgesTitle: 'Deuren en ramen',
    door: { noun: 'Deur', text: 'Een opening in de muur.' },
    window: { noun: 'Raam', text: 'Een raam in de muur. Aanwijzingen kunnen zeggen: bij een raam.' },
    roomsTitle: 'Kamers',
    roomLabel: { noun: 'Naam van de kamer', text: 'Elke kamer heeft een naam. Aanwijzingen gebruiken die naam.' },
    marksTitle: 'Op het bord',
    note: { noun: 'Notitie', text: 'Een letter in een vakje: hier kan deze persoon staan.' },
    cross: { noun: 'Kruis', text: 'Hier kan deze persoon niet staan.' },
    person: { noun: 'Persoon', text: 'Een portret: deze persoon staat hier echt.' },
    gift: { noun: 'Het cadeau', text: 'Staat ook ergens op het bord.' },
    ruleTitle: 'De regel',
    rule: 'Het cadeau staat alleen in een kamer, met precies één persoon.',
    close: 'Sluiten',
  },
  close: 'Aan de slag',
  link: 'Uitleg',
}
