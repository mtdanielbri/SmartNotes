import { DragDropContext, type DragStart, type DragUpdate, type DropResult, type ResponderProvided } from '@hello-pangea/dnd'
import { ArrowDownUp, FilterX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SORT_LABELS } from '../../constants'
import { COMPACT_QUERY, useMediaQuery } from '../../hooks/useMediaQuery'
import { useToday } from '../../hooks/useToday'
import { resolveDropIndex } from '../../lib/dnd'
import { cardMatchesFilters, countActiveFilters, sortCards } from '../../lib/filters'
import { useBoardStore } from '../../store/useBoardStore'
import { notify, useUiStore } from '../../store/useUiStore'
import { COLUMN_IDS, type Card, type ColumnId } from '../../types'
import { ColumnTabs, TAB_DROPPABLE_PREFIX } from './ColumnTabs'
import { ColumnView } from './ColumnView'
import './Board.css'

const DRAG_INSTRUCTIONS =
  'Pulsa Espacio para levantar la tarjeta. Muévela con las flechas y pulsa Espacio para soltarla, o Escape para cancelar.'

export function BoardView() {
  const board = useBoardStore((s) => s.boards[s.activeBoardId])
  const cards = useBoardStore((s) => s.cards)
  const tags = useBoardStore((s) => s.tags)
  const moveCard = useBoardStore((s) => s.moveCard)
  const setSortMode = useBoardStore((s) => s.setSortMode)
  const filters = useUiStore((s) => s.filters)
  const clearFilters = useUiStore((s) => s.clearFilters)
  const mobileColumn = useUiStore((s) => s.mobileColumn)
  const compact = useMediaQuery(COMPACT_QUERY)
  const today = useToday()
  const [dragSource, setDragSource] = useState<ColumnId | null>(null)

  const visible = useMemo(() => {
    const result = {} as Record<ColumnId, Card[]>
    for (const columnId of COLUMN_IDS) {
      const columnCards = board.columns[columnId].cardIds.map((id) => cards[id]).filter(Boolean)
      const matching = columnCards.filter((card) => cardMatchesFilters(card, filters, { tags, today, columnId }))
      result[columnId] = sortCards(matching, board.sortMode)
    }
    return result
  }, [board, cards, tags, filters, today])

  const counts = Object.fromEntries(COLUMN_IDS.map((id) => [id, visible[id].length])) as Record<ColumnId, number>
  const total = COLUMN_IDS.reduce((sum, id) => sum + board.columns[id].cardIds.length, 0)
  const shown = COLUMN_IDS.reduce((sum, id) => sum + visible[id].length, 0)
  const activeFilters = countActiveFilters(filters)

  const columnTitle = (id: ColumnId) => board.columns[id].title

  const onDragStart = (start: DragStart, provided: ResponderProvided) => {
    setDragSource(start.source.droppableId as ColumnId)
    provided.announce(`Tarjeta levantada en ${columnTitle(start.source.droppableId as ColumnId)}, posición ${start.source.index + 1}.`)
  }

  const onDragUpdate = (update: DragUpdate, provided: ResponderProvided) => {
    const destination = update.destination
    if (!destination) return provided.announce('Fuera de cualquier columna.')
    const id = destination.droppableId
    if (id.startsWith(TAB_DROPPABLE_PREFIX)) {
      return provided.announce(`Sobre la pestaña ${columnTitle(id.slice(TAB_DROPPABLE_PREFIX.length) as ColumnId)}.`)
    }
    provided.announce(`${columnTitle(id as ColumnId)}, posición ${destination.index + 1}.`)
  }

  const onDragEnd = (result: DropResult, provided: ResponderProvided) => {
    setDragSource(null)
    const { destination, source, draggableId } = result
    if (!destination) {
      provided.announce('Movimiento cancelado.')
      return
    }

    if (destination.droppableId.startsWith(TAB_DROPPABLE_PREFIX)) {
      const columnId = destination.droppableId.slice(TAB_DROPPABLE_PREFIX.length) as ColumnId
      if (columnId === source.droppableId) return
      moveCard(draggableId, { boardId: board.id, columnId, index: 0 })
      notify(`Tarjeta movida a «${columnTitle(columnId)}»`)
      provided.announce(`Tarjeta movida a ${columnTitle(columnId)}.`)
      return
    }

    const columnId = destination.droppableId as ColumnId
    if (columnId === source.droppableId && destination.index === source.index) return
    const index = resolveDropIndex(
      board.columns[columnId].cardIds,
      visible[columnId].map((card) => card.id),
      destination.index,
      draggableId,
    )
    moveCard(draggableId, { boardId: board.id, columnId, index })
    provided.announce(`Tarjeta soltada en ${columnTitle(columnId)}, posición ${destination.index + 1}.`)
  }

  const shownColumns = compact ? [mobileColumn] : COLUMN_IDS

  return (
    <DragDropContext
      onDragStart={onDragStart}
      onDragUpdate={onDragUpdate}
      onDragEnd={onDragEnd}
      dragHandleUsageInstructions={DRAG_INSTRUCTIONS}
    >
      {(activeFilters > 0 || board.sortMode !== 'manual') && (
        <div className="board-status">
          {activeFilters > 0 && (
            <span className="board-status__item">
              Mostrando <strong>{shown}</strong> de {total} tarjetas
              <button type="button" className="btn btn--sm btn--ghost" onClick={clearFilters}>
                <FilterX size={14} /> Limpiar filtros
              </button>
            </span>
          )}
          {board.sortMode !== 'manual' && (
            <span className="board-status__item">
              <ArrowDownUp size={14} aria-hidden /> Ordenado por {SORT_LABELS[board.sortMode].toLowerCase()}
              <button type="button" className="btn btn--sm btn--ghost" onClick={() => setSortMode(board.id, 'manual')}>
                Volver a orden manual
              </button>
            </span>
          )}
        </div>
      )}
      {compact && <ColumnTabs board={board} counts={counts} />}
      <div className={compact ? 'board board--compact' : 'board'}>
        {shownColumns.map((columnId) => (
          <ColumnView
            key={columnId}
            boardId={board.id}
            column={board.columns[columnId]}
            cards={visible[columnId]}
            tags={tags}
            today={today}
            // With automatic sorting, reordering inside the same column has no effect.
            dropDisabled={board.sortMode !== 'manual' && dragSource === columnId}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
