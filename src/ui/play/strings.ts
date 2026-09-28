import { VICTIM_TEXT } from '../../engine/clues/index.ts'
import { useLocale } from '../../locale/index.ts'
import type { Locale } from '../../locale/index.ts'

/** Shape shared by every language of the play screen. */
export interface PlayStrings {
  title: string
  tools: {
    label: string
    mode: string
    note: string
    place: string
    x: string
    erase: string
    undo: string
    redo: string
    hint: string
    autoX: string
    options: string
    help: string
    legend: string
    zoom: string
  }
  toolTitle: {
    note: string
    place: string
    x: string
    erase: string
    legend: string
    zoom: string
  }
  pickSuspect: string
  timerShow: string
  timerHide: string
  cards: string
  board: string
  options: {
    title: string
    autoX: string
    autoXHelp: string
    preventX: string
    preventXHelp: string
    timer: string
    timerHelp: string
    axisLabels: string
    axisLabelsHelp: string
    clearAll: string
    restart: string
    restartConfirm: string
    close: string
  }
  clearConfirm: { title: string; text: string; yes: string; no: string }
  hint: {
    level: (n: number) => string
    more: string
    close: string
    none: string
    place: string
  }
  result: {
    solvedTitle: string
    solved: (name: string) => string
    time: (formatted: string) => string
    wrongTitle: string
    wrong: (correct: number, total: number) => string
    again: string
    viewBoard: string
    keepGoing: string
  }
}

/** English wording of the play screen. Clue and victim wording live in engine/clues/en.ts. */
export const PLAY_EN: PlayStrings = {
  title: 'Slaydoku',
  tools: {
    label: 'Tools',
    mode: 'Mode',
    note: 'Note',
    place: 'Place',
    x: 'X',
    erase: 'Erase',
    undo: 'Undo',
    redo: 'Redo',
    hint: 'Hint',
    autoX: 'Auto-X',
    options: 'Options',
    help: 'Help',
    legend: 'Legend',
    zoom: 'Zoom',
  },
  toolTitle: {
    note: 'Tap a square to make a note, hold to place. Drag to fill several squares.',
    place: 'Tap a square to place the suspect, hold to make a note.',
    x: 'Tap a square to rule it out. Drag to cross several squares.',
    erase: 'Tap a square to clear it. Hold this button to clear everything.',
    legend: 'What do the objects and marks on this board mean?',
    zoom: 'Enlarge the board (2x), tap again for 1x. With two fingers you can also pinch and pan.',
  },
  pickSuspect: 'Pick a suspect first.',
  timerShow: 'Show the time',
  timerHide: 'Hide the time',
  cards: 'Suspects',
  board: 'Floor plan',
  options: {
    title: 'Options',
    autoX: 'Auto-X when placing',
    autoXHelp: 'Crosses out the row and column of a placed person for the others.',
    preventX: 'No X on blocked squares',
    preventXHelp: 'Squares where nobody can stand (table, plant) never get an X or a note.',
    timer: 'Show time',
    timerHelp: 'The clock keeps running, even when you hide it.',
    axisLabels: 'Row and column numbers',
    axisLabelsHelp: 'R1, R2 along the left are the rows, C1, C2 above the board are the columns: R3 and C4 is "row 3, column 4".',
    clearAll: 'Clear all',
    restart: 'Start over',
    restartConfirm: 'Sure? Tap again',
    close: 'Close',
  },
  clearConfirm: {
    title: 'Clear everything?',
    text: 'All notes, Xs and placed people disappear. You can undo this with Undo.',
    yes: 'Clear all',
    no: 'Cancel',
  },
  hint: {
    level: (n) => `Hint ${n} of 3`,
    more: 'More help',
    close: 'Close',
    none: 'No hint available. You are doing well, or the clues have run out.',
    place: 'Place for me',
  },
  result: {
    solvedTitle: 'Solved!',
    solved: (name) => `You found the murderer! ${name} was alone with ${VICTIM_TEXT.noun}.`,
    time: (formatted) => `Time: ${formatted}`,
    wrongTitle: 'Not right yet',
    wrong: (correct, total) => `Not quite: ${correct} of ${total} correct, try again.`,
    again: 'Play again',
    viewBoard: 'View the board',
    keepGoing: 'Keep going',
  },
}

/**
 * Dutch wording of the play screen (SLAY-3.4). Hint and clue *content* (`hint.text`, the technique
 * explanations) comes from the solver / `src/engine/clues/`, out of this story's References, so it
 * stays English; only this screen's own chrome (buttons, panels, the result dialog) is translated
 * here. `VICTIM_TEXT.noun` ("the victim") is engine content too, so the solved sentence spells "het
 * slachtoffer" directly instead of reusing it.
 */
export const PLAY_NL: PlayStrings = {
  title: 'Slaydoku',
  tools: {
    label: 'Gereedschap',
    mode: 'Modus',
    note: 'Notitie',
    place: 'Plaats',
    x: 'X',
    erase: 'Wissen',
    undo: 'Ongedaan',
    redo: 'Opnieuw',
    hint: 'Hint',
    autoX: 'Auto-X',
    options: 'Opties',
    help: 'Help',
    legend: 'Legenda',
    zoom: 'Zoom',
  },
  toolTitle: {
    note: 'Tik op een vakje voor een notitie, houd vast om te plaatsen. Sleep om meerdere vakjes te vullen.',
    place: 'Tik op een vakje om de verdachte te plaatsen, houd vast voor een notitie.',
    x: 'Tik op een vakje om het uit te sluiten. Sleep om meerdere vakjes te kruisen.',
    erase: 'Tik op een vakje om het te wissen. Houd deze knop ingedrukt om alles te wissen.',
    legend: 'Wat betekenen de objecten en tekens op dit bord?',
    zoom: 'Vergroot het bord (2x), tik nogmaals voor 1x. Met twee vingers kun je ook knijpen en slepen.',
  },
  pickSuspect: 'Kies eerst een verdachte.',
  timerShow: 'Toon de tijd',
  timerHide: 'Verberg de tijd',
  cards: 'Verdachten',
  board: 'Plattegrond',
  options: {
    title: 'Opties',
    autoX: 'Auto-X bij plaatsen',
    autoXHelp: 'Kruist de rij en kolom van een geplaatst persoon aan voor de anderen.',
    preventX: 'Geen X op geblokkeerde vakjes',
    preventXHelp: 'Vakjes waar niemand kan staan (tafel, plant) krijgen nooit een X of notitie.',
    timer: 'Toon tijd',
    timerHelp: 'De klok blijft lopen, ook als je hem verbergt.',
    axisLabels: 'Rij- en kolomnummers',
    axisLabelsHelp: 'R1, R2 links zijn de rijen, C1, C2 boven het bord zijn de kolommen: R3 en C4 is "rij 3, kolom 4".',
    clearAll: 'Alles wissen',
    restart: 'Opnieuw beginnen',
    restartConfirm: 'Zeker? Tik nogmaals',
    close: 'Sluiten',
  },
  clearConfirm: {
    title: 'Alles wissen?',
    text: 'Alle notities, kruisjes en geplaatste mensen verdwijnen. Je kunt dit ongedaan maken met Ongedaan.',
    yes: 'Alles wissen',
    no: 'Annuleren',
  },
  hint: {
    level: (n) => `Hint ${n} van 3`,
    more: 'Meer hulp',
    close: 'Sluiten',
    none: 'Geen hint beschikbaar. Je doet het goed, of de aanwijzingen zijn op.',
    place: 'Plaats voor mij',
  },
  result: {
    solvedTitle: 'Opgelost!',
    solved: (name) => `Je hebt de moordenaar gevonden! ${name} was alleen met het slachtoffer.`,
    time: (formatted) => `Tijd: ${formatted}`,
    wrongTitle: 'Nog niet juist',
    wrong: (correct, total) => `Niet helemaal: ${correct} van ${total} goed, probeer opnieuw.`,
    again: 'Speel opnieuw',
    viewBoard: 'Bekijk het bord',
    keepGoing: 'Ga verder',
  },
}

/** Both languages of the play screen, keyed by `Locale`. */
export const PLAY_STRINGS: Record<Locale, PlayStrings> = { en: PLAY_EN, nl: PLAY_NL }

/** The play screen strings in the reader's current locale. */
export function usePlayStrings(): PlayStrings {
  const { locale } = useLocale()
  return PLAY_STRINGS[locale]
}
