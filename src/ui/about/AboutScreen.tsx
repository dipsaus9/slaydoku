import { useEffect } from 'react'
import { useLocale } from '../../locale/index.ts'
import { Link } from '../router/index.ts'
import { ABOUT_STRINGS } from './strings.ts'
import './about.css'

/** The About page (`/about`): how it works, the credit, privacy and the licence. Static text, so it works offline like every screen. */
export function AboutScreen() {
  const { locale } = useLocale()
  const t = ABOUT_STRINGS[locale]
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  return (
    <main className="about">
      <Link href="/" className="about__back">
        <span aria-hidden="true">{'‹'}</span> {t.back}
      </Link>
      <header className="about__header">
        <img className="about__logo" src="/favicon.svg" width="56" height="56" alt="" />
        <div>
          <h1 className="about__title">{t.title}</h1>
          <p className="about__tagline">{t.tagline}</p>
        </div>
      </header>

      <section className="about__section" aria-labelledby="about-how">
        <h2 id="about-how">{t.how.title}</h2>
        <ol className="about__steps">
          {t.how.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </section>

      <section className="about__section" aria-labelledby="about-credit">
        <h2 id="about-credit">{t.credit.title}</h2>
        <p>{t.credit.inspired}</p>
        <p>{t.credit.original}</p>
      </section>

      <section className="about__section" aria-labelledby="about-privacy">
        <h2 id="about-privacy">{t.privacy.title}</h2>
        <p>{t.privacy.text}</p>
      </section>

      <section className="about__section" aria-labelledby="about-open-source">
        <h2 id="about-open-source">{t.openSource.title}</h2>
        <p>{t.openSource.text}</p>
      </section>
    </main>
  )
}
