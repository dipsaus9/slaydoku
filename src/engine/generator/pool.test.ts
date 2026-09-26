import { describe, expect, it } from 'vitest'
import { checkClue, evaluate, RELATIONAL_CLUE_TYPES, STRUCTURAL_CLUE_TYPES } from '../clues/index.ts'
import { randomScene, rng as testRng } from '../solver/testing.fixture.ts'
import { makePeople } from './generate.ts'
import { samplePlacement } from './placement.ts'
import { COMBINED_PER_HOLDER, enumerateTrueClues, SELF_CLUE_TYPES, victimClue } from './pool.ts'
import { Rng } from './rng.ts'

const scene = randomScene(9, 3, testRng(5))
const people = makePeople(9)
const sampled = samplePlacement(scene, new Rng(3))
const solution = [
  { personId: 'V', cell: sampled.victim },
  ...sampled.suspects.map((cell, i) => ({ personId: people[i + 1]?.id as string, cell })),
]
const pool = enumerateTrueClues(scene, people, solution)

describe('enumerateTrueClues', () => {
  it('only holds clues that are true, well-formed and held by a suspect', () => {
    expect(pool.length).toBeGreaterThan(500)
    for (const { clue, holder } of pool) {
      expect(evaluate(clue, scene, solution)).toBe(true)
      expect(checkClue(clue, { scene, people })).toEqual([])
      expect(people[holder]?.id).toBe(clue.personId)
      expect(people[holder]?.kind).toBe('suspect')
    }
  })

  it('draws only on kinds the evaluator supports, structural and relational alike', () => {
    const supported = new Set<string>([...STRUCTURAL_CLUE_TYPES, ...RELATIONAL_CLUE_TYPES])
    const kinds = new Set(pool.map((c) => c.clue.type))
    for (const kind of kinds) expect(supported.has(kind)).toBe(true)
    // Every relational kind and most structural kinds show up in a rich scene.
    for (const kind of RELATIONAL_CLUE_TYPES) expect(kinds.has(kind)).toBe(true)
    expect(kinds.size).toBeGreaterThanOrEqual(20)
  })

  it('never draws a gender card on people who have no gender (CAD-9.1)', () => {
    expect(people.every((p) => p.gender === undefined)).toBe(true)
    const kinds = new Set(pool.map((c) => c.clue.type))
    expect(kinds.has('roomHasGender')).toBe(false)
    expect(kinds.has('aloneWithGender')).toBe(false)
  })

  it('keeps the pool of the older generators unless the new kinds are asked for (their committed fixtures stay reproducible)', () => {
    const kinds = new Set<string>(pool.map((c) => c.clue.type))
    for (const kind of ['inRoomEdge', 'both', 'roomHasGender', 'aloneWithGender']) expect(kinds.has(kind)).toBe(false)
  })

  describe('with the new kinds (CAD-9.4)', () => {
    const genders = people.map((p, i) => (p.kind === 'victim' ? p : { ...p, gender: i % 2 === 0 ? ('woman' as const) : ('man' as const) }))
    const rich = enumerateTrueClues(scene, genders, solution, { newKinds: true })
    const kindsOf = new Set<string>(rich.map((c) => c.clue.type))

    it('draws room-edge cards, gender cards and combined cards, all true and well-formed', () => {
      for (const kind of ['inRoomEdge', 'roomHasGender', 'aloneWithGender', 'both']) expect(kindsOf.has(kind)).toBe(true)
      for (const { clue } of rich) {
        expect(evaluate(clue, scene, solution, genders)).toBe(true)
        expect(checkClue(clue, { scene, people: genders })).toEqual([])
      }
    })

    it('draws a room-edge card per edge for the own room and for the rooms', () => {
      const edges = rich.filter((c) => c.clue.type === 'inRoomEdge' && c.holder === 1).map((c) => c.clue.args as { edge: string; roomId?: string })
      expect(new Set(edges.filter((a) => a.roomId === undefined).map((a) => a.edge)).size).toBeGreaterThanOrEqual(1)
      expect(edges.some((a) => a.roomId !== undefined)).toBe(true)
    })

    it('caps the combined cards per holder and never combines a fact with itself or with one it implies', () => {
      const perHolder = new Map<number, number>()
      for (const c of rich) if (c.clue.type === 'both') perHolder.set(c.holder, (perHolder.get(c.holder) ?? 0) + 1)
      expect(perHolder.size).toBeGreaterThan(0)
      for (const n of perHolder.values()) expect(n).toBeLessThanOrEqual(COMBINED_PER_HOLDER)
      const none = enumerateTrueClues(scene, genders, solution, { newKinds: true, combinedPerHolder: 0 })
      expect(none.some((c) => c.clue.type === 'both')).toBe(false)
    })

    it('is deterministic, has no duplicates and never draws gender cards for people without genders', () => {
      expect(enumerateTrueClues(scene, genders, solution, { newKinds: true })).toEqual(rich)
      expect(new Set(rich.map((c) => JSON.stringify(c.clue))).size).toBe(rich.length)
      const plain = new Set<string>(enumerateTrueClues(scene, people, solution, { newKinds: true }).map((c) => c.clue.type))
      expect(plain.has('roomHasGender')).toBe(false)
      expect(plain.has('aloneWithGender')).toBe(false)
      expect(plain.has('inRoomEdge')).toBe(true)
    })
  })

  it('knows which kinds describe the holder themselves', () => {
    expect(SELF_CLUE_TYPES.has('emptyRoom')).toBe(false)
    expect(SELF_CLUE_TYPES.has('aloneWithMurderer')).toBe(false)
    expect(SELF_CLUE_TYPES.has('inRoom')).toBe(true)
    for (const kind of ['inRoomEdge', 'roomHasGender', 'aloneWithGender', 'both']) expect(SELF_CLUE_TYPES.has(kind)).toBe(true)
  })

  it('is deterministic and has no duplicates', () => {
    expect(enumerateTrueClues(scene, people, solution)).toEqual(pool)
    expect(new Set(pool.map((c) => JSON.stringify(c.clue))).size).toBe(pool.length)
  })

  it('gives the victim the fixed murderer card, true by the rules', () => {
    const card = victimClue(people[0] as (typeof people)[number])
    expect(card).toEqual({ personId: 'V', type: 'aloneWithMurderer', args: {} })
    expect(evaluate(card, scene, solution)).toBe(true)
  })
})
