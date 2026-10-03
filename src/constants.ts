import type {
  CardStyle,
  CardVariant,
  ColumnId,
  DueFilter,
  FontKey,
  FontSize,
  NoteColor,
  Priority,
  SortMode,
} from './types'

export const COLUMN_DEFAULTS: Record<ColumnId, { title: string; color: string }> = {
  todo: { title: 'To Do', color: '#64748b' },
  inProgress: { title: 'In Progress', color: '#3b82f6' },
  blocked: { title: 'Blocked', color: '#ef4444' },
  done: { title: 'Done', color: '#22c55e' },
}

/** Accent colors offered for columns and tags. */
export const ACCENT_COLORS = [
  '#64748b',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#0ea5e9',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
]

export interface PriorityMeta {
  label: string
  /** Higher sorts first. */
  weight: number
  color: string
}

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  urgent: { label: 'Urgente', weight: 4, color: '#e5484d' },
  high: { label: 'Alta', weight: 3, color: '#f76b15' },
  medium: { label: 'Media', weight: 2, color: '#d6a100' },
  low: { label: 'Baja', weight: 1, color: '#0090ff' },
  none: { label: 'Sin prioridad', weight: 0, color: '#8b8d98' },
}

/** Priorities from most to least important, for pickers and filters. */
export const PRIORITY_ORDER: Priority[] = ['urgent', 'high', 'medium', 'low', 'none']

export const NOTE_COLOR_LABELS: Record<NoteColor, string> = {
  default: 'Por defecto',
  yellow: 'Amarillo',
  orange: 'Naranja',
  red: 'Rojo',
  pink: 'Rosa',
  purple: 'Morado',
  blue: 'Azul',
  teal: 'Turquesa',
  green: 'Verde',
  gray: 'Gris',
}

export interface FontMeta {
  label: string
  short: string
  family: string
  /** Optical size correction, so every font looks equally big. */
  scale: number
}

export const FONTS: Record<FontKey, FontMeta> = {
  sans: {
    label: 'Inter (moderna)',
    short: 'Moderna',
    family: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', sans-serif",
    scale: 1,
  },
  rounded: {
    label: 'Nunito (redondeada)',
    short: 'Redonda',
    family: "'Nunito Variable', 'Inter Variable', system-ui, sans-serif",
    scale: 1.02,
  },
  serif: {
    label: 'Merriweather (serif)',
    short: 'Clásica',
    family: "'Merriweather Variable', Georgia, 'Times New Roman', serif",
    scale: 0.96,
  },
  mono: {
    label: 'JetBrains Mono (código)',
    short: 'Código',
    family: "'JetBrains Mono Variable', ui-monospace, 'SFMono-Regular', Menlo, monospace",
    scale: 0.94,
  },
  hand: {
    label: 'Caveat (manuscrita)',
    short: 'A mano',
    family: "'Caveat Variable', 'Comic Sans MS', cursive",
    scale: 1.32,
  },
}

export const FONT_SIZE_META: Record<FontSize, { label: string; px: number }> = {
  sm: { label: 'Pequeña', px: 13 },
  md: { label: 'Normal', px: 14.5 },
  lg: { label: 'Grande', px: 16.5 },
}

export const VARIANT_LABELS: Record<CardVariant, string> = {
  flat: 'Tarjeta',
  sticky: 'Post-it',
  outline: 'Contorno',
}

export const SORT_LABELS: Record<SortMode, string> = {
  manual: 'Manual (arrastrar)',
  priority: 'Prioridad',
  dueDate: 'Fecha límite',
  updated: 'Última edición',
}

export const DUE_FILTER_LABELS: Record<DueFilter, string> = {
  all: 'Cualquier fecha',
  overdue: 'Vencidas',
  today: 'Vencen hoy',
  week: 'Próximos 7 días',
  noDate: 'Sin fecha',
}

export const DEFAULT_CARD_STYLE: CardStyle = {
  color: 'default',
  font: 'sans',
  size: 'md',
  variant: 'flat',
}

/** Colors offered inside the rich text editor (text and highlight). */
export const TEXT_COLORS = [
  '#1f2328',
  '#6b7280',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0d9488',
  '#2563eb',
  '#7c3aed',
  '#db2777',
]

export const HIGHLIGHT_COLORS = [
  '#fef08a',
  '#fed7aa',
  '#fecaca',
  '#fbcfe8',
  '#e9d5ff',
  '#bfdbfe',
  '#99f6e4',
  '#bbf7d0',
]

export const TEXT_SIZES = [
  { label: 'Pequeño', value: '0.85em' },
  { label: 'Normal', value: '' },
  { label: 'Grande', value: '1.25em' },
  { label: 'Enorme', value: '1.6em' },
]

export const STORAGE_KEY = 'smartnotes'
export const MAX_TITLE_LENGTH = 200
