/**
 * Everything the "How it works" card and the Help panel say, in English and Dutch. This is the one
 * file to edit to change the wording; see README.md. `bun run test` guards the lengths, for every
 * locale. Dutch wording follows the vocabulary already shipped in the clue-sentence templates
 * (`src/engine/clues/nl.ts`, SLAY-3.2) and the play-screen chrome (`src/ui/play/strings.ts`, SLAY-3.4):
 * "plattegrond" for the board, "kaartje(s)" for the clue cards, "verdachte" for a suspect,
 * "het slachtoffer" for the victim, "moordenaar" for the murderer, "rij"/"kolom" for row/column.
 */
import type { Locale } from '../../locale/index.ts'

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
   * The Legend card: what is drawn on THIS board. The rows about objects, doors and windows are built
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
    /** Shown behind the noun of an object row that covers several kinds that look alike: "also: ...". */
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
    victimNote: { noun: string; text: string }
    ruleTitle: string
    rule: string
    /** Closes the card. */
    close: string
  }
  /** Closes the card. */
  close: string
  /** Small link on the start screen that reopens the card. */
  link: string
}

/** English wording of the help card and panel. */
export const HELP_EN: HelpContent = {
  version: 2,
  title: 'How it works',
  goal: [
    'Everybody stands somewhere on the board.',
    'Every row and every column holds exactly one person.',
    'The cards tell you where everybody stood.',
    'The victim was alone in a room with exactly one person.',
    'That person is the murderer.',
  ],
  stepsTitle: 'How to play',
  steps: [
    { icon: 'pick', title: 'Pick a person', text: 'Tap a photo next to the board.' },
    { icon: 'note', title: 'Tap to make a note', text: 'Tap a square: this person could stand here.' },
    { icon: 'place', title: 'Hold to place', text: 'Hold a square: the person really stands there.' },
    { icon: 'hint', title: 'Stuck? Ask for a hint', text: 'Tap Hint for help in small steps.' },
  ],
  more: {
    title: 'More about the buttons',
    items: [
      ['Drag', 'Drag over squares to fill or clear several at once.'],
      ['X', 'Rule out squares for the selected person.'],
      ['Erase', 'Tap a square to clear it. Hold the button to clear everything.'],
      ['Undo and Redo', 'Take back your last move, or do it again.'],
    ],
  },
  keywords: {
    button: 'Keywords',
    title: 'Keywords on the cards',
    otherTitle: 'Good to know',
    example: 'Example',
    back: 'Back to the guide',
  },
  legend: {
    button: 'Legend',
    title: 'Legend',
    intro: 'This is what is on this board.',
    objectsTitle: 'Objects',
    canOccupy: 'Can be occupied',
    blocked: 'Blocked',
    also: 'also',
    tapHint: 'Tap a row to see where it is.',
    peek: 'Tap to go back to the legend',
    edgesTitle: 'Doors and windows',
    door: { noun: 'Door', text: 'An opening in the wall.' },
    window: { noun: 'Window', text: 'A window in the wall. Cards can say: next to a window.' },
    roomsTitle: 'Rooms',
    roomLabel: { noun: 'Room name', text: 'Every room has a name. Cards use that name.' },
    marksTitle: 'On the board',
    note: { noun: 'Note', text: 'A letter in a square: this person could stand here.' },
    cross: { noun: 'Cross', text: 'This person cannot stand here.' },
    person: { noun: 'Person', text: 'A portrait: this person really stands here.' },
    gift: { noun: 'The victim', text: 'Stands somewhere on the board too.' },
    victimNote: { noun: 'Victim note', text: 'A small skull: the victim could stand here.' },
    ruleTitle: 'The rule',
    rule: 'The victim is alone in a room with exactly one person.',
    close: 'Close',
  },
  close: 'Start playing',
  link: 'How it works',
}

/**
 * Dutch wording of the help card and panel (SLAY-9.7). "Board" is "plattegrond" (matches
 * `src/ui/play/strings.ts`'s `PLAY_NL.board` and `ABOUT_NL.how`), clue cards are "kaartje(s)"
 * (matches `src/game/hintText.nl.ts`), and the keyword phrases mirror the exact Dutch wording the
 * engine renders for the same clue kind in `src/engine/clues/nl.ts` (e.g. "naast", "alleen met",
 * "in een hoek", "diagonaal") so a player never sees two different Dutch words for one concept.
 */
export const HELP_NL: HelpContent = {
  version: 2,
  title: 'Hoe het werkt',
  goal: [
    'Iedereen staat ergens op de plattegrond.',
    'Elke rij en elke kolom heeft precies één persoon.',
    'De kaartjes zeggen waar iedereen stond.',
    'Het slachtoffer was alleen in een kamer met precies één persoon.',
    'Die persoon is de moordenaar.',
  ],
  stepsTitle: 'Zo speel je',
  steps: [
    { icon: 'pick', title: 'Kies een persoon', text: 'Tik op een foto naast de plattegrond.' },
    { icon: 'note', title: 'Tik voor een notitie', text: 'Tik op een vakje: deze persoon zou hier kunnen staan.' },
    { icon: 'place', title: 'Houd vast om te plaatsen', text: 'Houd een vakje ingedrukt: de persoon staat hier echt.' },
    { icon: 'hint', title: 'Vastgelopen? Vraag een hint', text: 'Tik op Hint voor hulp in kleine stapjes.' },
  ],
  more: {
    title: 'Meer over de knoppen',
    items: [
      ['Slepen', 'Sleep over vakjes om er meteen meerdere te vullen of te wissen.'],
      ['X', 'Sluit vakjes uit voor de gekozen persoon.'],
      ['Wissen', 'Tik op een vakje om het te wissen. Houd de knop ingedrukt om alles te wissen.'],
      ['Ongedaan maken en opnieuw', 'Maak je laatste zet ongedaan, of doe hem opnieuw.'],
    ],
  },
  keywords: {
    button: 'Sleutelwoorden',
    title: 'Sleutelwoorden op de kaartjes',
    otherTitle: 'Goed om te weten',
    example: 'Voorbeeld',
    back: 'Terug naar de uitleg',
  },
  legend: {
    button: 'Legenda',
    title: 'Legenda',
    intro: 'Dit staat er op deze plattegrond.',
    objectsTitle: 'Voorwerpen',
    canOccupy: 'Kan bezet worden',
    blocked: 'Geblokkeerd',
    also: 'ook',
    tapHint: 'Tik op een rij om te zien waar die is.',
    peek: 'Tik om terug te gaan naar de legenda',
    edgesTitle: 'Deuren en ramen',
    door: { noun: 'Deur', text: 'Een opening in de muur.' },
    window: { noun: 'Raam', text: 'Een raam in de muur. Kaartjes kunnen zeggen: naast een raam.' },
    roomsTitle: 'Kamers',
    roomLabel: { noun: 'Kamernaam', text: 'Elke kamer heeft een naam. Kaartjes gebruiken die naam.' },
    marksTitle: 'Op de plattegrond',
    note: { noun: 'Notitie', text: 'Een letter in een vakje: deze persoon zou hier kunnen staan.' },
    cross: { noun: 'Kruisje', text: 'Deze persoon kan hier niet staan.' },
    person: { noun: 'Persoon', text: 'Een portret: deze persoon staat hier echt.' },
    gift: { noun: 'Het slachtoffer', text: 'Staat ook ergens op de plattegrond.' },
    victimNote: { noun: 'Notitie slachtoffer', text: 'Een klein doodshoofd: het slachtoffer zou hier kunnen staan.' },
    ruleTitle: 'De regel',
    rule: 'Het slachtoffer is alleen in een kamer met precies één persoon.',
    close: 'Sluiten',
  },
  close: 'Begin met spelen',
  link: 'Hoe het werkt',
}

/** Both languages of the help card and panel, keyed by `Locale`. Read through `useLocale()`. */
export const HELP_CONTENT: Record<Locale, HelpContent> = { en: HELP_EN, nl: HELP_NL }

/**
 * The English content, kept as a plain export for the one remaining consumer of `help.ts` not yet
 * switched to locale-aware content (`src/ui/help/firstVisit.ts`) — out of SLAY-9.7's References.
 * `src/ui/daily/StartScreen.tsx` switched to `HELP_CONTENT` in SLAY-9.15, joining `HowItWorks.tsx`,
 * `Glossary.tsx`, `HelpPanel.tsx`, `Legend.tsx`, `LegendPanel.tsx` and `PlayScreen.tsx`. New reads
 * of this file's content should go through `HELP_CONTENT` and `useLocale()` instead.
 */
export const help: HelpContent = HELP_EN
