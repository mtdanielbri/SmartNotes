import { ListChecks, Plus, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { cx } from '../../lib/cx'
import { useBoardStore } from '../../store/useBoardStore'
import type { Card } from '../../types'

export function ChecklistEditor({ card }: { card: Card }) {
  const addItem = useBoardStore((s) => s.addChecklistItem)
  const updateItem = useBoardStore((s) => s.updateChecklistItem)
  const removeItem = useBoardStore((s) => s.removeChecklistItem)
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLUListElement>(null)
  const newItemRef = useRef<HTMLInputElement>(null)

  const total = card.checklist.length
  const done = card.checklist.filter((item) => item.done).length
  const percent = total ? Math.round((done / total) * 100) : 0

  const focusItem = (index: number) => {
    const inputs = listRef.current?.querySelectorAll<HTMLInputElement>('.checklist__text')
    inputs?.[index]?.focus()
  }

  return (
    <section className="checklist" aria-label="Checklist">
      <header className="checklist__header">
        <h3 className="checklist__title">
          <ListChecks size={17} aria-hidden /> Checklist
        </h3>
        {total > 0 && (
          <span className="checklist__count">
            {done}/{total} · {percent}%
          </span>
        )}
      </header>
      {total > 0 && (
        <div className="checklist__progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${percent}%` }} className={cx(percent === 100 && 'is-complete')} />
        </div>
      )}
      <ul className="checklist__list" ref={listRef}>
        {card.checklist.map((item, index) => (
          <li key={item.id} className={cx('checklist__item', item.done && 'is-done')}>
            <input
              type="checkbox"
              className="checklist__check"
              checked={item.done}
              aria-label={`Completado: ${item.text}`}
              onChange={(event) => updateItem(card.id, item.id, { done: event.target.checked })}
            />
            <input
              className="checklist__text"
              value={item.text}
              aria-label="Texto del elemento"
              onChange={(event) => updateItem(card.id, item.id, { text: event.target.value })}
              onBlur={() => {
                if (!item.text.trim()) removeItem(card.id, item.id)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  if (index === total - 1) newItemRef.current?.focus()
                  else focusItem(index + 1)
                } else if (event.key === 'Backspace' && item.text === '') {
                  event.preventDefault()
                  removeItem(card.id, item.id)
                  if (index > 0) focusItem(index - 1)
                  else newItemRef.current?.focus()
                }
              }}
            />
            <button
              type="button"
              className="icon-btn icon-btn--sm checklist__remove"
              aria-label={`Eliminar «${item.text}»`}
              onClick={() => removeItem(card.id, item.id)}
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="checklist__add"
        onSubmit={(event) => {
          event.preventDefault()
          if (!draft.trim()) return
          addItem(card.id, draft)
          setDraft('')
        }}
      >
        <Plus size={16} aria-hidden />
        <input
          ref={newItemRef}
          className="checklist__text"
          placeholder="Añadir un paso…"
          aria-label="Nuevo elemento de la checklist"
          value={draft}
          maxLength={500}
          onChange={(event) => setDraft(event.target.value)}
        />
      </form>
    </section>
  )
}
