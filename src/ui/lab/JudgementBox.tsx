import { useState } from 'react'
import type { StorageLike } from '../../game/persistence.ts'
import {
  clearJudgement,
  exportJudgements,
  importJudgements,
  judgementFor,
  loadJudgements,
  saveJudgement,
  VERDICTS,
} from './judgements.ts'
import type { Verdict } from './judgements.ts'
import { downloadText } from './download.ts'
import { LAB_NL } from './strings.ts'

const t = LAB_NL.insight

export interface JudgementBoxProps {
  puzzleId: string
  storage: StorageLike | null
  now?: () => number
}

/** An optional verdict on one puzzle: too easy, good or too hard, kept in this browser. */
export function JudgementBox({ puzzleId, storage, now = Date.now }: JudgementBoxProps) {
  const [judgements, setJudgements] = useState(() => loadJudgements(storage))
  const [failed, setFailed] = useState(false)
  const current = judgementFor(judgements, puzzleId)

  const change = (write: () => boolean) => {
    setFailed(!write())
    setJudgements(loadJudgements(storage))
  }
  const pick = (verdict: Verdict) => change(() => saveJudgement(storage, puzzleId, verdict, now()))

  return (
    <section className="lab-section" aria-labelledby="lab-judgement-title">
      <h2 id="lab-judgement-title">{t.judgementTitle}</h2>
      <p className="lab-note">{t.judgementIntro}</p>
      <div className="lab-verdicts" role="group" aria-label={t.judgementTitle}>
        {VERDICTS.map((verdict) => (
          <button
            key={verdict}
            type="button"
            className={`lab-btn${current?.verdict === verdict ? ' lab-btn--primary' : ''}`}
            aria-pressed={current?.verdict === verdict}
            data-verdict={verdict}
            onClick={() => pick(verdict)}
          >
            {t.verdicts[verdict]}
          </button>
        ))}
        <button
          type="button"
          className="lab-btn"
          disabled={!current}
          onClick={() => change(() => clearJudgement(storage, puzzleId))}
        >
          {t.noVerdict}
        </button>
      </div>
      <p className="lab-note" role="status" data-judged={current?.verdict ?? 'none'}>
        {failed
          ? t.saveFailed
          : current
            ? t.judgedAs(t.verdicts[current.verdict], new Date(current.judgedAt).toLocaleString('nl-NL'))
            : t.notJudged}
      </p>
    </section>
  )
}

export interface JudgementTransferProps {
  storage: StorageLike | null
  onChanged?: () => void
}

/** Save every judgement to a JSON file (for the calibration) or load such a file back in. */
export function JudgementTransfer({ storage, onChanged }: JudgementTransferProps) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [count, setCount] = useState(() => loadJudgements(storage).length)

  const onFile = (file: File | undefined) => {
    if (!file) return
    file.text().then(
      (text) => {
        const result = importJudgements(storage, text)
        setMessage(result.ok ? { ok: true, text: t.imported(result.imported, result.skipped) } : { ok: false, text: t.importFailed })
        setCount(loadJudgements(storage).length)
        if (result.ok) onChanged?.()
      },
      () => setMessage({ ok: false, text: t.importFailed }),
    )
  }

  return (
    <section className="lab-section" aria-labelledby="lab-transfer-title">
      <h2 id="lab-transfer-title">{t.transferTitle}</h2>
      <p className="lab-note" data-judged-count={count}>
        {t.judgedCount(count)}
      </p>
      <div className="lab-verdicts">
        <button
          type="button"
          className="lab-btn"
          onClick={() => downloadText('slaydoku-lab-oordelen.json', exportJudgements(storage))}
        >
          {t.exportJudgements}
        </button>
        <label className="lab-btn lab-file">
          {t.importJudgements}
          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              onFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {message ? (
        <p className={message.ok ? 'lab-note' : 'lab-errors'} role={message.ok ? 'status' : 'alert'}>
          {message.text}
        </p>
      ) : null}
    </section>
  )
}
