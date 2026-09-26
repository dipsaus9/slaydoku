import { describe, expect, it } from 'vitest'
import { ladderCheck } from './ladder.ts'
import { combinedGenderLadder, combinedLadder, genderLadder, noCards, oneCardLadder, referenceLadder, soloPuzzle, twoCardIntersection } from './testing.fixture.ts'

const cardsPerStep = (result: ReturnType<typeof ladderCheck>) => result.steps.map((s) => s.clues.length)

describe('ladderCheck', () => {
  it('walks a hand-made ladder one card at a time and reports the order', () => {
    const result = ladderCheck(oneCardLadder, { maxCards: 1, references: false })
    expect(result.ok).toBe(true)
    expect(result.stuck).toEqual([])
    expect(result.steps.map((s) => s.personId)).toEqual(['C', 'B', 'A', 'V'])
    expect(cardsPerStep(result)).toEqual([1, 1, 1, 0])
    expect(result.steps.map((s) => s.cell)).toEqual([
      { row: 2, col: 3 },
      { row: 3, col: 1 },
      { row: 1, col: 2 },
      { row: 0, col: 0 },
    ])
  })

  it('reports per step: squares from the card, squares from the lines, squares after both', () => {
    const [c, b, a] = ladderCheck(oneCardLadder, { maxCards: 1, references: false }).steps
    // C: the window leaves 1 square straight away; nobody is placed yet, so the lines leave all 13 squares.
    expect(c).toMatchObject({ placedBefore: 0, squaresFromCards: 1, squaresFromLines: 13, squaresAfterBoth: 1 })
    // B: the bed has 2 squares; C's row and column leave 7 squares of the 13.
    expect(b).toMatchObject({ placedBefore: 1, squaresFromCards: 2, squaresFromLines: 7, squaresAfterBoth: 1 })
    // A: column 2 has 3 squares (the table blocks the 4th).
    expect(a).toMatchObject({ placedBefore: 2, squaresFromCards: 3, squaresAfterBoth: 1 })
  })

  it('needs two cards together for a two-card intersection, and says which', () => {
    expect(ladderCheck(twoCardIntersection, { maxCards: 1, references: false }).ok).toBe(false)
    const result = ladderCheck(twoCardIntersection, { maxCards: 2, references: false })
    expect(result.ok).toBe(true)
    expect(result.steps.map((s) => s.personId)).toEqual(['B', 'C', 'A', 'V'])
    const [b] = result.steps
    expect(b?.clues).toEqual([0, 1])
    // On the bed: 2 squares; in the bottom row: 3; both: 1.
    expect(b?.squaresFromCards).toBe(1)
    expect(cardsPerStep(result)).toEqual([2, 1, 1, 0])
  })

  it('counts a combined card as ONE card: what takes two separate cards takes one when they share a card', () => {
    const result = ladderCheck(combinedLadder, { maxCards: 1, references: false })
    expect(result.ok).toBe(true)
    expect(result.steps.map((s) => s.personId)).toEqual(['B', 'C', 'A', 'V'])
    expect(cardsPerStep(result)).toEqual([1, 1, 1, 0])
    expect(result.steps[0]?.clues).toEqual([0])
    // The card leaves the squares BOTH parts leave: on the bed and in the bottom row is one square.
    expect(result.steps[0]?.squaresFromCards).toBe(1)
  })

  it('a combined card with a gender part names other people: it is only used once they are placed, and not without references', () => {
    expect(ladderCheck(combinedGenderLadder, { maxCards: 3, references: false }).ok).toBe(false)
    const result = ladderCheck(combinedGenderLadder, { maxCards: 3, references: true })
    expect(result.ok).toBe(true)
    const order = result.steps.map((s) => s.personId)
    expect(order.indexOf('C')).toBeLessThan(order.indexOf('B'))
  })

  it('reports who is stuck and how many squares stay possible', () => {
    const result = ladderCheck(twoCardIntersection, { maxCards: 1, references: false })
    expect(result.ok).toBe(false)
    expect(result.steps).toEqual([])
    expect(result.stuck.find((s) => s.personId === 'B')?.squares).toBe(2)
    expect(result.stuck.map((s) => s.personId).sort()).toEqual(['A', 'B', 'C', 'V'])
  })

  it('uses a card that names a person only once that person is placed, and only when references are allowed', () => {
    const without = ladderCheck(referenceLadder, { maxCards: 2, references: false })
    expect(without.ok).toBe(false)
    expect(without.stuck.map((s) => s.personId)).toContain('B')
    const withRefs = ladderCheck(referenceLadder, { maxCards: 2, references: true })
    expect(withRefs.ok).toBe(true)
    const order = withRefs.steps.map((s) => s.personId)
    expect(order.indexOf('C')).toBeLessThan(order.indexOf('B'))
    expect(withRefs.steps.find((s) => s.personId === 'B')?.clues).toEqual([1, 2])
  })

  it('treats a gender card as a person reference: usable once the people of that gender are placed, and only with references', () => {
    expect(ladderCheck(genderLadder, { maxCards: 2, references: false }).ok).toBe(false)
    const result = ladderCheck(genderLadder, { maxCards: 2, references: true })
    expect(result.ok).toBe(true)
    const order = result.steps.map((s) => s.personId)
    // B is "alone with a man": the only other man, C, is placed first.
    expect(order.indexOf('C')).toBeLessThan(order.indexOf('B'))
    expect(result.steps.find((s) => s.personId === 'B')?.clues).toEqual([3, 4])
  })

  it('a gender card is about nobody when nobody has a gender: the ladder cannot use it', () => {
    const plain = { ...genderLadder, people: genderLadder.people.map(({ gender: _gender, ...rest }) => rest) }
    expect(ladderCheck(plain, { maxCards: 3, references: true }).ok).toBe(false)
  })

  it('fails a puzzle without cards', () => {
    const result = ladderCheck(noCards)
    expect(result.ok).toBe(false)
    expect(result.steps).toEqual([])
  })

  it('is deterministic and does not touch the puzzle', () => {
    const before = JSON.stringify(twoCardIntersection)
    const a = ladderCheck(twoCardIntersection)
    const b = ladderCheck(twoCardIntersection)
    expect(a).toEqual(b)
    expect(JSON.stringify(twoCardIntersection)).toBe(before)
  })

  it('places two people from their own card alone before anything else', () => {
    const result = ladderCheck(soloPuzzle, { maxCards: 1, references: false })
    expect(result.ok).toBe(true)
    expect(result.steps.map((s) => [s.personId, s.placedBefore, s.clues.length])).toEqual([
      ['A', 0, 1],
      ['B', 1, 1],
      ['V', 2, 0],
    ])
  })

  describe('caps on squares per card and on chains of dependent placements (CAD-8.7)', () => {
    const options = { maxCards: 2, references: true }

    it('reports per placement how long a chain of placements it depends on, and the most squares a card left', () => {
      const result = ladderCheck(oneCardLadder, options)
      // C stands alone; B needs C's row (one square of the bed goes); A needs B's row and column too, on top of C's.
      expect(result.steps.map((s) => [s.personId, s.squaresFromCards, s.chain])).toEqual([
        ['C', 1, 0],
        ['B', 2, 1],
        ['A', 3, 2],
        ['V', 13, 0],
      ])
      // The gift takes the last square with no card: it is not counted.
      expect(result.maxSquaresFromCards).toBe(3)
      expect(result.chainLength).toBe(2)
    })

    it('two people placeable from their own card have a chain of 0', () => {
      const result = ladderCheck(soloPuzzle, { maxCards: 1, references: false })
      expect(result.steps.map((s) => s.chain)).toEqual([0, 0, 0])
      expect(result.chainLength).toBe(0)
    })

    it('needs the people a card names: "with C" makes B depend on C even where the cards alone leave one square', () => {
      const result = ladderCheck(referenceLadder, options)
      const [c, b] = result.steps
      expect(c?.chain).toBe(0)
      expect(b?.chain).toBe(1)
    })

    it('refuses a placement whose cards leave more squares than the cap, and says who is stuck', () => {
      expect(ladderCheck(oneCardLadder, { ...options, maxSquaresFromCards: 3 }).ok).toBe(true)
      const capped = ladderCheck(oneCardLadder, { ...options, maxSquaresFromCards: 2 })
      expect(capped.ok).toBe(false)
      expect(capped.steps.map((s) => s.personId)).toEqual(['C', 'B'])
      expect(capped.stuck.map((s) => s.personId)).toContain('A')
    })

    it('holds the last three placements to the tighter cap (the free last one aside)', () => {
      // Four people: B, A and the gift are the last three, so B (2 squares) and A (3) both fall under it.
      expect(ladderCheck(oneCardLadder, { ...options, lastSquaresFromCards: 3 }).ok).toBe(true)
      expect(ladderCheck(oneCardLadder, { ...options, lastSquaresFromCards: 2 }).ok).toBe(false)
      // Whatever the tier cap, the tighter cap wins.
      expect(ladderCheck(oneCardLadder, { ...options, maxSquaresFromCards: 9, lastSquaresFromCards: 1 }).ok).toBe(false)
    })

    it('refuses a chain longer than the cap', () => {
      expect(ladderCheck(oneCardLadder, { ...options, maxChain: 2 }).ok).toBe(true)
      expect(ladderCheck(oneCardLadder, { ...options, maxChain: 1 }).ok).toBe(false)
      expect(ladderCheck(oneCardLadder, { ...options, maxChain: 0 }).ok).toBe(false)
    })

    it('without caps the result is the same as before: the caps only ever take placements away', () => {
      const free = ladderCheck(twoCardIntersection, options)
      const generous = ladderCheck(twoCardIntersection, { ...options, maxSquaresFromCards: 99, lastSquaresFromCards: 99, maxChain: 99 })
      expect(generous).toEqual(free)
    })
  })
})
