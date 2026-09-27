import { useId, type ReactNode } from 'react'
import type { Cell, Person, Puzzle } from '../../engine/model/index.ts'
import { cellKey } from '../../engine/model/index.ts'
import type { Board } from '../../game/index.ts'
import type { Hint } from '../../game/index.ts'
import { VictimIcon } from '../../render/cards/index.ts'
import type { BuiltCast } from '../../render/cards/index.ts'
import type { SceneGeometry } from '../../render/scene/index.ts'
import { hintCells } from './hintCells.ts'

interface LayerProps {
  geometry: SceneGeometry
  puzzle: Puzzle
  board: Board
  selectedId: string | null
  tags: Record<string, string>
  colors: Record<string, string>
}

const NOTE_HALO = '#ffffff'

/** One X mark: a white wash over the square with a cross in the person's colour. (x, y) is the square's top-left corner. */
export function XMarkGlyph({ x, y, size, color, markKey }: { x: number; y: number; size: number; color: string; markKey?: string }) {
  const pad = size * 0.24
  return (
    <g data-mark={markKey}>
      <rect x={x + 2} y={y + 2} width={size - 4} height={size - 4} fill="#ffffff" opacity={0.55} />
      <path
        d={`M${x + pad} ${y + pad} L${x + size - pad} ${y + size - pad} M${x + size - pad} ${y + pad} L${x + pad} ${y + size - pad}`}
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
        opacity={0.85}
      />
    </g>
  )
}

/** One candidate note: the person's letter (or the victim glyph) centred on (x, y), with a white halo. */
export function NoteGlyph({ x, y, fontSize, bold, color, tag, opacity = 1, noteKey }: { x: number; y: number; fontSize: number; bold: boolean; color: string; tag: string; opacity?: number; noteKey?: string }) {
  return (
    <text
      data-note={noteKey}
      x={x}
      y={y}
      dy="0.35em"
      textAnchor="middle"
      fontSize={fontSize}
      fontWeight={bold ? 800 : 600}
      fontFamily="system-ui, -apple-system, sans-serif"
      fill={color}
      stroke={NOTE_HALO}
      strokeWidth={3}
      strokeLinejoin="round"
      paintOrder="stroke"
      opacity={opacity}
    >
      {tag}
    </text>
  )
}

/**
 * Candidate notes and X marks. Every person has a fixed slot inside the cell (a small grid),
 * so a letter never jumps around when others are added or removed. The selected suspect's
 * letters are bold and their X marks are drawn big over a light wash; other people's X marks
 * are not drawn (there would be no room), they show when that suspect is selected.
 */
export function MarksLayer({ geometry, puzzle, board, selectedId, tags, colors }: LayerProps) {
  const people = puzzle.people
  const slots = Math.max(1, people.length)
  const cols = Math.ceil(Math.sqrt(slots))
  const rows = Math.ceil(slots / cols)
  const slotOf = new Map(people.map((p, i) => [p.id, i]))
  const size = geometry.cellSize
  const font = Math.min((size / cols) * 0.95, (size / rows) * 0.95, 24)

  const nodes: ReactNode[] = []
  for (const [key, ids] of Object.entries(board.marks)) {
    if (!selectedId || !ids.includes(selectedId)) continue
    const [row, col] = key.split(',').map(Number) as [number, number]
    const r = geometry.cellRect({ row, col })
    nodes.push(<XMarkGlyph key={`x-${key}`} markKey={key} x={r.x} y={r.y} size={size} color={colors[selectedId] ?? '#c0392b'} />)
  }
  for (const [key, ids] of Object.entries(board.notes)) {
    const [row, col] = key.split(',').map(Number) as [number, number]
    const r = geometry.cellRect({ row, col })
    for (const id of ids) {
      const slot = slotOf.get(id)
      if (slot === undefined) continue
      const x = r.x + ((slot % cols) + 0.5) * (size / cols)
      const y = r.y + (Math.floor(slot / cols) + 0.5) * (size / rows)
      const selected = id === selectedId
      nodes.push(
        <NoteGlyph
          key={`n-${key}-${id}`}
          noteKey={`${key}:${id}`}
          x={x}
          y={y}
          fontSize={selected ? font * 1.1 : font}
          bold={selected}
          color={colors[id] ?? '#333'}
          tag={tags[id] ?? ''}
          opacity={selected || !selectedId ? 1 : 0.8}
        />,
      )
    }
  }
  return <>{nodes}</>
}

interface PeopleLayerProps extends LayerProps {
  cast: BuiltCast
}

/** The round clip that portraits are drawn through (a 100 x 100 box); give it a unique id. */
export function PortraitClip({ id }: { id: string }) {
  return (
    <defs>
      <clipPath id={id}>
        <circle cx={50} cy={50} r={48} />
      </clipPath>
    </defs>
  )
}

/** One placed person as the board draws it: a white disc with a ring, and the portrait (or the victim, or a letter) in it. (x, y) is the square's top-left corner. */
export function PersonDisc({ x, y, size, person, cast, clipId, tag, color, selected = false }: { x: number; y: number; size: number; person: Person; cast: BuiltCast; clipId: string; tag: string; color: string; selected?: boolean }) {
  const d = size * 0.86
  return (
    <>
      <circle
        cx={x + size / 2}
        cy={y + size / 2}
        r={d / 2 + 2}
        fill="#ffffff"
        stroke={selected ? '#2b7de9' : 'rgba(42,42,54,0.55)'}
        strokeWidth={selected ? 3.5 : 1.5}
      />
      <svg x={x + (size - d) / 2} y={y + (size - d) / 2} width={d} height={d} viewBox="0 0 100 100">
        <Portrait person={person} cast={cast} clipId={clipId} tag={tag} color={color} />
      </svg>
    </>
  )
}

/** Placed people: a round portrait (or the victim, or a big letter when no portrait is known). */
export function PeopleLayer({ geometry, puzzle, board, selectedId, tags, colors, cast }: PeopleLayerProps) {
  const clipId = `play-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const size = geometry.cellSize
  return (
    <>
      <PortraitClip id={clipId} />
      {puzzle.people.map((person) => {
        const cell = board.placements[person.id]
        if (!cell) return null
        const r = geometry.cellRect(cell)
        return (
          <g key={person.id} data-person={person.id} data-cell-key={cellKey(cell)}>
            <PersonDisc x={r.x} y={r.y} size={size} person={person} cast={cast} clipId={clipId} tag={tags[person.id] ?? '?'} color={colors[person.id] ?? '#555'} selected={person.id === selectedId} />
          </g>
        )
      })}
    </>
  )
}

function Portrait({ person, cast, clipId, tag, color }: { person: Person; cast: BuiltCast; clipId: string; tag: string; color: string }) {
  if (person.kind === 'victim') {
    return (
      <g clipPath={`url(#${clipId})`}>
        <rect width={100} height={100} fill="#f6d6dc" />
        <VictimIcon />
      </g>
    )
  }
  const look = cast.lookFor(person.label)
  if (!look) {
    return (
      <g>
        <circle cx={50} cy={50} r={48} fill="#e9ecf2" />
        <text x={50} y={50} dy="0.35em" textAnchor="middle" fontSize={60} fontWeight={800} fill={color} fontFamily="system-ui, sans-serif">
          {tag}
        </text>
      </g>
    )
  }
  return (
    <g clipPath={`url(#${clipId})`}>
      <rect width={100} height={100} fill={look.photo} />
      {look.portrait}
    </g>
  )
}

/** Highlights for a hint: level 1 tints the areas, levels 2 and 3 ring the cells. */
export function HintLayer({ geometry, puzzle, hint }: { geometry: SceneGeometry; puzzle: Puzzle; hint: Hint | null }) {
  if (!hint) return null
  const areaCells = hint.level === 1 ? hintCells(puzzle, hint) : []
  const cells = hint.level === 1 ? [] : hint.cells
  const size = geometry.cellSize
  return (
    <g data-hint-level={hint.level}>
      {areaCells.map((cell) => {
        const r = geometry.cellRect(cell)
        return <rect key={cellKey(cell)} x={r.x} y={r.y} width={r.width} height={r.height} fill="#ffd23f" opacity={0.32} />
      })}
      {cells.map((cell) => {
        const r = geometry.cellRect(cell)
        return (
          <g key={cellKey(cell)} className="play-hint-ring">
            <rect x={r.x + 2} y={r.y + 2} width={size - 4} height={size - 4} rx={6} fill="#ffd23f" opacity={0.28} />
            <rect x={r.x + 3} y={r.y + 3} width={size - 6} height={size - 6} rx={6} fill="none" stroke="#e5a100" strokeWidth={4} />
          </g>
        )
      })}
    </g>
  )
}

/** A ring that closes in on the pressed cell while a long press is pending. */
export function PressRing({ geometry, cell }: { geometry: SceneGeometry; cell: Cell | null }) {
  if (!cell) return null
  const c = geometry.cellCenter(cell)
  return (
    <circle
      key={cellKey(cell)}
      className="play-press-ring"
      cx={c.x}
      cy={c.y}
      r={geometry.cellSize * 0.46}
      fill="none"
      stroke="#2b7de9"
      strokeWidth={4}
    />
  )
}

/**
 * The squares the Legend points at (CAD-10.9): a pulsing magenta wash and ring (the hint is yellow, the selection blue) over each. It never takes
 * a pointer event, and it is drawn inside the zoomed pane like every other layer, so it stays on its squares.
 */
export function FlashLayer({ geometry, cells }: { geometry: SceneGeometry; cells: readonly Cell[] }) {
  if (cells.length === 0) return null
  const size = geometry.cellSize
  return (
    <g data-layer="flash" pointerEvents="none">
      {cells.map((cell) => {
        const r = geometry.cellRect(cell)
        return (
          <g key={cellKey(cell)} className="play-flash" data-flash={cellKey(cell)}>
            <rect x={r.x + 1} y={r.y + 1} width={size - 2} height={size - 2} rx={5} fill="#e6007e" opacity={0.22} />
            <rect x={r.x + 2.5} y={r.y + 2.5} width={size - 5} height={size - 5} rx={5} fill="none" stroke="#ffffff" strokeWidth={8} />
            <rect x={r.x + 2.5} y={r.y + 2.5} width={size - 5} height={size - 5} rx={5} fill="none" stroke="#e6007e" strokeWidth={4.5} />
          </g>
        )
      })}
    </g>
  )
}
