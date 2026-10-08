import { describe, expect, it } from 'vitest'
import type { CatalogClue } from '../../clues/index.ts'
import { solveAdvanced } from '../../solver/advanced/index.ts'
import { difficultyScore, tierById } from '../tiers/index.ts'
import type { TierId } from '../tiers/index.ts'
import { enumerateTrueClues } from '../pool.ts'
import { cluePolicyFor, MIN_STEPS_PER_PERSON, qualityGate } from './gates.ts'
import { generateForSceneWithReport } from './generate.ts'
import { sceneForSeed } from './measure.ts'

const made = generateForSceneWithReport(sceneForSeed(7, 5), { tier: 'medium', seed: 5 })
const clues = made.puzzle.clues as CatalogClue[]

/** Runs the gate the way the generator does: on the capped walk of the given clues. */
function gate(id: TierId, withClues: CatalogClue[]) {
  const tier = tierById(id)
  const puzzle = { ...made.puzzle, clues: withClues }
  const human = solveAdvanced(puzzle.scene, puzzle.people, withClues, { maxLevel: tier.maxTechniqueLevel })
  return qualityGate({ puzzle, clues: withClues, tier, human, score: difficultyScore(human, puzzle.people.length) })
}

describe('qualityGate', () => {
  it('passes a generated puzzle', () => {
    expect(gate('medium', clues)).toBeNull()
  })

  it('refuses a rating outside the tier', () => {
    expect(gate('easy', clues)).not.toBeNull()
    expect(gate('very-easy', clues)).not.toBeNull()
  })

  it('refuses a clue set that is no longer unique', () => {
    // The generator leaves the set minimal: dropping any suspect clue that is not the last self clue breaks it.
    const tampered = clues.filter((_, i) => i !== clues.findIndex((c) => c.type !== 'aloneWithMurderer'))
    expect(['not-unique', 'not-deducible', 'trivial']).toContain(gate('medium', tampered))
  })

  it('refuses a puzzle with a duplicated card as trivial padding', () => {
    const doubled = [...clues, clues[1] as CatalogClue]
    expect(gate('medium', doubled)).toBe('trivial')
  })

  it('refuses puzzles that carry more cards than the tier policy allows', () => {
    const policy = cluePolicyFor(tierById('medium'), made.puzzle.people.length)
    const held = new Set(clues.map((c) => JSON.stringify(c)))
    const padding = enumerateTrueClues(made.puzzle.scene, made.puzzle.people, made.puzzle.solution)
      .map((c) => c.clue)
      .filter((c) => !held.has(JSON.stringify(c)))
      .slice(0, policy.maxExtraClues + 1)
    expect(gate('medium', [...clues, ...padding])).toBe('too-many-clues')
  })

  it('documents the trivial floor', () => {
    expect(MIN_STEPS_PER_PERSON).toBeGreaterThan(1)
    expect(made.human.steps.length).toBeGreaterThanOrEqual(MIN_STEPS_PER_PERSON * made.puzzle.people.length)
  })
})

describe('cluePolicyFor', () => {
  it('keeps the table on 9x9 and grows the extra-card allowance with the board', () => {
    const tier = tierById('medium')
    expect(cluePolicyFor(tier, 9).maxExtraClues).toBe(tier.clues.maxExtraClues)
    expect(cluePolicyFor(tier, 16).maxExtraClues).toBeGreaterThan(tier.clues.maxExtraClues)
    expect(cluePolicyFor(tier, 6).maxExtraClues).toBe(tier.clues.maxExtraClues)
    expect(cluePolicyFor(tier, 16).maxCluesPerSuspect).toBe(tier.clues.maxCluesPerSuspect)
  })
})
