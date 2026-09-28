import { countWordNl } from '../engine/clues/index.ts'

/**
 * Dutch sentence pieces for `hintText.ts` (SLAY-3.3): the Dutch counterpart of its own English
 * templates, kept here rather than inline so no Dutch word sits outside a file the Dutch-text
 * guard test already treats as deliberately Dutch (`src/validation/dutch.test.ts`, following the
 * `clues/nl.ts` / `engine/solver/human/nl.ts` / `engine/solver/advanced/nl.ts` pattern). Each
 * function takes the already-rendered pieces `hintText.ts` computes with its locale-aware helpers
 * (`cellsText`, `roomName`, `renderClue`, …) and returns the whole Dutch sentence around them.
 */

export const cellName = (row: number, col: number): string => `rij ${row}, kolom ${col}`
export const rowCellsText = (row: number, cols: string): string => `rij ${row}, kolom ${cols}`
export const colCellsText = (col: number, rows: string): string => `kolom ${col}, rij ${rows}`

export const cardLead = (possessiveWho: string): string => `${possessiveWho} kaartje`

export const squaresText = (n: number): string => `${countWordNl(n)} ${n === 1 ? 'vakje' : 'vakjes'}`

export const earlierSteps = 'Eerdere stappen sloten al andere vakjes uit.'

export const cardSaysRoom = (text: string): string => `Een kaartje zegt: "${text}"`
export const cardSays = (possessiveWho: string, text: string): string => `${possessiveWho} kaartje zegt: "${text}"`
export const anotherCardSays = (text: string): string => `Nog een kaartje zegt: "${text}"`

export const together = (placed: boolean): string =>
  placed ? 'Alle kaartjes samen, met de rijen en kolommen van de mensen die al vaststaan,' : 'Alle kaartjes samen'
export const leaveOneSquare = (together: string, label: string, at: string): string => `${together} laten maar één vakje over voor ${label}: ${at}.`
export const leaveManySquares = (together: string, count: number, label: string): string =>
  `${together} laten ${countWordNl(count)} mogelijke vakjes over voor ${label}. We weten nog niet welke het is.`

/** `focusHint` level 1: the lead-in (a card, or a plain look), then the count of possible squares. */
export const focusLead = (card: { room: boolean; text: string; possessiveWho: string } | null, label: string): string => {
  if (!card) return `Kijk naar ${label}. `
  return `${card.room ? 'Lees dit kaartje' : `Lees ${card.possessiveWho} kaartje`}: "${card.text}" `
}
export const focusLevel1Text = (lead: string, label: string, squares: string): string => `${lead}Met alle kaartjes samen kan ${label} alleen nog op ${squares} staan.`

/** `focusHint` level 2. */
export const focusPlacementText = (at: string, label: string): string => `Kijk naar ${at}. ${label} moet daar staan.`
export const focusNoteText = (label: string, at: string, single: boolean): string =>
  `${label} kan alleen nog op ${at} staan. ${single ? 'Dat vakje is' : 'Die vakjes zijn'} gemarkeerd op het bord.`

/** `focusHint` level 3, `stepHint` level 3 placement/note instructions. */
export const placeInstruction = (label: string, at: string): string => `Zet ${label} op ${at}.`
export const noteInstruction = (label: string, at: string): string => `Noteer vakjes voor ${label} op ${at}.`

/** `stepHint` level 1: the card lead-in ("Lees dit kaartje" / "Lees Alice's kaartje"). */
export const stepCardLead = (room: boolean, possessiveWho: string): string => (room ? 'Lees dit kaartje' : `Lees ${possessiveWho} kaartje`)

/**
 * `stepHint` level 1: the "look" phrase, with or without a placement, named people, or areas.
 * `then` picks "Kijk dan" (after a quoted card) over the bare "Kijk" (no card).
 */
export function look(then: boolean, placement: boolean, who: string, rooms: string, named: boolean): string {
  const lead = then ? 'Kijk dan' : 'Kijk'
  if (placement) return `${lead} naar ${who}${rooms ? ` in ${rooms}` : ''}.`
  if (named) return `${lead} naar ${who}${rooms ? `, en let op ${rooms}` : ''}.`
  return rooms ? `Let op ${rooms}.` : 'Kijk goed naar het bord.'
}

/** `stepHint` level 2. */
export const stepPlacementText = (at: string, who: string): string => `Kijk naar ${at}. ${who} moet daar staan.`
export const markedSquaresText = 'Kijk naar de gemarkeerde vakjes op het bord.'
export const stepNoteText = (at: string, single: boolean): string => `Kijk naar ${at}. ${single ? 'Dat vakje is' : 'Die vakjes zijn'} gemarkeerd op het bord.`

/** `stepHint` level 3. */
export const forNames = (who: string): string => ` voor ${who}`
export const markedSquares = 'de gemarkeerde vakjes'
export const ruledOutText = (cardText: string, crossedNames: string): string => `${cardText} Dat sluit vakjes uit${crossedNames}.`
export const stepPlaceInstruction = (who: string, at: string): string => `Zet ${who} op ${at}.`
export const crossManyInstruction = (crossedCells: string): string => `Zet een kruisje op ${crossedCells}, voor iedereen die daar nog zou kunnen staan.`
export const crossInstruction = (crossedNames: string, crossedCells: string): string => `Zet een kruisje${crossedNames} op ${crossedCells}.`
