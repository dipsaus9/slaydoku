import { describe, expect, it } from 'vitest'
import { NOTIFY_EN, NOTIFY_NL, PLAY_PATH, notificationBody, pushNotification, routeNotificationClick } from './notify.ts'

describe('notificationBody', () => {
  it('is Dutch for nl languages', () => {
    for (const lang of ['nl', 'nl-NL', 'nl-BE', 'NL']) expect(notificationBody(lang)).toBe(NOTIFY_NL.body)
  })
  it('is English otherwise', () => {
    for (const lang of ['en-US', 'de', 'nld', '', undefined, null]) expect(notificationBody(lang)).toBe(NOTIFY_EN.body)
  })
})

describe('pushNotification', () => {
  it('has title, icon and badge from the existing icons, and no spoiler fields', () => {
    const n = pushNotification('en')
    expect(n.title).toBe('Slaydoku')
    expect(n.options.icon).toBe('/icon-192.png')
    expect(n.options.badge).toBe('/favicon-32.png')
    expect(Object.keys(n.options).sort()).toEqual(['badge', 'body', 'icon', 'tag'])
  })
})

describe('routeNotificationClick', () => {
  const origin = 'https://slaydoku.nl'
  it('focuses the first client of this origin', () => {
    const clients = [{ url: 'https://other.example/' }, { url: 'https://slaydoku.nl/about' }]
    expect(routeNotificationClick(clients, origin)).toEqual({ kind: 'focus', index: 1 })
  })
  it('opens /play when nothing is open', () => {
    expect(routeNotificationClick([], origin)).toEqual({ kind: 'open' })
    expect(routeNotificationClick([{ url: 'garbage' }], origin)).toEqual({ kind: 'open' })
    expect(PLAY_PATH).toBe('/play')
  })
})
