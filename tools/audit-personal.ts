// Personal-data audit: `bun run audit:personal [dir] [--tree-only | --history-only]` (default: the repo root, tree and history).
// TREE: scans every file of the working tree except node_modules, dist, .git and reports/ for a deny-list of personal terms, for
// e-mail addresses that are not on the allow-list, and for metadata in images (EXIF, XMP, GPS, PNG text chunks). Binary files
// are searched through the printable strings they contain.
// HISTORY (when the directory is a git repository): the same rules over every commit message, every ref name and annotated tag
// message, every file NAME that ever existed and every file VERSION (blob) reachable from any ref (`git log --all`, `git rev-list
// --objects --all`, one `git cat-file --batch` pass), so a term deleted in a later commit is still found. Cost: one scan per unique
// blob, linear in the size of the history (about a second per 10 MB of text); see docs/launch.md. A shallow clone is refused (it
// would silently skip history): fetch it in full.
// The ONE allowance: the author and committer fields of a commit (name and e-mail, as a pair) may be the owner's identity. It is
// read from the repository's git config (user.name, user.email) at run time or from AUDIT_ALLOWED_IDENTITY ("Name <e-mail>"),
// never written into the tree, and it applies to those metadata fields only: a message, a ref or a file that holds the same words is a hit.
// Prints `file:line: [rule] excerpt` per hit and exits 1 when there is any.
// `bun tools/audit-personal.ts --encode <regex>` prints the base64 of a new deny-list pattern to paste into RULES.
//
// The deny-list is stored base64-encoded on purpose: this file is scanned like every other file of the tree (there is no
// path exemption), and it must not match its own terms. A pattern here is `[rule id, base64 of a case-insensitive regex source]`.
// The test (audit-personal.test.ts) builds its own hits from the decoded list, so it does not spell a term out either.
import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

/** `[rule id, base64 of the regex source]`, matched case-insensitively, word boundaries (`\b`) where the term is a short word. */
export const RULES: readonly (readonly [string, string])[] = [
  ['name-1', 'ZGVubmlz'],
  ['name-2', 'XGJyb215XGI='],
  ['name-3', 'XGJqb3NcYg=='],
  ['name-4', 'XGJkaWFuYVxi'],
  ['name-5', 'XGJpbmR5XGI='],
  ['name-6', 'XGJyZW5zXGI='],
  ['name-7', 'Y2Fyb2xpbmU='],
  ['name-8', 'XGJyb2JcYg=='],
  ['surname', 'c3BpZXJlbmJ1cmc='],
  ['mail-provider', 'aG90bWFpbA=='],
  ['account', 'ZGlwc2F1czk='],
  ['old-project', 'Y2FkZWF1a28='],
  ['sign-off', 'XGJsaWVmc1xi'],
  ['date-word', 'XGJva3RvYmVyXGI='],
  ['room-1', 'em9sZGVy'],
  ['room-2', 'ZWVyc3RlWyBfLV0/dmVyZGllcGluZw=='],
  ['room-3', 'YmVnYW5lWyBfLV0/Z3JvbmQ='],
  ['room-4', 'd2FzaG9r'],
  ['room-5', 'b3Zlcmxvb3A='],
  ['room-6', 'c2xhYXBob2Vr'],
  ['greeting', 'Z2VmZWxpY2l0ZWVyZA=='],
  ['context-1', 'Z2lybGZyaWVuZA=='],
  ['context-2', 'ZnJldW5kaW4='],
  ['context-3', 'YmlydGhkYXk='],
  ['context-4', 'dmVyamFhcmRhZw=='],
  ['home-path', 'L3VzZXJzL1thLXowLTkuXy1dKw=='],
  ['scratch-path', 'c2NyYXRjaHBhZA=='],
  ['tool-path', 'XC5jbGF1ZGUvcHJvamVjdHM='],
]

const decode = (text: string): string => Buffer.from(text, 'base64').toString('utf8')

/** The deny-list as regular expressions, decoded. */
export function denyRules(): { id: string; pattern: RegExp }[] {
  return RULES.map(([id, encoded]) => ({ id, pattern: new RegExp(decode(encoded), 'i') }))
}

/** E-mail addresses that contain one of these in the local part or the domain are fine (nobody to reply to). */
export const ALLOWED_EMAIL_MARKERS: readonly string[] = ['noreply', 'no-reply']
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g

const SKIPPED_DIRS = new Set(['node_modules', 'dist', '.git', 'reports'])
const BINARY_EXTENSIONS = /\.(png|jpe?g|gif|webp|ico|bmp|avif|pdf|woff2?|ttf|otf|eot|zip|gz|mp3|mp4|mov|webm|wasm)$/i

export interface Hit {
  /** Path relative to the audited root, with `/` separators. */
  file: string
  /** 1-based line for text files; 0 for a whole binary file. */
  line: number
  rule: string
  excerpt: string
}

const excerptOf = (text: string, index: number, length: number): string =>
  text.slice(Math.max(0, index - 20), index + length + 20).replace(/\s+/g, ' ').trim()

/** Hits of one text: the deny-list per line, and e-mail addresses that are not allowed. */
export function scanText(file: string, text: string, rules = denyRules()): Hit[] {
  const hits: Hit[] = []
  text.split(/\r?\n/).forEach((line, i) => {
    for (const { id, pattern } of rules) {
      const found = pattern.exec(line)
      if (found) hits.push({ file, line: i + 1, rule: id, excerpt: excerptOf(line, found.index, found[0].length) })
    }
    for (const match of line.matchAll(EMAIL)) {
      const address = match[0].toLowerCase()
      if (!ALLOWED_EMAIL_MARKERS.some((marker) => address.includes(marker))) {
        hits.push({ file, line: i + 1, rule: 'email', excerpt: excerptOf(line, match.index, match[0].length) })
      }
    }
  })
  return hits
}

/** Runs of at least `min` printable ASCII characters, the way `strings` finds them. */
export function printableStrings(bytes: Uint8Array, min = 4): string[] {
  const out: string[] = []
  let run = ''
  for (const byte of bytes) {
    if (byte >= 0x20 && byte < 0x7f) run += String.fromCharCode(byte)
    else {
      if (run.length >= min) out.push(run)
      run = ''
    }
  }
  if (run.length >= min) out.push(run)
  return out
}

/** PNG chunk types that carry text or camera data. */
const PNG_METADATA_CHUNKS = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf'])

/** Metadata chunks of a PNG, by walking its chunk list. */
export function pngMetadata(bytes: Uint8Array): string[] {
  const found: string[] = []
  let offset = 8
  while (offset + 8 <= bytes.length) {
    const length = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0)
    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8))
    if (PNG_METADATA_CHUNKS.has(type)) found.push(type)
    offset += 12 + length
  }
  return found
}

/** Metadata segments of a JPEG: APP1 (EXIF, XMP), APP13 (Photoshop) and comments. */
export function jpegMetadata(bytes: Uint8Array): string[] {
  const found: string[] = []
  let offset = 2
  while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1] as number
    if (marker === 0xda) break
    const length = ((bytes[offset + 2] as number) << 8) | (bytes[offset + 3] as number)
    if (marker === 0xe1) found.push('APP1 (EXIF or XMP)')
    else if (marker === 0xed) found.push('APP13 (Photoshop)')
    else if (marker === 0xfe) found.push('comment')
    offset += 2 + length
  }
  return found
}

const isPng = (bytes: Uint8Array): boolean => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
const isJpeg = (bytes: Uint8Array): boolean => bytes[0] === 0xff && bytes[1] === 0xd8

const RAW_METADATA = /<x:xmpmeta|ns\.adobe\.com\/xap|\bGPS[A-Z]|Exif\0\0|photoshop 3\.0/i

/** Hits of one binary file: the deny-list over its printable strings, and image metadata. */
export function scanBinary(file: string, bytes: Uint8Array, rules = denyRules()): Hit[] {
  const hits: Hit[] = []
  for (const run of printableStrings(bytes)) {
    for (const hit of scanText(file, run, rules)) hits.push({ ...hit, line: 0 })
    const raw = RAW_METADATA.exec(run)
    if (raw) hits.push({ file, line: 0, rule: 'image-metadata', excerpt: raw[0] })
  }
  const chunks = isPng(bytes) ? pngMetadata(bytes) : isJpeg(bytes) ? jpegMetadata(bytes) : []
  for (const chunk of chunks) hits.push({ file, line: 0, rule: 'image-metadata', excerpt: `${chunk} chunk` })
  return hits
}

function isBinary(path: string, bytes: Uint8Array): boolean {
  if (BINARY_EXTENSIONS.test(path)) return true
  return bytes.subarray(0, 8000).includes(0)
}

/** Every file below `root` that the audit covers, as absolute paths. */
export function auditedFiles(root: string): string[] {
  const out: string[] = []
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir).sort()) {
      if (SKIPPED_DIRS.has(name)) continue
      const path = join(dir, name)
      const stat = statSync(path)
      if (stat.isDirectory()) walk(path)
      else if (stat.isFile()) out.push(path)
    }
  }
  walk(root)
  return out
}

/** Audits a whole tree. */
export function auditTree(root: string): { files: number; hits: Hit[] } {
  const rules = denyRules()
  const files = auditedFiles(root)
  const hits: Hit[] = []
  for (const path of files) {
    const bytes = readFileSync(path)
    const rel = relative(root, path).split(sep).join('/')
    // The file NAME is audited too: a personal name in a path is as good as one in the text.
    hits.push(...scanText(rel, rel.replaceAll('/', ' '), rules).map((hit) => ({ ...hit, line: 0, rule: `${hit.rule} (file name)` })))
    hits.push(...(isBinary(path, bytes) ? scanBinary(rel, bytes, rules) : scanText(rel, bytes.toString('utf8'), rules)))
  }
  return { files: files.length, hits }
}

// --- history -----------------------------------------------------------------------------------

/** The one identity that may appear as author or committer of a commit. */
export interface Identity {
  name: string
  email: string
}

/** Parses `Name <e-mail>`; null when it is not of that shape. */
export function parseIdentity(text: string | undefined): Identity | null {
  const found = /^\s*(.+?)\s*<([^<>\s]+)>\s*$/.exec(text ?? '')
  return found ? { name: found[1] as string, email: found[2] as string } : null
}

interface GitResult {
  ok: boolean
  out: Buffer
  err: string
}

/** Runs git in `root`; `input` goes to its stdin (only used for cat-file --batch). Output is capped high enough for one batch. */
function git(root: string, args: string[], input?: Buffer, env?: Record<string, string>): GitResult {
  const done = spawnSync('git', ['-C', root, ...args], { input, maxBuffer: 1 << 30, env: { ...process.env, ...env } })
  return { ok: done.status === 0, out: done.stdout ?? Buffer.alloc(0), err: (done.stderr ?? Buffer.alloc(0)).toString('utf8') }
}

/** Is `root` the top of a git repository (or inside one)? */
export function isGitRepository(root: string): boolean {
  return git(root, ['rev-parse', '--git-dir']).ok
}

/** The allowed commit identity: AUDIT_ALLOWED_IDENTITY when set, else the repository's own user.name and user.email, else none. */
export function allowedIdentity(root: string, env: Record<string, string | undefined> = process.env): Identity | null {
  if (env.AUDIT_ALLOWED_IDENTITY) return parseIdentity(env.AUDIT_ALLOWED_IDENTITY)
  const name = git(root, ['config', 'user.name']).out.toString('utf8').trim()
  const email = git(root, ['config', 'user.email']).out.toString('utf8').trim()
  return name && email ? { name, email } : null
}

const sameIdentity = (a: Identity, b: Identity | null): boolean => b !== null && a.name === b.name && a.email.toLowerCase() === b.email.toLowerCase()

/** Hits of one identity (author, committer or tagger fields); the allowed identity, name AND e-mail exactly, is the only exception. */
export function scanIdentity(where: string, who: Identity, allowed: Identity | null, rules = denyRules()): Hit[] {
  if (sameIdentity(who, allowed)) return []
  return [...scanText(where, who.name, rules), ...scanText(where, who.email, rules)].map((hit) => ({ ...hit, line: 0 }))
}

export interface HistoryReport {
  commits: number
  /** Unique file versions (blobs) scanned. */
  blobs: number
  refs: number
  hits: Hit[]
}

const short = (sha: string): string => sha.slice(0, 7)
const RECORD = '\x01'
const FIELD = '\x00'
// git format placeholders (%xNN in log, %NN in for-each-ref) for the same two separators: an argument cannot hold a NUL byte.
const F = '%x00'
const R = '%x01'

/** Audits everything reachable from any ref of the repository at `root`. Throws when git fails or the clone is shallow. */
export function auditHistory(root: string, allowed: Identity | null = allowedIdentity(root)): HistoryReport {
  const run = (args: string[], input?: Buffer): Buffer => {
    const done = git(root, args, input)
    if (!done.ok) throw new Error(`git ${args[0]} failed: ${done.err.trim()}`)
    return done.out
  }
  if (run(['rev-parse', '--is-shallow-repository']).toString('utf8').trim() === 'true') {
    throw new Error('shallow clone: the history is incomplete, so it cannot be audited (fetch it in full, in CI: fetch-depth: 0)')
  }
  const rules = denyRules()
  const hits: Hit[] = []

  // Commits: identities (metadata, with the one allowance) and the message (content, no allowance).
  const log = run(['log', '--all', '--no-mailmap', `--format=${R}%H${F}%an${F}%ae${F}%cn${F}%ce${F}%B`]).toString('utf8')
  const records = log.split(RECORD).filter((r) => r.length > 0)
  for (const record of records) {
    const [sha = '', an = '', ae = '', cn = '', ce = '', ...rest] = record.split(FIELD)
    const message = rest.join(FIELD)
    hits.push(...scanIdentity(`commit ${short(sha)} author`, { name: an, email: ae }, allowed, rules))
    hits.push(...scanIdentity(`commit ${short(sha)} committer`, { name: cn, email: ce }, allowed, rules))
    hits.push(...scanText(`commit ${short(sha)} message`, message, rules))
  }

  // Refs: names, and the message and tagger of annotated tags.
  const refLines = run(['for-each-ref', `--format=%(refname)%00%(objecttype)%00%(taggername)%00%(taggeremail)%00%(contents)%01`]).toString('utf8')
  let refs = 0
  for (const record of refLines.split(RECORD).filter((r) => r.trim().length > 0)) {
    refs++
    const [name = '', type = '', taggerName = '', taggerEmail = '', ...rest] = record.trim().split(FIELD)
    hits.push(...scanText(`ref ${name}`, name, rules))
    // A branch's contents are its tip commit's message (already scanned above); only an annotated tag has a message of its own.
    if (type === 'tag') hits.push(...scanText(`ref ${name} message`, rest.join(FIELD), rules))
    if (type === 'tag' && (taggerName || taggerEmail)) hits.push(...scanIdentity(`ref ${name} tagger`, { name: taggerName, email: taggerEmail.replace(/^<|>$/g, '') }, allowed, rules))
  }

  // Every path that ever existed (names are audited like in the tree), and which commit first shows each blob (for the report).
  const raw = run(['log', '--all', '--root', '-m', '--no-renames', '--no-abbrev', '--raw', '-z', `--format=${R}%H`]).toString('utf8')
  const seenPath = new Set<string>()
  const introducedBy = new Map<string, { commit: string; path: string }>()
  for (const record of raw.split(RECORD).filter((r) => r.length > 0)) {
    // -z --raw: "<sha>\0\0" then ":<modes> <old> <new> <status>\0<path>\0" per change.
    const parts = record.split(FIELD)
    const commit = (parts[0] ?? '').trim()
    for (let i = 1; i < parts.length; i++) {
      const meta = /^:?\s*:?(\d{6}) (\d{6}) ([0-9a-f]+) ([0-9a-f]+) ([A-Z])/.exec(parts[i] ?? '')
      const path = parts[i + 1]
      if (!meta || path === undefined) continue
      i++
      if (meta[5] === 'D') continue
      if (!seenPath.has(path)) {
        seenPath.add(path)
        hits.push(...scanText(`commit ${short(commit)} ${path}`, path.replaceAll('/', ' '), rules).map((hit) => ({ ...hit, line: 0, rule: `${hit.rule} (file name)` })))
      }
      introducedBy.set(meta[4] as string, { commit, path })
    }
  }

  // Every blob reachable from any ref, once: sizes first, then contents in batches.
  const objects = run(['rev-list', '--objects', '--all']).toString('utf8').split('\n').filter((l) => l.length > 0)
  const names = new Map<string, string>()
  for (const line of objects) {
    const space = line.indexOf(' ')
    if (space > 0) names.set(line.slice(0, space), line.slice(space + 1))
  }
  const shas = objects.map((l) => l.split(' ', 1)[0] as string)
  const meta = run(['cat-file', '--batch-check=%(objecttype) %(objectname) %(objectsize)'], Buffer.from(shas.join('\n') + '\n')).toString('utf8').split('\n')
  const blobs = meta.filter((l) => l.startsWith('blob ')).map((l) => l.split(' ')) as [string, string, string][]
  const BATCH_BYTES = 64 * 1024 * 1024
  for (let start = 0; start < blobs.length; ) {
    let end = start
    let bytes = 0
    while (end < blobs.length && (end === start || bytes + Number(blobs[end]![2]) <= BATCH_BYTES)) bytes += Number(blobs[end++]![2])
    const batch = blobs.slice(start, end)
    const out = run(['cat-file', '--batch'], Buffer.from(batch.map(([, sha]) => sha).join('\n') + '\n'))
    let offset = 0
    for (const [, sha, size] of batch) {
      const headerEnd = out.indexOf(0x0a, offset)
      const length = Number(size)
      const bytesOf = out.subarray(headerEnd + 1, headerEnd + 1 + length)
      offset = headerEnd + 1 + length + 1
      const origin = introducedBy.get(sha)
      const path = origin?.path ?? names.get(sha) ?? sha
      const label = `${origin ? short(origin.commit) : short(sha)}:${path}`
      hits.push(...(isBinary(path, bytesOf) ? scanBinary(label, bytesOf, rules) : scanText(label, bytesOf.toString('utf8'), rules)))
    }
    start = end
  }
  return { commits: records.length, blobs: blobs.length, refs, hits }
}

export function formatHits(hits: readonly Hit[]): string[] {
  return hits.map((hit) => `${hit.file}${hit.line > 0 ? `:${hit.line}` : ''}: [${hit.rule}] ${hit.excerpt}`)
}

if (import.meta.main) {
  const argv = process.argv.slice(2)
  if (argv[0] === '--encode') {
    console.log(Buffer.from(argv[1] ?? '').toString('base64'))
    process.exit(0)
  }
  const flags = argv.filter((a) => a.startsWith('--'))
  const root = resolve(argv.find((a) => !a.startsWith('--')) ?? join(import.meta.dir, '..'))
  const treeOnly = flags.includes('--tree-only')
  const historyOnly = flags.includes('--history-only')
  const summary: string[] = []
  const hits: Hit[] = []
  if (!historyOnly) {
    const tree = auditTree(root)
    hits.push(...tree.hits)
    summary.push(`${tree.files} files`)
  }
  if (!treeOnly) {
    if (isGitRepository(root)) {
      try {
        const started = Date.now()
        const history = auditHistory(root)
        hits.push(...history.hits)
        summary.push(`history: ${history.commits} commits, ${history.blobs} file versions, ${history.refs} refs in ${((Date.now() - started) / 1000).toFixed(1)}s`)
      } catch (error) {
        console.error(`audit:personal: history could not be scanned: ${error instanceof Error ? error.message : error}`)
        process.exit(2)
      }
    } else if (historyOnly) {
      console.error('audit:personal: not a git repository, no history to scan')
      process.exit(2)
    } else {
      summary.push('history: not a git repository, skipped')
    }
  }
  if (hits.length > 0) {
    console.error(formatHits(hits).join('\n'))
    if (!treeOnly && hits.some((hit) => /^commit [0-9a-f]+ (author|committer)$|^ref .* tagger$/.test(hit.file)) && !allowedIdentity(root)) {
      console.error('\nhint: no allowed commit identity is configured. Set git config user.name and user.email, or AUDIT_ALLOWED_IDENTITY="Name <e-mail>" (in CI: the repository variable of that name).')
    }
    console.error(`\naudit:personal: ${hits.length} hit${hits.length === 1 ? '' : 's'} (${summary.join('; ')})`)
    process.exit(1)
  }
  console.log(`audit:personal: ${summary.join('; ')}: 0 hits`)
}
