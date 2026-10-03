import { ListFilter } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { DUE_FILTER_LABELS, PRIORITY_META, PRIORITY_ORDER } from '../../constants'
import { cx } from '../../lib/cx'
import { countActiveFilters } from '../../lib/filters'
import { useBoardStore } from '../../store/useBoardStore'
import { useUiStore } from '../../store/useUiStore'
import type { DueFilter } from '../../types'
import { PriorityIcon } from '../Badges'
import { Popover } from '../ui/Popover'

export function FilterMenu() {
  const filters = useUiStore((s) => s.filters)
  const togglePriority = useUiStore((s) => s.togglePriority)
  const toggleTagFilter = useUiStore((s) => s.toggleTagFilter)
  const setDueFilter = useUiStore((s) => s.setDueFilter)
  const clearFilters = useUiStore((s) => s.clearFilters)
  const tags = useBoardStore(useShallow((s) => Object.values(s.tags)))
  // The search box has its own indicator; count everything else.
  const active = countActiveFilters({ ...filters, query: '' })

  return (
    <Popover
      label="Filtros"
      align="end"
      className="filter-menu"
      trigger={(props) => (
        <button type="button" className={cx('btn toolbar-btn', active > 0 && 'is-active')} {...props}>
          <ListFilter size={16} aria-hidden />
          <span className="toolbar-btn__label">Filtros</span>
          {active > 0 && <span className="toolbar-btn__badge">{active}</span>}
        </button>
      )}
    >
      <div className="popover-section">
        <p className="popover-title">Prioridad</p>
        <div className="chip-row">
          {PRIORITY_ORDER.map((priority) => (
            <button
              key={priority}
              type="button"
              className={cx('chip toggle-chip', filters.priorities.includes(priority) && 'is-selected')}
              aria-pressed={filters.priorities.includes(priority)}
              style={{ '--prio': PRIORITY_META[priority].color } as CSSProperties}
              onClick={() => togglePriority(priority)}
            >
              <span className="filter-prio-icon">
                <PriorityIcon priority={priority} size={13} />
              </span>
              {PRIORITY_META[priority].label}
            </button>
          ))}
        </div>
      </div>
      <div className="popover-section">
        <p className="popover-title">Etiquetas</p>
        {tags.length === 0 ? (
          <p className="menu-note">Aún no hay etiquetas. Créalas desde una tarjeta.</p>
        ) : (
          <div className="chip-row">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={cx('chip toggle-chip', filters.tagIds.includes(tag.id) && 'is-selected')}
                aria-pressed={filters.tagIds.includes(tag.id)}
                onClick={() => toggleTagFilter(tag.id)}
              >
                <span className="filter-tag-dot" style={{ background: tag.color }} />
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="popover-section">
        <p className="popover-title">Fecha límite</p>
        <div className="chip-row">
          {(Object.keys(DUE_FILTER_LABELS) as DueFilter[]).map((due) => (
            <button
              key={due}
              type="button"
              className={cx('chip toggle-chip', filters.due === due && 'is-selected')}
              aria-pressed={filters.due === due}
              onClick={() => setDueFilter(due)}
            >
              {DUE_FILTER_LABELS[due]}
            </button>
          ))}
        </div>
      </div>
      <div className="popover-section filter-menu__footer">
        <button type="button" className="btn btn--sm btn--ghost" disabled={countActiveFilters(filters) === 0} onClick={clearFilters}>
          Limpiar filtros
        </button>
      </div>
    </Popover>
  )
}
