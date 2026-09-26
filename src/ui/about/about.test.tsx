import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AboutScreen } from './AboutScreen.tsx'
import { ABOUT_PATH, isAboutPath } from './route.ts'
import { ABOUT_EN } from './strings.ts'

describe('isAboutPath', () => {
  it('matches /about, with or without a trailing slash', () => {
    expect(ABOUT_PATH).toBe('/about')
    expect(isAboutPath('/about')).toBe(true)
    expect(isAboutPath('/about/')).toBe(true)
  })

  it('matches no other path', () => {
    for (const path of ['/', '', '/level/demo', '/about/us', '/aboutus', '/lab', '/level/about', '/%E0%A4%A']) expect(isAboutPath(path), path).toBe(false)
  })
})

describe('<AboutScreen/>', () => {
  const html = renderToStaticMarkup(<AboutScreen />)

  it('explains how it works in four short lines', () => {
    expect(ABOUT_EN.how.lines).toHaveLength(4)
    for (const line of ABOUT_EN.how.lines) {
      expect(line.length).toBeLessThanOrEqual(80)
      expect(html).toContain(line)
    }
  })

  it('credits Murdoku and says the puzzles are original', () => {
    expect(html).toContain('Inspired by Murdoku by Manuel Garand.')
    expect(html).toMatch(/No official assets are used: every puzzle, name and drawing here is original\./)
  })

  it('says everything stays on the device', () => {
    expect(html).toContain('Everything stays on your device: no accounts, no tracking.')
  })

  it('names the MIT license and holds a contact placeholder', () => {
    expect(html).toMatch(/open source, released under the MIT license/)
    expect(html).toContain(ABOUT_EN.contact.placeholder)
  })

  it('links back to the puzzles with a real href, and shows the tagline', () => {
    expect(html).toMatch(/<a[^>]*href="\/"[^>]*class="about__back"|<a[^>]*class="about__back"[^>]*href="\/"/)
    expect(html).toContain('A new murder mystery puzzle every day')
  })

  it('has one h1, one main landmark and labelled sections', () => {
    expect(html.match(/<h1/g)).toHaveLength(1)
    expect(html.match(/<main/g)).toHaveLength(1)
    expect(html.match(/<section[^>]*aria-labelledby=/g)).toHaveLength(5)
  })
})
