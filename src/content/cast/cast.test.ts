import { describe, expect, it } from 'vitest'
import { CAST_LETTERS, CAST_POOL, MAX_CAST_SIZE, castFor, castProblems, initialOf, namesFor, poolEntry, sharedNames } from './index.ts'

const SIZES = [6, 7, 8, 9, 10, 11, 12]
const women = (genders: readonly string[]) => genders.filter((g) => g === 'woman').length

describe('the cast pool', () => {
  it('holds only plain, capitalised, unique first names', () => {
    const lower = CAST_POOL.map((n) => n.name.toLowerCase())
    expect(new Set(lower).size).toBe(CAST_POOL.length)
    for (const { name } of CAST_POOL) expect(name).toMatch(/^[A-Z][a-z]{1,7}$/)
  })

  it('covers the letters A-Y without Q, U, X and Z', () => {
    expect(CAST_LETTERS.join('')).toBe('ABCDEFGHIJKLMNOPRSTVWY')
    expect(MAX_CAST_SIZE).toBe(CAST_LETTERS.length + 1)
  })

  it('has both genders on every letter, at least two names of each, and 4 to 6 names per letter', () => {
    for (const letter of CAST_LETTERS) {
      expect(namesFor(letter, 'woman').length, letter).toBeGreaterThanOrEqual(2)
      expect(namesFor(letter, 'man').length, letter).toBeGreaterThanOrEqual(2)
      const all = CAST_POOL.filter((n) => initialOf(n.name) === letter).length
      expect(all, letter).toBeGreaterThanOrEqual(4)
      expect(all, letter).toBeLessThanOrEqual(6)
    }
  })

  it('has women and men in roughly equal numbers', () => {
    const w = CAST_POOL.filter((n) => n.gender === 'woman').length
    expect(Math.abs(w - (CAST_POOL.length - w))).toBeLessThanOrEqual(10)
  })

  it('looks a name up', () => {
    expect(poolEntry('Alice')).toEqual({ name: 'Alice', gender: 'woman' })
    expect(poolEntry('Ben')?.gender).toBe('man')
    expect(poolEntry('Zed')).toBeUndefined()
  })
})

describe('castFor', () => {
  it.each(SIZES)('gives a %s-person puzzle size - 1 suspects: unique first letters, pool names, balanced genders', (size) => {
    for (let seed = 0; seed < 100; seed++) {
      const { names, genders, portraits } = castFor(size, `seed-${seed}`)
      expect(names, `seed ${seed}`).toHaveLength(size - 1)
      expect(genders).toHaveLength(size - 1)
      expect(portraits).toHaveLength(size - 1)
      expect(new Set(names.map(initialOf)).size, `seed ${seed}`).toBe(size - 1)
      expect(names.every((n) => poolEntry(n) !== undefined)).toBe(true)
      expect(genders).toEqual(names.map((n) => poolEntry(n)!.gender))
      expect(Math.abs(women(genders) - (genders.length - women(genders))), `seed ${seed}`).toBeLessThanOrEqual(1)
      expect(castProblems(names, genders)).toEqual([])
    }
  })

  it('goes from one person to the largest cast', () => {
    expect(castFor(1, 1).names).toEqual([])
    expect(castFor(MAX_CAST_SIZE, 1).names).toHaveLength(CAST_LETTERS.length)
    expect(() => castFor(MAX_CAST_SIZE + 1, 1)).toThrow(RangeError)
    expect(() => castFor(0, 1)).toThrow(RangeError)
    expect(() => castFor(2.5, 1)).toThrow(RangeError)
  })

  it('is deterministic per seed and varies with it', () => {
    expect(castFor(9, 'a')).toEqual(castFor(9, 'a'))
    expect(castFor(9, 42)).toEqual(castFor(9, 42))
    const sets = new Set(Array.from({ length: 50 }, (_, i) => castFor(9, i).names.join()))
    expect(sets.size).toBeGreaterThan(45)
  })

  it('lists the names alphabetically by first letter', () => {
    const { names } = castFor(12, 'order')
    expect(names.map(initialOf)).toEqual([...names.map(initialOf)].sort())
  })

  it('lets the seed decide which gender has one more on an odd number of suspects', () => {
    const extra = new Set(Array.from({ length: 40 }, (_, i) => women(castFor(8, i).genders)))
    expect(extra).toEqual(new Set([3, 4]))
  })

  it('never repeats a name of the previous cast, and keeps to other letters while there are some', () => {
    for (const size of SIZES) {
      let previous = castFor(size, 'day-0').names
      for (let day = 1; day <= 60; day++) {
        const today = castFor(size, `day-${day}`, previous)
        expect(sharedNames(today.names, previous), `size ${size} day ${day}`).toEqual([])
        // up to 11 suspects fit in the letters the day before left free
        expect(today.names.map(initialOf).filter((l) => previous.map(initialOf).includes(l)), `size ${size} day ${day}`).toEqual([])
        expect(castProblems(today.names, today.genders)).toEqual([])
        previous = today.names
      }
    }
  })

  it('avoids the previous names even on the largest cast, where letters must repeat', () => {
    const previous = castFor(MAX_CAST_SIZE, 'x').names
    for (let i = 0; i < 20; i++) {
      const next = castFor(MAX_CAST_SIZE, `y${i}`, previous)
      expect(sharedNames(next.names, previous)).toEqual([])
      expect(castProblems(next.names, next.genders)).toEqual([])
    }
  })

  it('ignores case and spaces in the previous names', () => {
    const next = castFor(12, 'z', [' alice ', 'BEN'])
    expect(next.names).not.toContain('Alice')
    expect(next.names).not.toContain('Ben')
  })
})

describe('castProblems', () => {
  it('accepts the sample cast', () => {
    expect(castProblems(['Alice', 'Ben', 'Chloe', 'Dan'], ['woman', 'man', 'woman', 'man'])).toEqual([])
  })

  it('rejects duplicate first letters', () => {
    expect(castProblems(['Alice', 'Amy', 'Ben', 'Dan'])).toEqual([expect.stringContaining('share the first letter A')])
  })

  it('rejects names outside the pool', () => {
    expect(castProblems(['Alice', 'Zed'])).toEqual([expect.stringContaining('not in the cast pool: Zed')])
  })

  it('rejects unbalanced genders and genders that differ from the pool', () => {
    expect(castProblems(['Alice', 'Chloe', 'Emma', 'Grace'])).toEqual([expect.stringContaining('not balanced: 4 women, 0 men')])
    expect(castProblems(['Alice', 'Ben'], ['man', 'man'])).toEqual([expect.stringContaining('"Alice" is a woman in the pool, not man')])
    expect(castProblems(['Alice', 'Ben'], ['woman'])).toContain('2 names but 1 genders')
  })
})
