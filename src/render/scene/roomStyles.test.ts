import { describe, expect, it } from 'vitest'
import { readSchedule } from '../../schedule/schedule.testing.ts'
import { colourDistance, resolveRoomStyles, roomNeighbours, ROOM_STYLES } from './roomStyles.ts'

const { days } = readSchedule()
/** The fallback of THEME.labelInk (theme.ts), the ink of room names. */
const LABEL_INK = '#2a2a36'

/** Relative luminance (WCAG) of a #rrggbb colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

describe('room tints (SLAY-20)', () => {
  it('every tone of a floor kind is clearly another colour than the other tones of that kind', () => {
    for (const style of Object.values(ROOM_STYLES)) {
      style.variants.forEach((a, i) =>
        style.variants.slice(i + 1).forEach((b) => expect(colourDistance(a.fill, b.fill), `${style.id} ${a.fill} ${b.fill}`).toBeGreaterThanOrEqual(8.5)),
      )
    }
  })

  it('every tone stays light: dark label ink reads on it, and white note halos and person discs still stand out', () => {
    for (const style of Object.values(ROOM_STYLES)) {
      for (const tone of style.variants) {
        expect(contrast(LABEL_INK, tone.fill), `${style.id} ${tone.fill} vs label ink`).toBeGreaterThanOrEqual(7)
        expect(contrast('#ffffff', tone.fill), `${style.id} ${tone.fill} vs white`).toBeGreaterThanOrEqual(1.05)
      }
    }
  })

  it(`two rooms that touch (a wall or a corner) never share a tint, on every scheduled day (${days.length} days)`, () => {
    let pairs = 0
    let clear = 0
    for (const day of days) {
      const scene = day.puzzle.scene
      const styles = resolveRoomStyles(scene)
      for (const [room, next] of roomNeighbours(scene)) {
        for (const other of next) {
          const [a, b] = [styles[room]!, styles[other]!]
          expect(a.fill, `${day.date} ${room}/${other}`).not.toBe(b.fill)
          pairs++
          if (colourDistance(a.fill, b.fill) >= 9) clear++
        }
      }
    }
    // Not only different hex codes: nearly every touching pair is a clearly different colour.
    expect(clear / pairs).toBeGreaterThanOrEqual(0.97)
  })

  it('is deterministic: the same scene always gets the same tints', () => {
    const scene = days[0]!.puzzle.scene
    expect(resolveRoomStyles(scene)).toEqual(resolveRoomStyles(structuredClone(scene)))
  })

  it('gives a room with more same-kind neighbours than tones a shade of its own', () => {
    // A hall in the middle of five tiled rooms around it, all touching it and each other in a ring.
    const cellRooms = [
      ['a', 'b', 'c'],
      ['f', 'h', 'd'],
      ['f', 'e', 'd'],
    ]
    const rooms = ['a', 'b', 'c', 'd', 'e', 'f', 'h'].map((id) => ({ id, name: 'Kitchen' }))
    const styles = resolveRoomStyles({ rooms, cellRooms })
    for (const [room, next] of roomNeighbours({ cellRooms })) {
      for (const other of next) expect(styles[room]!.fill).not.toBe(styles[other]!.fill)
    }
    expect(Object.values(styles).every((s) => s.pattern === 'tiles')).toBe(true)
  })
})
