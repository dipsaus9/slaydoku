import { describe, expect, it } from 'vitest'
import { RELATIONAL_CLUE_TYPES, STRUCTURAL_CLUE_TYPES } from '../../engine/clues/index.ts'
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
    for (const word of ['naast', 'alleen', 'samen met', 'precies n', 'diagonaal', 'in de hoek', 'bij een raam']) {
      expect(words).toContain(word)
    }
  })
})

describe('glossary wording of the plan-side clues', () => {
  it('explains directly-next-to and exact-distance without the stiff compass phrasing', () => {
    for (const kind of ['directlyNextToObject', 'exactDistance'] as const) {
      const entry = GLOSSARY.find((e) => e.kinds.includes(kind))!
      expect(entry.example).not.toMatch(/ten (noorden|zuiden|oosten|westen) van/)
      expect(entry.keyword).not.toMatch(/ten (noorden|zuiden|oosten|westen)/)
    }
  })
})
