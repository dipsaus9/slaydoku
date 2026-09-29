import { HELP_CONTENT } from '../../content/help/help.ts'
import type { HelpIcon } from '../../content/help/help.ts'
import { useLocale } from '../../locale/index.ts'
import { CAST, VictimIcon } from '../../render/cards/index.ts'
import { ToolIcon } from '../play/toolIcons.tsx'

const HostAvatar = CAST[0]!.Avatar

/** One small drawing per step: a portrait from src/render/cards, with the toolbar icon of the button it is about as a badge. */
function StepArt({ icon }: { icon: HelpIcon }) {
  return (
    <span className="play-help__stepicon" data-art={icon} aria-hidden="true">
      {icon === 'hint' ? <VictimIcon className="play-help__art" /> : <HostAvatar decorative className="play-help__art" />}
      {icon === 'note' ? <span className="play-help__badge"><ToolIcon name="note" /></span> : null}
      {icon === 'hint' ? <span className="play-help__badge"><ToolIcon name="hint" /></span> : null}
    </span>
  )
}

/** The goal in a few short sentences, then the how-to steps, each with a toolbar icon. */
export function HowItWorks() {
  const { locale } = useLocale()
  const help = HELP_CONTENT[locale]
  return (
    <div className="play-help">
      <div className="play-help__goal">
        {help.goal.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <h3>{help.stepsTitle}</h3>
      <ol className="play-help__steps">
        {help.steps.map((step) => (
          <li key={step.title} data-icon={step.icon}>
            <StepArt icon={step.icon} />
            <span className="play-help__steptext">
              <strong>{step.title}</strong>
              <span>{step.text}</span>
            </span>
          </li>
        ))}
      </ol>

      <details className="play-help__more">
        <summary>{help.more.title}</summary>
        <dl className="play-help__list">
          {help.more.items.map(([term, text]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  )
}
