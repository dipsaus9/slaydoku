import { expect, it } from 'vitest'
import { expertPuzzle, walkHints } from './hints.fixture.ts'

// Slow: the 9x9 expert fixture is built on the spot (about 22 s locally, more on CI) and would block the
// vitest worker long enough to time out its RPC in `bun run test`. Runs with `bun run test:slow`.
it('a full expert-tier walk never jumps ahead: every placement is the true cell (AC5)', () => {
  // Expert puzzles lean hardest on deduction()'s advanced-technique fallback (SLAY-8.3).
  const { wrong, status } = walkHints(expertPuzzle())
  expect(wrong).toEqual([])
  expect(status).toBe('solved')
}, 180_000)
