import { expandClue, isGenderClue } from '../../engine/clues/index.ts'
import type { CatalogClue } from '../../engine/clues/index.ts'
import { auditObjectNames } from '../../engine/clues/objectNames.ts'
import { LADDER_TIER_IDS } from '../../engine/generator/ladder/index.ts'
import { difficultyScore, tierById } from '../../engine/generator/tiers/index.ts'
import type { TierId } from '../../engine/generator/tiers/index.ts'
import { deriveMurderer, parsePuzzle } from '../../engine/model/index.ts'
import type { Puzzle } from '../../engine/model/index.ts'
import { verifyPuzzle } from '../../engine/solver/index.ts'
import { auditClues, auditHints } from '../../validation/index.ts'
import { solveAdvanced } from '../../engine/solver/advanced/index.ts'
import type { HumanResult } from '../../engine/solver/human/index.ts'
import { scoreBandProblem } from '../../engine/difficulty/index.ts'
import { SOLVABLE_TIERS, assessTier, ladderCheck, ladderMeetsTier, ladderOptions } from '../../engine/solvable/index.ts'
import { GIFT_LABEL, packId } from './ids.ts'
import type { PackEntry, PackRating } from './types.ts'

/**
 * Clue kinds that only read a row, column or line number; too many of them make a dull puzzle. A room edge
 * (`inRoomEdge`, CAD-9.2) is not one: it names no number (see `LINE_KINDS` in the ladder planner); a combined card counts
 * as a line card when one of its parts is.
 */
const LINE_KINDS: ReadonlySet<string> = new Set(['inRow', 'inColumn', 'onLine'])
/** The victim's fixed card; not a "kind" the variety gate counts. */
const VICTIM_CARD = 'aloneWithMurderer'

/** A pack puzzle carries between one card per person and two per person. */
export const clueRange = (size: number): { min: number; max: number } => ({ min: size, max: 2 * size })

/** Distinct clue kinds (victim card excluded) a puzzle must mix: 3 on small boards, 4 from 9x9. */
export const minKinds = (size: number): number => (size >= 9 ? 4 : 3)

/** Kind counts without the victim card. */
export function kindCounts(puzzle: Puzzle): Map<string, number> {
  const counts = new Map<string, number>()
  for (const clue of puzzle.clues) if (clue.type !== VICTIM_CARD) counts.set(clue.type, (counts.get(clue.type) ?? 0) + 1)
  return counts
}

/**
 * Variety of clue kinds: at least `minKinds` distinct kinds, no kind on more
 * than 40% of the cards (3 cards always allowed), and at most 30% row/column/line
 * clues (2 always allowed). Returns the problem, or null.
 */
export function varietyProblem(puzzle: Puzzle, size: number): string | null {
  const counts = kindCounts(puzzle)
  if (counts.size < minKinds(size)) return `only ${counts.size} clue kinds, need ${minKinds(size)}`
  const total = puzzle.clues.length
  for (const [kind, n] of counts) {
    if (n > Math.max(3, Math.ceil(total * 0.4))) return `clue kind ${kind} used ${n} of ${total} times`
  }
  const lines = puzzle.clues.filter((c) => expandClue(c as CatalogClue).some((part) => LINE_KINDS.has(part.type))).length
  if (lines > Math.max(2, Math.floor(total * 0.3))) return `${lines} of ${total} clues are row/column/line numbers`
  return null
}

/** Key of the board alone (rooms, objects, doors, windows): two puzzles on one board are duplicates. */
export const boardKey = (puzzle: Puzzle): string =>
  JSON.stringify([puzzle.scene.cellRooms, puzzle.scene.objects, puzzle.scene.edgeFeatures])

/** Key of the whole puzzle: board, planted solution and the clue set. */
export const puzzleKey = (puzzle: Puzzle): string =>
  JSON.stringify([boardKey(puzzle), puzzle.solution, puzzle.clues.map((c) => JSON.stringify(c)).sort()])

/** Very easy to medium: the tiers the ladder generator builds and the human-solvability scale decides (src/engine/solvable). */
export const isLadderTier = (tier: TierId): boolean => (LADDER_TIER_IDS as readonly string[]).includes(tier)

/** What the advanced human solver makes of a puzzle, and the rating stored from it. Ladder tiers run it uncapped, hard and expert at their level. */
export function ratingOf(puzzle: Puzzle, tier: TierId): { human: HumanResult; rating: PackRating } {
  const maxLevel = isLadderTier(tier) ? undefined : tierById(tier).maxTechniqueLevel
  const human = solveAdvanced(puzzle.scene, puzzle.people, puzzle.clues as CatalogClue[], { maxLevel })
  return { human, rating: { score: difficultyScore(human, puzzle.people.length), level: human.maxTechnique?.level ?? 0, steps: human.steps.length } }
}

/**
 * Checks one pack entry from scratch, with solver runs of its own; the same
 * checks run at generation and when the committed pack is re-verified.
 * Returns human-readable problems, empty when the entry is good:
 *
 * - shape: id, size, cast labels, victim label, room names with article;
 * - `verifyPuzzle` (what `bun run verify` runs): schema, rules, clues, exactly one solution equal to the stored one;
 * - the advanced human solver places everybody as stored (deducible without guessing) and measures the stored rating;
 * - very easy to medium (CAD-8.5): `ladderCheck` passes the tier's numbers (src/engine/solvable), the tier is not a band of the old score;
 *   hard and expert: hardest technique level inside the tier's range (the solver capped at its level);
 * - `tierFor` gives exactly the entry's tier (the easiest tier a person can solve the puzzle on, for every tier);
 * - score v2 lies in the band of the entry's tier (`SOLVABLE_TIERS[].scoreBand`, CAD-5.6), or the puzzle is one of `BAND_EXCEPTIONS`;
 * - the clue-noun audit (`auditObjectNames`, CAD-8.1): every object clue names exactly one drawn kind of object;
 * - sane clue count and variety of clue kinds;
 * - the hint and clue audit (`src/validation/`): every hint of a full human solve is plain Dutch, names the
 *   person and the square and ends with an instruction; the cards are clear and enough of them are direct.
 */
export function entryProblems(entry: PackEntry): string[] {
  const problems: string[] = []
  const { puzzle, size } = entry
  const tier = tierById(entry.tier)
  const at = (msg: string) => problems.push(`${entry.id}: ${msg}`)

  if (entry.id !== packId(entry.size, entry.tier, entry.theme, entry.seed)) at(`id does not match size, tier, theme and seed`)
  if (puzzle.scene.width !== size || puzzle.scene.height !== size) at(`scene is ${puzzle.scene.width}x${puzzle.scene.height}, not ${size}x${size}`)
  const suspects = puzzle.people.filter((p) => p.kind === 'suspect')
  const victims = puzzle.people.filter((p) => p.kind === 'victim')
  if (puzzle.people.length !== size || victims.length !== 1) at(`needs ${size} people: ${size - 1} suspects and one victim`)
  if (victims[0]?.label !== GIFT_LABEL) at(`victim label is "${victims[0]?.label}", not "${GIFT_LABEL}"`)
  if (JSON.stringify(suspects.map((p) => p.label)) !== JSON.stringify(entry.cast)) at('suspect labels differ from the cast')
  if (new Set(entry.cast).size !== entry.cast.length) at('cast names are not unique')
  if (entry.title.trim() === '') at('empty title')
  // Gender cards need a cast with genders (CAD-9.4): every suspect has one when any card asks about them (the gift has none).
  const usesGender = puzzle.clues.some((c) => expandClue(c as CatalogClue).some((part) => isGenderClue(part)))
  if (usesGender && suspects.some((p) => p.gender === undefined)) at('a gender card, but not every suspect has a gender')
  for (const room of puzzle.scene.rooms) if (!/^(de|het) \S/.test(room.name)) at(`room name "${room.name}" has no article`)
  if (puzzle.clues.length !== entry.clueCount) at(`clueCount ${entry.clueCount} but ${puzzle.clues.length} clues`)

  const { min, max } = clueRange(size)
  if (puzzle.clues.length < min || puzzle.clues.length > max) at(`${puzzle.clues.length} clues, expected ${min}-${max}`)
  const variety = varietyProblem(puzzle, size)
  if (variety) at(variety)

  const json = JSON.stringify(puzzle)
  const parsed = parsePuzzle(json)
  if (!parsed.ok) {
    at(`invalid puzzle: ${parsed.issues.map((i) => `${i.path}: ${i.message}`).join('; ')}`)
    return problems
  }
  const report = verifyPuzzle(json)
  if (!report.ok) at(`verify failed: ${report.problems.join('; ') || `solutions ${report.solutionCount}`}`)
  else if (report.murderer !== deriveMurderer(puzzle, puzzle.solution)) at('murderer differs from the stored solution')

  const { human, rating } = ratingOf(puzzle, entry.tier)
  const placedAsStored = puzzle.solution.every((p) => {
    const found = human.placements.find((q) => q.personId === p.personId)
    return found !== undefined && found.cell.row === p.cell.row && found.cell.col === p.cell.col
  })
  if (!human.solved || human.contradiction || !placedAsStored) at('the human solver does not place everybody as stored')
  if (isLadderTier(entry.tier)) {
    // Very easy to medium are defined by the human-solvability ladder, not by bands of the old score (CAD-8.5); the score v2 band is checked below for every tier.
    const rule = SOLVABLE_TIERS.find((t) => t.id === entry.tier)!
    const ladder = ladderCheck(puzzle, ladderOptions(rule))
    if (!ladderMeetsTier(puzzle, ladder, rule)) {
      at(
        `ladderCheck: not solvable on the ${entry.tier} ladder (${rule.maxCards} card(s) per placement, person references ${rule.references ? 'on' : 'off'}, ` +
          `cards leave at most ${rule.maxSquaresFromCards} squares (${rule.lastSquaresFromCards} in the last placements), chain of at most ${rule.maxChain})`,
      )
    }
  } else {
    if (rating.level < tier.minTechniqueLevel || rating.level > tier.maxTechniqueLevel) at(`technique level ${rating.level} outside ${tier.id}`)
  }
  const measured = assessTier(puzzle).tier
  if (measured !== entry.tier) at(`tierFor gives ${measured}, not ${entry.tier}`)
  // Score v2 (CAD-5.6): inside the tier's band of the one table (SOLVABLE_TIERS), unless the puzzle is a documented exception.
  const bandProblem = scoreBandProblem(puzzle, entry.tier, entry.id)
  if (bandProblem) at(bandProblem)
  if (rating.score !== entry.rating.score || rating.level !== entry.rating.level || rating.steps !== entry.rating.steps) {
    at(`stored rating ${JSON.stringify(entry.rating)} differs from measured ${rating.score}/${rating.level}/${rating.steps}`)
  }

  for (const problem of auditObjectNames(puzzle)) at(`clue noun: ${problem}`)
  for (const problem of auditHints(puzzle)) at(`hints: ${problem}`)
  for (const problem of auditClues(puzzle, entry.tier)) at(`clues: ${problem}`)
  return problems
}
