import { describe, expect, it } from 'vitest'
import { getTheme } from '../../content/themes/index.ts'
import { createRandom, mixSeed } from './random.ts'
import { placeObjects, type PlaceObjectsInput } from './objects.ts'

function kindOf(id: string): string {
  return id.replace(/-\d+$/, '')
}

describe('placeObjects', () => {
  it('never places an object into a room whose type it hard-excludes (CAD: "a delivery van can never be in a sleeping room")', () => {
    const width = 16
    const height = 16
    const rooms = Array.from({ length: height }, () => Array.from({ length: width }, () => 0))

    for (const theme of ['home', 'office', 'park', 'school', 'shop'] as const) {
      const sceneTheme = getTheme(theme)
      // A single sleeping room favouring every kind of the theme, so favours can never keep the
      // excluded kind out on its own — only the hard exclusion (excludeRoomTypes) can.
      const input: PlaceObjectsInput = {
        width,
        height,
        rooms,
        favours: [sceneTheme.objects.map((o) => o.kind)],
        roomTypes: [['sleeping']],
        theme: sceneTheme,
        edgeFeatures: [],
      }
      const excludedKinds = new Set(
        sceneTheme.objects.filter((o) => o.excludeRoomTypes?.includes('sleeping')).map((o) => o.kind),
      )
      if (excludedKinds.size === 0) continue // nothing to prove for this theme

      for (let seed = 0; seed < 100; seed++) {
        const random = createRandom(mixSeed(seed))
        const objects = placeObjects(input, random)
        for (const object of objects) {
          expect(excludedKinds.has(kindOf(object.id)), `${theme} seed ${seed} ${object.id}`).toBe(false)
        }
      }
    }
  })

  it('still places the favoured, non-excluded kinds in that room (the exclusion does not starve the room)', () => {
    const width = 16
    const height = 16
    const rooms = Array.from({ length: height }, () => Array.from({ length: width }, () => 0))
    const sceneTheme = getTheme('shop')
    const input: PlaceObjectsInput = {
      width,
      height,
      rooms,
      favours: [['showroomBed', 'showroomRug', 'displayCase', 'deliveryVan']],
      roomTypes: [['sleeping']],
      theme: sceneTheme,
      edgeFeatures: [],
    }
    const kinds = new Set<string>()
    for (let seed = 0; seed < 30; seed++) {
      const random = createRandom(mixSeed(seed))
      for (const object of placeObjects(input, random)) kinds.add(kindOf(object.id))
    }
    expect(kinds.has('deliveryVan')).toBe(false)
    expect(kinds.has('showroomBed') || kinds.has('showroomRug') || kinds.has('displayCase')).toBe(true)
  })
})
