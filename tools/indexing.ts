// The indexing switch: `bun tools/indexing.ts [status|on|off]`.
//   status  (default) print the mode and whether src/brand/site.json and vercel.json agree
//   on      make the site indexable: flag true, X-Robots-Tag noindex header removed from vercel.json
//   off     keep search engines out: flag false, noindex header back in vercel.json
// The robots meta tag, robots.txt and sitemap.xml follow the flag at build time. See src/brand/indexing.ts and docs/launch.md.
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { applyVercelHeader, parseIndexable, vercelSendsNoindex } from '../src/brand/indexing.ts'

const ROOT = resolve(import.meta.dir, '..')
export const SITE_JSON = join(ROOT, 'src/brand/site.json')
export const VERCEL_JSON = join(ROOT, 'vercel.json')

export interface IndexingState {
  indexable: boolean
  /** vercel.json sends the noindex header exactly when the flag is off. */
  headerAgrees: boolean
}

export function readState(): IndexingState {
  const indexable = parseIndexable(readFileSync(SITE_JSON, 'utf8'))
  return { indexable, headerAgrees: vercelSendsNoindex(readFileSync(VERCEL_JSON, 'utf8')) === !indexable }
}

export function setIndexable(indexable: boolean): void {
  writeFileSync(SITE_JSON, `${JSON.stringify({ indexable }, null, 2)}\n`)
  writeFileSync(VERCEL_JSON, applyVercelHeader(readFileSync(VERCEL_JSON, 'utf8'), indexable))
}

function main(argv: string[]): number {
  const command = argv[0] ?? 'status'
  if (command === 'on' || command === 'off') setIndexable(command === 'on')
  else if (command !== 'status') {
    console.error('usage: bun tools/indexing.ts [status|on|off]')
    return 2
  }
  const state = readState()
  console.log(`indexing: ${state.indexable ? 'ON (indexable)' : 'OFF (noindex)'}; vercel.json header ${state.headerAgrees ? 'agrees' : 'DISAGREES with the flag'}`)
  return state.headerAgrees ? 0 : 1
}

if ((import.meta as { main?: boolean }).main) process.exit(main(process.argv.slice(2)))
