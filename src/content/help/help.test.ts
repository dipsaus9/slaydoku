import { describe, expect, it } from 'vitest'
import { help } from './help.ts'

const ICONS = ['pick', 'note', 'place', 'hint']
const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).filter(Boolean)

describe('help content', () => {
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
    expect(goal).toMatch(/board/)
    expect(goal).toMatch(/row/)
    expect(goal).toMatch(/column/)
    expect(goal).toMatch(/cards/)
    expect(goal).toMatch(/victim/)
    expect(goal).toMatch(/murderer/)
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

  it('has short English wording for the Legend (CAD-10.9)', () => {
    const t = help.legend
    const texts = [t.button, t.title, t.intro, t.objectsTitle, t.canOccupy, t.blocked, t.also, t.tapHint, t.peek, t.edgesTitle, t.roomsTitle, t.marksTitle, t.ruleTitle, t.rule, t.close]
    for (const text of texts) {
      expect(text.trim()).not.toBe('')
      expect(text.length).toBeLessThanOrEqual(80)
    }
    for (const item of [t.door, t.window, t.roomLabel, t.note, t.cross, t.person, t.gift]) {
      expect(item.noun.trim()).not.toBe('')
      expect(item.noun.length).toBeLessThanOrEqual(40)
      expect(item.text.trim()).not.toBe('')
      expect(item.text.length).toBeLessThanOrEqual(90)
    }
    expect(t.canOccupy).toBe('Can be occupied')
    expect(t.blocked).toBe('Blocked')
    expect(t.rule).toMatch(/victim/)
    expect(t.rule).toMatch(/alone/)
    expect(t.rule).toMatch(/room/)
    expect(t.rule).toMatch(/exactly one person/)
  })
})
