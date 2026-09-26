import { describe, expect, it } from 'vitest'
import type { Puzzle } from '../../engine/model/index.ts'
import { generatedPuzzles } from '../../content/generated.testing.ts'
import { demoLevels } from '../../content/levels.ts'
import { markupText, missingCardText } from './cardText.ts'

const named: [string, Puzzle][] = [
  ['demo', demoLevels[0]!.puzzle],
  ...generatedPuzzles().map((g): [string, Puzzle] => [g.id, g.puzzle]),
]

describe('markupText', () => {
  it('drops tags, decodes entities and collapses whitespace', () => {
    expect(markupText('<li><p>Frank  staat<br/>in &quot;de&quot; keuken &amp; l&#x27;hal</p></li>')).toBe('Frank staat in "de" keuken & l\'hal')
  })
})

describe('missingCardText', () => {
  for (const [name, puzzle] of named) {
    it(`finds every card of every suspect of ${name} on the screen`, () => {
      expect(missingCardText(puzzle)).toEqual([])
    })
  }
})
