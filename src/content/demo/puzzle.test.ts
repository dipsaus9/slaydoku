import { describe, expect, it } from 'vitest'
import demoJson from './puzzle.json?raw'
import type { CatalogClue } from '../../engine/clues/index.ts'
import { renderClue } from '../../engine/clues/index.ts'
import { auditObjectNames } from '../../engine/clues/objectNames.ts'
import { deriveMurderer, parsePuzzle, validateSolution } from '../../engine/model/index.ts'
import { solveHuman } from '../../engine/solver/human/index.ts'
import { verifyPuzzle } from '../../engine/solver/index.ts'
import { SOLVABLE_TIERS, ladderCheck, ladderMeetsTier, ladderOptions, tierFor } from '../../engine/solvable/index.ts'
import { auditClues, auditHints, walkHints } from '../../validation/index.ts'
import { castProblems } from '../cast/index.ts'
import { ladderCast } from '../../engine/generator/ladder/index.ts'
import { DEMO_VICTIM_CELLS, demoRoomStyles, demoScene } from './scene.ts'
import { demoPuzzle } from './puzzle.ts'

const parsed = parsePuzzle(demoJson)
if (!parsed.ok) throw new Error('demo puzzle does not parse')
const puzzle = parsed.value
const label = (id: string) => puzzle.people.find((p) => p.id === id)!.label
const rule = SOLVABLE_TIERS.find((t) => t.id === 'easy')!

describe('the demo puzzle module', () => {
  it('exposes the stored puzzle', () => {
    expect(demoPuzzle).toEqual(puzzle)
  })
})

describe('the demo level (ladder tier easy, seed 2, victim on the sofa)', () => {
  it('passes verify: rules hold, exactly one solution, matches the stored one', () => {
    const report = verifyPuzzle(demoJson)
    expect(report.problems).toEqual([])
    expect(report.solutionCount).toBe(1)
    expect(report.matchesStored).toBe(true)
    expect(report.ok).toBe(true)
  })

  it('uses the demo scene, and a floor style for every room', () => {
    expect(puzzle.scene).toEqual(demoScene)
    for (const room of demoScene.rooms) expect(demoRoomStyles[room.id], room.id).toBeDefined()
  })

  it('pins the victim on a legal victim cell and keeps the murderer rule', () => {
    const victim = puzzle.solution.find((p) => puzzle.people.find((q) => q.id === p.personId)?.kind === 'victim')!
    expect(DEMO_VICTIM_CELLS.some((g) => g.row === victim.cell.row && g.col === victim.cell.col)).toBe(true)
    expect(validateSolution(puzzle).ok).toBe(true)
    expect(deriveMurderer(puzzle, puzzle.solution)).not.toBeNull()
  })

  it('is on the easy tier of the human-solvability scale, and on no easier one', () => {
    expect(tierFor(puzzle)).toBe('easy')
    const ladder = ladderCheck(puzzle, ladderOptions(rule))
    expect(ladder.ok).toBe(true)
    expect(ladderMeetsTier(puzzle, ladder, rule)).toBe(true)
    const withCards = ladder.steps.filter((s) => s.clues.length > 0)
    expect(withCards.length).toBe(puzzle.people.length - 1)
    for (const step of withCards) expect(step.squaresFromCards, label(step.personId)).toBeLessThanOrEqual(rule.maxSquaresFromCards)
    expect(ladder.chainLength).toBeLessThanOrEqual(rule.maxChain)
  })

  it('needs no more hint requests than 1.3 x the number of people, and the first hint places somebody', () => {
    const walk = walkHints(puzzle)
    expect(walk.solved).toBe(true)
    expect(walk.steps.length).toBeLessThanOrEqual(Math.floor(1.3 * puzzle.people.length))
    expect(walk.steps[0]!.next.placement).toBeDefined()
  })

  it('passes the clue-noun audit, the hint audit and the clue audit', () => {
    expect(auditObjectNames(puzzle)).toEqual([])
    expect(auditHints(puzzle)).toEqual([])
    expect(auditClues(puzzle, 'easy')).toEqual([])
  })

  it('is also solved by the full hint solver (what the hint button uses)', () => {
    expect(solveHuman(puzzle.scene, puzzle.people, puzzle.clues as CatalogClue[]).solved).toBe(true)
  })

  it('has a sane clue set: 9-14 cards, varied kinds', () => {
    expect(puzzle.clues.length).toBeGreaterThanOrEqual(9)
    expect(puzzle.clues.length).toBeLessThanOrEqual(14)
    expect(new Set(puzzle.clues.map((c) => c.type)).size).toBeGreaterThanOrEqual(5)
  })

  it('every room name is bare and every clue reads right', () => {
    for (const room of puzzle.scene.rooms) expect(room.name, room.id).toMatch(/^[A-Z][a-z]/)
    const ctx = { scene: puzzle.scene, people: puzzle.people }
    for (const clue of puzzle.clues) {
      const line = renderClue(clue as CatalogClue, ctx)
      expect(line).toMatch(/^[A-Z]/)
      expect(line).not.toMatch(/\bthe the\b/)
    }
  })

  it('carries a valid cast (pool names, unique initials, balanced genders) and the victim has neither name nor gender', () => {
    const suspects = puzzle.people.filter((p) => p.kind === 'suspect')
    const cast = ladderCast(puzzle.people.length)
    expect(suspects.map((p) => [p.label, p.gender])).toEqual(cast.names.map((n, i) => [n, cast.genders[i]]))
    expect(castProblems(suspects.map((p) => p.label), suspects.map((p) => p.gender))).toEqual([])
    const victim = puzzle.people.find((p) => p.kind === 'victim')!
    expect(victim.label).toBe('the victim')
    expect(victim.gender).toBeUndefined()
  })
})
