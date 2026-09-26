import { castFor, MAX_CAST_SIZE } from '../../../content/cast/index.ts'
import type { Cast } from '../../../content/cast/index.ts'
import { renderClue } from '../../clues/index.ts'
import type { CatalogClue } from '../../clues/index.ts'
import { isOccupiable, occupiableCells, roomIdAt } from '../../model/index.ts'
import type { Cell, Gender, Puzzle } from '../../model/index.ts'
import { VICTIM_TEXT, upperFirst } from '../../clues/en.ts'
import { precision } from '../../solvable/precision.ts'
import type { LadderReport } from './generate.ts'

/** Seed of the cast the ladder tools and the audit label people with; real puzzles bake the cast of their own seed (`castFor`). */
export const LADDER_CAST_SEED = 'ladder'

/** The cast of a puzzle of `size` people (`size` - 1 suspects) as the ladder tools use it: names and genders from the one pool (`castFor`). */
export const ladderCast = (size: number): Cast => {
  const wanted = Math.min(size, MAX_CAST_SIZE)
  let cast = ladderCasts.get(wanted)
  if (!cast) ladderCasts.set(wanted, (cast = castFor(wanted, LADDER_CAST_SEED)))
  return cast
}
const ladderCasts = new Map<number, Cast>()

/** The genders of the suspects of a puzzle of `size` people, in order: what `generateLadder` takes as `genders` so that the gender cards match the names. */
export const castGenders = (size: number): Gender[] => ladderCast(size).genders

/** Suspects A, B... take the names of `ladderCast` in order (a suspect beyond the pool is "Guest 23"...); the victim is "the victim". Ids stay. */
export function withCastLabels(puzzle: Puzzle): Puzzle {
  const { names } = ladderCast(puzzle.people.length)
  let n = 0
  return {
    ...puzzle,
    people: puzzle.people.map((p) => {
      if (p.kind === 'victim') return { ...p, label: VICTIM_TEXT.noun }
      const name = names[n] ?? `Guest ${n + 1}`
      n++
      return { ...p, label: name }
    }),
  }
}

const at = (cell: Cell) => `r${cell.row + 1}c${cell.col + 1}`

/** The board: the order each person is placed (G = the victim), `.` free, `#` blocked; then the rooms. */
function boardLines(report: LadderReport): string[] {
  const { scene, people } = report.puzzle
  const stepOf = new Map(report.steps.map((s) => [s.personId, s.index]))
  const at_ = new Map(report.puzzle.solution.map((p) => [`${p.cell.row},${p.cell.col}`, p.personId]))
  const roomLetter = new Map(scene.rooms.map((r, i) => [r.id, String.fromCharCode(97 + i)]))
  const victim = people.find((p) => p.kind === 'victim')?.id
  const header = `      ${Array.from({ length: scene.width }, (_, c) => String(c + 1).padStart(3)).join('')}`
  const rows: string[] = []
  for (let row = 0; row < scene.height; row++) {
    const cells: string[] = []
    for (let col = 0; col < scene.width; col++) {
      const cell = { row, col }
      const who = at_.get(`${row},${col}`)
      const mark = who ? (who === victim ? 'G' : String(stepOf.get(who))) : isOccupiable(scene, cell) ? '.' : '#'
      cells.push(`${mark.padStart(2)}${roomLetter.get(roomIdAt(scene, cell) ?? '') ?? '?'}`)
    }
    rows.push(`  r${String(row + 1).padStart(2)}  ${cells.join('')}`)
  }
  const legend = scene.rooms.map((r) => `${roomLetter.get(r.id)} = ${r.name}`).join(', ')
  return [header, ...rows, `  (number = order of placing, G = ${VICTIM_TEXT.noun}, # = blocked, letter = room: ${legend})`]
}

/**
 * The whole result as text for the terminal: scene, tier, the board with the order people are placed,
 * the ladder (per placement the cards it uses), all cards as they lie on the table, and the
 * oracle's verdict. Names are the cast, the victim is "the victim".
 */
export function formatLadderReport(report: LadderReport, sceneName: string): string {
  const puzzle = withCastLabels(report.puzzle)
  const ctx = { scene: puzzle.scene, people: puzzle.people }
  const label = (id: string) => upperFirst(puzzle.people.find((p) => p.id === id)?.label ?? id)
  const sentence = (clue: CatalogClue) => renderClue(clue, ctx)
  const prec = precision(report.puzzle)
  const victim = report.puzzle.solution.find((p) => p.personId === puzzle.people.find((q) => q.kind === 'victim')?.id)
  const lines: string[] = []
  lines.push(
    `${sceneName} ${puzzle.scene.width}x${puzzle.scene.height}, tier ${report.tier} (meets ${report.assessed}), seed ${report.seed}, ` +
      `${report.attempts} solution${report.attempts === 1 ? '' : 's'} sampled, ${report.elapsedMs} ms`,
  )
  lines.push(`${VICTIM_TEXT.title} on ${victim ? at(victim.cell) : '?'}, ${occupiableCells(puzzle.scene).length} free squares`)
  lines.push('', 'Board', ...boardLines(report))

  lines.push('', 'Ladder (the order the people are placed; each placement uses the cards named, plus the rows and columns of the people before)')
  for (const step of report.steps) {
    const cards = step.clues.map((i) => `    - ${sentence(puzzle.clues[i] as CatalogClue)}`)
    const isVictim = puzzle.people.find((p) => p.id === step.personId)?.kind === 'victim'
    const note = isVictim
      ? 'takes the last row and column'
      : `${step.squaresFromLines} squares left${step.index === 1 ? '' : ` by the rows and columns of the ${step.index - 1} placed`}, ${step.clues.length} card${step.clues.length === 1 ? ' leaves' : 's leave'} 1`
    lines.push(`  ${String(step.index).padStart(2)}. ${label(step.personId)} on ${at(step.cell)}: ${note}`)
    if (!isVictim) lines.push(...cards)
  }

  lines.push('', `Cards (${puzzle.clues.length}, as they lie on the table)`)
  puzzle.clues.forEach((clue, i) => {
    const alone = prec.cards.find((c) => c.clue === i)
    const hint = alone ? ` [${alone.referencing ? 'names a person' : `${alone.squares} square${alone.squares === 1 ? '' : 's'} alone`}]` : ''
    lines.push(`  ${String(i + 1).padStart(2)}. ${sentence(clue as CatalogClue)}${hint}`)
  })

  // What a person sees: per placement of the oracle's ladder, the squares the cards leave on their own (before any row or column is crossed off) and the chain (CAD-8.7).
  lines.push('', 'Own cards (ladderCheck order): squares the cards leave on their own, chain of dependent placements')
  for (const step of report.ladder.steps) {
    const own = step.clues.length === 0 ? 'no card, takes the last square' : `${step.clues.length} card${step.clues.length === 1 ? '' : 's'} leave${step.clues.length === 1 ? 's' : ''} ${step.squaresFromCards} square${step.squaresFromCards === 1 ? '' : 's'}, chain ${step.chain}`
    lines.push(`  ${String(step.index).padStart(2)}. ${label(step.personId)} on ${at(step.cell)}: ${own}`)
  }
  const tops = report.ladder.steps.map((s) => s.clues.length)
  lines.push(
    '',
    `ladderCheck (${report.ladder.maxCards} card${report.ladder.maxCards === 1 ? '' : 's'} per placement, person references ${report.ladder.references ? 'on' : 'off'}): ` +
      `${report.ladder.ok ? 'ok' : 'FAILED'}, cards per placement ${tops.join(' ')}, most squares left by a card ${report.ladder.maxSquaresFromCards}, longest chain ${report.ladder.chainLength}`,
    `people placeable from their own card alone: ${prec.placeableAlone.map(label).join(', ') || 'none'}`,
  )
  return lines.join('\n')
}
