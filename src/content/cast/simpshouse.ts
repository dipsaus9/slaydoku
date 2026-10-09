import type { CastName } from './pool.ts'

/*
 * The Simpshouse cast pool (SLAY-18.2): the one place the Simpshouse names live. They are real first names of friends of the owner, so
 * keep them in this file only and confirm with them before the repository goes public (docs/launch.md).
 *
 * Unlike the regular pool, most letters hold one gender only, so a cast picks its letters and genders TOGETHER (see `castFor`).
 */
const w = (...names: string[]): CastName[] => names.map((name) => ({ name, gender: 'woman' }))
const m = (...names: string[]): CastName[] => names.map((name) => ({ name, gender: 'man' }))

export const SIMPSHOUSE_POOL: readonly CastName[] = [
  ...m('Dennis', 'Duncan', 'Sander', 'Biko', 'Junior', 'Ralph', 'Ruben', 'Sven', 'Tijn'),
  ...w('Elodie', 'Romy', 'Emma', 'Iris', 'Jolie', 'Anne', 'Eveline', 'Marnica', 'Cait'),
]

/**
 * Names in every Simpshouse cast (SLAY-24, owner decision 2026-10-09). Their letters are taken, so Ruben and Ralph never appear with Romy
 * and Duncan never with Dennis.
 */
export const SIMPSHOUSE_ALWAYS: readonly string[] = ['Romy', 'Dennis']

/** The portrait design id of the monkey (drawn by `MonkeyAvatar`; not one of the slot designs of `PORTRAIT_DESIGNS`). */
export const MONKEY_DESIGN = 'monkey'

/**
 * Name-bound portraits: the one exception to "a portrait is picked by gender slot, never by name". Used only by the Simpshouse pool; every
 * other name keeps its slot portrait.
 */
export const SIMPSHOUSE_PORTRAIT_DESIGNS: Readonly<Record<string, string>> = { Biko: MONKEY_DESIGN }

/** Fur colour of the monkey (stored in the look's `skin`). */
export const MONKEY_FUR = '#8a5a3a'
