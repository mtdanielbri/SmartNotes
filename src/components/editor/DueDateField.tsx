import { X } from 'lucide-react'
import { cx } from '../../lib/cx'
import { addDays, daysBetween } from '../../lib/dates'
import { useBoardStore } from '../../store/useBoardStore'
import type { Card } from '../../types'

function describe(due: string, today: string, done: boolean): string {
  if (done) return 'Tarea terminada.'
  const days = daysBetween(today, due)
  if (days < -1) return `Venció hace ${-days} días.`
  if (days === -1) return 'Venció ayer.'
  if (days === 0) return 'Vence hoy.'
  if (days === 1) return 'Vence mañana.'
  return `Vence en ${days} días.`
}

export function DueDateField({ card, today, done }: { card: Card; today: string; done: boolean }) {
  const updateCard = useBoardStore((s) => s.updateCard)
  const setDue = (dueDate: string | null) => updateCard(card.id, { dueDate })
  const overdue = !done && card.dueDate !== null && card.dueDate < today
  const quick = [
    { label: 'Hoy', value: today },
    { label: 'Mañana', value: addDays(today, 1) },
    { label: 'En 1 semana', value: addDays(today, 7) },
  ]

  return (
    <div className="due-field">
      <div className="due-field__row">
        <input
          type="date"
          className="input"
          aria-label="Fecha límite"
          value={card.dueDate ?? ''}
          onChange={(event) => setDue(event.target.value || null)}
        />
        {card.dueDate && (
          <button type="button" className="icon-btn" aria-label="Quitar fecha límite" title="Quitar fecha" onClick={() => setDue(null)}>
            <X size={16} />
          </button>
        )}
      </div>
      <div className="chip-row">
        {quick.map((option) => (
          <button
            key={option.label}
            type="button"
            className={cx('chip toggle-chip', card.dueDate === option.value && 'is-selected')}
            onClick={() => setDue(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {card.dueDate && <p className={cx('due-field__status', overdue && 'is-overdue')}>{describe(card.dueDate, today, done)}</p>}
    </div>
  )
}
