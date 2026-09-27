/// <reference types="node" />
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  RULES,
  allowedIdentity,
  auditHistory,
  auditTree,
  denyRules,
  formatHits,
  jpegMetadata,
  parseIdentity,
  pngMetadata,
  printableStrings,
  scanBinary,
  scanIdentity,
  scanText,
  type Identity,
} from './audit-personal.ts'

/*
 * The deny-list is base64 in audit-personal.ts, so this file does not spell a term out either: every sample below is derived
 * from the decoded rule it has to trigger.
 */
const decode = (text: string): string => Buffer.from(text, 'base64').toString('utf8')

/** A string the rule matches: its regex source without anchors and optional parts. */
const sampleFor = (encoded: string): string =>
  decode(encoded).replaceAll('\\b', '').replaceAll('[ _-]?', '').replace('[a-z0-9._-]+', 'x').replaceAll('?', '').replaceAll('\\', '')

const dirs: string[] = []
const tree = (files: Record<string, string | Uint8Array>): string => {
  const root = mkdtempSync(join(tmpdir(), 'audit-personal-'))
  dirs.push(root)
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(join(root, name, '..'), { recursive: true })
    writeFileSync(join(root, name), content)
  }
  return root
}
afterEach(() => {
  while (dirs.length > 0) rmSync(dirs.pop()!, { recursive: true, force: true })
})

/** A minimal PNG: signature, IHDR, optional extra chunk, IEND (checksums are not read by the audit). */
function png(extra?: { type: string; data: string }): Uint8Array {
  const chunk = (type: string, data: Uint8Array): number[] => [
    ...new Uint8Array(new Uint32Array([data.length]).buffer).reverse(),
    ...Buffer.from(type, 'latin1'),
    ...data,
    0, 0, 0, 0,
  ]
  return Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ...chunk('IHDR', new Uint8Array(13)),
    ...(extra ? chunk(extra.type, Buffer.from(extra.data, 'latin1')) : []),
    ...chunk('IEND', new Uint8Array(0)),
  ])
}

describe('the deny-list', () => {
  it('has rules, none of them stored in the clear', () => {
    expect(RULES.length).toBeGreaterThan(20)
    for (const [id, encoded] of RULES) {
      expect(encoded, id).toMatch(/^[A-Za-z0-9+/]+={0,2}$/)
      expect(decode(encoded).length, id).toBeGreaterThan(2)
    }
  })

  it.each(RULES.map(([id, encoded]) => [id, sampleFor(encoded)] as const))('%s: a text with its term is a hit, upper case too', (id, sample) => {
    for (const text of [`before ${sample} after`, `BEFORE ${sample.toUpperCase()} AFTER`]) {
      expect(scanText('a.txt', text).map((hit) => hit.rule), text).toContain(id)
    }
  })

  it('respects word boundaries for the short words', () => {
    for (const clean of ['a problem with robust code', 'differences and references', 'the joshua tree', 'candy is sweet']) {
      expect(scanText('a.txt', clean), clean).toEqual([])
    }
  })

  it('reports file and line', () => {
    const term = sampleFor(RULES[0]![1])
    const hits = scanText('src/a.ts', `fine\nalso fine\nhas ${term} in it`)
    expect(hits).toHaveLength(1)
    expect(formatHits(hits)[0]).toMatch(/^src\/a\.ts:3: \[[^\]]+\] .*/)
  })
})

describe('e-mail addresses', () => {
  // Built at run time: an address written out here would be a hit of this very repository.
  const address = (local: string, domain: string): string => [local, domain].join('@')

  it('fails on an address, but not on a noreply one', () => {
    expect(scanText('a.md', `write to ${address('someone', 'example.org')} please`).map((hit) => hit.rule)).toEqual(['email'])
    const allowed = [address('noreply', 'example.org'), address('no-reply', 'example.org'), address('12345+noreply', 'users.noreply.github.com')]
    expect(scanText('a.md', `from ${allowed.join(' and ')}`)).toEqual([])
  })
})

describe('auditTree', () => {
  it('passes a clean tree and counts its files', () => {
    const root = tree({ 'src/a.ts': 'export const a = 1\n', 'README.md': '# Hello\n' })
    expect(auditTree(root)).toEqual({ files: 2, hits: [] })
  })

  it('fails on a hit in any file and lists file:line', () => {
    const term = sampleFor(RULES[1]![1])
    const root = tree({ 'src/a.ts': 'ok\n', 'docs/notes.md': `# Notes\n\nfor ${term}\n` })
    const { hits } = auditTree(root)
    expect(formatHits(hits)).toEqual([expect.stringMatching(/^docs\/notes\.md:3: \[/)])
  })

  it('checks file names', () => {
    const root = tree({ [`docs/${sampleFor(RULES[2]![1])}.md`]: 'clean text' })
    expect(auditTree(root).hits.map((hit) => hit.rule).join()).toContain('(file name)')
  })

  it('scans dot-directories and dot-files, .git excepted', () => {
    const term = sampleFor(RULES[0]![1])
    const root = tree({ '.claude/settings.json': `{"note": "${term}"}`, '.github/workflows/ci.yml': `# ${term}`, '.env.example': `X=${term}`, '.git/config': term, 'src/a.ts': 'ok' })
    expect(auditTree(root).hits.map((hit) => hit.file).sort()).toEqual(['.claude/settings.json', '.env.example', '.github/workflows/ci.yml'])
  })

  it('skips node_modules, dist, .git and reports', () => {
    const term = sampleFor(RULES[0]![1])
    const root = tree({ 'node_modules/x/index.js': term, 'dist/a.js': term, '.git/config': term, 'reports/r.md': term, 'src/a.ts': 'ok' })
    expect(auditTree(root)).toEqual({ files: 1, hits: [] })
  })

  it('exits non-zero from the command line on a hit, zero on a clean tree', () => {
    const script = resolve(import.meta.dirname, 'audit-personal.ts')
    const dirty = tree({ 'a.txt': `has ${sampleFor(RULES[0]![1])}` })
    const bad = spawnSync('bun', [script, dirty], { encoding: 'utf8' })
    expect(bad.status).toBe(1)
    expect(bad.stderr).toMatch(/a\.txt:1: \[/)
    const good = spawnSync('bun', [script, tree({ 'a.txt': 'fine' })], { encoding: 'utf8' })
    expect(good.status).toBe(0)
    expect(good.stdout).toContain('0 hits')
  }, 30_000)

  it('finds no hit in this repository, its own deny-list included', () => {
    const { hits } = auditTree(resolve(import.meta.dirname, '..'))
    expect(formatHits(hits)).toEqual([])
  }, 60_000)
})

describe('binary files', () => {
  it('reads the printable strings of a binary', () => {
    expect(printableStrings(Uint8Array.from([0, 65, 66, 67, 68, 69, 0, 70, 71, 0]))).toEqual(['ABCDE'])
  })

  it('finds a term inside a binary, and none in a clean one', () => {
    const term = sampleFor(RULES[0]![1])
    const dirty = Uint8Array.from([0, 1, 2, ...Buffer.from(`meta ${term} meta`), 0, 3])
    expect(scanBinary('a.bin', dirty).map((hit) => hit.rule)).toContain(RULES[0]![0])
    expect(scanBinary('a.bin', Uint8Array.from([0, 1, 2, 3, 4, 5, ...Buffer.from('nothing here'), 0]))).toEqual([])
  })

  it('fails a PNG with a text or EXIF chunk, passes a plain one', () => {
    expect(pngMetadata(png())).toEqual([])
    expect(scanBinary('a.png', png())).toEqual([])
    expect(pngMetadata(png({ type: 'tEXt', data: 'Author\0someone' }))).toEqual(['tEXt'])
    expect(scanBinary('a.png', png({ type: 'eXIf', data: 'II*\0' })).map((hit) => hit.rule)).toEqual(['image-metadata'])
  })

  it('fails a JPEG with an EXIF segment, and metadata markers in any binary', () => {
    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0xff, 0xda])
    expect(jpegMetadata(jpeg)).toEqual(['APP1 (EXIF or XMP)'])
    expect(scanBinary('a.jpg', jpeg).map((hit) => hit.rule)).toContain('image-metadata')
    const xmp = Uint8Array.from([0, 0, ...Buffer.from('<x:xmpmeta xmlns:x="adobe:ns:meta/">'), 0])
    expect(scanBinary('a.webp', xmp).map((hit) => hit.rule)).toContain('image-metadata')
  })

  it('does not decode unknown file names as text: a binary by extension is scanned as strings', () => {
    const term = sampleFor(RULES[0]![1])
    const root = tree({ 'pic.png': Uint8Array.from([...png(), ...Buffer.from(`\0${term}\0`)]) })
    expect(auditTree(root).hits.length).toBeGreaterThan(0)
  })
})

describe('denyRules', () => {
  it('decodes every rule to a case-insensitive regular expression', () => {
    for (const { id, pattern } of denyRules()) {
      expect(pattern.flags, id).toBe('i')
    }
  })
})

describe('history', () => {
  /*
   * Every repository here is a temporary fixture. Terms and identities are derived from the decoded deny-list at run time, so this
   * file spells none out. The fixture ignores the user's global git config (hooks, signing, identity) and sets author and committer
   * per commit through the environment.
   */
  const TERM = sampleFor(RULES[0]![1])
  const OTHER_TERM = sampleFor(RULES[1]![1])
  const address = (local: string, domain: string): string => [local, domain].join('@')
  /** A neutral identity: no term, and a noreply address (the audit lets those through). */
  const NEUTRAL: Identity = { name: 'Fixture Person', email: address('fixture', 'users.noreply.example.org') }
  /** The "owner" of a fixture: a name that IS a deny-list term, and a real-looking address. */
  const OWNER: Identity = { name: `${TERM} Fixture`, email: address('owner', 'example.org') }
  const ISOLATED = { GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' }

  const git = (root: string, args: string[], env: Record<string, string> = {}): string => {
    const done = spawnSync('git', args, { cwd: root, encoding: 'utf8', env: { ...process.env, ...ISOLATED, ...env } })
    expect(done.status, `git ${args.join(' ')}: ${done.stderr}`).toBe(0)
    return done.stdout
  }
  const identityEnv = (who: Identity, committer: Identity = who): Record<string, string> => ({
    GIT_AUTHOR_NAME: who.name,
    GIT_AUTHOR_EMAIL: who.email,
    GIT_COMMITTER_NAME: committer.name,
    GIT_COMMITTER_EMAIL: committer.email,
  })
  const repo = (): string => {
    const root = mkdtempSync(join(tmpdir(), 'audit-history-'))
    dirs.push(root)
    git(root, ['init', '-q', '-b', 'main'])
    return root
  }
  /** Writes (string or bytes) or deletes (null) files, then commits everything. Returns the short sha of the new commit. */
  const commit = (root: string, files: Record<string, string | Uint8Array | null>, message: string, who: Identity = NEUTRAL, committer: Identity = who): string => {
    for (const [name, content] of Object.entries(files)) {
      if (content === null) rmSync(join(root, name), { force: true })
      else {
        mkdirSync(join(root, name, '..'), { recursive: true })
        writeFileSync(join(root, name), content)
      }
    }
    git(root, ['add', '-A'])
    git(root, ['commit', '-q', '--allow-empty', '-m', message], identityEnv(who, committer))
    return git(root, ['rev-parse', '--short=7', 'HEAD']).trim()
  }
  const rulesOf = (hits: { rule: string }[]): string[] => hits.map((hit) => hit.rule)

  it('passes a clean history and counts commits and file versions', () => {
    const root = repo()
    commit(root, { 'src/a.ts': 'export const a = 1\n' }, 'feat: a')
    commit(root, { 'src/a.ts': 'export const a = 2\n', 'README.md': '# Hi\n' }, 'feat: change a')
    const report = auditHistory(root, null)
    expect(report).toMatchObject({ commits: 2, blobs: 3, hits: [] })
  })

  it('fails on a term in a file of the history, with the commit and the file in the report', () => {
    const root = repo()
    commit(root, { 'src/a.ts': 'ok\n' }, 'feat: a')
    const sha = commit(root, { 'docs/notes.md': `# Notes\n\nfor ${TERM}\n` }, 'docs: notes')
    const { hits } = auditHistory(root, null)
    expect(formatHits(hits)).toEqual([expect.stringMatching(new RegExp(`^${sha}:docs/notes\\.md:3: \\[${RULES[0]![0]}\\]`))])
  })

  it('fails on a term in a file version that a later commit deleted (the tree is clean, the history is not)', () => {
    const root = repo()
    commit(root, { 'src/a.ts': 'ok\n', 'secret.txt': `key ${TERM}\n` }, 'feat: a')
    commit(root, { 'secret.txt': null }, 'chore: remove it')
    expect(auditTree(root).hits).toEqual([])
    const { hits } = auditHistory(root, null)
    expect(formatHits(hits)).toEqual([expect.stringMatching(/:secret\.txt:1: \[/)])
  })

  it('fails on an older version of a file that was overwritten, and on a term in a deleted file name', () => {
    const root = repo()
    commit(root, { 'a.txt': `first ${TERM}\n`, [`${OTHER_TERM}.txt`]: 'clean text\n' }, 'feat: a')
    commit(root, { 'a.txt': 'clean now\n', [`${OTHER_TERM}.txt`]: null }, 'fix: clean')
    expect(auditTree(root).hits).toEqual([])
    const rules = rulesOf(auditHistory(root, null).hits)
    expect(rules).toContain(RULES[0]![0])
    expect(rules.some((rule) => rule.endsWith('(file name)'))).toBe(true)
  })

  it('fails on a binary file with image metadata that a later commit deleted', () => {
    const root = repo()
    commit(root, { 'pic.png': png({ type: 'tEXt', data: 'Author\0someone' }) }, 'feat: image')
    commit(root, { 'pic.png': null }, 'chore: remove the image')
    expect(rulesOf(auditHistory(root, null).hits)).toContain('image-metadata')
  })

  it('fails on a term in a commit message, in the subject and in the body', () => {
    const root = repo()
    commit(root, { 'a.txt': 'ok\n' }, `feat: a for ${TERM}`)
    commit(root, { 'b.txt': 'ok\n' }, `feat: b\n\nthe body mentions ${OTHER_TERM}`)
    const { hits } = auditHistory(root, null)
    expect(hits.map((hit) => hit.file)).toEqual([expect.stringMatching(/^commit [0-9a-f]{7} message$/), expect.stringMatching(/^commit [0-9a-f]{7} message$/)])
    expect(rulesOf(hits).sort()).toEqual([RULES[0]![0], RULES[1]![0]].sort())
  })

  it('finds a hit on a branch that is not merged, and in an annotated tag message and a ref name', () => {
    const root = repo()
    commit(root, { 'a.txt': 'ok\n' }, 'feat: a')
    git(root, ['switch', '-q', '-c', `topic-${TERM}`])
    commit(root, { 'b.txt': `side ${OTHER_TERM}\n` }, 'feat: side')
    git(root, ['switch', '-q', 'main'])
    git(root, ['tag', '-a', 'v1', '-m', `release for ${TERM}`], identityEnv(NEUTRAL))
    const files = auditHistory(root, null).hits.map((hit) => hit.file)
    expect(files).toContain(`ref refs/heads/topic-${TERM}`)
    expect(files).toContain('ref refs/tags/v1 message')
    expect(files.some((file) => /^[0-9a-f]{7}:b\.txt$/.test(file))).toBe(true)
  })

  it('ignores commits that no ref reaches any more', () => {
    const root = repo()
    commit(root, { 'a.txt': 'ok\n' }, 'feat: a')
    git(root, ['switch', '-q', '-c', 'gone'])
    commit(root, { 'b.txt': `side ${TERM}\n` }, `feat: side ${TERM}`)
    git(root, ['switch', '-q', 'main'])
    git(root, ['branch', '-q', '-D', 'gone'])
    expect(auditHistory(root, null)).toMatchObject({ commits: 1, hits: [] })
  })

  describe('the allowed identity', () => {
    it('passes as author and committer of a commit, the one explicit allowance', () => {
      const root = repo()
      commit(root, { 'a.txt': 'ok\n' }, 'feat: a', OWNER)
      commit(root, { 'b.txt': 'ok\n' }, 'feat: b', OWNER, NEUTRAL)
      expect(auditHistory(root, OWNER).hits).toEqual([])
      // ... and without the allowance the very same history fails, name and address both.
      expect(rulesOf(auditHistory(root, null).hits)).toEqual(expect.arrayContaining([RULES[0]![0], 'email']))
    })

    it('does not pass another identity that contains a deny-list term', () => {
      const root = repo()
      const other: Identity = { name: `${OTHER_TERM} Someone`, email: address('someone', 'example.org') }
      commit(root, { 'a.txt': 'ok\n' }, 'feat: a', other)
      const { hits } = auditHistory(root, OWNER)
      expect(rulesOf(hits)).toEqual(expect.arrayContaining([RULES[1]![0], 'email']))
      expect(hits.every((hit) => /^commit [0-9a-f]{7} (author|committer)$/.test(hit.file))).toBe(true)
    })

    it('is the exact pair: the owner name with another address, or the address with another name, fails', () => {
      const root = repo()
      commit(root, { 'a.txt': 'ok\n' }, 'feat: a', { name: OWNER.name, email: address('else', 'example.org') })
      commit(root, { 'b.txt': 'ok\n' }, 'feat: b', { name: `${TERM} Else`, email: OWNER.email })
      const { hits } = auditHistory(root, OWNER)
      expect(hits.length).toBeGreaterThanOrEqual(2)
      // Author and committer are both that identity, so each of the two commits reports both fields.
      expect(new Set(hits.map((hit) => hit.file)).size).toBe(4)
    })

    it('does not cover a committer that differs from it', () => {
      const root = repo()
      commit(root, { 'a.txt': 'ok\n' }, 'feat: a', OWNER, { name: `${OTHER_TERM} Bot`, email: address('bot', 'example.org') })
      const { hits } = auditHistory(root, OWNER)
      expect(hits.length).toBeGreaterThan(0)
      expect(hits.every((hit) => /committer$/.test(hit.file))).toBe(true)
    })

    it('compares the address case-insensitively', () => {
      const root = repo()
      commit(root, { 'a.txt': 'ok\n' }, 'feat: a', { name: OWNER.name, email: OWNER.email.toUpperCase() })
      expect(auditHistory(root, OWNER).hits).toEqual([])
    })

    it('is metadata only: the same words in a message, a file or a trailer still fail', () => {
      const root = repo()
      commit(root, { 'a.txt': `written by ${OWNER.name}\n` }, `feat: a by ${OWNER.name}\n\nCo-authored-by: ${OWNER.name} <${OWNER.email}>`, OWNER)
      const { hits } = auditHistory(root, OWNER)
      expect(hits.map((hit) => hit.file.replace(/[0-9a-f]{7}/, 'sha')).sort()).toEqual(['commit sha message', 'commit sha message', 'commit sha message', 'sha:a.txt'])
      expect(rulesOf(hits)).toContain('email')
    })

    it('scanIdentity is the single place of the allowance', () => {
      expect(scanIdentity('x', OWNER, OWNER)).toEqual([])
      expect(scanIdentity('x', OWNER, null).length).toBeGreaterThan(0)
      expect(scanIdentity('x', OWNER, { name: OWNER.name, email: address('else', 'example.org') }).length).toBeGreaterThan(0)
      expect(scanIdentity('x', NEUTRAL, null)).toEqual([])
    })

    it('is read from AUDIT_ALLOWED_IDENTITY, else from the git config of the repository', () => {
      expect(parseIdentity(`${OWNER.name} <${OWNER.email}>`)).toEqual(OWNER)
      expect(parseIdentity('no address here')).toBeNull()
      expect(parseIdentity(undefined)).toBeNull()
      const root = repo()
      expect(allowedIdentity(root, { AUDIT_ALLOWED_IDENTITY: `${OWNER.name} <${OWNER.email}>` })).toEqual(OWNER)
      git(root, ['config', 'user.name', NEUTRAL.name])
      git(root, ['config', 'user.email', NEUTRAL.email])
      expect(allowedIdentity(root, {})).toEqual(NEUTRAL)
      // The variable wins over the config, and a variable that does not parse allows nobody.
      expect(allowedIdentity(root, { AUDIT_ALLOWED_IDENTITY: `${OWNER.name} <${OWNER.email}>` })).toEqual(OWNER)
      expect(allowedIdentity(root, { AUDIT_ALLOWED_IDENTITY: 'garbage' })).toBeNull()
    })
  })

  it('refuses a shallow clone, which would leave the history unchecked', () => {
    const root = repo()
    commit(root, { 'a.txt': 'ok\n' }, 'feat: a')
    commit(root, { 'b.txt': 'ok\n' }, 'feat: b')
    const clone = mkdtempSync(join(tmpdir(), 'audit-history-clone-'))
    dirs.push(clone)
    git(clone, ['clone', '-q', '--depth=1', `file://${root}`, 'shallow'])
    expect(() => auditHistory(join(clone, 'shallow'), null)).toThrow(/shallow/)
  })

  describe('from the command line', () => {
    const script = resolve(import.meta.dirname, 'audit-personal.ts')
    const run = (root: string, args: string[] = [], identity?: Identity) =>
      spawnSync('bun', [script, root, ...args], {
        encoding: 'utf8',
        env: { ...process.env, ...ISOLATED, AUDIT_ALLOWED_IDENTITY: identity ? `${identity.name} <${identity.email}>` : '' },
      })

    it('passes a clean tree and history, and says how much history it read', () => {
      const root = repo()
      commit(root, { 'a.txt': 'ok\n' }, 'feat: a')
      const done = run(root)
      expect(done.status).toBe(0)
      expect(done.stdout).toMatch(/history: 1 commits, 1 file versions, 1 refs/)
    }, 30_000)

    it('fails on a hit that only the history holds, and names it', () => {
      const root = repo()
      commit(root, { 'a.txt': `x ${TERM}\n` }, 'feat: a')
      commit(root, { 'a.txt': 'clean\n' }, 'fix: clean')
      const done = run(root)
      expect(done.status).toBe(1)
      expect(done.stderr).toMatch(/:a\.txt:1: \[/)
      expect(run(root, ['--tree-only']).status).toBe(0)
      expect(run(root, ['--history-only']).status).toBe(1)
    }, 30_000)

    it('lets the owner identity through as metadata and fails on it everywhere else', () => {
      const root = repo()
      commit(root, { 'a.txt': 'ok\n' }, 'feat: a', OWNER)
      expect(run(root, [], OWNER).status).toBe(0)
      expect(run(root).status).toBe(1)
      commit(root, { 'b.txt': 'ok\n' }, `feat: b for ${OWNER.name}`, OWNER)
      expect(run(root, [], OWNER).status).toBe(1)
    }, 30_000)
  })
})
