import { describe, expect, it } from 'vitest'
import { RELATIONAL_CLUE_TYPES, STRUCTURAL_CLUE_TYPES, VICTIM_TEXT } from '../../engine/clues/index.ts'
import { GLOSSARY } from './glossary.ts'

describe('glossary', () => {
  const kinds = GLOSSARY.flatMap((entry) => entry.kinds)

  it('explains every clue kind of the catalog', () => {
    for (const type of [...STRUCTURAL_CLUE_TYPES, ...RELATIONAL_CLUE_TYPES]) expect(kinds).toContain(type)
  })

  it('explains no kind twice and invents none', () => {
    const known = new Set<string>([...STRUCTURAL_CLUE_TYPES, ...RELATIONAL_CLUE_TYPES])
    expect(new Set(kinds).size).toBe(kinds.length)
    for (const kind of kinds) expect(known.has(kind)).toBe(true)
  })

  it('gives every entry a keyword, a meaning and an example', () => {
    for (const entry of GLOSSARY) {
      expect(entry.keyword.trim()).not.toBe('')
      expect(entry.meaning.trim()).not.toBe('')
      expect(entry.example.trim()).not.toBe('')
    }
  })

  it('names the core keywords', () => {
    const words = GLOSSARY.map((e) => e.keyword).join(' | ').toLowerCase()
    for (const word of ['next to', 'alone', 'with', 'exactly n', 'diagonal', 'in a corner', 'next to a window']) {
      expect(words).toContain(word)
    }
  })
})

describe('glossary wording of the plan-side clues', () => {
  it('explains directly-next-to and exact-distance without the stiff compass phrasing', () => {
    for (const kind of ['directlyNextToObject', 'exactDistance'] as const) {
      const entry = GLOSSARY.find((e) => e.kinds.includes(kind))!
      expect(entry.example).not.toMatch(/to the (north|south|east|west) of/)
      expect(entry.keyword).not.toMatch(/to the (north|south|east|west)/)
    }
  })
})

describe('glossary examples are cards produced by the engine', () => {
  const exampleOf = (kind: string) => GLOSSARY.find((e) => e.kinds.some((k) => k === kind))!.example

  it('quotes the sentences of src/engine/clues/en.ts, not hand-written text', () => {
    expect(exampleOf('inRoom')).toBe('A was in the Kitchen.')
    expect(exampleOf('besideObject')).toBe('A stood next to a table. / B stood next to exactly one plant.')
    expect(exampleOf('roomHasGender')).toBe("There was at least one woman in A's room.")
    expect(exampleOf('directionOfObject')).toContain('C stood further west than a table.')
    expect(exampleOf('exactDistance')).toBe('A stood exactly two rows below B. / C stood exactly three columns left of D.')
    expect(exampleOf('aloneWithMurderer')).toBe(`${VICTIM_TEXT.sentence}`)
  })

  it('gives every example full sentences, each ending in a full stop', () => {
    for (const entry of GLOSSARY) {
      for (const sentence of entry.example.split(' / ')) {
        expect(sentence, entry.keyword).toMatch(/^[A-Z].*\.$/)
      }
    }
  })
})
