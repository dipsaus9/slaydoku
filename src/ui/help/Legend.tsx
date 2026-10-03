import { useId, useMemo, type ReactNode } from 'react'
import { HELP_CONTENT } from '../../content/help/help.ts'
import type { Cell, Person, Puzzle } from '../../engine/model/index.ts'
import { useLocale } from '../../locale/index.ts'
import type { BuiltCast } from '../../render/cards/index.ts'
import { EdgeFeatureIcon } from '../../render/icons/index.ts'
import { U } from '../../render/icons/art/tokens.ts'
import { IconDepthScope } from '../../render/icons/ObjectIcon.tsx'
import { ThemeObjectIconGlyph } from '../../render/icons/themes/ThemeObjectIcon.tsx'
import { NoteGlyph, PersonDisc, PortraitClip, XMarkGlyph } from '../play/BoardLayers.tsx'
import { bareRoomName } from '../../render/scene/labels.ts'
import { legendOf, type LegendObjectRow } from './legend.ts'

export interface LegendProps {
  puzzle: Puzzle
  /** Same look-up tables the board uses for letters, colours and portraits, so the marks read the same. */
  cast: BuiltCast
  tags: Record<string, string>
  colors: Record<string, string>
  /** A row was tapped: show these squares on the board for a moment. */
  onShow: (cells: readonly Cell[]) => void
}

/** The object as the board draws it, cropped to its own footprint. */
function ObjectSwatch({ row }: { row: LegendObjectRow }) {
  const { cells, type } = row.sample
  const cols = Math.max(...cells.map((c) => c.col)) - Math.min(...cells.map((c) => c.col)) + 1
  const rows = Math.max(...cells.map((c) => c.row)) - Math.min(...cells.map((c) => c.row)) + 1
  return (
    <svg
      className="play-legend__icon"
      viewBox={`0 0 ${cols * U} ${rows * U}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      data-icon={row.themeIcon ?? type}
    >
      <IconDepthScope>
        <ThemeObjectIconGlyph object={{ engineType: type, themeIcon: row.themeIcon }} cells={cells} />
      </IconDepthScope>
    </svg>
  )
}

/** A mark drawn on a bare square, exactly like the board draws it (same glyphs as BoardLayers). */
function SquareSwatch({ children, name }: { children: (size: number) => ReactNode; name: string }) {
  return (
    <svg className="play-legend__square" viewBox="0 0 100 100" aria-hidden="true" focusable="false" data-mark-sample={name}>
      <rect x={1} y={1} width={98} height={98} fill="#f3ecdc" stroke="rgba(42,42,54,0.35)" strokeWidth={2} />
      {children(100)}
    </svg>
  )
}

function StaticRow({ symbol, name, text, data }: { symbol: ReactNode; name: string; text: string; data?: string }) {
  return (
    <li className="play-legend__row play-legend__row--static" data-legend={data}>
      <span className="play-legend__symbol">{symbol}</span>
      <span className="play-legend__text">
        <strong>{name}</strong>
        <span>{text}</span>
      </span>
    </li>
  )
}

function firstOf(people: readonly Person[], kind: Person['kind']): Person | undefined {
  return people.find((p) => p.kind === kind)
}

/**
 * The Legend: what is drawn on this board. The object, door and window rows come from the scene
 * (legend.ts); tapping one asks the board to flash its squares. The marks are drawn with the very
 * glyphs of the board layers, so a letter, a cross, a portrait and the gift look the same here.
 */
export function Legend({ puzzle, cast, tags, colors, onShow }: LegendProps) {
  const { locale } = useLocale()
  const t = HELP_CONTENT[locale].legend
  const clipId = `legend-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const legend = useMemo(() => legendOf(puzzle.scene, locale), [puzzle.scene, locale])
  const suspect = firstOf(puzzle.people, 'suspect')
  const gift = firstOf(puzzle.people, 'victim')
  // The shortest room name as the sample, so the pill fits its box whole.
  const roomName = puzzle.scene.rooms.map((r) => bareRoomName(r.name)).sort((a, b) => a.length - b.length)[0]
  // Each portrait brings its own clip, so no sample depends on another one being in the page.
  const person = (p: Person, part: string) => (
    <>
      <PortraitClip id={`${clipId}-${part}`} />
      <PersonDisc x={0} y={0} size={100} person={p} cast={cast} clipId={`${clipId}-${part}`} tag={tags[p.id] ?? '?'} color={colors[p.id] ?? '#555'} />
    </>
  )

  return (
    <div className="play-legend">
      <p className="play-legend__intro">{t.intro}</p>

      <h3>{t.objectsTitle}</h3>
      <p className="play-legend__tap">{t.tapHint}</p>
      <ul className="play-legend__list" data-legend-list="objects">
        {legend.objects.map((row) => (
          <li key={row.key}>
            <button
              type="button"
              className="play-legend__row"
              data-legend={row.key}
              data-occupiable={row.occupiable ? 'yes' : 'no'}
              onClick={() => onShow(row.cells)}
            >
              <span className="play-legend__symbol"><ObjectSwatch row={row} /></span>
              <span className="play-legend__text">
                <strong>{row.noun}</strong>
                {row.alsoNouns.length > 0 ? <span className="play-legend__also">{t.also}: {row.alsoNouns.join(', ')}</span> : null}
              </span>
              <span className={`play-legend__flag play-legend__flag--${row.occupiable ? 'yes' : 'no'}`}>
                {row.occupiable ? t.canOccupy : t.blocked}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {legend.edges.length > 0 ? (
        <>
          <h3>{t.edgesTitle}</h3>
          <ul className="play-legend__list" data-legend-list="edges">
            {legend.edges.map((row) => (
              <li key={row.kind}>
                <button type="button" className="play-legend__row" data-legend={row.kind} onClick={() => onShow(row.cells)}>
                  <span className="play-legend__symbol play-legend__symbol--edge">
                    <EdgeFeatureIcon kind={row.kind} side="north" cellSize={56} />
                  </span>
                  <span className="play-legend__text">
                    <strong>{t[row.kind].noun}</strong>
                    <span>{t[row.kind].text}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h3>{t.roomsTitle}</h3>
      <ul className="play-legend__list">
        <StaticRow
          data="room-label"
          symbol={<span className="play-legend__pill">{roomName ?? t.roomLabel.noun}</span>}
          name={t.roomLabel.noun}
          text={t.roomLabel.text}
        />
      </ul>

      <h3>{t.marksTitle}</h3>
      <ul className="play-legend__list" data-legend-list="marks">
        {suspect ? (
          <StaticRow
            data="mark-note"
            symbol={
              <SquareSwatch name="note">
                {() => <NoteGlyph x={50} y={50} fontSize={46} bold color={colors[suspect.id] ?? '#333'} tag={tags[suspect.id] ?? '?'} />}
              </SquareSwatch>
            }
            name={t.note.noun}
            text={t.note.text}
          />
        ) : null}
        {suspect ? (
          <StaticRow
            data="mark-cross"
            symbol={<SquareSwatch name="cross">{(size) => <XMarkGlyph x={0} y={0} size={size} color={colors[suspect.id] ?? '#c0392b'} />}</SquareSwatch>}
            name={t.cross.noun}
            text={t.cross.text}
          />
        ) : null}
        {suspect ? (
          <StaticRow
            data="mark-person"
            symbol={<SquareSwatch name="person">{() => person(suspect, 'person')}</SquareSwatch>}
            name={t.person.noun}
            text={t.person.text}
          />
        ) : null}
        {gift ? (
          <StaticRow
            data="mark-gift"
            symbol={<SquareSwatch name="gift">{() => person(gift, 'gift')}</SquareSwatch>}
            name={t.gift.noun}
            text={t.gift.text}
          />
        ) : null}
      </ul>

      <h3>{t.ruleTitle}</h3>
      <p className="play-legend__rule">{t.rule}</p>
    </div>
  )
}
