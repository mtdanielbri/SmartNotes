import { Search, X } from 'lucide-react'
import { SEARCH_INPUT_ID } from '../../hooks/useGlobalShortcuts'
import { useUiStore } from '../../store/useUiStore'

export function SearchBox() {
  const query = useUiStore((s) => s.filters.query)
  const setQuery = useUiStore((s) => s.setQuery)

  return (
    <div className="search">
      <Search size={16} className="search__icon" aria-hidden />
      <input
        id={SEARCH_INPUT_ID}
        className="search__input"
        type="search"
        placeholder="Buscar notas…"
        aria-label="Buscar en títulos, contenido, checklists y etiquetas"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setQuery('')
            event.currentTarget.blur()
          }
        }}
      />
      {query ? (
        <button type="button" className="icon-btn icon-btn--sm search__clear" aria-label="Borrar búsqueda" onClick={() => setQuery('')}>
          <X size={14} />
        </button>
      ) : (
        <kbd className="kbd search__hint" aria-hidden>
          /
        </kbd>
      )}
    </div>
  )
}
