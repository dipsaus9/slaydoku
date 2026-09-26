// Writes the portrait contact sheet: `bun tools/portrait-sheet.ts [output.html]`.
// Every generic portrait design in six colour variants, then sample casts of 6, 9, 12 and 16 people.
// Default target is the OS temp dir, so nothing generated lands in the repo.
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { renderPortraitSheet } from '../src/render/cards/procedural/portraitSheet.ts'

const target = resolve(process.argv[2] ?? join(tmpdir(), 'slaydoku-portrait-sheet.html'))

mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, renderPortraitSheet())
console.log(`Portrait contact sheet written to ${target}`)
