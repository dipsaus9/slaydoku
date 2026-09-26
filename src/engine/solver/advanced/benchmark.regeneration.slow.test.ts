import { expect, it } from 'vitest'
import { parsePuzzle, serializePuzzle } from '../../model/index.ts'
import { generateScene } from '../../scenegen/index.ts'
import { generateAdvanced } from './index.ts'
import hardHome1 from './fixtures/hard-16x16-home-1.json?raw'

/**
 * Slow (`bun run test:slow`): the first 16x16 fixture of `benchmark.test.ts` is regenerated from its seed and must come out byte for byte.
 * It takes about two minutes of solver time in one synchronous test, which is why it is not part of `bun run test`.
 */
it('regenerates a 16x16 fixture from its seed, byte for byte', { timeout: 15 * 60_000 }, () => {
  const parsed = parsePuzzle(hardHome1)
  if (!parsed.ok) throw new Error(parsed.issues.map((i) => i.message).join('; '))
  const scene = generateScene({ width: 16, height: 16, theme: 'home', seed: 1 })
  const again = generateAdvanced(scene, { seed: 1, target: 'hard' })
  expect(serializePuzzle(again.puzzle)).toBe(serializePuzzle(parsed.value))
})
