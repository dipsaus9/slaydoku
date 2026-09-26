import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The dev server gives every .tsx module a React Refresh preamble that reads `window`, which a
 * worker does not have (the lab broke this way once). So nothing the worker imports, directly or
 * further down, may be a .tsx file.
 */
function importsOf(file: string): string[] {
  const text = readFileSync(file, 'utf8')
  const found = [...text.matchAll(/(?:import|export)[^'"]*?from\s+['"](\.[^'"]+)['"]|import\s+['"](\.[^'"]+)['"]/g)]
  return found
    .map((m) => (m[1] ?? m[2])!)
    .filter((spec) => /\.(ts|tsx)$/.test(spec))
    .map((spec) => resolve(dirname(file), spec))
    .filter((path) => existsSync(path))
}

function closure(entry: string): string[] {
  const seen = new Set<string>()
  const todo = [entry]
  while (todo.length > 0) {
    const file = todo.pop()!
    if (seen.has(file)) continue
    seen.add(file)
    todo.push(...importsOf(file))
  }
  return [...seen]
}

describe('generator worker', () => {
  it('imports no .tsx module', () => {
    const files = closure(resolve(import.meta.dirname, 'generate.worker.ts'))
    expect(files.length).toBeGreaterThan(20)
    expect(files.filter((file) => file.endsWith('.tsx'))).toEqual([])
  })
})
