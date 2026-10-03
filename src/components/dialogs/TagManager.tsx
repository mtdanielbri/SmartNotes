import { Check, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ACCENT_COLORS } from '../../constants'
import { cx } from '../../lib/cx'
import { useBoardStore } from '../../store/useBoardStore'
import { confirmAction, notify, useUiStore } from '../../store/useUiStore'
import type { Tag } from '../../types'
import { Modal } from '../ui/Modal'
import { Popover } from '../ui/Popover'
import './dialogs.css'

function TagRow({ tag, uses }: { tag: Tag; uses: number }) {
  const updateTag = useBoardStore((s) => s.updateTag)
  const deleteTag = useBoardStore((s) => s.deleteTag)
  const [name, setName] = useState(tag.name)

  const remove = async () => {
    if (uses > 0) {
      const ok = await confirmAction({
        title: `¿Eliminar la etiqueta «${tag.name}»?`,
        message: `Se quitará de ${uses === 1 ? '1 tarjeta' : `${uses} tarjetas`}. Las tarjetas no se borran.`,
        confirmLabel: 'Eliminar etiqueta',
        danger: true,
      })
      if (!ok) return
    }
    deleteTag(tag.id)
    notify(`Etiqueta «${tag.name}» eliminada`)
  }

  return (
    <li className="tag-row">
      <Popover
        label={`Color de ${tag.name}`}
        trigger={(props) => (
          <button type="button" className="tag-row__color" style={{ background: tag.color }} aria-label={`Cambiar color de ${tag.name}`} {...props} />
        )}
      >
        {(close) => (
          <div className="swatch-row tag-row__swatches">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={cx('accent-swatch', tag.color === color && 'is-selected')}
                style={{ background: color }}
                aria-label={`Color ${color}`}
                onClick={() => {
                  updateTag(tag.id, { color })
                  close()
                }}
              >
                {tag.color === color && <Check size={13} strokeWidth={3} />}
              </button>
            ))}
          </div>
        )}
      </Popover>
      <input
        className="input tag-row__name"
        value={name}
        maxLength={40}
        aria-label="Nombre de la etiqueta"
        onChange={(event) => {
          setName(event.target.value)
          if (event.target.value.trim()) updateTag(tag.id, { name: event.target.value })
        }}
        onBlur={() => setName(useBoardStore.getState().tags[tag.id]?.name ?? name)}
      />
      <span className="tag-row__uses" title="Tarjetas con esta etiqueta">
        {uses}
      </span>
      <button type="button" className="icon-btn icon-btn--sm icon-btn--danger" aria-label={`Eliminar ${tag.name}`} onClick={remove}>
        <Trash2 size={15} />
      </button>
    </li>
  )
}

export function TagManager() {
  const closeDialog = useUiStore((s) => s.closeDialog)
  const tags = useBoardStore(useShallow((s) => Object.values(s.tags)))
  const cards = useBoardStore((s) => s.cards)
  const createTag = useBoardStore((s) => s.createTag)
  const [newName, setNewName] = useState('')

  const uses = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const card of Object.values(cards)) for (const id of card.tagIds) counts[id] = (counts[id] ?? 0) + 1
    return counts
  }, [cards])

  return (
    <Modal onClose={closeDialog} labelledBy="tags-title">
      <div className="dialog">
        <div className="dialog__header">
          <h2 id="tags-title" className="dialog__title">
            Etiquetas
          </h2>
          <button type="button" className="icon-btn" aria-label="Cerrar" onClick={closeDialog}>
            <X size={18} />
          </button>
        </div>
        {tags.length === 0 ? (
          <p className="dialog__text">Todavía no tienes etiquetas.</p>
        ) : (
          <ul className="tag-rows">
            {tags.map((tag) => (
              <TagRow key={tag.id} tag={tag} uses={uses[tag.id] ?? 0} />
            ))}
          </ul>
        )}
        <form
          className="tag-create"
          onSubmit={(event) => {
            event.preventDefault()
            if (createTag(newName)) setNewName('')
          }}
        >
          <input
            className="input"
            placeholder="Nueva etiqueta…"
            aria-label="Nombre de la nueva etiqueta"
            value={newName}
            maxLength={40}
            data-autofocus
            onChange={(event) => setNewName(event.target.value)}
          />
          <button type="submit" className="btn btn--primary" disabled={!newName.trim()}>
            <Plus size={16} /> Crear
          </button>
        </form>
      </div>
    </Modal>
  )
}
