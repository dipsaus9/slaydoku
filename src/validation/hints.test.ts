import { describe, expect, it } from 'vitest'
import { MAX_CROSSED_SQUARES as GAME_MAX_CROSSED, MAX_POSSIBLE_SQUARES as GAME_MAX_POSSIBLE } from '../game/hints.ts'
import { MAX_NAMED_CELLS as GAME_MAX_NAMED } from '../game/hintText.ts'
import { hardPuzzle } from '../game/hints.fixture.ts'
import { auditHints, auditWalk, MAX_CROSSED_SQUARES, MAX_NAMED_CELLS, MAX_POSSIBLE_SQUARES } from './hints.ts'
import { walkHints } from './walk.ts'
import type { HintWalk, WalkStep } from './walk.ts'

/** A small hard puzzle: its hints hold a note, crossings and placements. */
const puzzle = hardPuzzle()
const good = walkHints(puzzle)
const clone = (): HintWalk => structuredClone(good)
const crossing = good.steps.findIndex((s) => !s.next.placement && !s.next.focus)
const placing = good.steps.findIndex((s) => s.next.placement)
const noting = good.steps.findIndex((s) => s.next.focus && !s.next.placement)

/** The audit of the walk after `edit` broke one hint. */
function audit(edit: (steps: WalkStep[]) => void): string[] {
  const walk = clone()
  edit(walk.steps)
  return auditWalk(puzzle, walk)
}

/** Sets text (and for level 3 the parts) of one hint, keeping level 3 text = explanation + instruction. */
const setText = (steps: WalkStep[], i: number, level: 1 | 2, text: string) => {
  ;(level === 1 ? steps[i]!.level1 : steps[i]!.level2).text = text
}
const setLevel3 = (steps: WalkStep[], i: number, explanation: string, instruction: string) => {
  const h = steps[i]!.level3
  h.explanation = explanation
  h.instruction = instruction
  h.text = `${explanation} ${instruction}`
}

describe('auditHints on a good puzzle', () => {
  it('finds nothing on a hard puzzle: it has a note, crossings and placements', () => {
    expect(noting).toBeGreaterThanOrEqual(0)
    expect(crossing).toBeGreaterThanOrEqual(0)
    expect(placing).toBeGreaterThanOrEqual(0)
    expect(good.solved).toBe(true)
    expect(auditHints(puzzle)).toEqual([])
  })
})

describe('auditHints: the walk', () => {
  it('flags a puzzle whose hints run dry before everybody is placed', () => {
    // Without its clue cards the puzzle has no deduction the human solver can make.
    const bare = { ...puzzle, clues: puzzle.clues.filter((c) => c.type === 'aloneWithMurderer') }
    expect(auditHints(bare).join('\n')).toMatch(/the hints stop after \d+ steps with \d+ people not placed/)
  })
})

describe('auditHints: every level', () => {
  const texts = [1, 2] as const
  for (const level of texts) {
    const at = crossing
    it(`level ${level}: empty text`, () => {
      expect(audit((s) => setText(s, at, level, '')).join()).toContain('empty text')
    })
    it(`level ${level}: not Dutch`, () => {
      expect(audit((s) => setText(s, at, level, 'Look at the cell and put the cross there.')).join()).toContain('is not plain Dutch')
    })
    it(`level ${level}: solver jargon`, () => {
      expect(audit((s) => setText(s, at, level, 'Kijk naar de kandidaten van A in de Woonkamer.')).join()).toContain('solver word "kandidaten"')
    })
    it(`level ${level}: technique id or title`, () => {
      expect(audit((s) => setText(s, at, level, 'Kijk naar A, dat is een single-candidate.')).join()).toContain('names the technique "single-candidate"')
    })
    it(`level ${level}: code and ids`, () => {
      expect(audit((s) => setText(s, at, level, 'Kijk naar A op r3k4.')).join()).toContain('shows code "r3k4"')
      expect(audit((s) => setText(s, at, level, 'Kijk naar A op undefined.')).join()).toContain('shows code')
    })
    it(`level ${level}: no capital, no full stop, stray whitespace`, () => {
      expect(audit((s) => setText(s, at, level, 'kijk naar A en het bord.')).join()).toContain('does not start with a capital')
      expect(audit((s) => setText(s, at, level, 'Kijk naar A en het bord')).join()).toContain('does not end in a full stop')
      expect(audit((s) => setText(s, at, level, 'Kijk  naar A en het bord. ')).join()).toContain('stray whitespace')
    })
  }

  it('a count of squares as a number above what a hint spells out (the "61 gemarkeerde vakjes" hint)', () => {
    expect(audit((s) => setText(s, crossing, 2, 'Kijk naar de 61 vakjes op het bord.')).join()).toContain('spells a count of 61 squares as a number')
    expect(audit((s) => setText(s, crossing, 2, 'Kijk naar de 3 vakjes op het bord.')).join()).not.toContain('spells a count')
  })
})

describe('auditHints: length limits', () => {
  it('too short and too long at each level', () => {
    expect(audit((s) => setText(s, crossing, 1, 'Kijk A.')).join()).toMatch(/level 1: \d+ characters, expected 12-220/)
    expect(audit((s) => setText(s, crossing, 1, `Kijk naar het bord. ${'Het is een lange zin. '.repeat(12)}`.trim())).join()).toMatch(/level 1: \d+ characters/)
    expect(audit((s) => setText(s, crossing, 2, `Kijk naar het bord ${'en dan nog eens. '.repeat(14)}`.trim() + '.')).join()).toMatch(/level 2: \d+ characters, expected 12-200/)
    expect(audit((s) => setLevel3(s, crossing, 'Te lang. '.repeat(100).trim(), 'Zet een kruisje op rij 1, kolom 1.')).join()).toMatch(/level 3: \d+ characters, expected 30-600/)
  })
})

describe('auditHints: names the person and the square', () => {
  it('level 1 must name the person it is about', () => {
    const who = good.steps[crossing]!.level1.personIds[0]!
    const label = puzzle.people.find((p) => p.id === who)!.label
    const problems = audit((s) => setText(s, crossing, 1, 'Kijk eens goed naar het bord en de kaarten.'))
    expect(problems.join()).toContain(`does not name ${label}`)
  })

  it('level 1 must name somebody at all, and only people and areas that exist', () => {
    expect(audit((s) => (s[crossing]!.level1.personIds = [])).join()).toContain('names nobody')
    expect(audit((s) => (s[crossing]!.level1.personIds = ['ghost'])).join()).toContain('a person that does not exist')
    expect(audit((s) => (s[crossing]!.level1.roomIds = ['nowhere'])).join()).toContain('an area that does not exist')
  })

  it('level 2 must name the square, and for a placement the person', () => {
    const cell = good.steps[placing]!.level2.cells[0]!
    const label = puzzle.people.find((p) => p.id === good.steps[placing]!.next.placement!.personId)!.label
    const noSquare = audit((s) => setText(s, placing, 2, `Kijk naar het bord. Daar moet ${label} staan.`))
    expect(noSquare.join()).toContain(`does not name the square rij ${cell.row + 1}, kolom ${cell.col + 1}`)
    const noPerson = audit((s) => setText(s, placing, 2, `Kijk naar rij ${cell.row + 1}, kolom ${cell.col + 1}. Daar moet iemand staan.`))
    expect(noPerson.join()).toContain(`does not name ${label}`)
  })

  it('level 2 must name the right row and column, alone or grouped', () => {
    const cell = good.steps[placing]!.level2.cells[0]!
    const label = puzzle.people.find((p) => p.id === good.steps[placing]!.next.placement!.personId)!.label
    const wrongRow = audit((s) => setText(s, placing, 2, `Kijk naar rij ${cell.row + 2}, kolom ${cell.col + 1}. Daar moet ${label} staan.`))
    expect(wrongRow.join()).toContain('does not name the square')
    const onlyColumn = audit((s) => setText(s, placing, 2, `Kijk naar kolom ${cell.col + 1}. Daar moet ${label} staan.`))
    expect(onlyColumn.join()).toContain('does not name the square')
    const grouped = audit((s) => {
      s[crossing]!.level2.cells = [{ row: 8, col: 4 }, { row: 8, col: 6 }, { row: 8, col: 7 }]
      setText(s, crossing, 2, 'Kijk naar rij 9, kolom 5, 7 en 8. Die vakjes zijn gemarkeerd op het bord.')
    })
    expect(grouped.join()).not.toContain('does not name the square')
  })

  it('level 2 must point at a square that is on the board', () => {
    expect(audit((s) => (s[crossing]!.level2.cells = [])).join()).toContain('points at no square')
    expect(audit((s) => (s[crossing]!.level2.cells = [{ row: 99, col: 0 }])).join()).toContain('outside the board')
  })

  it('level 2 with many squares must point at the marked squares', () => {
    // (A crossing may name four squares; a person's possible squares up to six.)
    const many = Array.from({ length: 7 }, (_, i) => ({ row: i % 4, col: Math.floor(i / 4) }))
    const problems = audit((s) => {
      s[crossing]!.level2.cells = many
      setText(s, crossing, 2, 'Kijk goed naar het bord.')
    })
    expect(problems.join()).toContain('7 squares but the text does not point at the marked squares')
  })
})

describe('auditHints: level 3 ends with an explicit instruction', () => {
  it('a placement must say "Zet <naam> op rij X, kolom Y."', () => {
    const { personId, cell } = good.steps[placing]!.next.placement!
    const label = puzzle.people.find((p) => p.id === personId)!.label
    const expected = `Zet ${label} op rij ${cell.row + 1}, kolom ${cell.col + 1}.`
    const wrong = cell.row === 0 && cell.col === 0 ? `Zet ${label} op rij 2, kolom 2.` : `Zet ${label} op rij 1, kolom 1.`
    const problems = audit((s) => setLevel3(s, placing, 'Er is nog maar één vakje.', wrong))
    expect(problems.join()).toContain(`instruction "${wrong}" is not "${expected}"`)
    expect(audit((s) => setLevel3(s, placing, 'Er is nog maar één vakje.', 'Probeer het daar eens.')).join()).toContain(`is not "${expected}"`)
  })

  it('a note must say "Zet een notitie voor <naam> op ..." and name every possible square', () => {
    const { focus } = good.steps[noting]!.next
    const label = puzzle.people.find((p) => p.id === focus!.personId)!.label
    expect(audit((s) => setLevel3(s, noting, 'Er zijn twee vakjes.', 'Schrijf ze maar op.')).join()).toContain('does not say where to note')
    expect(audit((s) => setLevel3(s, noting, 'Er zijn twee vakjes.', `Zet een notitie voor ${label} op rij 1, kolom 1.`)).join()).toContain('instruction does not name the square')
  })

  it('a note is about at most six possible squares, a crossing about at most twelve', () => {
    const cells = (n: number) => Array.from({ length: n }, (_, i) => ({ row: i % 6, col: Math.floor(i / 6) }))
    expect(audit((s) => (s[noting]!.level2.cells = cells(7))).join()).toContain('lists 7 possible squares, at most 6')
    expect(audit((s) => (s[crossing]!.level2.cells = cells(13))).join()).toContain('asks for 13 squares, at most 12')
    expect(audit((s) => (s[crossing]!.level2.cells = cells(12))).join()).not.toContain('asks for')
  })

  it('a hint about one person names that person at level 2', () => {
    const label = puzzle.people.find((p) => p.id === good.steps[noting]!.next.focus!.personId)!.label
    expect(audit((s) => setText(s, noting, 2, 'Kijk naar het bord. Die vakjes zijn gemarkeerd.')).join()).toContain(`does not name ${label}`)
  })

  it('a crossing must say "Zet een kruisje ..." and name the squares', () => {
    expect(audit((s) => setLevel3(s, crossing, 'Er vallen vakjes af.', 'Kruis ze maar weg.')).join()).toContain('does not say where to put a cross')
    expect(audit((s) => setLevel3(s, crossing, 'Er vallen vakjes af.', 'Zet een kruisje voor A.')).join()).toContain('instruction names no square')
  })

  it('the text must be the explanation followed by the instruction, and end with it', () => {
    expect(audit((s) => (s[crossing]!.level3.text = `${s[crossing]!.level3.instruction} ${s[crossing]!.level3.explanation}`)).join()).toContain(
      'text is not the explanation followed by the instruction',
    )
    expect(audit((s) => setLevel3(s, crossing, '', 'Zet een kruisje op rij 1, kolom 1.')).join()).toContain('has no explanation')
  })

  it('the instruction is one sentence', () => {
    expect(audit((s) => setLevel3(s, crossing, 'Er vallen vakjes af.', 'Zet een kruisje op rij 1, kolom 1. Doe dat nu.')).join()).toContain('more than one sentence')
  })
})

describe('auditHints: the level-3 limit follows the technique', () => {
  const long = `${'Er vallen vakjes af omdat het niet anders kan. '.repeat(11).trim()}`
  const cross = 'Zet een kruisje op rij 1, kolom 1.'
  const withTechnique = (id: string) =>
    audit((s) => {
      setLevel3(s, crossing, long, cross)
      s[crossing]!.level3.technique = { id, title: id }
    })

  it('a basic technique keeps to 420 characters, a fish or chain may use more', () => {
    expect(withTechnique('scan').join()).toMatch(/level 3: \d+ characters, expected 30-420/)
    expect(withTechnique('rectangle').join()).not.toContain('characters')
    expect(withTechnique('chain').join()).not.toContain('characters')
  })

  it('even a chain has a limit', () => {
    const problems = audit((s) => {
      setLevel3(s, crossing, `${long} ${long}`, cross)
      s[crossing]!.level3.technique = { id: 'chain', title: 'chain' }
    })
    expect(problems.join()).toMatch(/expected 30-800/)
  })
})

describe('the audit checks against the limits the hints are made with', () => {
  it('has the same square limits as the game', () => {
    expect([MAX_NAMED_CELLS, MAX_POSSIBLE_SQUARES, MAX_CROSSED_SQUARES]).toEqual([GAME_MAX_NAMED, GAME_MAX_POSSIBLE, GAME_MAX_CROSSED])
  })
})
