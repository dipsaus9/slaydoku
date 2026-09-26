import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { serializeScene } from '../model/index.ts'
import { randomScene, rng } from '../solver/testing.fixture.ts'
import { parseGenerateArgs, resolveScene } from './cli.ts'
import { verifyPuzzle } from '../solver/index.ts'

describe('parseGenerateArgs', () => {
  it('reads scene, seed, victim (1-based) and out, in either flag style', () => {
    expect(parseGenerateArgs(['--scene', 'demo', '--seed', '7', '--victim', '5,2', '--out', 'p.json'])).toEqual({
      scene: 'demo',
      seed: 7,
      victimCell: { row: 4, col: 1 },
      out: 'p.json',
    })
    expect(parseGenerateArgs(['--scene=x.json', '--seed=0'])).toEqual({ scene: 'x.json', seed: 0 })
  })

  it('rejects missing, unknown and malformed arguments', () => {
    expect(() => parseGenerateArgs(['--seed', '1'])).toThrow(/--scene/)
    expect(() => parseGenerateArgs(['--scene', 'a'])).toThrow(/--seed/)
    expect(() => parseGenerateArgs(['--scene', 'a', '--seed', 'x'])).toThrow(/integer/)
    expect(() => parseGenerateArgs(['--scene', 'a', '--seed', '1', '--victim', '0,3'])).toThrow(/1-based/)
    expect(() => parseGenerateArgs(['--scene', 'a', '--seed', '1', '--victim', '3'])).toThrow(/row,col/)
    expect(() => parseGenerateArgs(['--scene', 'a', '--seed', '1', '--wat', '1'])).toThrow(/Unknown/)
    expect(() => parseGenerateArgs(['--scene', 'a', '--seed'])).toThrow(/Missing value/)
  })
})

describe('resolveScene', () => {
  const scene = randomScene(5, 2, rng(1))
  const noFile = () => {
    throw new Error('ENOENT')
  }

  it('prefers a built-in name, else reads a scene or puzzle file', () => {
    expect(resolveScene('house', { house: scene }, noFile)).toBe(scene)
    expect(resolveScene('a.json', {}, () => serializeScene(scene))).toEqual(scene)
    expect(resolveScene('p.json', {}, () => JSON.stringify({ scene, people: [] }))).toEqual(scene)
  })

  it('explains an unreadable or invalid scene', () => {
    expect(() => resolveScene('nope', { house: scene }, noFile)).toThrow(/Built-in scenes: house/)
    expect(() => resolveScene('bad.json', {}, () => '{"width":3}')).toThrow(/Invalid scene/)
  })
})

describe('bun run generate', () => {
  const bun = spawnSync('bun', ['--version'])
  const runnable = !bun.error && bun.status === 0

  it.skipIf(!runnable)('writes a puzzle file that passes verify, for a built-in and a JSON scene', () => {
    const dir = mkdtempSync(join(tmpdir(), 'generate-'))
    const sceneFile = join(dir, 'scene.json')
    writeFileSync(sceneFile, serializeScene(randomScene(9, 3, rng(4))))
    for (const args of [
      ['--scene', 'demo', '--seed', '3', '--victim', '9,7'],
      ['--scene', sceneFile, '--seed', '5'],
    ]) {
      const out = join(dir, 'puzzle.json')
      const run = spawnSync('bun', ['tools/generate.ts', ...args, '--out', out], { encoding: 'utf8' })
      expect(run.status, run.stderr).toBe(0)
      const text = readFileSync(out, 'utf8')
      expect(verifyPuzzle(text).ok).toBe(true)
      const verify = spawnSync('bun', ['tools/verify.ts', out], { encoding: 'utf8' })
      expect(verify.status, verify.stdout).toBe(0)
    }
  }, 60_000)

  it.skipIf(!runnable)('exits 2 on bad usage and 1 when no puzzle fits', () => {
    expect(spawnSync('bun', ['tools/generate.ts', '--seed', '1'], { encoding: 'utf8' }).status).toBe(2)
    expect(
      spawnSync('bun', ['tools/generate.ts', '--scene', 'demo', '--seed', '1', '--victim', '1,2'], { encoding: 'utf8' })
        .status,
    ).toBe(1)
  }, 30_000)
})
