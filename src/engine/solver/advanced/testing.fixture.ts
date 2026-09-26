import type { CatalogClue } from '../../clues/index.ts'
import { Rng, enumerateTrueClues, makePeople, samplePlacement, victimClue } from '../../generator/index.ts'
import { generateScene } from '../../scenegen/index.ts'
import type { Person, Placement, Scene } from '../../model/index.ts'
import type { HumanResult } from '../human/types.ts'
import { solve } from '../solve.ts'

/** A clue set on a scene, and every solution it allows (the brute-force truth the techniques are held against). */
export interface Case {
  label: string
  scene: Scene
  people: Person[]
  clues: CatalogClue[]
  /** Every solution of the clue set, or null when there are more than `SOLUTION_CAP`. */
  solutions: Placement[][] | null
}

export const SOLUTION_CAP = 4000

const THEMES = ['home', 'office', 'park', 'school', 'shop'] as const

/**
 * Clue sets that stay ambiguous or barely unique: one self clue per suspect plus
 * the victim card, then random true clues added until the solution count drops
 * to the cap. Every set therefore stops the solvers in the middle of a puzzle,
 * where the advanced techniques get their chance. Deterministic per seed.
 */
export function ambiguousCase(size: number, seed: number, cap = SOLUTION_CAP): Case {
  const scene = generateScene({ width: size, height: size, theme: THEMES[seed % THEMES.length] as (typeof THEMES)[number], seed })
  const people = makePeople(size)
  const rng = new Rng(seed * 7919 + size)
  const sampled = samplePlacement(scene, rng, {})
  const ids = people.filter((p) => p.kind === 'suspect').map((p) => p.id)
  const solution: Placement[] = [
    { personId: 'V', cell: sampled.victim },
    ...rng.shuffle(sampled.suspects).map((cell, i) => ({ personId: ids[i] as string, cell })),
  ]
  const pool = rng.shuffle(enumerateTrueClues(scene, people, solution))
  const victim = people.find((p) => p.kind === 'victim') as Person
  const clues: CatalogClue[] = [victimClue(victim)]
  const chosen = new Set<string>([JSON.stringify(clues[0])])
  for (const suspect of people.filter((p) => p.kind === 'suspect')) {
    const own = pool.find((c) => c.clue.personId === suspect.id && !chosen.has(JSON.stringify(c.clue)))
    if (own) {
      clues.push(own.clue)
      chosen.add(JSON.stringify(own.clue))
    }
  }
  let solutions: Placement[][] | null = null
  for (const candidate of [null, ...pool]) {
    if (candidate) {
      const key = JSON.stringify(candidate.clue)
      if (chosen.has(key)) continue
      chosen.add(key)
      clues.push(candidate.clue)
    }
    const found = solve(scene, people, clues, { limit: cap + 1 })
    if (found.count <= cap) {
      solutions = found.solutions
      break
    }
  }
  return { label: `${size}x${size} seed ${seed}`, scene, people, clues, solutions }
}

/** Solutions of a clue set, or null above the cap. */
export function allSolutions(scene: Scene, people: Person[], clues: CatalogClue[]): Placement[][] | null {
  const found = solve(scene, people, clues, { limit: SOLUTION_CAP + 1 })
  return found.count <= SOLUTION_CAP ? found.solutions : null
}

/**
 * Checks a human walk-through against every solution: no step may remove a
 * position some solution has, and every placement must be the same in all
 * solutions. Returns the offending steps (empty = sound).
 */
export function unsoundSteps(result: HumanResult, solutions: Placement[][]): string[] {
  const possible = new Set<string>()
  const perPerson = new Map<string, Set<string>>()
  for (const solution of solutions) {
    for (const { personId, cell } of solution) {
      const key = `${personId}@${cell.row},${cell.col}`
      possible.add(key)
      const set = perPerson.get(personId) ?? new Set<string>()
      set.add(key)
      perPerson.set(personId, set)
    }
  }
  const bad: string[] = []
  for (const step of result.steps) {
    for (const gone of step.eliminated) {
      if (possible.has(`${gone.personId}@${gone.cell.row},${gone.cell.col}`)) {
        bad.push(`step ${step.index} (${step.technique}) removed ${gone.personId}@${gone.cell.row},${gone.cell.col}`)
      }
    }
    if (step.placed) {
      const options = perPerson.get(step.placed.personId)
      const key = `${step.placed.personId}@${step.placed.cell.row},${step.placed.cell.col}`
      if (!options || options.size !== 1 || !options.has(key)) bad.push(`step ${step.index} (${step.technique}) placed ${key}`)
    }
  }
  return bad
}
