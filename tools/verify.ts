// Checks a puzzle file: `bun run verify <puzzle.json>` (any path, in or outside the repo).
// Prints whether the rules hold, how many solutions there are (capped at 2) and the murderer.
// Exit code: 0 puzzle is valid and unique, 1 it is not, 2 usage or unreadable file.
import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { formatReport, verifyPuzzle } from '../src/engine/solver/index.ts'

const [file] = process.argv.slice(2)
if (!file) {
  console.error('Usage: bun run verify <puzzle.json>')
  process.exit(2)
}

let text: string
try {
  text = readFileSync(resolve(file), 'utf8')
} catch (error) {
  console.error(`Cannot read ${file}: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(2)
}

const report = verifyPuzzle(text)
console.log(formatReport(report, basename(file)))
process.exit(report.ok ? 0 : 1)
