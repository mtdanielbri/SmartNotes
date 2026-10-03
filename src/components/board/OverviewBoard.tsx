import { Draggable, Droppable } from '@hello-pangea/dnd'
import { AlarmClock, CalendarClock, CheckCircle2, ChevronsUp } from 'lucide-react'
import { memo, useMemo, type CSSProperties } from 'react'
import { PRIORITY_META } from '../../constants'
import { noteColorVars } from '../../lib/color'
import { cx } from '../../lib/cx'
import { addDays, formatDue, getDueStatus } from '../../lib/dates'
import { useBoardStore } from '../../store/useBoardStore'
import { useUiStore } from '../../store/useUiStore'
import { COLUMN_IDS, type Board, type Card, type ColumnId } from '../../types'
import './Overview.css'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

interface Summary {
  total: number
  done: number
  overdue: number
  dueSoon: number
  urgent: number
}

/** Counts over the whole board (filters don't apply), pending work only. */
function useSummary(board: Board, today: string): Summary {
  const cards = useBoardStore((s) => s.cards)
  return useMemo(() => {
    const summary: Summary = { total: 0, done: board.columns.done.cardIds.length, overdue: 0, dueSoon: 0, urgent: 0 }
    const weekEnd = addDays(today, 6)
    for (const columnId of COLUMN_IDS) {
      for (const id of board.columns[columnId].cardIds) {
        const card = cards[id]
        if (!card) continue
        summary.total++
        if (columnId === 'done') continue
        if (card.priority === 'urgent') summary.urgent++
        if (card.dueDate && card.dueDate < today) summary.overdue++
        else if (card.dueDate && card.dueDate <= weekEnd) summary.dueSoon++
      }
    }
    return summary
  }, [board, cards, today])
}

function OverviewSummary({ summary }: { summary: Summary }) {
  const filters = useUiStore((s) => s.filters)
  const setDueFilter = useUiStore((s) => s.setDueFilter)
  const togglePriority = useUiStore((s) => s.togglePriority)
  const percent = summary.total ? Math.round((summary.done / summary.total) * 100) : 0
  const allClear = summary.overdue === 0 && summary.dueSoon === 0 && summary.urgent === 0

  return (
    <div className="ov-summary">
      <div className="ov-progress" title={`${summary.done} de ${summary.total} tarjetas en Done`}>
        <CheckCircle2 size={16} className="ov-progress__icon" aria-hidden />
        <span className="ov-progress__label">
          <strong>{summary.done}</strong> de {summary.total} hechas
        </span>
        <span
          className="ov-progress__bar"
          role="progressbar"
          aria-label="Progreso del tablero"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${percent}%` }} />
        </span>
        <span className="ov-progress__pct">{percent}%</span>
      </div>
      <div className="ov-chips">
        {summary.overdue > 0 && (
          <button
            type="button"
            className="ov-chip ov-chip--overdue"
            aria-pressed={filters.due === 'overdue'}
            title="Ver solo las vencidas"
            onClick={() => setDueFilter(filters.due === 'overdue' ? 'all' : 'overdue')}
          >
            <AlarmClock size={14} aria-hidden /> {plural(summary.overdue, 'vencida', 'vencidas')}
          </button>
        )}
        {summary.dueSoon > 0 && (
          <button
            type="button"
            className="ov-chip ov-chip--soon"
            aria-pressed={filters.due === 'week'}
            title="Ver solo las que vencen en los próximos 7 días"
            onClick={() => setDueFilter(filters.due === 'week' ? 'all' : 'week')}
          >
            <CalendarClock size={14} aria-hidden /> {summary.dueSoon} vencen en 7 días
          </button>
        )}
        {summary.urgent > 0 && (
          <button
            type="button"
            className="ov-chip ov-chip--urgent"
            aria-pressed={filters.priorities.includes('urgent')}
            title="Ver solo las urgentes"
            onClick={() => togglePriority('urgent')}
          >
            <ChevronsUp size={14} aria-hidden /> {plural(summary.urgent, 'urgente', 'urgentes')}
          </button>
        )}
        {allClear && summary.total > 0 && (
          <span className="ov-chip ov-chip--ok">
            <CheckCircle2 size={14} aria-hidden /> Nada vencido ni urgente
          </span>
        )}
      </div>
    </div>
  )
}

const MiniCard = memo(function MiniCard({
  card,
  today,
  isDone,
  isDragging,
}: {
  card: Card
  today: string
  isDone: boolean
  isDragging: boolean
}) {
  const status = card.dueDate && !isDone ? getDueStatus(card.dueDate, today) : null
  const showDue = status === 'overdue' || status === 'today' || status === 'soon'
  const doneItems = card.checklist.filter((item) => item.done).length
  const style = { ...noteColorVars(card.style.color), '--prio': PRIORITY_META[card.priority].color } as CSSProperties

  return (
    <article
      className={cx('mini-card', card.priority !== 'none' && 'has-priority', isDone && 'is-done', isDragging && 'is-dragging')}
      style={style}
    >
      <span className="mini-card__title">{card.title || 'Sin título'}</span>
      {(showDue || card.checklist.length > 0) && (
        <span className="mini-card__meta">
          {showDue && (
            <span className={`mini-card__due mini-card__due--${status}`}>{formatDue(card.dueDate!, today)}</span>
          )}
          {card.checklist.length > 0 && (
            <span className="mini-card__progress" title={`${doneItems}/${card.checklist.length}`}>
              <span style={{ width: `${(doneItems / card.checklist.length) * 100}%` }} />
            </span>
          )}
        </span>
      )}
    </article>
  )
})

function OverviewColumn({
  board,
  columnId,
  cards,
  today,
  dropDisabled,
}: {
  board: Board
  columnId: ColumnId
  cards: Card[]
  today: string
  dropDisabled: boolean
}) {
  const openCard = useUiStore((s) => s.openCard)
  const setMobileColumn = useUiStore((s) => s.setMobileColumn)
  const setBoardView = useBoardStore((s) => s.setBoardView)
  const column = board.columns[columnId]
  const total = column.cardIds.length
  const overLimit = column.wipLimit !== null && total > column.wipLimit

  return (
    <section className="ov-column" style={{ '--column-color': column.color } as CSSProperties} aria-label={column.title}>
      <button
        type="button"
        className="ov-column__header"
        title={`Abrir la columna ${column.title}`}
        onClick={() => {
          setMobileColumn(columnId)
          setBoardView('columns')
        }}
      >
        <span className="ov-column__dot" aria-hidden />
        <span className="ov-column__title">{column.title}</span>
        <span className={cx('ov-column__count', overLimit && 'is-over')}>
          {cards.length}
          {column.wipLimit !== null && `/${column.wipLimit}`}
        </span>
      </button>
      <Droppable droppableId={columnId} isDropDisabled={dropDisabled}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cx('ov-column__list', snapshot.isDraggingOver && 'is-over')}
          >
            {cards.map((card, index) => (
              <Draggable key={card.id} draggableId={card.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className="ov-item"
                    aria-label={`${card.title || 'Sin título'}. Pulsa Enter para abrir.`}
                    onClick={() => openCard(card.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') openCard(card.id)
                    }}
                  >
                    <MiniCard card={card} today={today} isDone={columnId === 'done'} isDragging={dragSnapshot.isDragging} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {cards.length === 0 && !snapshot.isDraggingOver && <div className="ov-column__empty">Vacía</div>}
          </div>
        )}
      </Droppable>
    </section>
  )
}

interface OverviewBoardProps {
  board: Board
  visible: Record<ColumnId, Card[]>
  today: string
  dropDisabledFor: (columnId: ColumnId) => boolean
}

/** Bird's-eye view: every column side by side with compact cards, even on phones. */
export function OverviewBoard({ board, visible, today, dropDisabledFor }: OverviewBoardProps) {
  const summary = useSummary(board, today)
  return (
    <div className="overview">
      <OverviewSummary summary={summary} />
      <div className="ov-grid">
        {COLUMN_IDS.map((columnId) => (
          <OverviewColumn
            key={columnId}
            board={board}
            columnId={columnId}
            cards={visible[columnId]}
            today={today}
            dropDisabled={dropDisabledFor(columnId)}
          />
        ))}
      </div>
    </div>
  )
}
