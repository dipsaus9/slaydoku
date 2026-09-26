// Personal-data audit: `bun run audit:personal [dir]` (default: the repo root).
// Scans every file of the working tree except node_modules, dist, .git and reports/ for a deny-list of personal terms, for
// e-mail addresses that are not on the allow-list, and for metadata in images (EXIF, XMP, GPS, PNG text chunks). Binary files
// are searched through the printable strings they contain. Prints `file:line: [rule] excerpt` per hit and exits 1 when there is any.
// `bun tools/audit-personal.ts --encode <regex>` prints the base64 of a new deny-list pattern to paste into RULES.
//
// The deny-list is stored base64-encoded on purpose: this file is scanned like every other file of the tree (there is no
// path exemption), and it must not match its own terms. A pattern here is `[rule id, base64 of a case-insensitive regex source]`.
// The test (audit-personal.test.ts) builds its own hits from the decoded list, so it does not spell a term out either.
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

export function formatHits(hits: readonly Hit[]): string[] {
  return hits.map((hit) => `${hit.file}${hit.line > 0 ? `:${hit.line}` : ''}: [${hit.rule}] ${hit.excerpt}`)
}

if (import.meta.main) {
  const argv = process.argv.slice(2)
  if (argv[0] === '--encode') {
    console.log(Buffer.from(argv[1] ?? '').toString('base64'))
    process.exit(0)
  }
  const root = resolve(argv[0] ?? join(import.meta.dir, '..'))
  const { files, hits } = auditTree(root)
  if (hits.length > 0) {
    console.error(formatHits(hits).join('\n'))
    console.error(`\naudit:personal: ${hits.length} hit${hits.length === 1 ? '' : 's'} in ${files} files`)
    process.exit(1)
  }
  console.log(`audit:personal: ${files} files scanned, 0 hits`)
}
