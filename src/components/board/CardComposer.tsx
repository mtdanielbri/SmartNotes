import { useState, type FormEvent } from 'react'
import { MAX_TITLE_LENGTH } from '../../constants'
import { cardMatchesFilters, countActiveFilters } from '../../lib/filters'
import { useBoardStore } from '../../store/useBoardStore'
import { notify, useUiStore } from '../../store/useUiStore'
import type { ColumnId, Priority } from '../../types'
import { PriorityPicker } from '../PriorityPicker'

interface CardComposerProps {
  boardId: string
  columnId: ColumnId
  today: string
  onClose: () => void
}

export function CardComposer({ boardId, columnId, today, onClose }: CardComposerProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('none')
  const addCard = useBoardStore((s) => s.addCard)

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!title.trim()) return
    const id = addCard(boardId, columnId, { title, priority })
    setTitle('')
    setPriority('none')
    const { filters, clearFilters } = useUiStore.getState()
    const { cards, tags } = useBoardStore.getState()
    if (id && countActiveFilters(filters) > 0 && !cardMatchesFilters(cards[id], filters, { tags, today, columnId })) {
      notify('Tarjeta creada, pero los filtros activos la ocultan.', {
        action: { label: 'Quitar filtros', onClick: clearFilters },
      })
    }
  }

  return (
    <form
      className="composer"
      onSubmit={submit}
      onBlur={(event) => {
        // Close when focus leaves the composer and nothing was typed.
        if (!title.trim() && !event.currentTarget.contains(event.relatedTarget)) onClose()
      }}
    >
      <textarea
        className="composer__input"
        value={title}
        rows={2}
        maxLength={MAX_TITLE_LENGTH}
        placeholder="¿Qué hay que hacer?"
        aria-label="Título de la nueva tarjeta"
        autoFocus
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            submit()
          } else if (event.key === 'Escape') {
            event.preventDefault()
            onClose()
          }
        }}
      />
      <div className="composer__row">
        <PriorityPicker value={priority} onChange={setPriority} compact />
        <div className="composer__buttons">
          <button type="button" className="btn btn--sm btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--sm btn--primary" disabled={!title.trim()}>
            Añadir
          </button>
        </div>
      </div>
    </form>
  )
}
