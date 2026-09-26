import type { Person, Puzzle } from '../../engine/model/index.ts'
import { buildCast, MAX_SUSPECTS, type BuiltCast } from '../../render/cards/index.ts'

/** Glyph of the gift in notes. */
export const GIFT_TAG = '\u{1F381}'

/**
 * One short tag per person for the small candidate notes. A suspect gets the first letter of
 * their label; when two share it, the later one takes the next letter of its name that no
 * initial claims (Bob after Ben: "O"). Labels that are already single letters (A, B...)
 * are kept. The gift gets a gift glyph. Tags are unique, upper case, one character.
 */
export function noteTags(people: readonly Person[]): Record<string, string> {
  const tags: Record<string, string> = {}
  const used = new Set<string>()
  const suspects = people.filter((p) => p.kind === 'suspect')
  const upper = (label: string) => label.trim().toUpperCase()
  const letters = (label: string) => [...upper(label)].filter((ch) => /\p{L}|\d/u.test(ch))

  // Pass 1: initials, first come first served.
  for (const p of suspects) {
    const initial = letters(p.label)[0]
    if (initial && !used.has(initial)) {
      tags[p.id] = initial
      used.add(initial)
    }
  }
  // Pass 2: everybody else, from their own letters, then from the alphabet, then digits.
  const fallback = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789']
  for (const p of suspects) {
    if (tags[p.id]) continue
    const pick = [...letters(p.label), ...fallback].find((ch) => !used.has(ch)) ?? '?'
    tags[p.id] = pick
    used.add(pick)
  }
  for (const p of people) if (p.kind === 'victim') tags[p.id] = GIFT_TAG
  return tags
}

/** Distinguishable ink colours for notes, by person order. Dark enough to read on every floor. */
export const NOTE_COLORS = [
  '#c0392b', '#1f6feb', '#1e8a4c', '#b7690b', '#8e44ad', '#0d8a8a', '#d6336c', '#5b6b7f',
  '#a0522d', '#3949ab', '#6b8e23', '#c2185b', '#00838f', '#7b5e00', '#455a64',
] as const

export function colorsFor(people: readonly Person[]): Record<string, string> {
  const colors: Record<string, string> = {}
  let i = 0
  for (const p of people) {
    colors[p.id] = p.kind === 'victim' ? '#d6336c' : NOTE_COLORS[i++ % NOTE_COLORS.length]!
  }
  return colors
}

/**
 * Gives suspects that are only letters (as the generator makes them) the names of the cast, so
 * the cards show Alice, Ben, Chloe... and the clues speak of them. Puzzles that already carry
 * names are returned as they are. The cast is deterministic: same puzzle, same names.
 */
export function withCastNames(puzzle: Puzzle, seed: string | number = 'slaydoku'): Puzzle {
  const suspects = puzzle.people.filter((p) => p.kind === 'suspect')
  if (suspects.length === 0 || suspects.length > MAX_SUSPECTS) return puzzle
  if (!suspects.every((p) => p.label.trim().length <= 1)) return puzzle
  const { entries } = buildCast(suspects.length, seed)
  const castOf = new Map(suspects.map((p, i) => [p.id, entries[i]!]))
  return {
    ...puzzle,
    people: puzzle.people.map((p) => {
      const member = castOf.get(p.id)
      if (!member) return p
      return { ...p, label: member.name, ...(member.gender && p.gender === undefined ? { gender: member.gender } : {}) }
    }),
  }
}

/** The card looks (drawn cast and generated extras) for a puzzle's suspects. */
export function castFor(puzzle: Puzzle, seed: string | number = 'slaydoku'): BuiltCast {
  const count = puzzle.people.filter((p) => p.kind === 'suspect').length
  return buildCast(Math.min(count, MAX_SUSPECTS), seed)
}

/** "1:05" or "1:02:03". */
export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const s = total % 60
  const m = Math.floor(total / 60) % 60
  const h = Math.floor(total / 3600)
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}
