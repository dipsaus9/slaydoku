import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Runs the real ignoreCommand of vercel.json in a shell: exit 0 = skip the build, exit 1 = build.
const { ignoreCommand } = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as {
  ignoreCommand: string
}

function exitCode(ref: string): number | null {
  return spawnSync('sh', ['-c', ignoreCommand], { env: { ...process.env, VERCEL_GIT_COMMIT_REF: ref } }).status
}

describe('vercel ignoreCommand', () => {
  it.each(['main', 'SLAY-17.8/preview-look-poc', 'SLAY-17.7/preview-check'])('builds %s', (ref) => {
    expect(exitCode(ref)).toBe(1)
  })

  it.each(['SLAY-17.1/room-rules-home', 'plan/SLAY-18', 'mainline', 'preview-x', 'SLAY-1.1/no-preview-here', ''])(
    'skips %s',
    (ref) => {
      expect(exitCode(ref)).toBe(0)
    },
  )
})
