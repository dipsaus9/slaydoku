import { describe, expect, it } from 'vitest'
import { DUTCH_RE, DUTCH_WORDS, wordMatcher } from './dutch.ts'

/**
 * Guard against Dutch text creeping back into the game code (the project started from a Dutch prototype).
 *
 * How it works: every source file under src/engine, src/game, src/validation, src/content, src/ui, src/pwa and src/brand,
 * plus the top-level src/*.ts(x) files (tests, fixtures and JSON data included), is read as text. Only the contents of
 * string literals ('...', "...", `...`), the string values of JSON files and the text between the tags of JSX are
 * searched, so identifiers and comments cannot trip it. A hit is a whole word from `DUTCH_WORDS`, case-insensitive, and
 * only words that are not English (and not names) are on that list, so "was" and "van" are not.
 *
 * Skipped on purpose: this test and `dutch.ts` (they ARE the list). Nothing else is skipped: the help card and legend
 * (src/content/help) and all interface text under src/ui and src/pwa are English since SLAY-1.2.
 */
const SCANNED = ['../engine/', '../game/', '../validation/', '../content/', '../ui/', '../pwa/', '../brand/', '../App.tsx', '../main.tsx']
const SKIPPED = [/\/validation\/dutch(\.test)?\.ts$/]

const modules = import.meta.glob(
  [
    '../engine/**/*.{ts,tsx,json}',
    '../game/**/*.{ts,tsx,json}',
    '../validation/**/*.{ts,tsx,json}',
    '../content/**/*.{ts,tsx,json}',
    '../ui/**/*.{ts,tsx,json}',
    '../pwa/**/*.{ts,tsx,json}',
    '../brand/**/*.{ts,tsx,json}',
    '../*.{ts,tsx}',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

const files = Object.entries(modules).filter(([path]) => SCANNED.some((dir) => path.startsWith(dir)) && !SKIPPED.some((re) => re.test(path)))

/**
 * Comments and string literals of a TypeScript source in one pass, so that a quote inside a comment is not taken for a
 * string and a "//" inside a string is not taken for a comment. Single, double and template quotes; escapes respected.
 */
const TOKEN_RE = /\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\[\s\S])*`/g

/** Text between the tags of JSX (`<p>Some text</p>`), which is not a string literal; `=>` and `->` are not tag ends. */
const JSX_TEXT_RE = /(?<![=-])>([^<>{}\n]*\p{L}[^<>{}\n]*)</gu

/** The text a file holds as strings: literals of code files, string values (and no keys) of JSON files, JSX text of .tsx files. */
function strings(path: string, source: string): string[] {
  if (path.endsWith('.json')) {
    const out: string[] = []
    JSON.parse(source, (_key, value: unknown) => {
      if (typeof value === 'string') out.push(value)
      return value
    })
    return out
  }
  const literals = (source.match(TOKEN_RE) ?? []).filter((token) => !token.startsWith('/*') && !token.startsWith('//'))
  if (!path.endsWith('.tsx')) return literals
  // JSX text is looked for outside comments only: blank the comments and strings first.
  const code = source.replace(TOKEN_RE, (token) => ' '.repeat(token.length))
  return [...literals, ...[...code.matchAll(JSX_TEXT_RE)].map((m) => m[1]!)]
}

describe('no Dutch text is left in the game code', () => {
  it('scans a healthy number of files', () => {
    expect(files.length).toBeGreaterThan(250)
    expect(files.some(([path]) => path.endsWith('/clues/en.ts'))).toBe(true)
    expect(files.some(([path]) => path.endsWith('/content/themes/home.ts'))).toBe(true)
    expect(files.some(([path]) => path.endsWith('/content/demo/puzzle.json'))).toBe(true)
    // interface text (SLAY-1.2)
    for (const end of ['/content/help/help.ts', '/ui/play/strings.ts', '/ui/daily/strings.ts', '/ui/lab/strings.ts', '/ui/play/glossary.ts', '/pwa/strings.ts', '/ui/play/Toolbar.tsx']) {
      expect(files.some(([path]) => path.endsWith(end)), end).toBe(true)
    }
  })

  it('finds no Dutch word in any string literal or JSX text of src/engine, src/game, src/validation, src/content, src/ui, src/pwa or src/brand', () => {
    const hits: string[] = []
    for (const [path, source] of files) {
      for (const text of strings(path, source)) {
        const found = DUTCH_RE.exec(text)?.[0]
        if (found) hits.push(`${path}: "${found}" in ${text.length > 80 ? `${text.slice(0, 80)}...` : text}`)
      }
    }
    expect(hits).toEqual([])
  })

  it('finds no Dutch word in index.html or the web manifest', () => {
    const pages = import.meta.glob(['../../index.html', '../../public/manifest.webmanifest'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>
    expect(Object.keys(pages)).toHaveLength(2)
    for (const [path, source] of Object.entries(pages)) {
      // tags and attribute values alike: the visible text, description, og tags and manifest values
      const text = path.endsWith('.html') ? source.replace(/<!--[\s\S]*?-->/g, ' ') : source
      expect(DUTCH_RE.exec(text)?.[0], path).toBeUndefined()
    }
    expect(pages['../../index.html']).toContain('<html lang="en">')
    expect(pages['../../index.html']).toContain('property="og:locale" content="en_US"')
    expect(JSON.parse(pages['../../public/manifest.webmanifest']!).lang).toBe('en')
  })

  it('catches Dutch text in JSX', () => {
    const jsx = 'export const A = () => <p>Sluit het bord</p>'
    expect(strings('x.tsx', jsx).map((t) => DUTCH_RE.test(t))).toContain(true)
    expect(strings('x.tsx', 'const f = (a: number) => a > 1 ? <b>Close</b> : null').some((t) => DUTCH_RE.test(t))).toBe(false)
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
        'Solved! Reload, Legend and Keywords',
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
      expect(DUTCH_WORDS.length).toBeLessThan(120)
      for (const english of ['was', 'van', 'die', 'met', 'want', 'over', 'ten', 'for', 'in', 'on', 'is']) expect(DUTCH_WORDS).not.toContain(english)
    })
  })
})
