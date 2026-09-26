import { describe, expect, it } from 'vitest'
import { DUTCH_RE, DUTCH_WORDS, wordMatcher } from './dutch.ts'

/**
 * Guard against Dutch text creeping back into the game code (the project started from a Dutch prototype).
 *
 * How it works: every source file under src/engine, src/game, src/validation and src/content (tests, fixtures and JSON
 * data included) is read as text; only the contents of string literals ('...', "...", `...`) and the string values of
 * JSON files are searched, so identifiers and comments cannot trip it. A hit is a whole word from `DUTCH_WORDS`,
 * case-insensitive, and only words that are not English (and not names) are on that list, so "was" and "van" are not.
 *
 * Skipped on purpose:
 * - this test and `dutch.ts` (they ARE the list);
 * - src/content/help: the help card and legend are interface text, which story SLAY-1.2 (English interface) translates.
 *   Remove the entry from `SKIPPED` when that story lands.
 * UI text under src/ui and src/pwa is not scanned: it belongs to SLAY-1.2 as well.
 */
const SCANNED = ['../engine/', '../game/', '../validation/', '../content/']
const SKIPPED = [/\/validation\/dutch(\.test)?\.ts$/, /\/content\/help\//]

const modules = import.meta.glob(['../engine/**/*.{ts,tsx,json}', '../game/**/*.{ts,tsx,json}', '../validation/**/*.{ts,tsx,json}', '../content/**/*.{ts,tsx,json}'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const files = Object.entries(modules).filter(([path]) => SCANNED.some((dir) => path.startsWith(dir)) && !SKIPPED.some((re) => re.test(path)))

/**
 * Comments and string literals of a TypeScript source in one pass, so that a quote inside a comment is not taken for a
 * string and a "//" inside a string is not taken for a comment. Single, double and template quotes; escapes respected.
 */
const TOKEN_RE = /\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\[\s\S])*`/g

/** The text a file holds as strings: literals of code files, string values (and no keys) of JSON files. */
function strings(path: string, source: string): string[] {
  if (path.endsWith('.json')) {
    const out: string[] = []
    JSON.parse(source, (_key, value: unknown) => {
      if (typeof value === 'string') out.push(value)
      return value
    })
    return out
  }
  return (source.match(TOKEN_RE) ?? []).filter((token) => !token.startsWith('/*') && !token.startsWith('//'))
}

describe('no Dutch text is left in the game code', () => {
  it('scans a healthy number of files', () => {
    expect(files.length).toBeGreaterThan(150)
    expect(files.some(([path]) => path.endsWith('/clues/en.ts'))).toBe(true)
    expect(files.some(([path]) => path.endsWith('/content/themes/home.ts'))).toBe(true)
    expect(files.some(([path]) => path.endsWith('/content/demo/puzzle.json'))).toBe(true)
  })

  it('finds no Dutch word in any string literal of src/engine, src/game, src/validation or src/content', () => {
    const hits: string[] = []
    for (const [path, source] of files) {
      for (const text of strings(path, source)) {
        const found = DUTCH_RE.exec(text)?.[0]
        if (found) hits.push(`${path}: "${found}" in ${text.length > 80 ? `${text.slice(0, 80)}...` : text}`)
      }
    }
    expect(hits).toEqual([])
  })

  describe('the matcher itself', () => {
    it('catches Dutch clue text and hint text', () => {
      for (const text of ['A stond naast een tafel.', 'Zet A op rij 3, kolom 4.', 'Het cadeau was alleen met de dader.', 'in de Keuken', "'t Hoekje is een kamer"]) {
        expect(DUTCH_RE.test(text), text).toBe(true)
      }
    })

    it('leaves English alone, including English words that look Dutch and cast names', () => {
      for (const text of [
        'Alice stood next to a table.',
        'There was at least one woman in the same room.',
        'Place Alice on row 3, column 4.',
        'A was with B in the Kitchen.',
        'delivery van',
        'Ties, Els, Bas and Cor',
        'de-DE',
        'demo',
      ]) {
        expect(DUTCH_RE.test(text), text).toBe(false)
      }
    })

    it('matches whole words only', () => {
      expect(wordMatcher(['de']).test('demo decision')).toBe(false)
      expect(wordMatcher(['de']).test('a de b')).toBe(true)
    })

    it('keeps the list small and free of words that are English too', () => {
      expect(DUTCH_WORDS.length).toBeLessThan(80)
      for (const english of ['was', 'van', 'die', 'met', 'want', 'over', 'ten', 'for', 'in', 'on', 'is']) expect(DUTCH_WORDS).not.toContain(english)
    })
  })
})
