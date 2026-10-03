import { ArrowDownUp } from 'lucide-react'
import { SORT_LABELS } from '../../constants'
import { useBoardStore } from '../../store/useBoardStore'
import { SORT_MODES, type SortMode } from '../../types'

export function SortSelect() {
  const boardId = useBoardStore((s) => s.activeBoardId)
  const sortMode = useBoardStore((s) => s.boards[s.activeBoardId].sortMode)
  const setSortMode = useBoardStore((s) => s.setSortMode)

  return (
    <label className="sort-select" title="Ordenar las tarjetas de cada columna">
      <ArrowDownUp size={15} aria-hidden />
      <span className="visually-hidden">Ordenar por</span>
      <select value={sortMode} onChange={(event) => setSortMode(boardId, event.target.value as SortMode)}>
        {SORT_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {SORT_LABELS[mode]}
          </option>
        ))}
      </select>
    </label>
  )
}
