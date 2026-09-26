// Writes the object-icon contact sheet: `bun tools/icon-sheet.ts [output.html]`.
// Default target is the OS temp dir, so nothing generated lands in the repo.
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { renderContactSheet } from '../src/render/icons/contactSheet.ts'

const target = resolve(process.argv[2] ?? join(tmpdir(), 'slaydoku-icon-sheet.html'))

mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, renderContactSheet())
console.log(`Icon contact sheet written to ${target}`)
