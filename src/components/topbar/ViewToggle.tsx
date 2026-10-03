import { LayoutGrid } from 'lucide-react'
import { cx } from '../../lib/cx'
import { useBoardStore } from '../../store/useBoardStore'

/** Switches between the normal columns and the bird's-eye overview. */
export function ViewToggle() {
  const overview = useBoardStore((s) => s.settings.boardView === 'overview')
  const setBoardView = useBoardStore((s) => s.setBoardView)

  return (
    <button
      type="button"
      className={cx('btn toolbar-btn', overview && 'is-active')}
      aria-pressed={overview}
      title={overview ? 'Volver a las columnas (V)' : 'Vista general de todo el tablero (V)'}
      onClick={() => setBoardView(overview ? 'columns' : 'overview')}
    >
      <LayoutGrid size={16} aria-hidden />
      <span className="toolbar-btn__label">Vista general</span>
    </button>
  )
}
