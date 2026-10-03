import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { ACCENT_COLORS, DEFAULT_CARD_STYLE, MAX_TITLE_LENGTH, STORAGE_KEY } from '../constants'
import { parseAppData, settingsSchema } from '../lib/backup'
import { createId } from '../lib/id'
import {
  COLUMN_IDS,
  type AppData,
  type Card,
  type CardStyle,
  type ChecklistItem,
  type Column,
  type ColumnId,
  type Settings,
  type SortMode,
  type Tag,
  type ThemeMode,
} from '../types'
import { createEmptyBoard, createSeedData } from './seed'
import { createDebouncedStorage, preserveUnreadableData } from './storage'
import { notify } from './useUiStore'

export interface CardLocation {
  boardId: string
  columnId: ColumnId
  index: number
}

export interface DeletedCard extends CardLocation {
  card: Card
}

export type NewCard = Partial<Omit<Card, 'id' | 'createdAt' | 'updatedAt'>> & { title: string }
export type CardPatch = Partial<Omit<Card, 'id' | 'createdAt' | 'updatedAt'>>

interface Actions {
  createBoard: (name: string) => string
  renameBoard: (boardId: string, name: string) => void
  deleteBoard: (boardId: string) => boolean
  setActiveBoard: (boardId: string) => void
  setSortMode: (boardId: string, mode: SortMode) => void
  updateColumn: (boardId: string, columnId: ColumnId, patch: Partial<Pick<Column, 'title' | 'color' | 'wipLimit'>>) => void
  clearColumn: (boardId: string, columnId: ColumnId) => void

  addCard: (boardId: string, columnId: ColumnId, input: NewCard, position?: 'top' | 'bottom') => string | null
  updateCard: (cardId: string, patch: CardPatch) => void
  updateCardStyle: (cardId: string, patch: Partial<CardStyle>) => void
  deleteCard: (cardId: string) => DeletedCard | null
  restoreCard: (deleted: DeletedCard) => void
  duplicateCard: (cardId: string) => string | null
  moveCard: (cardId: string, to: CardLocation) => void

  addChecklistItem: (cardId: string, text: string) => void
  updateChecklistItem: (cardId: string, itemId: string, patch: Partial<Omit<ChecklistItem, 'id'>>) => void
  removeChecklistItem: (cardId: string, itemId: string) => void

  createTag: (name: string, color?: string) => string | null
  updateTag: (tagId: string, patch: Partial<Omit<Tag, 'id'>>) => void
  deleteTag: (tagId: string) => void

  replaceData: (data: AppData, settings?: Settings | null) => void
  setTheme: (theme: ThemeMode) => void
  setDefaultCardStyle: (style: CardStyle) => void
}

export type BoardState = AppData & { settings: Settings } & Actions

const DEFAULT_SETTINGS: Settings = { theme: 'system', defaultCardStyle: { ...DEFAULT_CARD_STYLE } }

/** Tag colors, in the order they are handed out to new tags. */
const TAG_COLORS = [7, 4, 8, 2, 9, 5, 3, 1, 6, 0].map((i) => ACCENT_COLORS[i])

export function findCardLocation(state: AppData, cardId: string): CardLocation | null {
  for (const boardId of state.boardOrder) {
    const board = state.boards[boardId]
    if (!board) continue
    for (const columnId of COLUMN_IDS) {
      const index = board.columns[columnId].cardIds.indexOf(cardId)
      if (index !== -1) return { boardId, columnId, index }
    }
  }
  return null
}

export function pickAppData(state: AppData): AppData {
  const { boards, boardOrder, cards, tags, activeBoardId } = state
  return { boards, boardOrder, cards, tags, activeBoardId }
}

export const storage = createDebouncedStorage<Partial<BoardState>>({
  onError: () =>
    notify('No se pudieron guardar los cambios: el almacenamiento del navegador está lleno o bloqueado.', {
      tone: 'error',
      duration: 8000,
    }),
})

export const useBoardStore = create<BoardState>()(
  persist(
    immer((set, get) => ({
      ...createSeedData(),
      settings: DEFAULT_SETTINGS,

      createBoard: (name) => {
        const id = createId()
        set((s) => {
          s.boards[id] = createEmptyBoard(id, name.trim() || 'Nuevo tablero')
          s.boardOrder.push(id)
          s.activeBoardId = id
        })
        return id
      },

      renameBoard: (boardId, name) =>
        set((s) => {
          const board = s.boards[boardId]
          if (board && name.trim()) board.name = name.trim().slice(0, 80)
        }),

      deleteBoard: (boardId) => {
        const { boards, boardOrder } = get()
        if (!boards[boardId] || boardOrder.length <= 1) return false
        set((s) => {
          for (const columnId of COLUMN_IDS) {
            for (const cardId of s.boards[boardId].columns[columnId].cardIds) delete s.cards[cardId]
          }
          delete s.boards[boardId]
          const index = s.boardOrder.indexOf(boardId)
          s.boardOrder.splice(index, 1)
          if (s.activeBoardId === boardId) s.activeBoardId = s.boardOrder[Math.max(0, index - 1)]
        })
        return true
      },

      setActiveBoard: (boardId) =>
        set((s) => {
          if (s.boards[boardId]) s.activeBoardId = boardId
        }),

      setSortMode: (boardId, mode) =>
        set((s) => {
          const board = s.boards[boardId]
          if (board) board.sortMode = mode
        }),

      updateColumn: (boardId, columnId, patch) =>
        set((s) => {
          const column = s.boards[boardId]?.columns[columnId]
          if (!column) return
          if (patch.title !== undefined) column.title = patch.title.trim().slice(0, 60) || column.title
          if (patch.color !== undefined) column.color = patch.color
          if (patch.wipLimit !== undefined) column.wipLimit = patch.wipLimit && patch.wipLimit > 0 ? patch.wipLimit : null
        }),

      clearColumn: (boardId, columnId) =>
        set((s) => {
          const column = s.boards[boardId]?.columns[columnId]
          if (!column) return
          for (const cardId of column.cardIds) delete s.cards[cardId]
          column.cardIds = []
        }),

      addCard: (boardId, columnId, input, position = 'top') => {
        if (!get().boards[boardId]) return null
        const id = createId()
        set((s) => {
          const now = Date.now()
          s.cards[id] = {
            content: '',
            priority: 'none',
            tagIds: [],
            dueDate: null,
            checklist: [],
            style: { ...s.settings.defaultCardStyle },
            ...input,
            title: input.title.trim().slice(0, MAX_TITLE_LENGTH),
            id,
            createdAt: now,
            updatedAt: now,
          }
          const cardIds = s.boards[boardId].columns[columnId].cardIds
          if (position === 'top') cardIds.unshift(id)
          else cardIds.push(id)
        })
        return id
      },

      updateCard: (cardId, patch) =>
        set((s) => {
          const card = s.cards[cardId]
          if (!card) return
          Object.assign(card, patch, { updatedAt: Date.now() })
          if (patch.title !== undefined) card.title = patch.title.slice(0, MAX_TITLE_LENGTH)
        }),

      updateCardStyle: (cardId, patch) =>
        set((s) => {
          const card = s.cards[cardId]
          if (!card) return
          Object.assign(card.style, patch)
          card.updatedAt = Date.now()
        }),

      deleteCard: (cardId) => {
        const state = get()
        const card = state.cards[cardId]
        const location = findCardLocation(state, cardId)
        if (!card || !location) return null
        set((s) => {
          s.boards[location.boardId].columns[location.columnId].cardIds.splice(location.index, 1)
          delete s.cards[cardId]
        })
        return { card, ...location }
      },

      restoreCard: ({ card, boardId, columnId, index }) =>
        set((s) => {
          if (s.cards[card.id]) return
          const targetBoard = s.boards[boardId] ?? s.boards[s.activeBoardId]
          const cardIds = targetBoard.columns[columnId].cardIds
          s.cards[card.id] = card
          cardIds.splice(Math.min(index, cardIds.length), 0, card.id)
        }),

      duplicateCard: (cardId) => {
        const state = get()
        const card = state.cards[cardId]
        const location = findCardLocation(state, cardId)
        if (!card || !location) return null
        const id = createId()
        set((s) => {
          const now = Date.now()
          s.cards[id] = {
            ...structuredClone(card),
            id,
            title: `${card.title} (copia)`.slice(0, MAX_TITLE_LENGTH),
            checklist: card.checklist.map((item) => ({ ...item, id: createId() })),
            createdAt: now,
            updatedAt: now,
          }
          s.boards[location.boardId].columns[location.columnId].cardIds.splice(location.index + 1, 0, id)
        })
        return id
      },

      moveCard: (cardId, to) =>
        set((s) => {
          const from = findCardLocation(s, cardId)
          const target = s.boards[to.boardId]?.columns[to.columnId]
          if (!from || !target) return
          s.boards[from.boardId].columns[from.columnId].cardIds.splice(from.index, 1)
          const index = Math.max(0, Math.min(to.index, target.cardIds.length))
          target.cardIds.splice(index, 0, cardId)
          if (from.boardId !== to.boardId || from.columnId !== to.columnId) s.cards[cardId].updatedAt = Date.now()
        }),

      addChecklistItem: (cardId, text) =>
        set((s) => {
          const card = s.cards[cardId]
          if (!card || !text.trim()) return
          card.checklist.push({ id: createId(), text: text.trim().slice(0, 500), done: false })
          card.updatedAt = Date.now()
        }),

      updateChecklistItem: (cardId, itemId, patch) =>
        set((s) => {
          const card = s.cards[cardId]
          const item = card?.checklist.find((entry) => entry.id === itemId)
          if (!card || !item) return
          if (patch.text !== undefined) item.text = patch.text.slice(0, 500)
          if (patch.done !== undefined) item.done = patch.done
          card.updatedAt = Date.now()
        }),

      removeChecklistItem: (cardId, itemId) =>
        set((s) => {
          const card = s.cards[cardId]
          if (!card) return
          card.checklist = card.checklist.filter((entry) => entry.id !== itemId)
          card.updatedAt = Date.now()
        }),

      createTag: (name, color) => {
        const trimmed = name.trim().slice(0, 40)
        if (!trimmed) return null
        const existing = Object.values(get().tags).find((tag) => tag.name.toLowerCase() === trimmed.toLowerCase())
        if (existing) return existing.id
        const id = createId()
        set((s) => {
          const count = Object.keys(s.tags).length
          s.tags[id] = { id, name: trimmed, color: color ?? TAG_COLORS[count % TAG_COLORS.length] }
        })
        return id
      },

      updateTag: (tagId, patch) =>
        set((s) => {
          const tag = s.tags[tagId]
          if (!tag) return
          if (patch.name !== undefined && patch.name.trim()) tag.name = patch.name.trim().slice(0, 40)
          if (patch.color !== undefined) tag.color = patch.color
        }),

      deleteTag: (tagId) =>
        set((s) => {
          delete s.tags[tagId]
          for (const card of Object.values(s.cards)) {
            if (card.tagIds.includes(tagId)) card.tagIds = card.tagIds.filter((id) => id !== tagId)
          }
        }),

      replaceData: (data, settings) =>
        set((s) => {
          Object.assign(s, data)
          if (settings) s.settings = settings
        }),

      setTheme: (theme) =>
        set((s) => {
          s.settings.theme = theme
        }),

      setDefaultCardStyle: (style) =>
        set((s) => {
          s.settings.defaultCardStyle = { ...style }
        }),
    })),
    {
      name: STORAGE_KEY,
      version: 1,
      storage,
      partialize: (state) => ({ ...pickAppData(state), settings: state.settings }),
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== 'object') return current
        try {
          const data = parseAppData(persisted)
          const settings = settingsSchema.parse((persisted as { settings?: unknown }).settings)
          return { ...current, ...data, settings }
        } catch (error) {
          // Keep the unreadable data aside and start fresh instead of crashing.
          preserveUnreadableData(STORAGE_KEY, JSON.stringify(persisted))
          console.error('SmartNotes: no se pudieron leer los datos guardados', error)
          return current
        }
      },
    },
  ),
)

/** Reloads the state when another tab saved changes. */
export function syncAcrossTabs(): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || event.newValue === null) return
    // If this tab has unsaved changes, they are about to be written and win.
    if (storage.hasPending()) return
    void useBoardStore.persist.rehydrate()
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}
