// Screens ladder seeds for a scene: `bun tools/screen-level.ts --scene demo --tier very-easy --victim 6,2 --from 1 --to 400 [--min-share 50] [--max-cards 14] [--min-kinds 5] [--max-kind 4] [--max-lines 2] [--plain 1] [--budget 20000]`.
// For every seed it runs generateLadder (victim pinned), dresses the puzzle with the cast, and keeps it when the noun audit,
// auditHints and auditClues pass and a hint walk (walkHints) needs at most 1.3 x people requests. Survivors are printed as one line each:
// seed, cards, kinds, most used kind, row/column cards, direct share, hint requests, most squares a card leaves alone, longest chain of dependent placements, ladder order, then the Dutch clue lines, so they can be
// read by hand (the last step of the curation, see docs/authoring/generate-verify-register.md). Prints the counts to stderr.
// Exit code: 0 done, 2 usage.
import { demoScene } from '../src/content/demo/scene.ts'
import { auditObjectNames } from '../src/engine/clues/objectNames.ts'
import { expandClue, renderClue } from '../src/engine/clues/index.ts'
import type { CatalogClue } from '../src/engine/clues/index.ts'
import { LADDER_TIER_IDS, castGenders, generateLadder, withCastLabels } from '../src/engine/generator/ladder/index.ts'
import type { LadderTierId } from '../src/engine/generator/ladder/index.ts'
import type { Scene } from '../src/engine/model/index.ts'
import { auditClues, auditHints, directClueShare, walkHints } from '../src/validation/index.ts'

const scenes: Record<string, Scene> = { demo: demoScene }
const USAGE =
  'Usage: bun tools/screen-level.ts --scene <demo> --tier <very-easy|easy|easy-medium|medium> --victim <row,col 1-based> ' +
  '[--from 1] [--to 400] [--min-share 0..100] [--max-cards N] [--min-kinds N] [--max-kind N] [--max-lines N] [--plain 1] [--budget ms]'

const values = new Map<string, string>()
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i += 2) {
  const flag = argv[i] as string
  const value = argv[i + 1]
  if (!/^--[a-z-]+$/.test(flag) || value === undefined) {
    console.error(`Bad argument "${flag}".\n${USAGE}`)
    process.exit(2)
  }
  values.set(flag.slice(2), value)
}
const scene = scenes[values.get('scene') ?? '']
const tier = values.get('tier') as LadderTierId
const victim = /^(\d+),(\d+)$/.exec(values.get('victim') ?? '')
if (!scene || !LADDER_TIER_IDS.includes(tier) || !victim) {
  console.error(USAGE)
  process.exit(2)
}
const num = (name: string, fallback: number) => Number(values.get(name) ?? fallback)
const [from, to] = [num('from', 1), num('to', 400)]
const minShare = num('min-share', 0)
const maxCards = num('max-cards', 99)
const minKinds = num('min-kinds', 0)
const maxKind = num('max-kind', 99)
const maxLines = num('max-lines', 99)
const budgetMs = num('budget', 20_000)
/**
 * --plain 1: no card that rules something out or counts ("did not stand next to", "nobody in", "the only person on", "there was ... on ...'s square",
 * "exactly three rows above", "at least one woman in ...'s room", "alone with a man"); a combined card is plain when both parts are.
 */
const plain = num('plain', 0) === 1
const NOT_PLAIN: ReadonlySet<string> = new Set([
  'notBesideObject', 'notWith', 'differentRoom', 'emptyRoom', 'onlyOnObject', 'squareWithObject',
  'exactDistance', 'roomHasGender', 'aloneWithGender',
])
const victimCell = { row: Number(victim[1]) - 1, col: Number(victim[2]) - 1 }

const counts = { seeds: 0, generated: 0, audits: 0, walk: 0, screen: 0 }
for (let seed = from; seed <= to; seed++) {
  counts.seeds++
  const outcome = generateLadder(scene, tier, seed, { victimCell, budgetMs, genders: castGenders(scene.width) })
  if (!outcome.ok) continue
  counts.generated++
  const puzzle = withCastLabels(outcome.puzzle)
  if ([...auditObjectNames(puzzle), ...auditHints(puzzle), ...auditClues(puzzle, tier)].length > 0) continue
  counts.audits++
  const walk = walkHints(puzzle)
  if (!walk.solved || walk.steps.length > 1.3 * puzzle.people.length) continue
  counts.walk++
  const kinds = new Map<string, number>()
  for (const clue of puzzle.clues) if (clue.type !== 'aloneWithMurderer') kinds.set(clue.type, (kinds.get(clue.type) ?? 0) + 1)
  const lines = (kinds.get('inRow') ?? 0) + (kinds.get('inColumn') ?? 0) + (kinds.get('onLine') ?? 0)
  const share = Math.round(directClueShare(puzzle) * 100)
  const most = Math.max(...kinds.values())
  if (plain && puzzle.clues.some((c) => expandClue(c as CatalogClue).some((part) => NOT_PLAIN.has(part.type)))) continue
  if (share < minShare || puzzle.clues.length > maxCards || kinds.size < minKinds || most > maxKind || lines > maxLines) continue
  counts.screen++
  const ctx = { scene: puzzle.scene, people: puzzle.people }
  const label = (id: string) => puzzle.people.find((p) => p.id === id)?.label
  console.log(
    `seed ${seed}: ${puzzle.clues.length} cards, ${kinds.size} kinds, most used ${most}x, ${lines} row/column, ${share}% direct, ${walk.steps.length} hint requests, ` +
      `most squares left by a card ${outcome.ladder.maxSquaresFromCards}, chain ${outcome.ladder.chainLength}, ` +
      `order ${outcome.steps.map((s) => `${label(s.personId)}(${s.clues.length})`).join(' ')}`,
  )
  for (const clue of puzzle.clues) console.log(`  ${renderClue(clue as CatalogClue, ctx)}`)
}
console.error(
  `${counts.seeds} seeds: ${counts.generated} generated, ${counts.audits} pass the audits, ${counts.walk} pass the hint walk, ${counts.screen} pass the screen`,
)
