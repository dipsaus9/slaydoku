import type { Gender } from '../../engine/model/index.ts'
import { SIMPSHOUSE_POOL } from './simpshouse.ts'

/** One name of the cast pool and the gender it reads as (the gender clues talk about "a woman" and "a man"). */
export interface CastName {
  name: string
  gender: Gender
}

const w = (...names: string[]): CastName[] => names.map((name) => ({ name, gender: 'woman' }))
const m = (...names: string[]): CastName[] => names.map((name) => ({ name, gender: 'man' }))

/**
 * The names a puzzle's suspects are drawn from: short, plain English first names that read the same everywhere.
 * Rules the tests keep: letters A-Y without Q, U, X and Z; at least two names of each gender per letter (so that a
 * previous day's name can always be avoided without losing the gender balance); no duplicates; no name of a real
 * public figure; nothing unusual or hard to read.
 */
export const CAST_POOL: readonly CastName[] = [
  ...w('Alice', 'Amy', 'Anna'), ...m('Adam', 'Alex', 'Aaron'),
  ...w('Beth', 'Bella'), ...m('Ben', 'Bob'),
  ...w('Chloe', 'Clara'), ...m('Carl', 'Colin', 'Chris'),
  ...w('Daisy', 'Dora'), ...m('Dan', 'David', 'Derek'),
  ...w('Emma', 'Ella'), ...m('Eric', 'Ethan', 'Evan'),
  ...w('Fiona', 'Faye'), ...m('Frank', 'Fred', 'Finn'),
  ...w('Grace', 'Gwen'), ...m('George', 'Greg', 'Gus'),
  ...w('Hannah', 'Holly'), ...m('Henry', 'Harry', 'Hugh'),
  ...w('Ivy', 'Iris', 'Irene'), ...m('Ian', 'Isaac'),
  ...w('Jane', 'Julia', 'Jill'), ...m('Jack', 'James', 'Jake'),
  ...w('Kate', 'Kim'), ...m('Kevin', 'Kyle', 'Kurt'),
  ...w('Lily', 'Lucy', 'Laura'), ...m('Leo', 'Luke', 'Liam'),
  ...w('Mia', 'Molly', 'Mary'), ...m('Max', 'Mike', 'Martin'),
  ...w('Nina', 'Nora'), ...m('Nick', 'Neil', 'Noah'),
  ...w('Olive', 'Opal'), ...m('Oscar', 'Owen', 'Oliver'),
  ...w('Paula', 'Polly', 'Pam'), ...m('Paul', 'Pete', 'Phil'),
  ...w('Rose', 'Ruby', 'Ruth'), ...m('Ray', 'Ryan', 'Roy'),
  ...w('Sara', 'Sally', 'Sue'), ...m('Sean', 'Simon', 'Steve'),
  ...w('Tina', 'Tess'), ...m('Tom', 'Toby', 'Tyler'),
  ...w('Vicky', 'Violet'), ...m('Victor', 'Vince'),
  ...w('Wendy', 'Wanda'), ...m('Will', 'Walter', 'Wade'),
  ...w('Yasmin', 'Yvonne'), ...m('Yuri', 'Yusuf'),
]

/** The first letters a name may start with, in alphabetical order (A-Y without Q, U, X and Z). */
export const CAST_LETTERS: readonly string[] = [...new Set(CAST_POOL.map((n) => n.name.charAt(0)))]

/** Most people one puzzle can hold: one suspect per letter, plus the victim (who needs no name). */
export const MAX_CAST_SIZE = CAST_LETTERS.length + 1

/** The first letter of a name, upper case: what notes and markers show. */
export const initialOf = (name: string): string => name.trim().charAt(0).toUpperCase()

const byName = new Map([...CAST_POOL, ...SIMPSHOUSE_POOL].map((n) => [n.name, n]))

/** The pool entry for exactly this name, if it is in the regular pool or a theme's own pool. */
export const poolEntry = (name: string): CastName | undefined => byName.get(name)

/** The pool names starting with `letter` and reading as `gender`. */
export const namesFor = (letter: string, gender: Gender): string[] =>
  CAST_POOL.filter((n) => n.name.charAt(0) === letter && n.gender === gender).map((n) => n.name)
