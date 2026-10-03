import { Copy, Trash2, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { MAX_TITLE_LENGTH } from '../../constants'
import { useToday } from '../../hooks/useToday'
import { cardStyleVars } from '../../lib/cardStyle'
import { formatTimestamp } from '../../lib/dates'
import { findCardLocation, useBoardStore } from '../../store/useBoardStore'
import { notify, useUiStore } from '../../store/useUiStore'
import { COLUMN_IDS, type ColumnId } from '../../types'
import { PriorityPicker } from '../PriorityPicker'
import { Modal } from '../ui/Modal'
import { ChecklistEditor } from './ChecklistEditor'
import { DueDateField } from './DueDateField'
import { RichTextEditor } from './RichTextEditor'
import { StylePicker } from './StylePicker'
import { TagPicker } from './TagPicker'
import './Editor.css'

function TitleField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  // Grow with the content instead of scrolling.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      className="editor__title"
      value={value}
      rows={1}
      maxLength={MAX_TITLE_LENGTH}
      placeholder="Título de la tarjeta"
      aria-label="Título"
      data-autofocus={value ? undefined : true}
      onChange={(event) => onChange(event.target.value.replace(/\n/g, ' '))}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.preventDefault()
      }}
    />
  )
}

export function CardEditor({ cardId }: { cardId: string }) {
  const card = useBoardStore((s) => s.cards[cardId])
  const location = useBoardStore(useShallow((s) => findCardLocation(s, cardId)))
  const boards = useBoardStore(useShallow((s) => s.boardOrder.map((id) => s.boards[id])))
  const updateCard = useBoardStore((s) => s.updateCard)
  const moveCard = useBoardStore((s) => s.moveCard)
  const deleteCard = useBoardStore((s) => s.deleteCard)
  const restoreCard = useBoardStore((s) => s.restoreCard)
  const duplicateCard = useBoardStore((s) => s.duplicateCard)
  const setActiveBoard = useBoardStore((s) => s.setActiveBoard)
  const closeCard = useUiStore((s) => s.closeCard)
  const openCard = useUiStore((s) => s.openCard)
  const today = useToday()

  const missing = !card || !location
  useEffect(() => {
    // The card was deleted, e.g. from another tab.
    if (missing) closeCard()
  }, [missing, closeCard])
  if (missing) return null

  const board = boards.find((b) => b.id === location.boardId)!
  const column = board.columns[location.columnId]

  const changeColumn = (columnId: ColumnId) => moveCard(cardId, { boardId: board.id, columnId, index: 0 })

  const changeBoard = (boardId: string) => {
    const target = boards.find((b) => b.id === boardId)
    if (!target) return
    moveCard(cardId, { boardId, columnId: location.columnId, index: 0 })
    notify(`Tarjeta movida a «${target.name}»`, {
      action: { label: 'Ir al tablero', onClick: () => setActiveBoard(boardId) },
    })
  }

  const remove = () => {
    closeCard()
    const deleted = deleteCard(cardId)
    if (deleted) {
      notify(`Tarjeta «${card.title || 'Sin título'}» eliminada`, {
        action: { label: 'Deshacer', onClick: () => restoreCard(deleted) },
      })
    }
  }

  const duplicate = () => {
    const copyId = duplicateCard(cardId)
    if (copyId) notify('Tarjeta duplicada', { tone: 'success', action: { label: 'Abrir copia', onClick: () => openCard(copyId) } })
  }

  return (
    <Modal onClose={closeCard} label={`Editar tarjeta: ${card.title || 'Sin título'}`} className="modal--editor">
      <header className="editor__header">
        <label className="status-select" style={{ '--column-color': column.color } as CSSProperties}>
          <span className="status-select__dot" aria-hidden />
          <span className="visually-hidden">Columna</span>
          <select value={location.columnId} onChange={(event) => changeColumn(event.target.value as ColumnId)}>
            {COLUMN_IDS.map((id) => (
              <option key={id} value={id}>
                {board.columns[id].title}
              </option>
            ))}
          </select>
        </label>
        {boards.length > 1 && (
          <label className="board-select" title="Mover a otro tablero">
            <span className="board-select__prefix">en</span>
            <select value={board.id} aria-label="Tablero" onChange={(event) => changeBoard(event.target.value)}>
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="editor__header-actions">
          <button type="button" className="icon-btn" title="Duplicar" aria-label="Duplicar tarjeta" onClick={duplicate}>
            <Copy size={17} />
          </button>
          <button type="button" className="icon-btn icon-btn--danger" title="Eliminar" aria-label="Eliminar tarjeta" onClick={remove}>
            <Trash2 size={17} />
          </button>
          <button type="button" className="icon-btn" title="Cerrar (Esc)" aria-label="Cerrar" onClick={closeCard}>
            <X size={19} />
          </button>
        </div>
      </header>

      <div className="editor__body">
        <div className={`editor__main editor__main--${card.style.variant}`} style={cardStyleVars(card.style)}>
          <TitleField value={card.title} onChange={(title) => updateCard(cardId, { title })} />
          <RichTextEditor content={card.content} onChange={(content) => updateCard(cardId, { content })} />
          <ChecklistEditor card={card} />
        </div>

        <aside className="editor__side">
          <section className="editor__section">
            <h3 className="field-label">Prioridad</h3>
            <PriorityPicker value={card.priority} onChange={(priority) => updateCard(cardId, { priority })} />
          </section>
          <section className="editor__section">
            <h3 className="field-label">Fecha límite</h3>
            <DueDateField card={card} today={today} done={location.columnId === 'done'} />
          </section>
          <section className="editor__section">
            <h3 className="field-label">Etiquetas</h3>
            <TagPicker card={card} />
          </section>
          <section className="editor__section">
            <h3 className="field-label">Estilo de la tarjeta</h3>
            <StylePicker card={card} />
          </section>
          <p className="editor__meta">
            Creada: {formatTimestamp(card.createdAt)}
            <br />
            Última edición: {formatTimestamp(card.updatedAt)}
          </p>
        </aside>
      </div>
    </Modal>
  )
}
