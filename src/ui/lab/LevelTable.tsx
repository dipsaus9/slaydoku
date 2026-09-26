import type { Level } from '../levels/registry.ts'
import { LAB_NL } from './strings.ts'

export interface LevelTableProps {
  levels: readonly Level[]
  onOpen: (levelId: string) => void
}

/** The registered levels: always listed. */
export function LevelTable({ levels, onOpen }: LevelTableProps) {
  const t = LAB_NL
  return (
    <section className="lab-section" aria-labelledby="lab-levels-title">
      <h2 id="lab-levels-title">{t.levelsTitle}</h2>
      <table className="lab-table">
        <thead>
          <tr>
            <th>{t.columns.id}</th>
            <th>{t.columns.title}</th>
            <th>{t.columns.size}</th>
            <th>{t.columns.clues}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {levels.map((level) => (
            <tr key={level.id} data-level={level.id}>
              <td>{level.id}</td>
              <td>{level.title}</td>
              <td>{t.size_(level.puzzle.scene.width)}</td>
              <td>{level.puzzle.clues.length}</td>
              <td>
                <button type="button" className="lab-btn" onClick={() => onOpen(level.id)}>
                  {t.open}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
