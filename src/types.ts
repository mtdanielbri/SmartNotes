export const COLUMN_IDS = ['todo', 'inProgress', 'blocked', 'done'] as const
export type ColumnId = (typeof COLUMN_IDS)[number]

export const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'] as const
export type Priority = (typeof PRIORITIES)[number]

export const SORT_MODES = ['manual', 'priority', 'dueDate', 'updated'] as const
export type SortMode = (typeof SORT_MODES)[number]

export const NOTE_COLORS = [
  'default',
  'yellow',
  'orange',
  'red',
  'pink',
  'purple',
  'blue',
  'teal',
  'green',
  'gray',
] as const
export type NoteColor = (typeof NOTE_COLORS)[number]

export const FONT_KEYS = ['sans', 'rounded', 'serif', 'mono', 'hand'] as const
export type FontKey = (typeof FONT_KEYS)[number]

export const FONT_SIZES = ['sm', 'md', 'lg'] as const
export type FontSize = (typeof FONT_SIZES)[number]

export const CARD_VARIANTS = ['flat', 'sticky', 'outline'] as const
export type CardVariant = (typeof CARD_VARIANTS)[number]

export const THEME_MODES = ['light', 'dark', 'system'] as const
export type ThemeMode = (typeof THEME_MODES)[number]

export interface CardStyle {
  /** Palette key (adapts to light/dark theme) or a custom `#rrggbb` color. */
  color: NoteColor | string
  font: FontKey
  size: FontSize
  variant: CardVariant
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface Card {
  id: string
  title: string
  /** Rich text content as sanitized HTML. */
  content: string
  priority: Priority
  tagIds: string[]
  /** Local calendar date `YYYY-MM-DD`, or null. */
  dueDate: string | null
  checklist: ChecklistItem[]
  style: CardStyle
  createdAt: number
  updatedAt: number
}

export interface Column {
  id: ColumnId
  title: string
  color: string
  wipLimit: number | null
  cardIds: string[]
}

export interface Board {
  id: string
  name: string
  columns: Record<ColumnId, Column>
  sortMode: SortMode
  createdAt: number
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface AppData {
  boards: Record<string, Board>
  boardOrder: string[]
  cards: Record<string, Card>
  tags: Record<string, Tag>
  activeBoardId: string
}

export interface Settings {
  theme: ThemeMode
  /** Style given to newly created cards. */
  defaultCardStyle: CardStyle
}

export type DueFilter = 'all' | 'overdue' | 'today' | 'week' | 'noDate'

export interface Filters {
  query: string
  priorities: Priority[]
  tagIds: string[]
  due: DueFilter
}
