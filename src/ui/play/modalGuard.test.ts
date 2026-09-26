import { describe, expect, it } from 'vitest'
import { GHOST_CLICK_MS, isGhostClick } from './modalGuard.ts'

describe('isGhostClick', () => {
  it('ignores the click that ends the long press which opened the dialog', () => {
    expect(isGhostClick(1000, 1000)).toBe(true)
    expect(isGhostClick(1000, 1000 + GHOST_CLICK_MS - 1)).toBe(true)
  })

  it('lets a real tap through once the dialog has been there a moment', () => {
    expect(isGhostClick(1000, 1000 + GHOST_CLICK_MS)).toBe(false)
    expect(isGhostClick(1000, 5000)).toBe(false)
  })
})
