import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

/**
 * Slow specs: the per size and tier generator sweeps (`generator/scale/sweep.*.test.ts`, about 4 minutes) and
 * anything named `*.slow.test.ts` (e.g. the full pack re-verification). They are left out of `bun run test`
 * and run with `bun run test:slow` (`vitest run --mode slow`).
 */
const SLOW = ['**/sweep.*.test.ts', '**/*.slow.test.ts']

// https://vitest.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  test: {
    // A fresh scaffold has zero specs; verify must stay green until the first one lands.
    passWithNoTests: true,
    ...(mode === 'slow'
      ? { include: SLOW }
      : { exclude: [...configDefaults.exclude, ...SLOW] }),
  },
}))
