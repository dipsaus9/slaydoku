import { describe, expect, it } from 'vitest'
import type { Puzzle } from '../model/index.ts'
import type { PlacedObject } from '../model/index.ts'
import { demoPuzzle } from '../../content/demo/puzzle.ts'
import { generatedPuzzles } from '../../content/generated.testing.ts'
import { auditObjectNames, auditObjectNamesBoth, currentNounsNl, legacyNouns, legacyNounsNl } from './objectNames.ts'
import { scene as fixtureScene } from './testing.fixture.ts'
import type { CatalogClue } from './types.ts'

const at = (row: number, col: number) => ({ row, col })
const obj = (id: string, type: PlacedObject['type'], row: number, col: number): PlacedObject => ({ id, type, cells: [at(row, col)] })
const puzzleOf = (objects: PlacedObject[], clues: CatalogClue[]) =>
  ({ scene: { ...fixtureScene, objects }, clues }) as Pick<Puzzle, 'scene' | 'clues'>

const besideChair = { personId: 'A', type: 'besideObject', args: { objectType: 'chair' } } as CatalogClue
const besideRug = { personId: 'A', type: 'besideObject', args: { objectType: 'rug' } } as CatalogClue

describe('auditObjectNames', () => {
  // Every chair kind draws the plain chair since SLAY-17.2, so kinds drawn differently are tested on rugs.
  const rugAndMat = [obj('readingRug-1', 'rug', 0, 0), obj('gymMat-1', 'rug', 3, 3)]

  it('passes the wording that names every drawn kind', () => {
    expect(auditObjectNames(puzzleOf(rugAndMat, [besideRug]))).toEqual([])
  })

  it('fails "rug" when a gym mat and a reading rug are both on the board', () => {
    const problems = auditObjectNames(puzzleOf(rugAndMat, [besideRug]), legacyNouns)
    // the plain-icon reading rug is a "rug", the gym mat is not: one group is named, the other left out
    expect(problems).toEqual(['card 1: leaves out gym mat, which the clue counts too'])
  })

  it('fails a noun that leaves a drawn kind out', () => {
    const problems = auditObjectNames(puzzleOf(rugAndMat, [besideRug]), () => ['gym mat'])
    expect(problems).toEqual(['card 1: leaves out reading rug, which the clue counts too'])
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
    expect(auditObjectNames(puzzleOf(rugAndMat, [{ personId: 'A', type: 'alone', args: {} } as CatalogClue]))).toEqual([])
  })

  it('numbers the card', () => {
    const clues = [{ personId: 'A', type: 'alone', args: {} } as CatalogClue, besideRug]
    expect(auditObjectNames(puzzleOf(rugAndMat, clues), () => ['gym mat'])[0]).toMatch(/^card 2: /)
  })

  describe('in Dutch (SLAY-17.4: the same audit, on the Dutch nouns)', () => {
    const nl = (puzzle: Pick<Puzzle, 'scene' | 'clues'>, nounsFor = currentNounsNl) => auditObjectNames(puzzle, nounsFor, 'nl')

    it('passes the Dutch wording that names every drawn kind', () => {
      expect(nl(puzzleOf(rugAndMat, [besideRug]))).toEqual([])
      expect(nl(puzzleOf([obj('schoolChair-1', 'chair', 0, 0), obj('meetingChair-1', 'chair', 1, 1)], [besideChair]))).toEqual([])
    })

    it('fails the old one-generic-noun Dutch wording: "kleed" leaves the gym mat out, "plant" the lava lamp', () => {
      expect(nl(puzzleOf(rugAndMat, [besideRug]), legacyNounsNl)).toEqual(['card 1: leaves out sportmat, which the clue counts too'])
      const lamps = [obj('houseplant-1', 'plant', 0, 0), obj('lavaLamp-1', 'plant', 3, 3)]
      const besidePlant = { personId: 'A', type: 'besideObject', args: { objectType: 'plant' } } as CatalogClue
      expect(nl(puzzleOf(lamps, [besidePlant]), legacyNounsNl)).toEqual(['card 1: leaves out lavalamp, which the clue counts too'])
      expect(nl(puzzleOf(lamps, [besidePlant]))).toEqual([])
    })

    it('fails a Dutch noun that names none of the drawn kinds, and a member noun alone for a group of several kinds', () => {
      expect(nl(puzzleOf(rugAndMat, [besideRug]), () => ['lavalamp'])).toEqual(['card 1: "lavalamp" matches none of the drawn kinds (leeskleed, sportmat)'])
      const alike = [obj('schoolChair-1', 'chair', 0, 0), obj('meetingChair-1', 'chair', 1, 1)]
      expect(nl(puzzleOf(alike, [besideChair]), () => ['schoolstoel'])).toEqual(['card 1: "schoolstoel" matches none of the drawn kinds (schoolstoel/vergaderstoel)'])
    })

    it('fails a Dutch noun that names two drawn kinds (the generic noun on a plain kind while a kind with own art carries the same word)', () => {
      // No registered kind does this (themes.test.ts forbids it); the audit must still catch it, so the wording is faked:
      // a hypothetical kind with own art whose Dutch noun is the generic "kleed" would make "kleed" ambiguous.
      const problems = nl(puzzleOf(rugAndMat, [besideRug]), () => ['kleed', 'sportmat'])
      expect(problems).toEqual([])
      // ... whereas "sportmat" said twice is still one kind: the audit counts kinds, not words
      expect(nl(puzzleOf(rugAndMat, [besideRug]), () => ['kleed', 'sportmat', 'sportmat'])).toEqual([])
      // and the generic English word is no Dutch noun at all
      expect(nl(puzzleOf(rugAndMat, [besideRug]), () => ['rug', 'sportmat'])).toEqual(['card 1: "rug" matches none of the drawn kinds (leeskleed, sportmat)'])
    })

    it('fails a type that has no object on the board, in Dutch words', () => {
      const problems = nl(puzzleOf([obj('gardenChair-1', 'chair', 0, 0)], [{ personId: 'A', type: 'onObject', args: { objectType: 'rug' } } as CatalogClue]))
      expect(problems).toEqual(['card 1: names a kleed, which matches none of the drawn objects: the board has none'])
    })

    it('reports both languages at once for a gate, each problem prefixed', () => {
      expect(auditObjectNamesBoth(puzzleOf(rugAndMat, [besideRug]))).toEqual([])
      const none = puzzleOf([obj('gardenChair-1', 'chair', 0, 0)], [{ personId: 'A', type: 'onObject', args: { objectType: 'rug' } } as CatalogClue])
      expect(auditObjectNamesBoth(none)).toEqual([
        'en: card 1: names a rug, which matches none of the drawn objects: the board has none',
        'nl: card 1: names a kleed, which matches none of the drawn objects: the board has none',
      ])
    })
  })
})

describe('the demo level and a generated sample', () => {
  const houses = [{ id: 'demo', puzzle: demoPuzzle }]
  const packs = generatedPuzzles().map((p) => ({ id: p.id, puzzle: p.puzzle }))

  it('holds the demo level and a sample of every theme', () => {
    expect(houses).toHaveLength(1)
    expect(packs.length).toBeGreaterThanOrEqual(30)
  })

  it('names every object by what is drawn in all of them, in English and in Dutch', () => {
    const failing = [...packs, ...houses].map((p) => [p.id, auditObjectNamesBoth(p.puzzle)] as const).filter(([, problems]) => problems.length > 0)
    expect(failing).toEqual([])
  })

  it('shows the audit is not vacuous: the old one-noun-per-type wording fails on generated puzzles, in both languages', () => {
    const failing = packs.filter((p) => auditObjectNames(p.puzzle, legacyNouns).length > 0)
    expect(failing.length).toBeGreaterThan(0)
    expect(houses.filter((p) => auditObjectNames(p.puzzle, legacyNouns).length > 0)).toEqual([])
    const failingNl = packs.filter((p) => auditObjectNames(p.puzzle, legacyNounsNl, 'nl').length > 0)
    expect(failingNl.length).toBeGreaterThan(0)
    expect(houses.filter((p) => auditObjectNames(p.puzzle, legacyNounsNl, 'nl').length > 0)).toEqual([])
  })
})
