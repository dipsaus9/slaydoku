import { describe, expect, it } from 'vitest'
import type { Locale } from '../../locale/index.ts'
import { HELP_CONTENT } from './help.ts'

const ICONS = ['pick', 'note', 'place', 'hint']
const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).filter(Boolean)

/** The English rule-coverage words and their Dutch equivalents (`src/engine/clues/nl.ts`, `src/ui/play/strings.ts`). */
const RULE_WORDS: Record<Locale, { board: RegExp; row: RegExp; column: RegExp; cards: RegExp; victim: RegExp; murderer: RegExp }> = {
  en: { board: /board/, row: /row/, column: /column/, cards: /cards/, victim: /victim/, murderer: /murderer/ },
  nl: { board: /plattegrond/, row: /rij/, column: /kolom/, cards: /kaartjes/, victim: /slachtoffer/, murderer: /moordenaar/ },
}

const LEGEND_LABEL: Record<Locale, { canOccupy: string; blocked: string }> = {
  en: { canOccupy: 'Can be occupied', blocked: 'Blocked' },
  nl: { canOccupy: 'Kan bezet worden', blocked: 'Geblokkeerd' },
}

const RULE_MATCH: Record<Locale, { victim: RegExp; alone: RegExp; room: RegExp; exactlyOne: RegExp }> = {
  en: { victim: /victim/, alone: /alone/, room: /room/, exactlyOne: /exactly one person/ },
  nl: { victim: /slachtoffer/, alone: /alleen/, room: /kamer/, exactlyOne: /precies één persoon/ },
}

describe.each(['en', 'nl'] as const)('help content (%s)', (locale) => {
  const help = HELP_CONTENT[locale]

  it('has a positive integer version and no empty labels', () => {
    expect(Number.isInteger(help.version)).toBe(true)
    expect(help.version).toBeGreaterThanOrEqual(1)
    const labels = [help.title, help.stepsTitle, help.more.title, help.close, help.link, ...Object.values(help.keywords)]
    for (const label of labels) {
      expect(label.trim()).not.toBe('')
      expect(label.length).toBeLessThanOrEqual(40)
    }
  })

  it('states the goal in at most 5 short sentences', () => {
    expect(help.goal.length).toBeGreaterThanOrEqual(1)
    expect(help.goal.length).toBeLessThanOrEqual(5)
    for (const line of help.goal) {
      expect(line.trim()).not.toBe('')
      expect(line.length).toBeLessThanOrEqual(80)
      expect(sentences(line).length).toBe(1)
    }
  })

  it('explains the rules: board, one per row and column, the cards, the victim and the murderer', () => {
    const goal = help.goal.join(' ')
    const words = RULE_WORDS[locale]
    expect(goal).toMatch(words.board)
    expect(goal).toMatch(words.row)
    expect(goal).toMatch(words.column)
    expect(goal).toMatch(words.cards)
    expect(goal).toMatch(words.victim)
    expect(goal).toMatch(words.murderer)
  })

  it('has 3 or 4 steps with a known icon and short text', () => {
    expect(help.steps.length).toBeGreaterThanOrEqual(3)
    expect(help.steps.length).toBeLessThanOrEqual(4)
    for (const step of help.steps) {
      expect(ICONS).toContain(step.icon)
      expect(step.title.trim()).not.toBe('')
      expect(step.title.length).toBeLessThanOrEqual(40)
      expect(step.text.trim()).not.toBe('')
      expect(step.text.length).toBeLessThanOrEqual(90)
    }
  })

  it('keeps the extra list short and non-empty', () => {
    expect(help.more.items.length).toBeGreaterThan(0)
    for (const [term, text] of help.more.items) {
      expect(term.trim()).not.toBe('')
      expect(text.trim()).not.toBe('')
      expect(text.length).toBeLessThanOrEqual(120)
    }
  })

  it('has short wording for the Legend (CAD-10.9)', () => {
    const t = help.legend
    const texts = [t.button, t.title, t.intro, t.objectsTitle, t.canOccupy, t.blocked, t.also, t.tapHint, t.peek, t.edgesTitle, t.roomsTitle, t.marksTitle, t.ruleTitle, t.rule, t.close]
    for (const text of texts) {
      expect(text.trim()).not.toBe('')
      expect(text.length).toBeLessThanOrEqual(80)
    }
    for (const item of [t.door, t.window, t.roomLabel, t.note, t.cross, t.person, t.gift, t.victimNote]) {
      expect(item.noun.trim()).not.toBe('')
      expect(item.noun.length).toBeLessThanOrEqual(40)
      expect(item.text.trim()).not.toBe('')
      expect(item.text.length).toBeLessThanOrEqual(90)
    }
    const label = LEGEND_LABEL[locale]
    expect(t.canOccupy).toBe(label.canOccupy)
    expect(t.blocked).toBe(label.blocked)
    const rule = RULE_MATCH[locale]
    expect(t.rule).toMatch(rule.victim)
    expect(t.rule).toMatch(rule.alone)
    expect(t.rule).toMatch(rule.room)
    expect(t.rule).toMatch(rule.exactlyOne)
  })
})

describe('help content across locales', () => {
  it('keeps the same step icons, step count and extra-list length in every locale', () => {
    const [en, nl] = [HELP_CONTENT.en, HELP_CONTENT.nl]
    expect(nl.steps.map((step) => step.icon)).toEqual(en.steps.map((step) => step.icon))
    expect(nl.more.items.length).toBe(en.more.items.length)
  })
})
