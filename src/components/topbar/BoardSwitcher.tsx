import { Check, ChevronDown, KanbanSquare, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { cx } from '../../lib/cx'
import { useBoardStore } from '../../store/useBoardStore'
import { confirmAction, notify } from '../../store/useUiStore'
import { COLUMN_IDS, type Board } from '../../types'
import { Popover } from '../ui/Popover'

const countCards = (board: Board) => COLUMN_IDS.reduce((sum, id) => sum + board.columns[id].cardIds.length, 0)

function BoardRow({ board, active, onSelect }: { board: Board; active: boolean; onSelect: () => void }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(board.name)
  const cancelled = useRef(false)
  const renameBoard = useBoardStore((s) => s.renameBoard)
  const deleteBoard = useBoardStore((s) => s.deleteBoard)
  const boardCount = useBoardStore((s) => s.boardOrder.length)

  const save = () => {
    // Escape also blurs the input; don't save what was just cancelled.
    if (cancelled.current) {
      cancelled.current = false
      return
    }
    if (name.trim()) renameBoard(board.id, name)
    else setName(board.name)
    setEditing(false)
  }

  const remove = async () => {
    const cards = countCards(board)
    const ok = await confirmAction({
      title: `¿Eliminar «${board.name}»?`,
      message:
        cards > 0
          ? `Se eliminarán también sus ${cards} tarjetas. Esta acción no se puede deshacer.`
          : 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar tablero',
      danger: true,
    })
    if (ok && deleteBoard(board.id)) notify(`Tablero «${board.name}» eliminado`)
  }

  if (editing) {
    return (
      <form
        className="board-row board-row--editing"
        onSubmit={(event) => {
          event.preventDefault()
          save()
        }}
      >
        <input
          className="input"
          value={name}
          maxLength={80}
          autoFocus
          aria-label="Nombre del tablero"
          onChange={(event) => setName(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              cancelled.current = true
              setName(board.name)
              setEditing(false)
            }
          }}
        />
      </form>
    )
  }

  return (
    <div className={cx('board-row', active && 'is-active')}>
      <button type="button" className="board-row__main" onClick={onSelect} aria-current={active || undefined}>
        <span className="board-row__check">{active && <Check size={15} />}</span>
        <span className="board-row__name">{board.name}</span>
        <span className="board-row__count">{countCards(board)}</span>
      </button>
      <button type="button" className="icon-btn icon-btn--sm" aria-label={`Renombrar ${board.name}`} onClick={() => setEditing(true)}>
        <Pencil size={14} />
      </button>
      <button
        type="button"
        className="icon-btn icon-btn--sm icon-btn--danger"
        aria-label={`Eliminar ${board.name}`}
        title={boardCount <= 1 ? 'Necesitas al menos un tablero' : undefined}
        disabled={boardCount <= 1}
        onClick={remove}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export function BoardSwitcher() {
  const boards = useBoardStore(useShallow((s) => s.boardOrder.map((id) => s.boards[id])))
  const activeBoardId = useBoardStore((s) => s.activeBoardId)
  const setActiveBoard = useBoardStore((s) => s.setActiveBoard)
  const createBoard = useBoardStore((s) => s.createBoard)
  const [newName, setNewName] = useState('')
  const active = boards.find((board) => board.id === activeBoardId)

  return (
    <Popover
      label="Tableros"
      className="board-switcher"
      trigger={(props) => (
        <button type="button" className="board-switcher__trigger" {...props}>
          <KanbanSquare size={17} aria-hidden />
          <span className="board-switcher__name">{active?.name}</span>
          <ChevronDown size={15} aria-hidden />
        </button>
      )}
    >
      {(close) => {
        const create = (event: FormEvent) => {
          event.preventDefault()
          if (!newName.trim()) return
          createBoard(newName)
          setNewName('')
          close()
        }
        return (
          <>
            <div className="popover-section">
              <p className="popover-title">Tableros</p>
              <div className="board-list">
                {boards.map((board) => (
                  <BoardRow
                    key={board.id}
                    board={board}
                    active={board.id === activeBoardId}
                    onSelect={() => {
                      setActiveBoard(board.id)
                      close()
                    }}
                  />
                ))}
              </div>
            </div>
            <form className="popover-section board-create" onSubmit={create}>
              <input
                className="input"
                placeholder="Nuevo tablero…"
                value={newName}
                maxLength={80}
                aria-label="Nombre del nuevo tablero"
                onChange={(event) => setNewName(event.target.value)}
              />
              <button type="submit" className="btn btn--primary" disabled={!newName.trim()}>
                <Plus size={16} /> Crear
              </button>
            </form>
          </>
        )
      }}
    </Popover>
  )
}
