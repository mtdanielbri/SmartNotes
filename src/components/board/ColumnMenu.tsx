import { Check, MoreHorizontal, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ACCENT_COLORS, COLUMN_DEFAULTS } from '../../constants'
import { cx } from '../../lib/cx'
import { useBoardStore } from '../../store/useBoardStore'
import { confirmAction, notify } from '../../store/useUiStore'
import type { Column } from '../../types'
import { Popover } from '../ui/Popover'

function ColumnSettings({ boardId, column, close }: { boardId: string; column: Column; close: () => void }) {
  const updateColumn = useBoardStore((s) => s.updateColumn)
  const clearColumn = useBoardStore((s) => s.clearColumn)
  const [title, setTitle] = useState(column.title)
  const [wip, setWip] = useState(column.wipLimit ? String(column.wipLimit) : '')

  // Saved as you type, so closing the popover never loses the new name.
  const changeTitle = (value: string) => {
    setTitle(value)
    if (value.trim()) updateColumn(boardId, column.id, { title: value })
  }

  const saveWip = (value: string) => {
    setWip(value)
    const limit = Number.parseInt(value, 10)
    updateColumn(boardId, column.id, { wipLimit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 999) : null })
  }

  const clear = async () => {
    close()
    const count = column.cardIds.length
    const ok = await confirmAction({
      title: `¿Vaciar «${column.title}»?`,
      message: `Se eliminarán ${count === 1 ? 'la tarjeta' : `las ${count} tarjetas`} de esta columna. No se puede deshacer.`,
      confirmLabel: 'Vaciar columna',
      danger: true,
    })
    if (ok) {
      clearColumn(boardId, column.id)
      notify(`Columna «${column.title}» vaciada`)
    }
  }

  return (
    <>
      <div className="popover-section">
        <label className="field-label" htmlFor={`col-title-${column.id}`}>
          Nombre
        </label>
        <input
          id={`col-title-${column.id}`}
          className="input"
          value={title}
          maxLength={60}
          placeholder={COLUMN_DEFAULTS[column.id].title}
          onChange={(event) => changeTitle(event.target.value)}
          onBlur={() => {
            if (!title.trim()) setTitle(column.title)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') close()
          }}
        />
      </div>
      <div className="popover-section">
        <p className="field-label">Color</p>
        <div className="swatch-row">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={cx('accent-swatch', column.color === color && 'is-selected')}
              style={{ background: color }}
              aria-label={`Color ${color}`}
              aria-pressed={column.color === color}
              onClick={() => updateColumn(boardId, column.id, { color })}
            >
              {column.color === color && <Check size={13} strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>
      <div className="popover-section">
        <label className="field-label" htmlFor={`col-wip-${column.id}`}>
          Límite de tarjetas (WIP)
        </label>
        <input
          id={`col-wip-${column.id}`}
          className="input"
          type="number"
          min={1}
          max={999}
          inputMode="numeric"
          placeholder="Sin límite"
          value={wip}
          onChange={(event) => saveWip(event.target.value)}
        />
        <p className="menu-note column-menu__hint">Te avisa cuando hay demasiadas tareas a la vez en esta columna.</p>
      </div>
      <div className="popover-section">
        <button type="button" className="menu-item menu-item--danger" disabled={column.cardIds.length === 0} onClick={clear}>
          <Trash2 size={16} /> Vaciar columna
        </button>
      </div>
    </>
  )
}

export function ColumnMenu({ boardId, column }: { boardId: string; column: Column }) {
  return (
    <Popover
      label={`Opciones de ${column.title}`}
      align="end"
      className="column-menu"
      trigger={(props) => (
        <button type="button" className="icon-btn icon-btn--sm" aria-label={`Opciones de ${column.title}`} title="Opciones de la columna" {...props}>
          <MoreHorizontal size={17} />
        </button>
      )}
    >
      {(close) => <ColumnSettings boardId={boardId} column={column} close={close} />}
    </Popover>
  )
}
