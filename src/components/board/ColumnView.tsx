import { Draggable, Droppable } from '@hello-pangea/dnd'
import { Plus, SearchX } from 'lucide-react'
import type { CSSProperties } from 'react'
import { PRIORITY_META } from '../../constants'
import { cx } from '../../lib/cx'
import { useUiStore } from '../../store/useUiStore'
import type { Card, Column, Tag } from '../../types'
import { CardComposer } from './CardComposer'
import { CardItem } from './CardItem'
import { ColumnMenu } from './ColumnMenu'

/** Short accessible name for a card; Enter opens it. */
function describeCard(card: Card): string {
  const parts = [card.title || 'Sin título']
  if (card.priority !== 'none') parts.push(`prioridad ${PRIORITY_META[card.priority].label.toLowerCase()}`)
  if (card.dueDate) parts.push(`fecha límite ${card.dueDate}`)
  return `${parts.join(', ')}. Pulsa Enter para abrir.`
}

interface ColumnViewProps {
  boardId: string
  column: Column
  cards: Card[]
  tags: Record<string, Tag>
  today: string
  dropDisabled: boolean
}

export function ColumnView({ boardId, column, cards, tags, today, dropDisabled }: ColumnViewProps) {
  const composerOpen = useUiStore((s) => s.composerColumn === column.id)
  const openComposer = useUiStore((s) => s.openComposer)
  const closeComposer = useUiStore((s) => s.closeComposer)
  const openCard = useUiStore((s) => s.openCard)

  const total = column.cardIds.length
  const filtered = cards.length !== total
  const overLimit = column.wipLimit !== null && total > column.wipLimit

  return (
    <section className="column" style={{ '--column-color': column.color } as CSSProperties} aria-label={column.title}>
      <header className="column__header">
        <span className="column__dot" aria-hidden />
        <h2 className="column__title">{column.title}</h2>
        <span
          className={cx('column__count', overLimit && 'is-over')}
          title={
            column.wipLimit
              ? `${total} de un máximo de ${column.wipLimit} tarjetas${overLimit ? ' — límite superado' : ''}`
              : `${total} tarjetas`
          }
        >
          {filtered ? `${cards.length} de ${total}` : total}
          {column.wipLimit !== null && ` / ${column.wipLimit}`}
        </span>
        <div className="column__actions">
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            aria-label={`Añadir tarjeta en ${column.title}`}
            title="Añadir tarjeta"
            onClick={() => openComposer(column.id)}
          >
            <Plus size={17} />
          </button>
          <ColumnMenu boardId={boardId} column={column} />
        </div>
      </header>

      {composerOpen ? (
        <CardComposer boardId={boardId} columnId={column.id} today={today} onClose={closeComposer} />
      ) : (
        <button type="button" className="column__add" onClick={() => openComposer(column.id)}>
          <Plus size={15} /> Añadir tarjeta
        </button>
      )}

      <Droppable droppableId={column.id} isDropDisabled={dropDisabled}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cx('column__list', snapshot.isDraggingOver && 'is-over')}
          >
            {cards.map((card, index) => (
              <Draggable key={card.id} draggableId={card.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className="column__item"
                    aria-label={describeCard(card)}
                    onClick={(event) => {
                      // Links inside the preview open on their own.
                      if ((event.target as HTMLElement).closest('a')) return
                      openCard(card.id)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') openCard(card.id)
                    }}
                  >
                    <CardItem
                      card={card}
                      tags={tags}
                      today={today}
                      isDone={column.id === 'done'}
                      isDragging={dragSnapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {cards.length === 0 && !snapshot.isDraggingOver && (
              <div className="column__empty">
                {filtered ? (
                  <>
                    <SearchX size={18} aria-hidden />
                    Ninguna tarjeta coincide con los filtros
                  </>
                ) : (
                  'Arrastra tarjetas aquí'
                )}
              </div>
            )}
          </div>
        )}
      </Droppable>
    </section>
  )
}
