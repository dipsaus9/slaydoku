import type { Gender } from '../../../engine/model/index.ts'

/** A name for an extra suspect and the gender it reads as (the gender clues name people by gender: vrouw/man). */
export interface GenderedName {
  name: string
  gender: Gender
}

const v = (name: string): GenderedName => ({ name, gender: 'vrouw' })
const m = (name: string): GenderedName => ({ name, gender: 'man' })

/**
 * Names for the extra suspects: short, easy to read aloud in Dutch, mixed boys and girls, each with the gender it
 * reads as (a name that could be either, like Bo or Mees, is given one; the cast builder alternates the genders so the
 * cast stays balanced). None of the eight fixed cast names appear here (Alice, Ben, Chloe, Dan, Emma, Frank, Grace, Henry).
 */
export const GENDERED_NAMES: readonly GenderedName[] = [
  v('Sanne'), v('Lotte'), v('Fleur'), m('Daan'), m('Sem'), m('Bram'), m('Lars'), m('Milan'),
  v('Tess'), v('Noor'), v('Femke'), v('Maud'), m('Jasper'), m('Thijs'), m('Joris'), v('Anouk'),
  v('Lisa'), m('Mees'), m('Finn'), m('Luuk'), m('Sven'), m('Niels'), m('Ruben'), m('Jesse'),
  m('Pieter'), v('Hanneke'), v('Marijke'), v('Ineke'), m('Gerrit'), m('Wim'), m('Kees'), m('Henk'),
  v('Els'), v('Trudy'), m('Ties'), m('Guus'), v('Lieke'), v('Iris'), v('Roos'), v('Vera'),
  v('Fien'), v('Bo'), v('Julia'), v('Sophie'), v('Nina'), v('Merel'), v('Suus'),
  m('Jip'), m('Job'), m('Teun'), m('Stijn'), m('Wouter'), m('Bart'), m('Maarten'), m('Sander'),
  m('Tim'), m('Ronald'), v('Marloes'), v('Nienke'), v('Yara'), v('Ilse'), v('Mirjam'), m('Hugo'),
  m('Otto'), m('Cor'), v('Ella'), m('Bas'), m('Koen'), m('Thomas'), v('Saar'), m('Jurre'),
]

/** The names alone, in the order of `GENDERED_NAMES`. */
export const NAME_POOL: readonly string[] = GENDERED_NAMES.map((n) => n.name)
