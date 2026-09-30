import { describe, expect, it } from 'vitest'
import { ladderCheck } from './ladder.ts'
import demoJson from '../../content/demo/puzzle.json?raw'
import { parsePuzzle } from '../model/index.ts'
import { SOLVABLE_TIERS, ladderCapsFor, ladderMeetsTier, ladderOptions, tierFor } from './tiers.ts'

/**
 * Every card informative on its own. The caps of the tier table hold for the committed demo puzzle (ladder tier easy): no placement is left
 * more squares than the cap by its own cards (before any row or column is crossed off), the last three placements are held to the tight cap,
 * and no chain of dependent placements is longer than the tier allows.
 */
const ladderTiers = SOLVABLE_TIERS.filter((t) => t.method === 'ladder')

function expectCaps(name: string, puzzle: Parameters<typeof ladderCheck>[0], tierId: string): void {
  const rule = ladderTiers.find((t) => t.id === tierId)!
  const caps = ladderCapsFor(rule, puzzle.scene.width)
  const ladder = ladderCheck(puzzle, ladderOptions(rule, puzzle.scene.width))
  expect(ladder.ok, `${name}: ladder on ${tierId}`).toBe(true)
  expect(ladderMeetsTier(puzzle, ladder, rule), `${name}: meets ${tierId}`).toBe(true)
  const withCards = ladder.steps.filter((s) => s.clues.length > 0)
  for (const step of withCards) expect(step.squaresFromCards, `${name}: ${step.personId} squares from cards`).toBeLessThanOrEqual(caps.maxSquaresFromCards)
  for (const step of ladder.steps.slice(-3).filter((s) => s.clues.length > 0)) {
    expect(step.squaresFromCards, `${name}: ${step.personId} (one of the last three) squares from cards`).toBeLessThanOrEqual(caps.lastSquaresFromCards)
  }
  for (const step of withCards) expect(step.chain, `${name}: ${step.personId} chain`).toBeLessThanOrEqual(caps.maxChain)
  expect(ladder.maxSquaresFromCards).toBeLessThanOrEqual(caps.maxSquaresFromCards)
  expect(ladder.chainLength).toBeLessThanOrEqual(caps.maxChain)
}

describe('the caps on squares per card and on chains', () => {
  it('hold for the demo level, on the tier it carries', () => {
    const parsed = parsePuzzle(demoJson)
    if (!parsed.ok) throw new Error('demo puzzle is invalid')
    expect(tierFor(parsed.value)).toBe('easy')
    expectCaps('demo', parsed.value, 'easy')
  })
})
