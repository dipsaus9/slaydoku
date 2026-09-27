import { describe, expect, it } from 'vitest'
import { createMemoryStorage } from '../memoryStorage.ts'
import { DATE_OVERRIDE_KEY, createClock, overrideAllowed, parseOverride, readDateOverride } from './clock.ts'

const noon = (date: string) => Date.parse(`${date}T12:00:00Z`)

describe('overrideAllowed', () => {
  it('is on in dev and on localhost, and nowhere else', () => {
    expect(overrideAllowed(true, 'anything.example')).toBe(true)
    expect(overrideAllowed(false, 'localhost')).toBe(true)
    for (const host of ['slaydoku.vercel.app', 'slaydoku.example.com', '127.0.0.1', 'localhost.evil.example', 'notlocalhost', '']) {
      expect(overrideAllowed(false, host), host).toBe(false)
    }
  })
})

describe('parseOverride', () => {
  it('reads a date as noon UTC and a date with a time as that instant', () => {
    expect(parseOverride('2026-10-15')).toBe(noon('2026-10-15'))
    expect(parseOverride('2026-10-15T23:59:50')).toBe(Date.parse('2026-10-15T23:59:50Z'))
    expect(parseOverride('2026-10-15T23:59:50Z')).toBe(Date.parse('2026-10-15T23:59:50Z'))
    expect(parseOverride('2026-10-15T08:30')).toBe(Date.parse('2026-10-15T08:30:00Z'))
    expect(parseOverride('2028-02-29')).toBe(noon('2028-02-29'))
  })

  it('refuses text that is not a real date or time', () => {
    for (const bad of ['', 'tomorrow', '2026-02-30', '2027-02-29', '2026-13-01', '2026-10-15T24:00', '2026-10-15T10:60', '15-10-2026']) {
      expect(parseOverride(bad), bad).toBeNull()
    }
  })
})

describe('readDateOverride', () => {
  const env = (over: Partial<Parameters<typeof readDateOverride>[0]> = {}) => ({ dev: true, hostname: 'localhost', search: '', storage: createMemoryStorage(), ...over })

  it('reads ?date= in dev and on localhost', () => {
    expect(readDateOverride(env({ search: '?date=2026-10-15' }))).toBe(noon('2026-10-15'))
    expect(readDateOverride(env({ dev: false, hostname: 'localhost', search: '?date=2026-10-15' }))).toBe(noon('2026-10-15'))
    expect(readDateOverride(env({ dev: true, hostname: 'slaydoku.vercel.app', search: '?date=2026-10-15' }))).toBe(noon('2026-10-15'))
  })

  it('is ignored in a production build on any other host: neither the URL nor the stored key count', () => {
    const storage = createMemoryStorage()
    storage.setItem(DATE_OVERRIDE_KEY, '2026-10-20')
    for (const hostname of ['slaydoku.vercel.app', 'example.com', '127.0.0.1']) {
      expect(readDateOverride({ dev: false, hostname, search: '?date=2026-10-15', storage }), hostname).toBeNull()
    }
    // and nothing was written by the refused attempt
    expect(storage.getItem(DATE_OVERRIDE_KEY)).toBe('2026-10-20')
  })

  it('takes the stored key when there is no parameter, and lets the parameter win', () => {
    const storage = createMemoryStorage()
    storage.setItem(DATE_OVERRIDE_KEY, '2026-10-20')
    expect(readDateOverride(env({ storage }))).toBe(noon('2026-10-20'))
    expect(readDateOverride(env({ storage, search: '?date=2026-10-15' }))).toBe(noon('2026-10-15'))
    expect(storage.getItem(DATE_OVERRIDE_KEY)).toBe('2026-10-15')
  })

  it('copies the parameter into the key so a reload keeps it, and ?date=off removes it', () => {
    const storage = createMemoryStorage()
    readDateOverride(env({ storage, search: '?date=2026-10-15' }))
    expect(readDateOverride(env({ storage }))).toBe(noon('2026-10-15'))
    expect(readDateOverride(env({ storage, search: '?date=off' }))).toBeNull()
    expect(storage.getItem(DATE_OVERRIDE_KEY)).toBeNull()
    expect(readDateOverride(env({ storage }))).toBeNull()
  })

  it('ignores a value that is not a date', () => {
    expect(readDateOverride(env({ search: '?date=soon' }))).toBeNull()
    const storage = createMemoryStorage()
    storage.setItem(DATE_OVERRIDE_KEY, 'garbage')
    expect(readDateOverride(env({ storage }))).toBeNull()
  })

  it('survives storage that throws or is missing', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {},
    }
    expect(readDateOverride(env({ storage: broken, search: '?date=2026-10-15' }))).toBeNull()
    expect(readDateOverride(env({ storage: null, search: '?date=2026-10-15' }))).toBe(noon('2026-10-15'))
  })
})

describe('createClock', () => {
  it('is the device clock when there is no override', () => {
    const clock = createClock({ dev: false, hostname: 'slaydoku.vercel.app', search: '?date=2026-10-15', storage: null, now: () => 42 })
    expect(clock()).toBe(42)
  })

  it('starts at the override instant and moves on with real time', () => {
    let real = 1_000_000
    const clock = createClock({ dev: true, hostname: 'localhost', search: '?date=2026-10-15T23:59:50', storage: null, now: () => real })
    expect(clock()).toBe(Date.parse('2026-10-15T23:59:50Z'))
    real += 15_000
    expect(clock()).toBe(Date.parse('2026-10-16T00:00:05Z'))
  })
})
