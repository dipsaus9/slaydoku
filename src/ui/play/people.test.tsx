import { describe, expect, it } from 'vitest'
import { generate, makePeople } from '../../engine/generator/index.ts'
import { tutorialPuzzle } from '../../engine/model/tutorial.fixture.ts'
import { renderToStaticMarkup } from 'react-dom/server'
import { cardLookOf } from '../../render/cards/index.ts'
import { readSchedule } from '../../schedule/schedule.testing.ts'
import { castFor as castFor2, colorsFor, formatTime, VICTIM_TAG, noteTags, withCastNames } from './people.ts'
import { DEMO_VICTIM_CELLS, demoScene } from '../../content/demo/scene.ts'
import { castFor } from '../../content/cast/index.ts'

const person = (id: string, label: string) => ({ id, kind: 'suspect' as const, label })

describe('noteTags', () => {
  it('keeps letters as they are and gives the victim the skull tag', () => {
    expect(noteTags(makePeople(4))).toEqual({ V: VICTIM_TAG, A: 'A', B: 'B', C: 'C' })
  })

  it('uses initials, and unclaimed letters of the name on a clash', () => {
    const names = ['Alice', 'Anna', 'Ben', 'Bob', 'Chloe', 'Cleo', 'Dan', 'Dora']
    const tags = noteTags(names.map((n, i) => person(String.fromCharCode(65 + i), n)))
    expect(names.map((_, i) => tags[String.fromCharCode(65 + i)])).toEqual(['A', 'N', 'B', 'O', 'C', 'L', 'D', 'R'])
  })

  it('stays unique for a full 15-suspect cast with clashes', () => {
    const labels = Array.from({ length: 15 }, (_, i) => `Sam${i}`)
    const tags = Object.values(noteTags(labels.map((l, i) => person(`p${i}`, l))))
    expect(new Set(tags).size).toBe(15)
    for (const t of tags) expect([...t]).toHaveLength(1)
  })
})

describe('colorsFor', () => {
  it('gives every person a colour', () => {
    const people = makePeople(9)
    const colors = colorsFor(people)
    expect(Object.keys(colors)).toHaveLength(9)
    expect(new Set(Object.values(colors)).size).toBeGreaterThan(7)
  })
})

describe('withCastNames', () => {
  it('names letter suspects after the cast and leaves the rest of the puzzle alone', () => {
    const named = withCastNames(tutorialPuzzle)
    expect(named.people.filter((p) => p.kind === 'suspect').map((p) => p.label)).toEqual(castFor(4, 'slaydoku').names)
    expect(named.people.find((p) => p.kind === 'victim')?.label).toBe('V')
    expect(named.solution).toBe(tutorialPuzzle.solution)
    expect(named.people.map((p) => p.id)).toEqual(tutorialPuzzle.people.map((p) => p.id))
  })

  it('brings the gender of the cast and leaves the gift without one', () => {
    const puzzle = generate(demoScene, { seed: 7, victimCell: DEMO_VICTIM_CELLS[0] })
    const played = withCastNames(puzzle)
    const suspects = played.people.filter((p) => p.kind === 'suspect')
    const cast = castFor(9, 'slaydoku')
    expect(suspects.map((p) => [p.label, p.gender])).toEqual(cast.names.map((n, i) => [n, cast.genders[i]]))
    expect(played.people.find((p) => p.kind === 'victim')?.gender).toBeUndefined()
  })

  it('keeps puzzles that already have names', () => {
    const named = withCastNames(tutorialPuzzle)
    expect(withCastNames(named)).toBe(named)
  })

  it('works on a generated 9x9', () => {
    const puzzle = generate(demoScene, { seed: 7, victimCell: DEMO_VICTIM_CELLS[0] })
    expect(withCastNames(puzzle).people.filter((p) => p.kind === 'suspect')).toHaveLength(8)
  })
})

describe('formatTime', () => {
  it('formats minutes and hours', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(65_400)).toBe('1:05')
    expect(formatTime(3_723_000)).toBe('1:02:03')
    expect(formatTime(-5)).toBe('0:00')
  })
})

describe('castFor with the portraits of a scheduled day', () => {
  const day = readSchedule().days[3]!
  const puzzle = withCastNames(day.puzzle)

  it('shows the baked looks, one per suspect in seat order', () => {
    const baked = castFor2(puzzle, undefined, day.portraits)
    const own = castFor2(puzzle)
    expect(baked.entries.map((e) => e.name)).toEqual(puzzle.people.filter((p) => p.kind === 'suspect').map((p) => p.label))
    for (const [i, entry] of baked.entries.entries()) {
      const html = renderToStaticMarkup(<>{entry.look.portrait}</>)
      expect(html, entry.name).toContain(day.portraits[i]!.skin)
      expect(entry.look.photo).toBe(cardLookOf(day.portraits[i]!).photo)
    }
    expect(baked.lookFor(baked.names[0]!)).toBe(baked.entries[0]!.look)
    // Not the same as the looks drawn from the default seed: the day's own faces are what the player sees.
    expect(baked.entries.map((e) => e.look.photo)).not.toEqual(own.entries.map((e) => e.look.photo))
  })

  it('falls back to the drawn looks when the count does not match', () => {
    const own = castFor2(puzzle)
    expect(castFor2(puzzle, undefined, day.portraits.slice(1)).entries.map((e) => e.look.photo)).toEqual(own.entries.map((e) => e.look.photo))
  })
})
