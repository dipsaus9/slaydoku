import { HELP_CONTENT } from '../../content/help/help.ts'
import { useLocale } from '../../locale/index.ts'
import { GLOSSARY_CONTENT, EXTRA_TERMS_CONTENT } from '../play/glossary.ts'

/** Every clue keyword with its meaning and an example, plus a few extra terms. Only shown behind the "Keywords" button. */
export function Glossary() {
  const { locale } = useLocale()
  const t = HELP_CONTENT[locale].keywords
  const GLOSSARY = GLOSSARY_CONTENT[locale]
  const EXTRA_TERMS = EXTRA_TERMS_CONTENT[locale]
  return (
    <div className="play-help">
      <dl className="play-help__list play-help__glossary">
        {GLOSSARY.map((entry) => (
          <div key={entry.keyword} data-kinds={entry.kinds.join(' ')}>
            <dt>{entry.keyword}</dt>
            <dd>
              {entry.meaning}
              <span className="play-help__example">
                {t.example}: {entry.example}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <h3>{t.otherTitle}</h3>
      <dl className="play-help__list">
        {EXTRA_TERMS.map((term) => (
          <div key={term.keyword}>
            <dt>{term.keyword}</dt>
            <dd>{term.meaning}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
