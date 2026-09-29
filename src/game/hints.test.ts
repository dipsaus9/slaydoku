import { describe, expect, it } from 'vitest'
import { demoPuzzle } from '../content/demo/puzzle.ts'
import type { Puzzle } from '../engine/model/index.ts'
import { defaultRegistry, solveHuman } from '../engine/solver/human/index.ts'
import { uniquePuzzle } from '../engine/solver/testing.fixture.ts'
import { hasMark, hasNote } from './board.ts'
import { at, puzzle } from './fixture.ts'
import { hardPuzzle, hintPath } from './hints.fixture.ts'
import { getHint, hintFor, nextStep } from './hints.ts'
import type { NextStep } from './hints.ts'
import { initialState, reduce } from './reducer.ts'
import type { GameAction, GameState } from './types.ts'

const marking = { autoXOnPlace: true, preventXOnBlocked: true, showTimer: true }
const run = (state: GameState, ...actions: GameAction[]) => actions.reduce((s, a) => reduce(puzzle, s, a), state)
const empty = () => initialState(marking)

/** Does what the hint asks for: puts the person down, makes the notes, or crosses the squares out. */
function follow(p: Puzzle, s: GameState, next: NextStep): GameState {
  if (next.placement) return reduce(p, s, { type: 'place', personId: next.placement.personId, cell: next.placement.cell })
  const actions: GameAction[] = next.focus
    ? next.focus.cells
        .filter((cell) => !hasNote(s.board, next.focus!.personId, cell))
        .map((cell): GameAction => ({ type: 'toggleNote', personId: next.focus!.personId, cell }))
    : (next.eliminations ?? []).filter((e) => !hasMark(s.board, e.personId, e.cell)).map((e): GameAction => ({ type: 'toggleMark', personId: e.personId, cell: e.cell }))
  return actions.reduce((acc, action) => reduce(p, acc, action), s)
}

describe('hint levels on the empty grid', () => {
  it('level 1 names people and areas only', () => {
    const hint = getHint(puzzle, empty(), 1)
    expect(hint).toMatchObject({ level: 1, personIds: ['C'] })
    expect(Object.keys(hint as object).sort()).toEqual(['level', 'personIds', 'roomIds', 'text'])
    expect((hint as { text: string }).text).not.toMatch(/r\d+[kc]\d+/)
  })

  it('level 2 adds cells, still no explanation', () => {
    const hint = getHint(puzzle, empty(), 2)
    expect(hint?.level).toBe(2)
    expect(Object.keys(hint as object).sort()).toEqual(['cells', 'level', 'personIds', 'roomIds', 'text'])
    expect((hint as { cells: unknown[] }).cells.length).toBeGreaterThan(0)
  })

  it('level 3 adds the reasoning, the instruction and the technique for the record', () => {
    const hint = getHint(puzzle, empty(), 3)
    if (hint?.level !== 3) throw new Error('level')
    expect(hint.explanation).toContain('C\'s card says: "C stood next to a window."')
    expect(hint.text).toBe(`${hint.explanation} ${hint.instruction}`)
    expect(hint.instruction).toBe('Place C on row 3, column 4.')
    expect(hint.technique).toEqual({ id: 'single-candidate', title: expect.any(String) })
  })

  it('is stable: the same state gives the same hint', () => {
    expect(getHint(puzzle, empty(), 3)).toEqual(getHint(puzzle, empty(), 3))
  })

  it('stays deterministic and the higher levels extend the lower ones', () => {
    const h1 = getHint(puzzle, empty(), 1)
    const h2 = getHint(puzzle, empty(), 2)
    expect(h2).toMatchObject({ personIds: h1?.personIds, roomIds: h1?.roomIds })
  })
})

describe('the best next move', () => {
  it('is a placement as soon as somebody has one possible square: no reading of cards first', () => {
    const next = nextStep(puzzle, empty())
    expect(next?.placement).toEqual({ personId: 'C', cell: at.C })
    expect(next?.focus).toMatchObject({ personId: 'C', cells: [at.C], cards: [2] })
  })

  it('a placement reads as card and person, then the square, then the reasoning and an explicit instruction', () => {
    const [first] = hintPath(puzzle)
    expect(first?.level1).toBe('Read C\'s card: "C stood next to a window." With all the cards together, C can only stand on one square.')
    expect(first?.level2).toBe('Look at row 3, column 4. C must stand there.')
    expect(first?.level3).toBe(
      'C\'s card says: "C stood next to a window." All the cards together leave only one square for C: row 3, column 4. Place C on row 3, column 4.',
    )
  })

  it('moves on once somebody is placed correctly', () => {
    const s = run(empty(), { type: 'place', personId: 'C', cell: at.C })
    const next = nextStep(puzzle, s)
    expect(next?.placement?.personId).not.toBe('C')
    expect(next?.focus?.placed).toBe(true)
  })

  it('leads with the true cell even when the player placed somebody wrong', () => {
    const s = run(empty(), { type: 'place', personId: 'C', cell: { row: 1, col: 1 } })
    expect(nextStep(puzzle, s)?.placement).toEqual(nextStep(puzzle, empty())?.placement)
  })

  it('does not depend on what the player crossed out or noted', () => {
    const s = run(empty(), { type: 'toggleMark', personId: 'C', cell: { row: 0, col: 1 } }, { type: 'toggleNote', personId: 'A', cell: { row: 1, col: 2 } })
    expect(nextStep(puzzle, s)?.placement).toEqual(nextStep(puzzle, empty())?.placement)
  })

  it('guides all the way to the solution, one placement per suspect, then the victim fills in on its own', () => {
    let s = empty()
    const order: string[] = []
    for (let i = 0; i < 10 && s.status === 'playing'; i++) {
      const next = nextStep(puzzle, s)
      if (!next?.placement) throw new Error('expected a placement')
      order.push(next.placement.personId)
      s = follow(puzzle, s, next)
    }
    expect(s.status).toBe('solved')
    expect([...order].sort()).toEqual(['A', 'B', 'C'])
    expect(s.board.placements.V).toEqual(at.V)
  })

  it('returns null when everybody is right', () => {
    const done = run(
      empty(),
      { type: 'place', personId: 'C', cell: at.C },
      { type: 'place', personId: 'B', cell: at.B },
      { type: 'place', personId: 'A', cell: at.A },
      { type: 'place', personId: 'V', cell: at.V },
    )
    expect(getHint(puzzle, done, 1)).toBeNull()
  })

  it('returns null when the solver has nothing (no clues to reason with)', () => {
    expect(getHint({ ...puzzle, clues: [] }, empty(), 1)).toBeNull()
  })
})

describe('when nobody has one possible square', () => {
  // A hard puzzle on 6x6: the cards leave everybody two or more squares at first.
  const hard = hardPuzzle()

  it('asks for a note on the squares of the person with the fewest possible ones (at most six)', () => {
    const next = nextStep(hard, empty())
    expect(next?.placement).toBeUndefined()
    expect(next?.focus?.cells.length).toBeGreaterThan(1)
    expect(next?.focus?.cells.length).toBeLessThanOrEqual(6)
    const h1 = getHint(hard, empty(), 1)
    const h2 = getHint(hard, empty(), 2)
    const h3 = getHint(hard, empty(), 3)
    if (h1?.level !== 1 || h2?.level !== 2 || h3?.level !== 3) throw new Error('levels')
    // Level 1: the card and how many squares are possible.
    expect(h1.text).toMatch(/^Read \S+'s card: ".+" With all the cards together, \S+ can only stand on \S+ squares\.$/)
    // Level 2: only the possible squares, named.
    expect(h2.cells).toEqual(next?.focus?.cells)
    expect(h2.text).toMatch(/^\S+ can only stand on row \d+, column \d+.*\. Those squares are marked on the board\.$/)
    // Level 3: the reasoning and an explicit instruction to make a note.
    expect(h3.instruction).toMatch(/^Note squares for \S+ on row \d+, column \d+.*\.$/)
    expect(h3.explanation).toContain('We do not know yet which one it is.')
    expect(h3.placement).toBeUndefined()
  })

  it('goes on to the next deduction once the note is made', () => {
    const first = nextStep(hard, empty())!
    const noted = follow(hard, empty(), first)
    const second = nextStep(hard, noted)
    expect(second?.focus).toBeUndefined()
    expect(second?.eliminations?.length).toBeGreaterThan(0)
    expect(second?.step.technique).toEqual(expect.any(String))
  })

  it('never asks to cross out more than 12 squares, and never crosses out what the cards ruled out already', () => {
    let s = empty()
    for (let i = 0; i < 40 && s.status === 'playing'; i++) {
      const next = nextStep(hard, s)
      if (!next) break
      if (next.eliminations) expect(new Set(next.eliminations.map((e) => `${e.cell.row},${e.cell.col}`)).size).toBeLessThanOrEqual(12)
      s = follow(hard, s, next)
    }
    expect(s.status).toBe('solved')
  })

  it('after the last technique beyond the basic ones every hint is a placement: the freed squares are worked out in it', () => {
    const path = hintPath(hard)
    const lastCrossing = path.map((h) => h.placed).lastIndexOf(false)
    expect(path.slice(0, lastCrossing + 1).some((h) => h.level3.includes('Put a cross'))).toBe(true)
    expect(path.slice(lastCrossing + 1).every((h) => h.placed)).toBe(true)
    expect(path.length).toBeLessThanOrEqual(hard.people.length + 4)
  })
})

describe('hints on generated puzzles', () => {
  it('every placement hint is the true cell and the hints lead to a solved level', () => {
    let followed = 0
    for (let seed = 1; seed <= 30; seed++) {
      const { scene, people, solution, clues } = uniquePuzzle(seed, 5, 2)
      const generated = { scene, people, solution, clues }
      if (!solveHuman(scene, people, clues, { techniques: defaultRegistry.list() }).solved) continue
      followed++
      let s = empty()
      for (let i = 0; i < 200 && s.status === 'playing'; i++) {
        const next = nextStep(generated, s)
        if (!next) break
        if (next.placement) {
          const truth = solution.find((p) => p.personId === next.placement?.personId)
          expect(next.placement.cell).toEqual(truth?.cell)
        }
        s = follow(generated, s, next)
      }
      expect(s.status).toBe('solved')
    }
    expect(followed).toBeGreaterThanOrEqual(3)
  })
})

describe('the victim label in hint text', () => {
  const victimised: typeof puzzle = {
    ...puzzle,
    people: puzzle.people.map((p) => (p.kind === 'victim' ? { ...p, label: 'the victim' } : p)),
  }
  const sentenceStart = /(^|[.!?]\s+)the victim/

  it('starts with a capital when it opens a sentence, in the hint and in the explanation', () => {
    const step = {
      index: 1,
      technique: 'clue',
      level: 1,
      explanation: 'the victim is in the Kitchen. That is the murderer. the victim cannot stand next to the victim.',
      people: ['V'],
      cells: [at.V],
      placed: { personId: 'V', cell: at.V },
      eliminated: [],
    }
    // The solver's own step (no person to look at): the way the lab tells a step of the solve trace.
    const h2 = hintFor(victimised, { step, placement: step.placed }, 2)
    expect(h2.text).toBe('Look at row 1, column 1. The victim must stand there.')
    const h3 = hintFor(victimised, { step, placement: step.placed }, 3)
    if (h3.level !== 3) throw new Error('level')
    expect(h3.explanation).toBe(
      'The victim is in the Kitchen. That is the murderer. The victim cannot stand next to the victim.',
    )
    expect(h3.instruction).toBe('Place the victim on row 1, column 1.')
    expect(h3.text).toBe(`${h3.explanation} ${h3.instruction}`)
    expect(hintFor(victimised, { step, placement: step.placed }, 1).text).toBe('Take a look at the victim in the Living Room.')
  })

  it('never offers a hint about the victim: the moment every suspect is placed, the victim fills in on its own', () => {
    const last = run(empty(), { type: 'place', personId: 'C', cell: at.C }, { type: 'place', personId: 'B', cell: at.B }, { type: 'place', personId: 'A', cell: at.A })
    expect(last.board.placements.V).toEqual(at.V)
    expect(last.status).toBe('solved')
    expect(nextStep(victimised, last)).toBeNull()
    expect(getHint(victimised, last, 1)).toBeNull()
  })

  it('no hint along a whole game leaves the victim lower case at a sentence start', () => {
    // The victim never gets a hint of their own (SLAY-9.5): every entry here is a suspect.
    const path = hintPath(victimised)
    expect(path.length).toBe(3)
    for (const h of path) for (const text of [h.level1, h.level2, h.level3]) expect(text).not.toMatch(sentenceStart)
  })
})

describe('hint texts on the demo level and a hard puzzle', () => {
  const houses: Record<string, Puzzle> = {
    demo: demoPuzzle,
    hard: hardPuzzle(),
  }
  const techniqueIds = defaultRegistry.list().map((t) => t.id)
  const english = /\b(the|look|place|put|stand|card|row|column|squares?|on)\b/i
  const jargon = new RegExp(`\\b(${[...techniqueIds, 'technique', 'elimination', 'candidate', 'deduction'].join('|')})\\b`, 'i')

  describe.each(Object.entries(houses))('%s', (name, p) => {
    const path = hintPath(p)

    it('is followed to the end of the level, and no hint before the first placement is a bare crossing (the hard puzzle opens with a note)', () => {
      // At least one hint step per suspect: the victim never gets a hint step of their own (SLAY-9.5).
      const suspectCount = p.people.filter((person) => person.kind === 'suspect').length
      expect(path.length).toBeGreaterThanOrEqual(suspectCount)
      expect(path[0]?.placed).toBe(name === 'demo')
    })

    it('every text of every step is filled, English, jargon-free and short enough', () => {
      path.forEach((h, i) => {
        const where = `${name} step ${i + 1}`
        for (const [text, max] of [[h.level1, 220], [h.level2, 220], [h.level3, 420]] as const) {
          expect(text.trim(), where).not.toBe('')
          expect(text, where).toMatch(english)
          expect(text, where).not.toMatch(jargon)
          expect(text.length, `${where}: ${text}`).toBeLessThan(max)
        }
      })
    })

    it('ends every level-3 text with what to do: place somebody, or note or cross squares', () => {
      for (const h of path) {
        expect(h.level3).toMatch(h.placed ? /Place .+ on row \d+, column \d+\.$/ : /(Put a cross|Note squares) .+\.$/)
      }
    })

    it('a placement level 3 carries the placement the button uses', () => {
      let s = empty()
      for (let i = 0; i < 100 && s.status === 'playing'; i++) {
        const next = nextStep(p, s)
        if (!next) break
        const hint = getHint(p, s, 3)
        if (next.placement) expect(hint).toMatchObject({ level: 3, placement: next.placement })
        else expect(hint).not.toHaveProperty('placement')
        s = follow(p, s, next)
      }
      expect(s.status).toBe('solved')
    })
  })
})
