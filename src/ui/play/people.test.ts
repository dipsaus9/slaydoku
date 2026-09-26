import { describe, expect, it } from 'vitest'
import { generate, makePeople } from '../../engine/generator/index.ts'
import { tutorialPuzzle } from '../../engine/model/tutorial.fixture.ts'
import { colorsFor, formatTime, GIFT_TAG, noteTags, withCastNames } from './people.ts'
import { DEMO_VICTIM_CELLS, demoScene } from '../../content/demo/scene.ts'

const person = (id: string, label: string) => ({ id, kind: 'suspect' as const, label })

describe('noteTags', () => {
  it('keeps letters as they are and gives the gift a glyph', () => {
    expect(noteTags(makePeople(4))).toEqual({ V: GIFT_TAG, A: 'A', B: 'B', C: 'C' })
  })

  it('uses initials, and unclaimed letters of the name on a clash', () => {
    const names = ['Alice', 'Anna', 'Ben', 'Bob', 'Chloe', 'Cleo', 'Dan', 'Dora']
    const tags = noteTags(names.map((n, i) => person(String.fromCharCode(65 + i), n)))
    expect(names.map((_, i) => tags[String.fromCharCode(65 + i)])).toEqual(['A', 'N', 'B', 'O', 'C', 'L', 'D', 'R'])
  })

  it('stays unique for a full 15-suspect cast with clashes', () => {
    const labels = Array.from({ length: 15 }, (_, i) => `Sam${i}`)
    const tags = Object.values(noteTags(labels.map((l, i) => person(`p${i}`, l))))
    expect(new Set(tags).size).toBe(15)
    for (const t of tags) expect([...t]).toHaveLength(1)
  })
})

describe('colorsFor', () => {
  it('gives every person a colour', () => {
    const people = makePeople(9)
    const colors = colorsFor(people)
    expect(Object.keys(colors)).toHaveLength(9)
    expect(new Set(Object.values(colors)).size).toBeGreaterThan(7)
  })
})

describe('withCastNames', () => {
  it('names letter suspects after the cast and leaves the rest of the puzzle alone', () => {
    const named = withCastNames(tutorialPuzzle)
    expect(named.people.filter((p) => p.kind === 'suspect').map((p) => p.label)).toEqual(['Alice', 'Ben', 'Chloe'])
    expect(named.people.find((p) => p.kind === 'victim')?.label).toBe('V')
    expect(named.solution).toBe(tutorialPuzzle.solution)
    expect(named.people.map((p) => p.id)).toEqual(tutorialPuzzle.people.map((p) => p.id))
  })

  it('brings the gender of the fixed cast and leaves the gift without one', () => {
    const puzzle = generate(demoScene, { seed: 7, victimCell: DEMO_VICTIM_CELLS[0] })
    const played = withCastNames(puzzle)
    const suspects = played.people.filter((p) => p.kind === 'suspect')
    expect(suspects.map((p) => [p.label, p.gender])).toEqual([
      ['Alice', 'woman'], ['Ben', 'man'], ['Chloe', 'woman'], ['Dan', 'man'],
      ['Emma', 'woman'], ['Frank', 'man'], ['Grace', 'woman'], ['Henry', 'man'],
    ])
    expect(played.people.find((p) => p.kind === 'victim')?.gender).toBeUndefined()
  })

  it('keeps puzzles that already have names', () => {
    const named = withCastNames(tutorialPuzzle)
    expect(withCastNames(named)).toBe(named)
  })

  it('works on a generated 9x9', () => {
    const puzzle = generate(demoScene, { seed: 7, victimCell: DEMO_VICTIM_CELLS[0] })
    expect(withCastNames(puzzle).people.filter((p) => p.kind === 'suspect')).toHaveLength(8)
  })
})

describe('formatTime', () => {
  it('formats minutes and hours', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(65_400)).toBe('1:05')
    expect(formatTime(3_723_000)).toBe('1:02:03')
    expect(formatTime(-5)).toBe('0:00')
  })
})
