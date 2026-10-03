import { PRIORITY_META } from '../constants'
import type { Card, ColumnId, Filters, SortMode, Tag } from '../types'
import { addDays, daysBetween } from './dates'
import { htmlToText } from './html'

export const EMPTY_FILTERS: Filters = { query: '', priorities: [], tagIds: [], due: 'all' }

/** Lowercase and accent-insensitive, so "cafe" finds "Café". */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function countActiveFilters(filters: Filters): number {
  return (
    (filters.query.trim() ? 1 : 0) +
    filters.priorities.length +
    filters.tagIds.length +
    (filters.due === 'all' ? 0 : 1)
  )
}

interface MatchContext {
  tags: Record<string, Tag>
  today: string
  columnId: ColumnId
}

export function cardMatchesFilters(card: Card, filters: Filters, ctx: MatchContext): boolean {
  if (filters.priorities.length > 0 && !filters.priorities.includes(card.priority)) return false
  if (filters.tagIds.length > 0 && !filters.tagIds.some((id) => card.tagIds.includes(id))) return false

  const due = card.dueDate
  // Due-date filters are about pending work: finished cards never match.
  const pending = ctx.columnId !== 'done'
  switch (filters.due) {
    case 'overdue':
      if (!due || !pending || daysBetween(ctx.today, due) >= 0) return false
      break
    case 'today':
      if (due !== ctx.today || !pending) return false
      break
    case 'week':
      if (!due || !pending || due < ctx.today || due > addDays(ctx.today, 6)) return false
      break
    case 'noDate':
      if (due) return false
      break
    case 'all':
      break
  }

  const terms = normalizeText(filters.query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  const haystack = normalizeText(
    [
      card.title,
      htmlToText(card.content),
      ...card.checklist.map((item) => item.text),
      ...card.tagIds.map((id) => ctx.tags[id]?.name ?? ''),
    ].join(' '),
  )
  return terms.every((term) => haystack.includes(term))
}

const byPriority = (a: Card, b: Card) => PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight

/** Returns a sorted copy. Ties keep the manual order (Array#sort is stable). */
export function sortCards(cards: Card[], mode: SortMode): Card[] {
  const sorted = [...cards]
  switch (mode) {
    case 'manual':
      return sorted
    case 'priority':
      return sorted.sort(byPriority)
    case 'dueDate':
      return sorted.sort((a, b) => {
        if (a.dueDate === b.dueDate) return byPriority(a, b)
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate < b.dueDate ? -1 : 1
      })
    case 'updated':
      return sorted.sort((a, b) => b.updatedAt - a.updatedAt)
  }
}
