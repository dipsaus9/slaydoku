import { checkClue, evaluate } from '../clues/index.ts'
import type { CatalogClue } from '../clues/index.ts'
import { deriveMurderer, parsePuzzle, validateSolution } from '../model/index.ts'
import type { Placement, Puzzle } from '../model/index.ts'
import { solve } from './solve.ts'

export interface VerifyReport {
  /** The JSON parsed and passed the schema check. When false only `problems` is meaningful. */
  loaded: boolean
  /** Schema, clue-parameter and rule problems, human readable. Empty when everything is fine. */
  problems: string[]
  /** Whether the stored solution obeys the Murdoku rules (row/column, occupiable cells, murderer). */
  rulesValid: boolean
  /** Number of solutions found, capped at 2. 0 = contradictory, 2 = ambiguous ("2 or more"). */
  solutionCount: number
  /** The murderer of the unique solution, or of the stored one when the puzzle is not unique. */
  murderer: string | null
  /** Whether the unique solver solution equals the stored (published) solution. Null unless count is 1. */
  matchesStored: boolean | null
  /** Unique, rules valid, clues well-formed and solver solution equals the stored one. */
  ok: boolean
}

const failed = (problems: string[]): VerifyReport => ({
  loaded: false,
  problems,
  rulesValid: false,
  solutionCount: 0,
  murderer: null,
  matchesStored: null,
  ok: false,
})

/** Loads a puzzle from JSON text, checks it, solves it and compares with the stored solution. */
export function verifyPuzzle(text: string): VerifyReport {
  const parsed = parsePuzzle(text)
  if (!parsed.ok) return failed(parsed.issues.map((i) => `${i.path}: ${i.message}`))
  const puzzle = parsed.value
  const problems: string[] = []

  puzzle.clues.forEach((clue, i) => {
    for (const issue of checkClue(clue, puzzle)) problems.push(`clues[${i}] (${clue.type}): ${issue}`)
  })
  const rules = validateSolution(puzzle)
  for (const issue of rules.issues) problems.push(`solution: ${issue.message}`)
  if (problems.some((p) => p.startsWith('clues['))) {
    return { ...failed(problems), loaded: true, rulesValid: rules.ok }
  }

  const clues = puzzle.clues as CatalogClue[]
  clues.forEach((clue, i) => {
    if (!evaluate(clue, puzzle.scene, puzzle.solution, puzzle.people)) {
      problems.push(`clues[${i}] (${clue.type}): the stored solution does not satisfy this clue.`)
    }
  })

  const { count, solutions } = solve(puzzle.scene, puzzle.people, clues)
  const only = count === 1 ? (solutions[0] as Placement[]) : null
  const matchesStored = only === null ? null : samePlacements(only, puzzle.solution)
  const murderer = deriveMurderer(puzzle, only ?? puzzle.solution)
  if (count === 0) problems.push('The clues contradict each other or the rules: no solution.')
  if (count > 1) problems.push('The clues leave several solutions: not unique.')
  if (matchesStored === false) problems.push('The solver solution differs from the stored solution.')
  return {
    loaded: true,
    problems,
    rulesValid: rules.ok,
    solutionCount: count,
    murderer,
    matchesStored,
    ok: problems.length === 0 && count === 1 && matchesStored === true,
  }
}

function samePlacements(a: Placement[], b: Puzzle['solution']): boolean {
  if (a.length !== b.length) return false
  return a.every((p) => {
    const other = b.find((q) => q.personId === p.personId)
    return other !== undefined && other.cell.row === p.cell.row && other.cell.col === p.cell.col
  })
}

/** The lines the `verify` CLI prints. */
export function formatReport(report: VerifyReport, name: string): string {
  const lines = [`Puzzle: ${name}`]
  if (!report.loaded) {
    lines.push('Loaded: no', ...report.problems.map((p) => `  - ${p}`))
    return lines.join('\n')
  }
  lines.push(`Valid rules: ${report.rulesValid ? 'yes' : 'no'}`)
  const count = report.solutionCount
  lines.push(`Solutions: ${count > 1 ? `${count}+ (not unique)` : count}`)
  lines.push(`Murderer: ${report.murderer ?? 'none'}`)
  if (report.matchesStored !== null) {
    lines.push(`Matches stored solution: ${report.matchesStored ? 'yes' : 'no'}`)
  }
  if (report.problems.length) lines.push('Problems:', ...report.problems.map((p) => `  - ${p}`))
  lines.push(report.ok ? 'Result: OK' : 'Result: FAILED')
  return lines.join('\n')
}
