import { Droppable } from '@hello-pangea/dnd'
import type { CSSProperties } from 'react'
import { cx } from '../../lib/cx'
import { useUiStore } from '../../store/useUiStore'
import { COLUMN_IDS, type Board, type ColumnId } from '../../types'

export const TAB_DROPPABLE_PREFIX = 'tab:'

/**
 * Column switcher for narrow screens. Each tab is also a drop target, so a
 * card can be dragged onto another column's tab to move it there.
 */
export function ColumnTabs({ board, counts }: { board: Board; counts: Record<ColumnId, number> }) {
  const active = useUiStore((s) => s.mobileColumn)
  const setActive = useUiStore((s) => s.setMobileColumn)

  return (
    <div className="column-tabs" role="tablist" aria-label="Columnas">
      {COLUMN_IDS.map((columnId) => {
        const column = board.columns[columnId]
        const selected = columnId === active
        return (
          <Droppable key={columnId} droppableId={`${TAB_DROPPABLE_PREFIX}${columnId}`}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                role="tab"
                tabIndex={selected ? 0 : -1}
                aria-selected={selected}
                className={cx('column-tab', selected && 'is-active', snapshot.isDraggingOver && 'is-over')}
                style={{ '--column-color': column.color } as CSSProperties}
                onClick={() => setActive(columnId)}
                onKeyDown={(event) => {
                  const index = COLUMN_IDS.indexOf(columnId)
                  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                    const next = COLUMN_IDS[(index + (event.key === 'ArrowRight' ? 1 : 3)) % 4]
                    setActive(next)
                    ;(event.currentTarget.parentElement?.children[COLUMN_IDS.indexOf(next)] as HTMLElement)?.focus()
                  } else if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setActive(columnId)
                  }
                }}
              >
                <span className="column-tab__dot" aria-hidden />
                <span className="column-tab__title">{column.title}</span>
                <span className="column-tab__count">{counts[columnId]}</span>
                {/* Required by the drag & drop library; kept out of the layout. */}
                <span className="column-tab__placeholder">{provided.placeholder}</span>
              </div>
            )}
          </Droppable>
        )
      })}
    </div>
  )
}
