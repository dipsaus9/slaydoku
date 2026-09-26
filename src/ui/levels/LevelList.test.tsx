import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LevelList } from './LevelList.tsx'

describe('<LevelList/>', () => {
  const html = renderToStaticMarkup(<LevelList entries={[]} />)

  it('has a small How it works link that reopens the how-it-works card (CAD-10.8)', () => {
    expect(html).toMatch(/<button[^>]*class="[^"]*levels__help[^"]*"[^>]*>How it works<\/button>/)
  })

  it('links to the About page from the footer', () => {
    expect(html).toMatch(/<footer[^>]*class="levels__footer"[^>]*><a[^>]*href="\/about"[^>]*>About Slaydoku<\/a><\/footer>/)
  })

  it('does not show the card until the link is used', () => {
    expect(html).not.toContain('role="dialog"')
  })
})
