import { describe, expect, it } from 'vitest'
import { generateScene } from '../../engine/scenegen/generate.ts'
import { measureVariety, type REGULAR_THEMES } from '../../engine/scenegen/variety.testing.ts'
import { addDays } from '../../schedule/dates.ts'
import { planDays, rotationThemeOf, themeOf } from '../../schedule/pick.ts'
import { pairProblems, roomSetOf } from '../../schedule/gates.ts'
import type { ScheduleDay } from '../../schedule/types.ts'
import { CHRISTMAS_THEME } from './christmas.ts'
import { SCENE_THEMES, getTheme } from './index.ts'

/** The Christmas theme (SLAY-18.8): rooms, room rules, December variety and the calendar. The rules every theme shares run in rooms.test.ts. */
const theme = getTheme('christmas')
const kindOf = (id: string): string => id.replace(/-\d+$/, '')
const roomTypesOf = new Map(theme.rooms.map((r) => [r.name, r.roomTypes ?? []]))
const byKind = new Map(theme.objects.map((o) => [o.kind, o]))

describe('Christmas theme (SLAY-18.8)', () => {
  it('is registered as seasonal and outside the rotation', () => {
    expect(CHRISTMAS_THEME).toBeDefined()
    expect(SCENE_THEMES).toContain(CHRISTMAS_THEME)
    expect(theme.seasonal).toBe(true)
  })

  it('has at least 15 rooms with EN and NL names and room types; every kind an allow-list with an allowed room', () => {
    expect(theme.rooms.length).toBeGreaterThanOrEqual(15)
    for (const r of theme.rooms) {
      expect(r.nameNl.length, r.name).toBeGreaterThan(2)
      expect(r.roomTypes?.length, r.name).toBeGreaterThan(0)
    }
    for (const o of theme.objects) {
      expect(o.nameNl.length, o.kind).toBeGreaterThan(1)
      expect(o.allowedRoomTypes.length, o.kind).toBeGreaterThan(0)
      expect(theme.rooms.some((r) => o.allowedRoomTypes.some((t) => r.roomTypes?.includes(t))), `${o.kind} has no room`).toBe(true)
    }
  })

  it('keeps the plain chair the only chair look: every other chair-type kind is a drawn toy, not a seat', () => {
    const chairs = theme.objects.filter((o) => o.engineType === 'chair')
    expect(chairs.filter((o) => !o.themeIcon).map((o) => o.kind)).toEqual(['chair'])
    expect(chairs.filter((o) => o.themeIcon).map((o) => o.kind)).toEqual(['rockingHorse'])
  })

  it('keeps beds in sleeping rooms, the sleigh in the shed and the snow things outside', () => {
    const roomsFor = (kind: string) => theme.rooms.filter((r) => byKind.get(kind)!.allowedRoomTypes.some((t) => r.roomTypes!.includes(t))).map((r) => r.name)
    expect(roomsFor('singleBed').sort()).toEqual(["Children's Bedroom", 'Elf Dormitory'])
    expect(roomsFor('sleigh')).toEqual(['Sleigh Shed'])
    for (const kind of ['snowman', 'firTree']) for (const room of roomsFor(kind)) expect(theme.rooms.find((r) => r.name === room)!.outdoor, `${kind} in ${room}`).toBe(true)
  })

  it('never places a kind outside its allow-list over many seeds and sizes', () => {
    let placed = 0
    for (const size of [6, 7, 9, 12]) {
      for (let seed = 1; seed <= 80; seed++) {
        const scene = generateScene({ width: size, height: size, theme: 'christmas', seed })
        for (const object of scene.objects) {
          const kind = kindOf(object.id)
          const roomId = scene.cellRooms[object.cells[0]!.row]![object.cells[0]!.col]!
          const room = scene.rooms.find((r) => r.id === roomId)!.name
          placed++
          expect(byKind.get(kind)!.allowedRoomTypes.some((t) => roomTypesOf.get(room)!.includes(t)), `${size}x${size} seed ${seed}: ${kind} in ${room}`).toBe(true)
        }
      }
    }
    expect(placed).toBeGreaterThan(1000)
  })

  it('caps chairs (2 per room unless at a table, desk or counter) and every kind at 3 per room', () => {
    const stats = measureVariety('christmas' as (typeof REGULAR_THEMES)[number], 20)
    expect(stats.violations).toEqual([])
    expect(stats.neverPlaced).toEqual([])
  })

  describe('December', () => {
    for (const year of [2026, 2027]) {
      const plans = planDays(`${year}-12-01`, 31)

      it(`${year}: the calendar picks Christmas for 1 to 31 December and nothing around it`, () => {
        for (const plan of plans) expect(plan.theme, plan.date).toBe('christmas')
        for (const date of [`${year}-11-30`, `${year + 1}-01-01`]) {
          expect(themeOf(date), date).not.toBe('christmas')
          expect(themeOf(date), date).toBe(rotationThemeOf(date))
        }
      })

      it(`${year}: no two days in a row get the same set of rooms (the first seed of each day's window)`, () => {
        const sets = plans.map((p) => roomSetOf({ puzzle: { scene: generateScene({ width: p.size, height: p.size, theme: 'christmas', seed: p.seed }) } } as unknown as ScheduleDay))
        for (let i = 1; i < sets.length; i++) expect(sets[i], plans[i]!.date).not.toBe(sets[i - 1])
        expect(new Set(sets).size).toBeGreaterThan(25)
      })
    }

    it('the rotation underneath December is unchanged: Christmas never enters it', () => {
      for (let d = '2026-09-27', i = 0; i < 500; d = addDays(d, 1), i++) expect(rotationThemeOf(d), d).not.toBe('christmas')
    })

    it('the pair gate asks two Christmas days in a row for different rooms, not for a different theme', () => {
      const day = (date: string, seed: number, size = 6) =>
        ({ date, size, tier: 'easy', theme: 'christmas', puzzle: { people: [], scene: generateScene({ width: size, height: size, theme: 'christmas', seed }) } }) as unknown as ScheduleDay
      expect(pairProblems(day('2026-12-01', 1), day('2026-12-02', 2))).toEqual([])
      expect(pairProblems(day('2026-12-01', 1), day('2026-12-02', 1))).toEqual(['2026-12-02: same rooms as 2026-12-01 in the christmas window'])
    })
  })
})
