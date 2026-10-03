import { Check, Plus, Settings2, X } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { normalizeText } from '../../lib/filters'
import { useBoardStore } from '../../store/useBoardStore'
import { useUiStore } from '../../store/useUiStore'
import type { Card } from '../../types'
import { Popover } from '../ui/Popover'

function TagSearch({ card, close }: { card: Card; close: () => void }) {
  const tags = useBoardStore(useShallow((s) => Object.values(s.tags)))
  const createTag = useBoardStore((s) => s.createTag)
  const updateCard = useBoardStore((s) => s.updateCard)
  const openDialog = useUiStore((s) => s.openDialog)
  const [query, setQuery] = useState('')

  const trimmed = query.trim()
  const matches = tags.filter((tag) => normalizeText(tag.name).includes(normalizeText(trimmed)))
  const exact = tags.find((tag) => tag.name.toLowerCase() === trimmed.toLowerCase())

  const toggle = (tagId: string) => {
    const current = useBoardStore.getState().cards[card.id]?.tagIds ?? []
    updateCard(card.id, {
      tagIds: current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    })
  }

  const create = () => {
    const id = createTag(trimmed)
    if (id && !card.tagIds.includes(id)) toggle(id)
    setQuery('')
  }

  return (
    <div className="tag-search">
      <input
        className="input"
        placeholder="Buscar o crear etiqueta…"
        aria-label="Buscar o crear etiqueta"
        value={query}
        maxLength={40}
        data-autofocus
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || !trimmed) return
          event.preventDefault()
          if (exact) {
            toggle(exact.id)
            setQuery('')
          } else create()
        }}
      />
      <div className="tag-options" role="group" aria-label="Etiquetas">
        {matches.map((tag) => {
          const selected = card.tagIds.includes(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              className="tag-option"
              aria-pressed={selected}
              onClick={() => toggle(tag.id)}
            >
              <span className="tag-option__check">{selected && <Check size={14} strokeWidth={3} />}</span>
              <span className="tag-option__dot" style={{ background: tag.color }} />
              <span className="tag-option__name">{tag.name}</span>
            </button>
          )
        })}
        {trimmed && !exact && (
          <button type="button" className="tag-option tag-option--create" onClick={create}>
            <Plus size={14} /> Crear «{trimmed}»
          </button>
        )}
        {tags.length === 0 && !trimmed && <p className="menu-note">Escribe un nombre para crear tu primera etiqueta.</p>}
      </div>
      <div className="menu-separator" />
      <button
        type="button"
        className="menu-item"
        onClick={() => {
          close()
          openDialog('tags')
        }}
      >
        <Settings2 size={15} /> Gestionar etiquetas…
      </button>
    </div>
  )
}

export function TagPicker({ card }: { card: Card }) {
  const tags = useBoardStore((s) => s.tags)
  const updateCard = useBoardStore((s) => s.updateCard)
  const selected = card.tagIds.map((id) => tags[id]).filter(Boolean)

  return (
    <div className="tag-picker">
      {selected.map((tag) => (
        <span key={tag.id} className="chip tag-chip tag-picker__chip" style={{ '--tag': tag.color } as CSSProperties}>
          <span className="chip__label">{tag.name}</span>
          <button
            type="button"
            aria-label={`Quitar etiqueta ${tag.name}`}
            onClick={() => updateCard(card.id, { tagIds: card.tagIds.filter((id) => id !== tag.id) })}
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </span>
      ))}
      <Popover
        label="Etiquetas"
        className="tag-popover"
        trigger={(props) => (
          <button type="button" className="chip tag-picker__add" {...props}>
            <Plus size={13} strokeWidth={2.5} /> Etiqueta
          </button>
        )}
      >
        {(close) => <TagSearch card={card} close={close} />}
      </Popover>
    </div>
  )
}
