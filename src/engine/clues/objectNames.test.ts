import { describe, expect, it } from 'vitest'
import type { Puzzle } from '../model/index.ts'
import type { PlacedObject } from '../model/index.ts'
import { demoLevels } from '../../content/levels.ts'
import { generatedPuzzles } from '../../content/generated.testing.ts'
import { auditObjectNames, legacyNouns } from './objectNames.ts'
import { scene as fixtureScene } from './testing.fixture.ts'
import type { CatalogClue } from './types.ts'

const at = (row: number, col: number) => ({ row, col })
const obj = (id: string, type: PlacedObject['type'], row: number, col: number): PlacedObject => ({ id, type, cells: [at(row, col)] })
const puzzleOf = (objects: PlacedObject[], clues: CatalogClue[]) =>
  ({ scene: { ...fixtureScene, objects }, clues }) as Pick<Puzzle, 'scene' | 'clues'>

const besideChair = { personId: 'A', type: 'besideObject', args: { objectType: 'chair' } } as CatalogClue

describe('auditObjectNames', () => {
  const poofAndGardenChair = [obj('gardenChair-1', 'chair', 0, 0), obj('poof-1', 'chair', 3, 3)]

  it('passes the wording that names every drawn kind', () => {
    expect(auditObjectNames(puzzleOf(poofAndGardenChair, [besideChair]))).toEqual([])
  })

  it('fails "chair" when a poof and a garden chair are both on the board', () => {
    const problems = auditObjectNames(puzzleOf(poofAndGardenChair, [besideChair]), legacyNouns)
    // the plain-icon garden chair is a "chair", the poof is not: one group is named, the other left out
    expect(problems).toEqual(['card 1: leaves out poof, which the clue counts too'])
  })

  it('fails a noun that leaves a drawn kind out', () => {
    const problems = auditObjectNames(puzzleOf(poofAndGardenChair, [besideChair]), () => ['poof'])
    expect(problems).toEqual(['card 1: leaves out garden chair, which the clue counts too'])
  })

  it('fails the engine noun when another kind of the type is drawn differently', () => {
    // hammock and bed are engine type bed with different art; "bed" names only the plain one
    const both = [obj('hammock-1', 'bed', 0, 0), obj('sunLounger-1', 'bed', 3, 3)]
    const bed = { personId: 'A', type: 'onObject', args: { objectType: 'bed' } } as CatalogClue
    expect(auditObjectNames(puzzleOf(both, [bed]), legacyNouns)).toEqual(['card 1: leaves out hammock, which the clue counts too'])
    // a plain engine bed and a themed bed with the same plain art are one drawn kind
    const plain = [obj('bed-a', 'bed', 0, 0), obj('sunLounger-1', 'bed', 3, 3)]
    expect(auditObjectNames(puzzleOf(plain, [bed]), legacyNouns)).toEqual([])
  })

  it('accepts the group noun when every member is drawn alike', () => {
    const alike = [obj('schoolChair-1', 'chair', 0, 0), obj('meetingChair-1', 'chair', 1, 1)]
    expect(auditObjectNames(puzzleOf(alike, [besideChair]))).toEqual([])
    expect(auditObjectNames(puzzleOf(alike, [besideChair]), legacyNouns)).toEqual([])
    // a member noun alone does not name a group of several kinds
    expect(auditObjectNames(puzzleOf(alike, [besideChair]), () => ['school chair'])).toHaveLength(1)
  })

  it('fails a type that has no object on the board', () => {
    const problems = auditObjectNames(puzzleOf([obj('gardenChair-1', 'chair', 0, 0)], [{ personId: 'A', type: 'onObject', args: { objectType: 'rug' } } as CatalogClue]))
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/^card 1: names a rug/)
  })

  it('ignores clues that name no object', () => {
    expect(auditObjectNames(puzzleOf(poofAndGardenChair, [{ personId: 'A', type: 'alone', args: {} } as CatalogClue]))).toEqual([])
  })

  it('numbers the card', () => {
    const clues = [{ personId: 'A', type: 'alone', args: {} } as CatalogClue, besideChair]
    expect(auditObjectNames(puzzleOf(poofAndGardenChair, clues), () => ['poof'])[0]).toMatch(/^card 2: /)
  })
})

describe('the demo level and a generated sample', () => {
  const houses = demoLevels.map((level) => ({ id: level.id, puzzle: level.puzzle }))
  const packs = generatedPuzzles().map((p) => ({ id: p.id, puzzle: p.puzzle }))

  it('holds the demo level and a sample of every theme', () => {
    expect(houses).toHaveLength(1)
    expect(packs.length).toBeGreaterThanOrEqual(30)
  })

  it('names every object by what is drawn in all of them', () => {
    const failing = [...packs, ...houses].map((p) => [p.id, auditObjectNames(p.puzzle)] as const).filter(([, problems]) => problems.length > 0)
    expect(failing).toEqual([])
  })

  it('shows the audit is not vacuous: the old one-noun-per-type wording fails on generated puzzles', () => {
    const failing = packs.filter((p) => auditObjectNames(p.puzzle, legacyNouns).length > 0)
    expect(failing.length).toBeGreaterThan(0)
    expect(houses.filter((p) => auditObjectNames(p.puzzle, legacyNouns).length > 0)).toEqual([])
  })
})
