import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import react from '@vitejs/plugin-react'
import { build, defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { parseIndexable } from './src/brand/indexing.ts'
import { siteMetaPlugin } from './src/brand/site.ts'
import type { PrecacheEntry } from './src/pwa/cache.ts'

/** Files of the build output that stay out of the precache: the worker itself and files only crawlers or nothing in the app read. */
const NOT_PRECACHED = /^(sw\.js|robots\.txt|sitemap\.xml|og-image\.png)$/

/**
 * Size budget of the whole precache (raw bytes). The app alone is about 0.5 MiB; the rest is the schedule: one lazily loaded chunk per month
 * (about 45 KB a week, 0.65 MiB for the first 120 days), and all of them are precached so any scheduled day works offline. Raised from 3 to 6 MiB
 * in SLAY-1.5 for that growth (a 90 day top-up adds about 0.5 MiB, so 6 MiB lasts roughly two years of schedule). The build fails above it;
 * raise it on purpose, or stop precaching months that are already past (they are never shown again: there is no archive).
 */
const PRECACHE_BUDGET_BYTES = 6 * 1024 * 1024

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? listFiles(path) : [path]
  })
}

/**
 * Offline support. After the app is written, lists every file of the build (HTML, hashed assets,
 * pack chunks, icons, manifest) with a content hash and bundles src/pwa/sw.ts into `dist/sw.js` with that
 * list embedded. The list is the cache version: any changed file changes sw.js, which is what makes the
 * browser install the new worker on the next visit. Build only; `bun run dev` has no worker.
 */
function swPlugin(): Plugin {
  let outDir = 'dist'
  let root = process.cwd()
  return {
    name: 'slaydoku-sw',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
      root = config.root
    },
    async writeBundle() {
      const entries: PrecacheEntry[] = listFiles(outDir)
        .map((path) => relative(outDir, path).split(sep).join('/'))
        .filter((file) => !NOT_PRECACHED.test(file))
        .sort()
        .map((file) => ({ url: `/${file}`, revision: createHash('sha256').update(readFileSync(join(outDir, file))).digest('hex').slice(0, 16) }))
      const total = entries.reduce((sum, entry) => sum + statSync(join(outDir, entry.url)).size, 0)
      if (total > PRECACHE_BUDGET_BYTES) {
        throw new Error(`precache is ${total} bytes, over the budget of ${PRECACHE_BUDGET_BYTES}: raise PRECACHE_BUDGET_BYTES in vite.config.ts or drop files`)
      }
      await build({
        root,
        configFile: false,
        publicDir: false,
        logLevel: 'warn',
        define: { __PRECACHE__: JSON.stringify(entries) },
        build: {
          outDir,
          emptyOutDir: false,
          copyPublicDir: false,
          target: 'es2022',
          lib: { entry: join(root, 'src/pwa/sw.ts'), formats: ['iife'], name: 'slaydokuSw', fileName: () => 'sw.js' },
        },
      })
    },
  }
}

/** The indexing switch (src/brand/site.json, docs/launch.md): false keeps search engines out. */
const INDEXABLE = parseIndexable(readFileSync(join(import.meta.dirname, 'src/brand/site.json'), 'utf8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), siteMetaPlugin(process.env, INDEXABLE), swPlugin()],
})
