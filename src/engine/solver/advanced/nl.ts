import { countWordNl } from '../../clues/index.ts'
import { countPeople as countPeopleNl, joinList, manyWord } from '../human/nl.ts'

/**
 * Full-sentence and "why"-clause builders for the advanced techniques (`techniques/*.ts`) and the
 * room head-count bounds (`rooms.ts`): the Dutch counterpart of their English templates. Kept
 * here, never inline in those files, so no Dutch word sits outside a file the Dutch-text guard
 * test already treats as deliberately Dutch (`src/validation/dutch.test.ts`, SLAY-3.3 following
 * the SLAY-3.2 pattern of `clues/nl.ts` and the SLAY-3.3 pattern of `human/nl.ts`).
 */

/** The gender values ("woman"/"man") as the Dutch noun a "why" clause says (same words as `clues/nl.ts`'s private `GENDER_NL`). */
export const GENDER_NL: Record<string, string> = { woman: 'vrouw', man: 'man' }

// -- techniques/chain.ts --

export function chainStepText(who: string, cell: string, steps: readonly string[], cut: boolean, deadIsPerson: boolean, deadText: string): string {
  const lead = steps.length > 0 ? `Dat dwingt af dat ${joinList(steps, 'and', '; ')}${cut ? ' enzovoort' : ''}. Daardoor ` : 'Dan '
  const end = deadIsPerson ? `heeft ${deadText} geen vakje meer over.` : `heeft ${deadText} geen vrij vakje meer over.`
  return `Stel dat ${who} op ${cell} staat. ${lead}${end} Dat kan niet, dus ${who} staat daar niet.`
}
export const chainTailText = (more: number): string => ` Dezelfde redenering sluit ${manyWord(more)} ander${more === 1 ? '' : 'e'} vakje${more === 1 ? '' : 's'} uit.`

// -- techniques/combined.ts --

export const combinedExtraText = (more: number): string => ` Er ${more === 1 ? 'is' : 'zijn'} nog ${countWordNl(more)} zoals deze.`
export const combinedText = (name: string, neighbours: string, cards: string, extra: string, cellList: string): string =>
  `De kaartjes van ${name} en ${neighbours} horen bij elkaar: ${cards}${extra} Als ${name} op ${cellList} staat, is er geen combinatie van vakjes meer over voor ${neighbours} die bij al die kaartjes past zonder een rij of kolom te delen. Dus ${name} staat daar niet.`

// -- techniques/lines.ts --

export const nakedLinesText = (who: string, where: string, rows: boolean, size: number): string => {
  const noun = rows ? 'rijen' : 'kolommen'
  return `${who} kunnen nu alleen nog in ${where} staan: ${countWordNl(size)} mensen voor ${countWordNl(size)} ${noun}. We weten niet wie waar staat, maar die ${noun} zijn samen van hen. Niemand anders kan daar staan.`
}
export const hiddenLinesText = (who: string, list: string, rows: boolean, size: number): string => {
  const nounSingle = rows ? 'rij' : 'kolom'
  return size === 1
    ? `Alleen ${who} kan nog in ${list} staan. Elke ${nounSingle} houdt iemand, dus ${who} staat daar en nergens anders.`
    : `Alleen ${who} kunnen nog in ${list} staan. Elke ${nounSingle} houdt iemand, dus zij vullen die ${countWordNl(size)} ${rows ? 'rijen' : 'kolommen'} samen en staan nergens anders.`
}

// -- techniques/rectangle.ts --

export const rectangleText = (own: string, corners: string, cross: string, rows: boolean, size: number, person: string): string =>
  `In ${own} zijn alleen deze vakjes nog vrij: ${corners}. Ze liggen allemaal in ${cross}. Dus ${countWordNl(size)} ${rows ? 'rijen' : 'kolommen'} hebben ${countWordNl(size)} ${rows ? 'kolommen' : 'rijen'} nodig: samen gebruiken ze ${cross} op. Buiten ${own} kan niemand in ${cross} staan, ook ${person} niet.`
export const intersectWideText = (name: string, count: number, cellList: string): string =>
  `${name} kan nog op ${countWordNl(count)} vakjes staan, en elk daarvan deelt een rij of kolom met ${cellList}. Als iemand anders daar zou staan, had ${name} niets meer over. Dus niemand anders kan daar staan.`

// -- techniques/rooms.ts --

export const roomHiddenSingleText = (needed: number, room: string, why: string, who: string, singleReach: boolean): string =>
  `Er ${needed === 1 ? 'moet' : 'moeten'} nog minstens ${countWordNl(needed)} ${needed === 1 ? 'persoon' : 'mensen'} in ${room} staan, omdat ${why}. Alleen ${who} ${singleReach ? 'kan' : 'kunnen'} daar nog komen, dus ${singleReach ? 'die persoon staat' : 'zij staan'} daar.`

export const roomSaturatedSureText = (who: string, count: number): string => ` ${who} ${count === 1 ? 'staat' : 'staan'} daar al zeker.`
export const roomSaturatedText = (count: number, room: string, why: string, sure: string): string =>
  `Er kunnen hoogstens ${countPeopleNl(count)} in ${room} staan, omdat ${why}.${sure} Dus niemand anders kan daar staan.`

export const roomLinesText = (count: number, room: string, why: string, names: string, confinedCount: number, rows: boolean): string =>
  `Er kunnen hoogstens ${countPeopleNl(count)} in ${room} staan, omdat ${why}. ${names} ${confinedCount === 1 ? 'levert' : 'leveren'} er al ${countWordNl(confinedCount)}. Dus andere ${rows ? 'rijen' : 'kolommen'} hebben geen ruimte meer in ${room}.`

export const victimCountLoWhy = (room: string, count: number, why: string, victim: string): string =>
  `${room} moet minstens ${countPeopleNl(count)} bevatten, omdat ${why}. ${victim} is bij precies één verdachte`
export const victimCountHiWhy = (room: string, count: number, why: string, victim: string): string =>
  `${room} kan hoogstens ${countPeopleNl(count)} bevatten, omdat ${why}. ${victim} is bij een verdachte`
export const victimCountText = (why: string): string => `${why}, en kan daar dus niet zijn.`

export const clueRoomCountLoReason = (room: string, count: number, why: string): string => `${room} moet minstens ${countPeopleNl(count)} bevatten, omdat ${why}`
export const clueRoomCountHiReason = (room: string, count: number, why: string): string => `${room} kan hoogstens ${countPeopleNl(count)} bevatten, omdat ${why}`
export const clueRoomCountText = (who: string, size: number, reason: string, room: string): string =>
  `Een kaartje zegt dat ${who} ${size === 1 ? 'alleen' : 'samen alleen'} in een kamer ${size === 1 ? 'is' : 'zijn'}, dus staan daar precies ${countPeopleNl(size)}. ${reason}. Dus ${who} ${size === 1 ? 'kan' : 'kunnen'} niet in ${room} staan.`

// -- rooms.ts (roomBounds "why" clauses) --
//
// Every one of these is always spliced in after "omdat" ("because") by the callers above, so each
// reads as a Dutch subordinate clause: the (part of the) verb goes at the very end, not in second
// position the way a Dutch main clause would put it.

export const sureInRoomWhy = (who: string, count: number, room: string): string => `${who} zeker in ${room} ${count === 1 ? 'staat' : 'staan'}`
export const confinedLineWhy = (rows: boolean, count: number, single: number, room: string): string => {
  const label = count === 1 ? (rows ? `rij ${single}` : `kolom ${single}`) : `${countWordNl(count)} ${rows ? 'rijen' : 'kolommen'}`
  return `${label} alleen vanuit ${room} gevuld ${count === 1 ? 'kan' : 'kunnen'} worden`
}
export const freeLinesLeftWhy = (rows: boolean, count: number, room: string): string =>
  `${room} nog maar ${countWordNl(count)} vrije ${rows ? (count === 1 ? 'rij' : 'rijen') : count === 1 ? 'kolom' : 'kolommen'} over heeft`
export const reachablePeopleWhy = (count: number, room: string): string => `maar ${countWordNl(count)} ${count === 1 ? 'persoon' : 'mensen'} nog in ${room} ${count === 1 ? 'kan' : 'kunnen'} komen`
export const victimRoomWhy = (room: string, victim: string): string => `${room} ${victim} en precies één verdachte bevat`
export const aloneWithPairWhy = (room: string, a: string, b: string): string => `${room} alleen ${a} en ${b} bevat`
export const aloneWithGenderWhy = (room: string, who: string, gender: string): string => `${room} alleen ${who} en een ${GENDER_NL[gender] ?? gender} bevat`
export const aloneInRoomWhy = (who: string, room: string): string => `${who} alleen in ${room} is`
export const otherRoomsSpaceWhy = (left: number): string => `alle andere kamers samen maar voor ${countWordNl(left)} ${left === 1 ? 'persoon' : 'mensen'} plaats hebben`
