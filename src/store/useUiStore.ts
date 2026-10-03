import { create } from 'zustand'
import { EMPTY_FILTERS } from '../lib/filters'
import { createId } from '../lib/id'
import type { ColumnId, DueFilter, Filters, Priority } from '../types'

export interface Toast {
  id: string
  message: string
  tone: 'info' | 'success' | 'error'
  action?: { label: string; onClick: () => void }
  duration: number
}

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  danger?: boolean
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void
}

export type DialogId = 'tags' | 'shortcuts'

interface UiState {
  filters: Filters
  editingCardId: string | null
  composerColumn: ColumnId | null
  /** Column shown on narrow screens, where only one column fits. */
  mobileColumn: ColumnId
  toasts: Toast[]
  confirmRequest: ConfirmRequest | null
  dialog: DialogId | null

  setQuery: (query: string) => void
  togglePriority: (priority: Priority) => void
  toggleTagFilter: (tagId: string) => void
  setDueFilter: (due: DueFilter) => void
  clearFilters: () => void
  openCard: (cardId: string) => void
  closeCard: () => void
  openComposer: (columnId: ColumnId) => void
  closeComposer: () => void
  setMobileColumn: (columnId: ColumnId) => void
  notify: (message: string, options?: Partial<Omit<Toast, 'id' | 'message'>>) => string
  dismissToast: (id: string) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
  settleConfirm: (confirmed: boolean) => void
  openDialog: (dialog: DialogId) => void
  closeDialog: () => void
}

const toggle = <T>(list: T[], value: T) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value]

export const useUiStore = create<UiState>()((set, get) => ({
  filters: EMPTY_FILTERS,
  editingCardId: null,
  composerColumn: null,
  mobileColumn: 'todo',
  toasts: [],
  confirmRequest: null,
  dialog: null,

  setQuery: (query) => set((s) => ({ filters: { ...s.filters, query } })),
  togglePriority: (priority) =>
    set((s) => ({ filters: { ...s.filters, priorities: toggle(s.filters.priorities, priority) } })),
  toggleTagFilter: (tagId) => set((s) => ({ filters: { ...s.filters, tagIds: toggle(s.filters.tagIds, tagId) } })),
  setDueFilter: (due) => set((s) => ({ filters: { ...s.filters, due } })),
  clearFilters: () => set({ filters: EMPTY_FILTERS }),

  openCard: (cardId) => set({ editingCardId: cardId }),
  closeCard: () => set({ editingCardId: null }),
  openComposer: (columnId) => set({ composerColumn: columnId, mobileColumn: columnId }),
  closeComposer: () => set({ composerColumn: null }),
  setMobileColumn: (columnId) => set({ mobileColumn: columnId }),

  notify: (message, options = {}) => {
    const id = createId()
    const toast: Toast = { id, message, tone: 'info', duration: options.action ? 6000 : 3500, ...options }
    set((s) => ({ toasts: [...s.toasts.slice(-3), toast] }))
    return id
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((toast) => toast.id !== id) })),

  confirm: (options) =>
    new Promise<boolean>((resolve) => {
      get().confirmRequest?.resolve(false)
      set({ confirmRequest: { ...options, resolve } })
    }),
  settleConfirm: (confirmed) => {
    get().confirmRequest?.resolve(confirmed)
    set({ confirmRequest: null })
  },

  openDialog: (dialog) => set({ dialog }),
  closeDialog: () => set({ dialog: null }),
}))

/** Shorthands usable outside React components. */
export const notify: UiState['notify'] = (message, options) => useUiStore.getState().notify(message, options)
export const confirmAction: UiState['confirm'] = (options) => useUiStore.getState().confirm(options)
