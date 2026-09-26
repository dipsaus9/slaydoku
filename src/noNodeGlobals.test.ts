import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * Regression: `export const MIN_WEIGHT = Number(process.env.MINW ?? 2)` in an engine module made the dev-only
 * lab (/lab) render blank, because `process` does not exist in the browser. Everything under src that the app
 * can import must stay free of node globals and node: imports. Tests, fixtures, slow suites and the CLI/main
 * entry points (run by bun, never bundled) are exempt.
 */
const ROOT = new URL('.', import.meta.url).pathname
const EXEMPT = /(\.test\.|\.testing\.|\.slow\.|\.fixture\.|\.scratch\.|\/cli\.ts$|\/main\.ts$|\/testing\.fixture\.ts$)/

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : /\.(ts|tsx)$/.test(name) ? [path] : []
  })
}

const isCode = (line: string) => !/^\s*(\/\/|\*|\/\*)/.test(line)

describe('browser-safe sources', () => {
  const sources = files(ROOT).filter((path) => !EXEMPT.test(path) && !path.endsWith('noNodeGlobals.test.ts'))

  it('scans a meaningful number of files', () => {
    expect(sources.length).toBeGreaterThan(100)
  })

  it('uses no process.* and no node: imports', () => {
    const offenders: string[] = []
    for (const path of sources) {
      readFileSync(path, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (isCode(line) && (/\bprocess\.(env|argv|exit|cwd|platform)\b/.test(line) || /from ['"]node:/.test(line) || /\brequire\(/.test(line))) {
            offenders.push(`${path.replace(ROOT, 'src/')}:${i + 1}: ${line.trim()}`)
          }
        })
    }
    expect(offenders).toEqual([])
  })
})
